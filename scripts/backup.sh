#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════
# Supabase Backup Script
#
# يأخذ نسخة احتياطية يومية من Supabase ويرفعها لـ S3-compatible storage.
#
# الاستخدام:
#   ./scripts/backup.sh
#
# المتطلبات:
#   - SUPABASE_DB_URL (postgres connection string)
#   - BACKUP_S3_BUCKET (اختياري - للرفع التلقائي)
#   - aws-cli أو rclone (للرفع)
#
# الجدولة (cron):
#   0 3 * * * /path/to/backup.sh >> /var/log/spir-backup.log 2>&1
# ═══════════════════════════════════════════════════════════════════

set -euo pipefail

# الإعدادات
BACKUP_DIR="${BACKUP_DIR:-/var/backups/spirmedical}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/spir_${TIMESTAMP}.sql.gz"

# تحقق من المتغيرات
if [[ -z "${SUPABASE_DB_URL:-}" ]]; then
  echo "❌ SUPABASE_DB_URL غير محدد" >&2
  exit 1
fi

mkdir -p "$BACKUP_DIR"

echo "🚀 بدء النسخ الاحتياطي..."

# 1. أخذ النسخة
pg_dump "$SUPABASE_DB_URL" \
  --no-owner \
  --no-privileges \
  --format=plain \
  | gzip -9 > "$BACKUP_FILE"

SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
echo "✅ تم: $BACKUP_FILE ($SIZE)"

# 2. تحقق من الـ integrity
gzip -t "$BACKUP_FILE" || {
  echo "❌ النسخة تالفة!" >&2
  exit 1
}
echo "✅ تم التحقق من سلامة النسخة"

# 3. ارفع لـ S3 (اختياري)
if [[ -n "${BACKUP_S3_BUCKET:-}" ]]; then
  if command -v aws &>/dev/null; then
    aws s3 cp "$BACKUP_FILE" "s3://${BACKUP_S3_BUCKET}/$(basename "$BACKUP_FILE")"
    echo "✅ تم الرفع لـ S3"
  fi
fi

# 4. حذف النسخ القديمة (احتفظ بـ RETENTION_DAYS فقط)
find "$BACKUP_DIR" -name "spir_*.sql.gz" -mtime +"$RETENTION_DAYS" -delete
DELETED=$(find "$BACKUP_DIR" -name "spir_*.sql.gz" -mtime +"$RETENTION_DAYS" 2>/dev/null | wc -l)
[[ $DELETED -gt 0 ]] && echo "🧹 تم حذف $DELETED نسخة قديمة"

echo "🎉 اكتمل النسخ الاحتياطي"
