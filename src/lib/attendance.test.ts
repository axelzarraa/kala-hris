import { describe, expect, it } from "vitest";
import { getAttendanceStatus, getWibDate } from "./attendance";

describe("getAttendanceStatus", () => {
  it("tepat waktu sebelum 08:00 WIB", () => {
    expect(getAttendanceStatus(new Date("2026-11-09T00:59:00Z"))).toBe(
      "ON_TIME"
    );
  });

  it("tepat waktu pas di jam 08:00 WIB", () => {
    expect(getAttendanceStatus(new Date("2026-11-09T01:00:00Z"))).toBe(
      "ON_TIME"
    );
  });

  it("terlambat mulai 08:01 WIB", () => {
    expect(getAttendanceStatus(new Date("2026-11-09T01:01:00Z"))).toBe("LATE");
  });
});

describe("getWibDate", () => {
  it("masih tanggal yang sama pukul 23:59 WIB", () => {
    const d = getWibDate(new Date("2026-11-08T16:59:00Z"));
    expect(d.toISOString().slice(0, 10)).toBe("2026-11-08");
  });

  it("pindah ke tanggal berikutnya tepat tengah malam WIB", () => {
    const d = getWibDate(new Date("2026-11-08T17:00:00Z"));
    expect(d.toISOString().slice(0, 10)).toBe("2026-11-09");
  });
});