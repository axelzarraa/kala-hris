import { describe, expect, it } from "vitest";
import { countWorkdays, parseDateOnly } from "./leave";

function day(value: string) {
  return new Date(`${value}T00:00:00Z`);
}

describe("parseDateOnly", () => {
  it("menerima format YYYY-MM-DD", () => {
    expect(parseDateOnly("2026-11-16")?.toISOString()).toBe(
      "2026-11-16T00:00:00.000Z"
    );
  });

  it("menolak format lain", () => {
    expect(parseDateOnly("16-11-2026")).toBeNull();
    expect(parseDateOnly("2026-13-01")).toBeNull();
    expect(parseDateOnly(12345)).toBeNull();
    expect(parseDateOnly(undefined)).toBeNull();
  });
});

describe("countWorkdays", () => {
  it("menghitung Senin sampai Rabu sebagai 3 hari", () => {
    expect(countWorkdays(day("2026-11-16"), day("2026-11-18"))).toBe(3);
  });

  it("satu hari kerja dihitung 1", () => {
    expect(countWorkdays(day("2026-11-09"), day("2026-11-09"))).toBe(1);
  });

  it("melewati akhir pekan tidak menghitung Sabtu dan Minggu", () => {
    expect(countWorkdays(day("2026-11-13"), day("2026-11-16"))).toBe(2);
  });

  it("hanya akhir pekan menghasilkan 0", () => {
    expect(countWorkdays(day("2026-11-14"), day("2026-11-15"))).toBe(0);
  });

  it("tidak mengubah tanggal yang dikirim", () => {
    const start = day("2026-11-16");
    countWorkdays(start, day("2026-11-20"));
    expect(start.toISOString()).toBe("2026-11-16T00:00:00.000Z");
  });
});