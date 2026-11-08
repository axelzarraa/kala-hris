"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const demos = [
  { label: "Karyawan", email: "karyawan@kala.test" },
  { label: "Manager", email: "manager@kala.test" },
  { label: "HR", email: "hr@kala.test" },
];

const DEMO_PASSWORD = "kala12345";

export default function LoginPage() {
  const router = useRouter();
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
      router.push("/beranda");
    } catch {
      setError("Tidak bisa terhubung ke server");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-8">
        <p className="text-lg font-semibold text-indigo-600">Kala</p>
        <h1 className="mt-5 text-2xl font-semibold text-slate-900">Masuk</h1>
        <p className="mt-1 text-sm text-slate-600">
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
              className="min-h-11 rounded-lg border border-slate-300 px-3 text-sm font-normal outline-none focus:border-indigo-600"
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
              className="min-h-11 rounded-lg border border-slate-300 px-3 text-sm font-normal outline-none focus:border-indigo-600"
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

        <hr className="my-6 border-slate-200" />

        <p className="text-sm text-slate-600">Coba tanpa akun (demo):</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {demos.map((d) => (
            <button
              key={d.label}
              type="button"
              disabled={loading}
              onClick={() => login(d.email, DEMO_PASSWORD)}
              className="min-h-11 rounded-lg border border-slate-300 px-4 text-sm font-medium text-slate-800 hover:bg-slate-50 disabled:opacity-60"
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>
    </main>
  );
}