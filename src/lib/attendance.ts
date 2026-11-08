const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;
export const WORK_START_MINUTES = 8 * 60; // 08:00 WIB

function toWib(now: Date) {
  return new Date(now.getTime() + WIB_OFFSET_MS);
}

// Tanggal hari ini menurut WIB, disimpan sebagai UTC tengah malam
export function getWibDate(now: Date) {
  const w = toWib(now);
  return new Date(
    Date.UTC(w.getUTCFullYear(), w.getUTCMonth(), w.getUTCDate())
  );
}

export function getAttendanceStatus(now: Date): "ON_TIME" | "LATE" {
  const w = toWib(now);
  const minutes = w.getUTCHours() * 60 + w.getUTCMinutes();
  return minutes <= WORK_START_MINUTES ? "ON_TIME" : "LATE";
}