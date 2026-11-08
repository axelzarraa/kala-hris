import { Suspense } from "react";
import { getSession } from "@/lib/session";
import AttendanceCard from "@/components/attendance-card";

async function Greeting() {
  const session = await getSession();

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900">
        Halo, {session?.name}
      </h1>
      <p className="mt-1 text-sm text-slate-600">
        Absen dulu sebelum mulai kerja.
      </p>
    </div>
  );
}

export default function BerandaPage() {
  return (
    <div className="flex flex-col gap-6">
      <Suspense fallback={null}>
        <Greeting />
      </Suspense>
      <AttendanceCard />
    </div>
  );
}