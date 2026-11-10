"use client";

import { useState } from "react";

const demos = [
  { label: "Karyawan", email: "karyawan@kala.test", hint: "Absen dan ajukan cuti" },
  { label: "Manager", email: "manager@kala.test", hint: "Setujui cuti tim" },
  { label: "HR", email: "hr@kala.test", hint: "Kelola karyawan dan laporan" },
];

const DEMO_PASSWORD = "kala12345";

function ClockMark({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </svg>
  );
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function login(e: string, p: string) {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: e, password: p }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Terjadi kesalahan");
        return;
      }
      // Full page navigation on purpose: router.push can reuse a stale cached redirect after login.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.assign("/beranda");
    } catch {
      setError("Tidak bisa terhubung ke server");
    } finally {
      setLoading(false);
    }
  }

    return (
    <main className="grid min-h-screen lg:grid-cols-2">
      <section className="relative hidden flex-col justify-between overflow-hidden bg-indigo-900 p-12 text-white lg:flex">
        <svg
          className="pointer-events-none absolute -bottom-32 -right-32 text-white/10"
          width="480"
          height="480"
          viewBox="0 0 100 100"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          aria-hidden="true"
        >
          <circle cx="50" cy="50" r="48" />
          <circle cx="50" cy="50" r="36" />
          <path d="M50 14v36l22 14" strokeLinecap="round" strokeWidth="1.5" />
        </svg>

        <div className="relative flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10">
            <ClockMark />
          </span>
          <p className="text-xl font-bold tracking-tight">Kala</p>
        </div>

        <div className="relative max-w-md">
          <h2 className="text-4xl font-bold leading-tight tracking-tight">
            Absen dan cuti, tanpa ribet.
          </h2>
          <ul className="mt-8 flex flex-col gap-4 text-indigo-100">
            <li>Absen pakai selfie dan waktu server, jadi tidak bisa diakali.</li>
            <li>Pengajuan cuti disetujui dua tahap: manager, lalu HR.</li>
            <li>Dina, asisten yang menjawab soal absensi dan cuti kamu.</li>
          </ul>
        </div>

        <p className="relative text-sm text-indigo-200">
          Proyek portofolio oleh Axel Zarra Setya Budi
        </p>
      </section>

      <section className="flex items-center justify-center bg-slate-50 p-6">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white">
              <ClockMark />
            </span>
            <p className="text-xl font-bold tracking-tight text-slate-900">Kala</p>
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Masuk
          </h1>
          <p className="mt-1.5 text-sm text-slate-600">
            Gunakan akun kantor dari HR.
          </p>

          <form
            className="mt-6 flex flex-col gap-4"
            onSubmit={(ev) => {
              ev.preventDefault();
              login(email, password);
            }}
          >
            <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-800">
              Email kantor
              <input
                type="email"
                value={email}
                onChange={(ev) => setEmail(ev.target.value)}
                placeholder="nama@perusahaan.com"
                className="min-h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm font-normal outline-none focus:border-indigo-600"
                required
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-800">
              Kata sandi
              <input
                type="password"
                value={password}
                onChange={(ev) => setPassword(ev.target.value)}
                placeholder="Kata sandi"
                className="min-h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm font-normal outline-none focus:border-indigo-600"
                required
              />
            </label>

            {error && (
              <p role="alert" className="text-sm text-red-700">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="min-h-11 rounded-lg bg-indigo-600 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              {loading ? "Memproses..." : "Masuk"}
            </button>
          </form>

          <div className="mt-8 border-t border-slate-200 pt-6">
            <p className="text-sm font-semibold text-slate-900">
              Coba tanpa akun
            </p>
            <p className="mt-0.5 text-sm text-slate-600">
              Masuk sebagai salah satu peran demo.
            </p>
            <div className="mt-3 flex flex-col gap-2">
              {demos.map((d) => (
                <button
                  key={d.label}
                  type="button"
                  disabled={loading}
                  onClick={() => login(d.email, DEMO_PASSWORD)}
                  className="flex min-h-11 items-center justify-between gap-3 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-left text-sm hover:border-indigo-600 hover:bg-indigo-50 disabled:opacity-60"
                >
                  <span className="font-medium text-slate-900">{d.label}</span>
                  <span className="text-slate-600">{d.hint}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}