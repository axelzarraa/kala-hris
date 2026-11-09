import { v2 as cloudinary } from "cloudinary";
import { randomUUID } from "crypto";

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

  const result = await cloudinary.uploader.upload(dataUrl, {
    folder: "kala/attendance",
    public_id: `${employeeId}-${dateKey}-${type}-${randomUUID()}`,
    resource_type: "image",
  });

  return result.secure_url;
}