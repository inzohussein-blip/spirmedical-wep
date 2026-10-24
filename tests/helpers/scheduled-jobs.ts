import { readFileSync } from 'fs';
import { join } from 'path';

/** المهامّ المجدولة من `.github/workflows/scheduled-jobs.yml` (كانت `crons` في vercel.json) */
export function scheduledJobs(): { schedules: string[]; jobs: { cron: string; path: string }[] } {
  const y = readFileSync(join(process.cwd(), '.github/workflows/scheduled-jobs.yml'), 'utf8');
  const schedules = [...y.matchAll(/^\s+- cron: '([^']+)'/gm)].map((m) => m[1]);
  const block = y.match(/JOBS: \|\n((?:\s+[^\n]+=\/[^\n]+\n)+)/)?.[1] ?? '';
  const jobs = block.split('\n').map((l) => l.trim()).filter(Boolean).map((l) => {
    const [cron, path] = l.split('=');
    return { cron, path };
  });
  return { schedules, jobs };
}
