
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {},
}));

import { parseMonth, toCsv } from "./report";

describe("parseMonth", () => {
  it("menerima format YYYY-MM yang valid", () => {
    const result = parseMonth("2026-11");

    expect(result).not.toBeNull();
    expect(result?.start.toISOString()).toBe("2026-11-01T00:00:00.000Z");
    expect(result?.end.toISOString()).toBe("2026-11-30T00:00:00.000Z");
  });

  it("menentukan tanggal akhir Februari dengan benar", () => {
    expect(parseMonth("2028-02")?.end.toISOString()).toBe(
      "2028-02-29T00:00:00.000Z"
    );
    expect(parseMonth("2027-02")?.end.toISOString()).toBe(
      "2027-02-28T00:00:00.000Z"
    );
  });

  it("menolak format bulan yang tidak valid", () => {
    expect(parseMonth("2026-13")).toBeNull();
    expect(parseMonth("2026-00")).toBeNull();
    expect(parseMonth("26-11")).toBeNull();
    expect(parseMonth("2026-1")).toBeNull();
    expect(parseMonth("")).toBeNull();
    expect(parseMonth(null)).toBeNull();
  });
});

describe("toCsv", () => {
  it("menghasilkan header dan BOM UTF-8", () => {
    const result = toCsv([]);

    expect(result.startsWith("\uFEFF")).toBe(true);
    expect(result).toContain('"Kode";"Nama";"Departemen"');
    expect(result).toContain('"Hari hadir";"Tepat waktu";"Terlambat";"Hari cuti"');
  });

  it("menghasilkan baris laporan dengan benar", () => {
    const result = toCsv([
      {
        code: "K001",
        name: "Budi",
        department: "Engineering",
        present: 20,
        onTime: 18,
        late: 2,
        leaveDays: 3,
      },
    ]);

    expect(result).toContain(
      '"K001";"Budi";"Engineering";"20";"18";"2";"3"'
    );
  });

  it("mengamankan nilai yang diawali karakter formula Excel", () => {
    const result = toCsv([
      {
        code: "=1+1",
        name: "+Budi",
        department: "-Finance",
        present: 1,
        onTime: 1,
        late: 0,
        leaveDays: 0,
      },
    ]);

    expect(result).toContain("\"'=1+1\"");
    expect(result).toContain("\"'+Budi\"");
    expect(result).toContain("\"'-Finance\"");
  });

  it("mengamankan tanda kutip dan mempertahankan UTF-8", () => {
    const result = toCsv([
      {
        code: "K002",
        name: 'Acha "HR"',
        department: "Operasional",
        present: 10,
        onTime: 9,
        late: 1,
        leaveDays: 2,
      },
    ]);

    expect(result).toContain('"Acha ""HR"""');
    expect(result).toContain("Operasional");
  });
});
