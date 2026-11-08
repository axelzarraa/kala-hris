import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import LogoutButton from "./logout-button";

const roleLabel = {
  EMPLOYEE: "Karyawan",
  MANAGER: "Manager",
  HR: "HR",
} as const;

async function Content() {
  const session = await getSession();
  if (!session) redirect("/");

  return (
    <main className="p-10">
      <h1 className="text-2xl font-semibold text-slate-900">
        Halo, {session.name}
      </h1>
      <p className="mt-2 text-slate-600">
        Masuk sebagai {roleLabel[session.role]}
      </p>
      <div className="mt-6">
        <LogoutButton />
      </div>
    </main>
  );
}

export default function BerandaPage() {
  return (
    <Suspense fallback={<p className="p-10 text-slate-600">Memuat...</p>}>
      <Content />
    </Suspense>
  );
}