'use client';

import { useEffect } from 'react';
import { markInboxRead } from './actions';

/**
 * يُعلِّم الإشعاراتِ مقروءةً بعد عرضها فعلاً — لا في تصيير الخادم، كي لا
 * يمحو الجلبُ المسبق (prefetch) النقطةَ الحمراء قبل أن يرى المريضُ شيئاً.
 */
export default function MarkRead({ hasUnread }: { hasUnread: boolean }) {
  useEffect(() => {
    if (hasUnread) markInboxRead().catch(() => {});
  }, [hasUnread]);
  return null;
}
