/** مراحلُ العيّنة كما يراها المختبر (`lab_orders.status`) */
export const SAMPLE_STAGE: Record<string, { label: string; tone: 'amber' | 'blue' | 'green' }> = {
  sent_to_lab: { label: 'في الطريق إليك', tone: 'amber' },
  processing: { label: 'قيد التحليل', tone: 'blue' },
  results_ready: { label: 'النتائج مرفوعة', tone: 'green' },
};
