import { Suspense } from "react";
import { getSession } from "@/lib/session";

async function Greeting() {
  const session = await getSession();

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900">
        Halo, {session?.name}
      </h1>
      <p className="mt-1 text-sm text-slate-600">
        Fitur absensi dibuat di step berikutnya.
      </p>
    </div>
  );
}

export default function BerandaPage() {
  return (
    <Suspense fallback={null}>
      <Greeting />
    </Suspense>
  );
}