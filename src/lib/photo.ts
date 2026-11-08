import { mkdir, writeFile } from "fs/promises";
import path from "path";

const MAX_BYTES = 2 * 1024 * 1024;

export async function saveAttendancePhoto(
  dataUrl: string,
  employeeId: number,
  dateKey: string,
  type: "in" | "out"
) {
  const match = /^data:image\/jpeg;base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);
  if (!match) throw new Error("Format foto tidak valid");

  const buffer = Buffer.from(match[1], "base64");
  if (buffer.length > MAX_BYTES) throw new Error("Ukuran foto terlalu besar");

  const dir = path.join(process.cwd(), "public", "uploads", "attendance");
  await mkdir(dir, { recursive: true });

  const fileName = `${employeeId}-${dateKey}-${type}.jpg`;
  await writeFile(path.join(dir, fileName), buffer);
  return `/uploads/attendance/${fileName}`;
}