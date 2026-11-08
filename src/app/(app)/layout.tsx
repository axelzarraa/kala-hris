import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import Sidebar from "@/components/sidebar";

async function Shell({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/");

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar name={session.name} role={session.role} />
      <main className="min-w-0 flex-1 p-8">{children}</main>
    </div>
  );
}

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<p className="p-10 text-slate-600">Memuat...</p>}>
      <Shell>{children}</Shell>
    </Suspense>
  );
}