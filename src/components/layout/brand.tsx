import { Package } from "lucide-react";

export function Brand() {
  return (
    <div className="flex items-center gap-3 text-white" aria-label="Sag Assistant · Módulo ventas">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-white/35 bg-[#064ea4] shadow-lg shadow-blue-950/25">
        <Package className="h-7 w-7" aria-hidden="true" />
      </div>
      <div className="leading-none">
        <p className="text-2xl font-extrabold tracking-[0.06em]">SAG</p>
        <p className="mt-1 text-[11px] font-extrabold tracking-[0.2em] text-slate-300">ASSISTANT</p>
        <p className="mt-2 whitespace-nowrap text-[10px] font-extrabold tracking-[0.09em] text-blue-400">MÓDULO VENTAS</p>
      </div>
    </div>
  );
}
