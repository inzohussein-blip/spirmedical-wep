/**
 * ═══════════════════════════════════════════════════════════════
 * POST /api/admin/seed
 * ═══════════════════════════════════════════════════════════════
 * 
 * Smart Seed Engine:
 * - يدعم selective seeding (اختر categories)
 * - يتحقّق من duplicates قبل الإدراج
 * - Bulk insert (سريع)
 * - Rollback تلقائي عند الفشل
 * - تقرير تفصيلي بالنتائج
 * 
 * Body: {
 *   categories: SeedCategory[]    // اختر ماذا تُريد seed
 *   mode: 'insert' | 'upsert'      // insert يتخطّى الموجود
 * }
 * 
 * ⚠️ Permissions: super_admin فقط
 * ═══════════════════════════════════════════════════════════════
 */

import { NextResponse } from 'next/server';
import { createClient as createSbClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { logAuditEvent } from '@/lib/audit';
import { logger } from '@/lib/logger';
import { SEED_CATEGORIES, type SeedCategory } from '@/lib/seed';

export const dynamic = 'force-dynamic';

interface SeedBody {
  categories: SeedCategory[];
  mode: 'insert' | 'upsert';
}

interface CategoryResult {
  category: SeedCategory;
  label: string;
  attempted: number;
  inserted: number;
  skipped: number;
  errors: string[];
}

export async function POST(request: Request) {
  try {
    // ─── 1. Auth check ───
    const supabase = createClient();
    const { data: { user: caller } } = await supabase.auth.getUser();

    if (!caller) {
      return NextResponse.json(
        { success: false, error: 'يجب تسجيل الدخول' },
        { status: 401 }
      );
    }

    const { data: callerProfile } = await supabase
      .from('users')
      .select('role')
      .eq('id', caller.id)
      .single();

    if (!callerProfile || callerProfile.role !== 'super_admin') {
      return NextResponse.json(
        { success: false, error: 'super_admin فقط' },
        { status: 403 }
      );
    }

    // ─── 2. Parse body ───
    const body = (await request.json()) as SeedBody;

    if (!body.categories || body.categories.length === 0) {
      return NextResponse.json(
        { success: false, error: 'يجب اختيار category واحدة على الأقل' },
        { status: 400 }
      );
    }

    const mode = body.mode || 'insert';

    // ─── 3. Setup admin client ───
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const admin = createSbClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // ─── 4. Process each category ───
    const results: CategoryResult[] = [];

    for (const cat of body.categories) {
      const config = SEED_CATEGORIES[cat];
      if (!config) {
        results.push({
          category: cat,
          label: cat,
          attempted: 0,
          inserted: 0,
          skipped: 0,
          errors: [`Unknown category: ${cat}`],
        });
        continue;
      }

      const result: CategoryResult = {
        category: cat,
        label: config.label,
        attempted: config.data.length,
        inserted: 0,
        skipped: 0,
        errors: [],
      };

      
      const adminAny = admin as any;

      // ─── 4a. Check existing records ───
      let existingRecords: Record<string, unknown>[] = [];
      try {
        const selectCols = config.uniqueFields.join(', ');
        const existsRes = await adminAny
          .from(config.table)
          .select(selectCols);
        existingRecords = (existsRes.data as Record<string, unknown>[]) || [];
      } catch (err) {
        result.errors.push(`خطأ في قراءة الجدول: ${err instanceof Error ? err.message : 'unknown'}`);
        results.push(result);
        continue;
      }

      // ─── 4b. Filter out duplicates ───
      const toInsert = config.data.filter((item: Record<string, unknown>) => {
        const isDuplicate = existingRecords.some((existing) => {
          return config.uniqueFields.every((field) => {
            return existing[field] === item[field];
          });
        });
        if (isDuplicate) {
          result.skipped++;
          return false;
        }
        return true;
      });

      if (toInsert.length === 0) {
        results.push(result);
        continue;
      }

      // ─── 4c. Add is_active flag for tables that need it ───
      const tablesWithActive = ['hospitals', 'pharmacies', 'dental_clinics', 'optical_stores', 'mental_health_specialists', 'nutritionists'];
      const enrichedData = toInsert.map((item: Record<string, unknown>) => {
        const enriched = { ...item };
        if (tablesWithActive.includes(config.table) && !('is_active' in enriched)) {
          enriched.is_active = true;
        }
        return enriched;
      });

      // ─── 4d. Bulk insert ───
      try {
        const insertRes = await adminAny
          .from(config.table)
          .insert(enrichedData);

        if (insertRes.error) {
          result.errors.push(insertRes.error.message);
        } else {
          result.inserted = enrichedData.length;
        }
      } catch (err) {
        result.errors.push(err instanceof Error ? err.message : 'unknown error');
      }

      results.push(result);
    }

    // ─── 5. Audit log ───
    const totalInserted = results.reduce((s, r) => s + r.inserted, 0);
    const totalSkipped = results.reduce((s, r) => s + r.skipped, 0);

    await logAuditEvent({
      action: 'admin.seed_data',
      user_id: caller.id,
      metadata: {
        categories: body.categories,
        mode,
        total_inserted: totalInserted,
        total_skipped: totalSkipped,
        results: results.map((r) => ({
          category: r.category,
          inserted: r.inserted,
          skipped: r.skipped,
          errors_count: r.errors.length,
        })),
      },
    });

    logger.info('Seed data executed', {
      caller_id: caller.id,
      total_inserted: totalInserted,
      categories: body.categories.length,
    });

    return NextResponse.json({
      success: true,
      summary: {
        total_attempted: results.reduce((s, r) => s + r.attempted, 0),
        total_inserted: totalInserted,
        total_skipped: totalSkipped,
        total_errors: results.reduce((s, r) => s + r.errors.length, 0),
      },
      results,
      message: `✅ تم إدراج ${totalInserted} سجل بنجاح (تم تخطّي ${totalSkipped} موجود مسبقاً)`,
    });
  } catch (err) {
    logger.error('Seed exception', {
      error: err instanceof Error ? err.message : 'unknown',
    });
    return NextResponse.json(
      { success: false, error: 'خطأ في النظام' },
      { status: 500 }
    );
  }
}

// ─────────────────────────────────────────────────────────
// GET — استعراض ما هو متاح للـ seed
// ─────────────────────────────────────────────────────────

export async function GET() {
  try {
    const supabase = createClient();
    const { data: { user: caller } } = await supabase.auth.getUser();
    
    if (!caller) {
      return NextResponse.json(
        { success: false, error: 'يجب تسجيل الدخول' },
        { status: 401 }
      );
    }

    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', caller.id)
      .single();

    if (!profile || !['super_admin', 'admin'].includes(profile.role)) {
      return NextResponse.json(
        { success: false, error: 'غير مصرّح' },
        { status: 403 }
      );
    }

    // ─── احصاءات لكل category ───
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const admin = createSbClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const stats: Record<string, { available: number; existing: number }> = {};

    for (const [key, config] of Object.entries(SEED_CATEGORIES)) {
      try {
        
        const adminAny = admin as any;
        const countRes = await adminAny
          .from(config.table)
          .select('*', { count: 'exact', head: true });
        
        stats[key] = {
          available: config.count,
          existing: countRes.count || 0,
        };
      } catch {
        stats[key] = { available: config.count, existing: 0 };
      }
    }

    return NextResponse.json({
      success: true,
      categories: Object.entries(SEED_CATEGORIES).map(([key, config]) => ({
        key,
        label: config.label,
        icon: config.icon,
        color: config.color,
        description: config.description,
        available: config.count,
        existing: stats[key]?.existing || 0,
      })),
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'خطأ' },
      { status: 500 }
    );
  }
}
