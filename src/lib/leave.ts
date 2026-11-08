// Terima "YYYY-MM-DD", hasilnya tanggal UTC tengah malam
export function parseDateOnly(value: unknown): Date | null {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }
  const d = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

// Hitung hari kerja (Senin sampai Jumat), awal dan akhir ikut dihitung
export function countWorkdays(start: Date, end: Date) {
  let count = 0;
  for (
    const d = new Date(start);
    d <= end;
    d.setUTCDate(d.getUTCDate() + 1)
  ) {
    const day = d.getUTCDay();
    if (day !== 0 && day !== 6) count++;
  }
  return count;
}