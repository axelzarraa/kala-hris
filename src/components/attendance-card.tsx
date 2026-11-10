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
                    <p className="text-6xl font-bold tabular-nums tracking-tight text-slate-900">
            {now ? clockFmt.format(new Date(now)) : "--:--:--"}
          </p>
          <p className="flex items-center gap-2 text-sm text-slate-600">
            <span className="relative flex h-2 w-2" aria-hidden="true">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sun-400 opacity-60 motion-reduce:animate-none" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-sun-400" />
            </span>
            Waktu server, tidak bisa diubah
          </p>

          <div className="mt-2 grid max-w-sm grid-cols-2 gap-3">
            <div className="rounded-lg bg-slate-50 px-4 py-3">
              <p className="text-xs text-slate-600">Masuk</p>
              <p className="text-2xl font-semibold tabular-nums text-slate-900">
                {formatTime(attendance?.clockIn ?? null)}
              </p>
              {attendance?.status === "ON_TIME" && (
                <span className="mt-1 inline-block rounded-full bg-green-100 px-2.5 py-0.5 text-xs text-green-800">
                  Tepat waktu
                </span>
              )}
              {attendance?.status === "LATE" && (
                <span className="mt-1 inline-block rounded-full bg-amber-100 px-2.5 py-0.5 text-xs text-amber-900">
                  Terlambat
                </span>
              )}
            </div>
            <div className="rounded-lg bg-slate-50 px-4 py-3">
              <p className="text-xs text-slate-600">Pulang</p>
              <p className="text-2xl font-semibold tabular-nums text-slate-900">
                {formatTime(attendance?.clockOut ?? null)}
              </p>
            </div>
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

                <div className="flex h-52 w-full items-center justify-center overflow-hidden rounded-2xl bg-indigo-50 md:w-64">
          {cameraOpen ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="h-full w-full -scale-x-100 object-cover"
            />
          ) : (
            <div className="flex flex-col items-center gap-3 px-6 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-indigo-600 shadow-sm">
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z" />
                  <circle cx="12" cy="13" r="3.5" />
                </svg>
              </span>
              <p className="text-sm text-slate-700">
                Kamera menyala saat kamu menekan tombol absen
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}