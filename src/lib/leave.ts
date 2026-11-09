// Terima "YYYY-MM-DD", hasilnya tanggal UTC tengah malam
export function parseDateOnly(value: unknown): Date | null {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }
  const d = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function toDateKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

// Hitung hari kerja (Senin sampai Jumat), awal dan akhir ikut dihitung.
// skipDates berisi tanggal "YYYY-MM-DD" libur nasional yang tidak dihitung.
export function countWorkdays(
  start: Date,
  end: Date,
  skipDates: ReadonlySet<string> = new Set()
) {
  let count = 0;
  for (
    const d = new Date(start);
    d <= end;
    d.setUTCDate(d.getUTCDate() + 1)
  ) {
    const day = d.getUTCDay();
    if (day === 0 || day === 6) continue;
    if (skipDates.has(toDateKey(d))) continue;
    count++;
  }
  return count;
}