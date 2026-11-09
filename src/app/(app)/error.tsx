"use client";

export default function Error({ reset }: { reset: () => void }) {
  return (
    <div className="mx-auto mt-10 max-w-md rounded-xl border border-slate-200 bg-white p-8 text-center">
      <h1 className="text-lg font-semibold text-slate-900">
        Terjadi kesalahan
      </h1>
      <p className="mt-1 text-sm text-slate-600">
        Data tidak bisa dimuat. Coba lagi sebentar.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-5 min-h-11 rounded-lg bg-indigo-600 px-5 text-sm font-medium text-white hover:bg-indigo-700"
      >
        Coba lagi
      </button>
    </div>
  );
}