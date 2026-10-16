import { buildLlmsTxt } from '@/lib/seo/llms';

// يُولَّد من src/lib/seo/facts.ts عند البناء — لا ملفَّ ثابتاً في public/
export const dynamic = 'force-static';

export function GET() {
  return new Response(buildLlmsTxt(), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=3600' },
  });
}
