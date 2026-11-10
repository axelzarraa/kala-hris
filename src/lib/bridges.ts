import { toDateKey } from "@/lib/leave";

const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_LEAVE = 4; // paling banyak 4 hari cuti per saran
const MIN_RATIO = 2.5; // minimal hari libur per hari cuti
const HORIZON_DAYS = 400;

export type HolidayInput = {
  date: string; // YYYY-MM-DD
  name: string;
  isCollectiveLeave: boolean;
};

export type BridgeSuggestion = {
  leaveStart: string;
  leaveEnd: string;
  leaveDays: number;
  offStart: string;
  offEnd: string;
  offDays: number;
  holidayName: string;
};

type Day = { key: string; free: boolean; weekdayHoliday?: string };

type Candidate = BridgeSuggestion & {
  ratio: number;
  offIndex: number;
  leaveIndex: number;
};

// Hari bebas = akhir pekan atau libur nasional. Cuti bersama dianggap hari
// kerja biasa (kalau diambil, memotong jatah cuti).
export function findBridgeSuggestions(
  holidays: HolidayInput[],
  fromKey: string,
  limit = 3
): BridgeSuggestion[] {
  const from = new Date(`${fromKey}T00:00:00Z`);
  if (Number.isNaN(from.getTime())) return [];

  const national = new Map<string, string>();
  for (const h of holidays) {
    if (!h.isCollectiveLeave) national.set(h.date, h.name);
  }

  const days: Day[] = [];
  for (let i = 0; i <= HORIZON_DAYS; i++) {
    const d = new Date(from.getTime() + i * DAY_MS);
    const dow = d.getUTCDay();
    const key = toDateKey(d);
    const name = national.get(key);
    const weekend = dow === 0 || dow === 6;
    days.push({
      key,
      free: weekend || name !== undefined,
      weekdayHoliday: weekend ? undefined : name,
    });
  }

  const used = new Set<string>();
  const found: Candidate[] = [];

  let i = 0;
  while (i < days.length) {
    if (!days[i].free) {
      i++;
      continue;
    }
    let j = i;
    while (j + 1 < days.length && days[j + 1].free) j++;

    const holiday = days
      .slice(i, j + 1)
      .find((d) => d.weekdayHoliday)?.weekdayHoliday;

    if (holiday) {
      const options: Candidate[] = [];
      const add = (
        leaveFirst: number,
        leaveLast: number,
        offFirst: number,
        offLast: number
      ) => {
        const leaveDays = leaveLast - leaveFirst + 1;
        const offDays = offLast - offFirst + 1;
        const ratio = offDays / leaveDays;
        if (ratio < MIN_RATIO) return;
        options.push({
          leaveStart: days[leaveFirst].key,
          leaveEnd: days[leaveLast].key,
          leaveDays,
          offStart: days[offFirst].key,
          offEnd: days[offLast].key,
          offDays,
          holidayName: holiday,
          ratio,
          offIndex: offFirst,
          leaveIndex: leaveFirst,
        });
      };

      // Ambil cuti di hari kerja tepat sebelum rentang libur
      for (let k = 1; k <= MAX_LEAVE; k++) {
        const idx = i - k;
        if (idx < 0 || days[idx].free) break;
        let offFirst = idx;
        while (offFirst - 1 >= 0 && days[offFirst - 1].free) offFirst--;
        add(idx, i - 1, offFirst, j);
      }

      // Ambil cuti di hari kerja tepat sesudah rentang libur
      for (let k = 1; k <= MAX_LEAVE; k++) {
        const idx = j + k;
        if (idx >= days.length || days[idx].free) break;
        let offLast = idx;
        while (offLast + 1 < days.length && days[offLast + 1].free) offLast++;
        add(j + 1, idx, i, offLast);
      }

      options.sort(
        (a, b) =>
          b.ratio - a.ratio ||
          b.offDays - a.offDays ||
          a.leaveIndex - b.leaveIndex
      );
      const pick = options.find(
        (o) => !used.has(`${o.leaveStart}|${o.leaveEnd}`)
      );
      if (pick) {
        used.add(`${pick.leaveStart}|${pick.leaveEnd}`);
        found.push(pick);
      }
    }

    i = j + 1;
  }

  found.sort((a, b) => a.offIndex - b.offIndex);
  return found.slice(0, limit).map((c) => ({
    leaveStart: c.leaveStart,
    leaveEnd: c.leaveEnd,
    leaveDays: c.leaveDays,
    offStart: c.offStart,
    offEnd: c.offEnd,
    offDays: c.offDays,
    holidayName: c.holidayName,
  }));
}