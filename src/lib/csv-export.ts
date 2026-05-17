/**
 * تحويل array من records إلى CSV string مع BOM للعربي
 */
export function toCSV<T extends Record<string, unknown>>(
  rows: T[],
  headers: Array<{ key: keyof T; label: string }>
): string {
  if (rows.length === 0) return '';

  const escape = (value: unknown): string => {
    if (value === null || value === undefined) return '';
    const str = String(value);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const headerRow = headers.map((h) => escape(h.label)).join(',');
  const dataRows = rows.map((row) =>
    headers.map((h) => escape(row[h.key])).join(',')
  );

  // BOM للعربي في Excel
  return '\ufeff' + [headerRow, ...dataRows].join('\n');
}
