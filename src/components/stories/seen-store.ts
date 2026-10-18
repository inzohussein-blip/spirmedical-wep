/**
 * ما شاهده هذا الجهازُ من القصص — راحةٌ للمشاهد لا بيانات: في localStorage، والقصّةُ تُعدّ جديدةً
 * ثانيةً إن عدّلتها الإدارة (`updated_at`). الخادمُ يرسم كلَّ القصص «غير مُشاهَدة» ثمّ يُصحَّح بعد
 * التركيب عبر useSyncExternalStore (بلا setState في أثر، وبلا اختلاف ترطيب).
 */
const KEY = 'spir_stories_seen_v1';
const listeners = new Set<() => void>();

function read(): string {
  try {
    return localStorage.getItem(KEY) ?? '{}';
  } catch {
    return '{}';
  }
}

export function subscribeSeen(cb: () => void) {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) cb();
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener('storage', onStorage);
  };
}

export const getSeenSnapshot = read;
export const getSeenServerSnapshot = () => '{}';

export function parseSeen(raw: string): Record<string, string> {
  try {
    const v = JSON.parse(raw);
    return v && typeof v === 'object' ? v : {};
  } catch {
    return {};
  }
}

export function isSeen(seen: Record<string, string>, s: { id: string; updated_at: string }) {
  return seen[s.id] === s.updated_at;
}

export function markSeen(s: { id: string; updated_at: string }) {
  const seen = parseSeen(read());
  if (seen[s.id] === s.updated_at) return;
  seen[s.id] = s.updated_at;
  try {
    localStorage.setItem(KEY, JSON.stringify(seen));
  } catch {
    // وضعُ التصفّح الخاصّ: تبقى القصّةُ «جديدة» — لا ضرر
  }
  listeners.forEach((l) => l());
}
