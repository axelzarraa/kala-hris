"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Attendance = {
  clockIn: string | null;
  clockOut: string | null;
  status: "ON_TIME" | "LATE" | "ABSENT" | "LEAVE";
} | null;

const clockFmt = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Jakarta",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

const timeFmt = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Jakarta",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

function formatTime(iso: string | null) {
  return iso ? timeFmt.format(new Date(iso)) : "--:--";
}

export default function AttendanceCard() {
  const [attendance, setAttendance] = useState<Attendance>(null);
  const [offset, setOffset] = useState(0);
  const [now, setNow] = useState<number | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/attendance/today");
    if (!res.ok) return;
    const data = await res.json();
    setOffset(new Date(data.serverTime).getTime() - Date.now());
    setAttendance(data.attendance);
  }, []);

    useEffect(() => {
    const t = setTimeout(load, 0);
    return () => clearTimeout(t);
  }, [load]);

  // Jam mengikuti waktu server, bukan jam perangkat
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now() + offset), 1000);
    return () => clearInterval(id);
  }, [offset]);

  useEffect(() => {
    if (cameraOpen && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [cameraOpen]);

  useEffect(() => {
    return () => streamRef.current?.getTracks().forEach((t) => t.stop());
  }, []);

  function stopCamera() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraOpen(false);
  }

  async function openCamera() {
    setError("");
    try {
      streamRef.current = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
      });
      setCameraOpen(true);
    } catch {
      setError("Kamera tidak bisa dibuka. Izinkan akses kamera di browser.");
    }
  }

  async function capture(type: "in" | "out") {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;

    setSaving(true);
    setError("");

    const canvas = document.createElement("canvas");
    canvas.width = 480;
    canvas.height = Math.round((video.videoHeight / video.videoWidth) * 480);
    canvas.getContext("2d")?.drawImage(video, 0, 0, canvas.width, canvas.height);
    const photo = canvas.toDataURL("image/jpeg", 0.7);

    try {
      const res = await fetch("/api/attendance/clock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, photo }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Gagal absen");
        return;
      }
      stopCamera();
      await load();
    } catch {
      setError("Tidak bisa terhubung ke server");
    } finally {
      setSaving(false);
    }
  }

  const nextType = !attendance?.clockIn
    ? "in"
    : !attendance.clockOut
      ? "out"
      : null;

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6">
      <h2 className="text-base font-semibold text-slate-900">
        Absensi hari ini
      </h2>

      <div className="mt-4 flex flex-col gap-6 md:flex-row">
        <div className="flex flex-1 flex-col gap-3">
          <p className="text-5xl font-semibold tracking-wide text-slate-900">
            {now ? clockFmt.format(new Date(now)) : "--:--:--"}
          </p>
          <p className="text-sm text-slate-600">
            Waktu server, tidak bisa diubah
          </p>

          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-800">
              Masuk {formatTime(attendance?.clockIn ?? null)}
            </span>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-800">
              Pulang {formatTime(attendance?.clockOut ?? null)}
            </span>
            {attendance?.status === "ON_TIME" && (
              <span className="rounded-full bg-green-100 px-3 py-1 text-xs text-green-800">
                Tepat waktu
              </span>
            )}
            {attendance?.status === "LATE" && (
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs text-amber-900">
                Terlambat
              </span>
            )}
          </div>

          {error && (
            <p role="alert" className="text-sm text-red-700">
              {error}
            </p>
          )}

          {nextType && !cameraOpen && (
            <button
              type="button"
              onClick={openCamera}
              className="min-h-11 self-start rounded-lg bg-indigo-600 px-5 text-sm font-medium text-white hover:bg-indigo-700"
            >
              {nextType === "in" ? "Absen masuk" : "Absen pulang"}
            </button>
          )}

          {nextType && cameraOpen && (
            <div className="flex gap-2">
              <button
                type="button"
                disabled={saving}
                onClick={() => capture(nextType)}
                className="min-h-11 rounded-lg bg-indigo-600 px-5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
              >
                {saving ? "Menyimpan..." : "Ambil foto dan absen"}
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={stopCamera}
                className="min-h-11 rounded-lg border border-slate-300 px-4 text-sm font-medium text-slate-800 hover:bg-slate-50"
              >
                Batal
              </button>
            </div>
          )}

          {!nextType && (
            <p className="text-sm text-slate-600">
              Absensi hari ini sudah lengkap.
            </p>
          )}
        </div>

        <div className="flex h-52 w-full items-center justify-center overflow-hidden rounded-xl border border-dashed border-slate-300 bg-slate-100 md:w-64">
          {cameraOpen ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="h-full w-full -scale-x-100 object-cover"
            />
          ) : (
            <p className="px-4 text-center text-sm text-slate-600">
              Kamera terbuka saat kamu menekan tombol absen
            </p>
          )}
        </div>
      </div>
    </section>
  );
}