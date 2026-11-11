import DinaChat from "@/components/dina-chat";

export default function DinaPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Dina</h1>
        <p className="mt-1.5 text-sm text-slate-600">
          Asisten untuk pertanyaan seputar absensi dan cuti milikmu.
        </p>
      </div>
      <DinaChat />
    </div>
  );
}