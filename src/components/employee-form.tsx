"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Option = { id: number; name: string };

const inputCls =
  "min-h-11 w-full rounded-lg border border-slate-300 px-3 text-sm font-normal outline-none focus:border-indigo-600";
const labelCls = "flex flex-col gap-1.5 text-sm font-medium text-slate-800";

export default function EmployeeForm({
  departments,
  managers,
}: {
  departments: Option[];
  managers: Option[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function submit(ev: React.FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    const form = ev.currentTarget;
    const f = new FormData(form);

    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: f.get("name"),
          email: f.get("email"),
          position: f.get("position"),
          role: f.get("role"),
          departmentId: Number(f.get("departmentId")),
          managerId: f.get("managerId") || null,
          joinDate: f.get("joinDate"),
          password: f.get("password"),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Gagal menambah karyawan");
        return;
      }
      form.reset();
      setSuccess(`Karyawan ${data.employee.name} ditambahkan.`);
      router.refresh();
    } catch {
      setError("Tidak bisa terhubung ke server");
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="min-h-11 self-start rounded-lg bg-indigo-600 px-5 text-sm font-medium text-white hover:bg-indigo-700"
      >
        Tambah karyawan
      </button>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-6"
    >
      <h2 className="text-base font-semibold text-slate-900">
        Karyawan baru
      </h2>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className={labelCls}>
          Nama lengkap
          <input name="name" className={inputCls} required />
        </label>
        <label className={labelCls}>
          Email kantor
          <input name="email" type="email" className={inputCls} required />
        </label>
        <label className={labelCls}>
          Jabatan
          <input name="position" className={inputCls} required />
        </label>
        <label className={labelCls}>
          Tanggal bergabung
          <input name="joinDate" type="date" className={inputCls} required />
        </label>
        <label className={labelCls}>
          Departemen
          <select name="departmentId" className={inputCls} required>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </label>
        <label className={labelCls}>
          Atasan langsung
          <select name="managerId" className={inputCls} defaultValue="">
            <option value="">Tanpa atasan</option>
            {managers.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </label>
        <label className={labelCls}>
          Peran
          <select name="role" className={inputCls} defaultValue="EMPLOYEE">
            <option value="EMPLOYEE">Karyawan</option>
            <option value="MANAGER">Manager</option>
            <option value="HR">HR</option>
          </select>
        </label>
        <label className={labelCls}>
          Kata sandi awal
          <input
            name="password"
            type="password"
            minLength={8}
            placeholder="Minimal 8 karakter"
            className={inputCls}
            required
          />
        </label>
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}
      {success && <p className="text-sm text-green-800">{success}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="min-h-11 rounded-lg bg-indigo-600 px-5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
        >
          {loading ? "Menyimpan..." : "Simpan"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="min-h-11 rounded-lg border border-slate-300 px-4 text-sm font-medium text-slate-800 hover:bg-slate-50"
        >
          Tutup
        </button>
      </div>
    </form>
  );
}