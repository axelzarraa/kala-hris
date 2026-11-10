import { describe, expect, it } from "vitest";
import { findBridgeSuggestions } from "./bridges";

describe("findBridgeSuggestions", () => {
  it("Natal 2026: ambil 24 Des, libur 24 sampai 27 Des", () => {
    const result = findBridgeSuggestions(
      [
        { date: "2026-12-24", name: "Cuti Bersama Natal", isCollectiveLeave: true },
        { date: "2026-12-25", name: "Hari Raya Natal", isCollectiveLeave: false },
      ],
      "2026-11-10"
    );
    expect(result).toEqual([
      {
        leaveStart: "2026-12-24",
        leaveEnd: "2026-12-24",
        leaveDays: 1,
        offStart: "2026-12-24",
        offEnd: "2026-12-27",
        offDays: 4,
        holidayName: "Hari Raya Natal",
      },
    ]);
  });

  it("Maret 2027: menyambung Nyepi dan Idulfitri dengan 1 hari cuti", () => {
    const result = findBridgeSuggestions(
      [
        { date: "2027-03-08", name: "Hari Suci Nyepi", isCollectiveLeave: false },
        { date: "2027-03-09", name: "Cuti Bersama Idulfitri", isCollectiveLeave: true },
        { date: "2027-03-10", name: "Idulfitri", isCollectiveLeave: false },
        { date: "2027-03-11", name: "Idulfitri", isCollectiveLeave: false },
      ],
      "2027-03-01"
    );
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      leaveStart: "2027-03-09",
      leaveEnd: "2027-03-09",
      leaveDays: 1,
      offStart: "2027-03-06",
      offEnd: "2027-03-11",
      offDays: 6,
      holidayName: "Hari Suci Nyepi",
    });
    expect(result[1].leaveStart).toBe("2027-03-12");
    expect(result[1].offDays).toBe(5);
  });

  it("tanpa libur menghasilkan daftar kosong", () => {
    expect(findBridgeSuggestions([], "2026-11-10")).toEqual([]);
  });

  it("libur yang sudah lewat tidak disarankan", () => {
    const result = findBridgeSuggestions(
      [{ date: "2026-12-25", name: "Hari Raya Natal", isCollectiveLeave: false }],
      "2026-12-26"
    );
    expect(result).toEqual([]);
  });
});