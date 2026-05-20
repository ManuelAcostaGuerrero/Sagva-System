import { AppShell } from "@/components/layout/app-shell";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/utils/formatters/currency";
import {
  abrirCajaAction,
  cerrarCajaAction,
  registrarMovimientoCajaAction,
} from "./actions";

export const dynamic = "force-dynamic";

function toNumber(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value);
  if (value && typeof value === "object" && "toString" in value) {
    return Number(value.toString());
  }
  return 0;
}

export default async function CajaPage() {
  const sucursal = await prisma.sucursal.findFirst({
    orderBy: { createdAt: "asc" },
  });

  const cajaActiva = sucursal
    ? await prisma.caja.findFirst({
        where: {
          sucursalId: sucursal.id,
          estado: "abierta",
        },
        include: {
          usuario: true,
          sucursal: true,
          movimientos: {
            orderBy: { createdAt: "desc" },
          },
          ventas: {
            where: { estado: "cobrada" },
          },
        },
        orderBy: { fechaApertura: "desc" },
      })
    : null;

  const historial = await prisma.caja.findMany({
    include: {
      usuario: true,
      sucursal: true,
      cierres: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  const totalMovimientos = cajaActiva
    ? cajaActiva.movimientos.reduce((sum, mov) => sum + toNumber(mov.monto), 0)
    : 0;

  const ventasTurno = cajaActiva
    ? cajaActiva.ventas.reduce((sum, venta) => sum + toNumber(venta.totalPagado), 0)
    : 0;

  return (
    <AppShell title="Caja" subtitle="Apertura, caja activa, movimientos y cierre">
      <section className="space-y-6">
        {!sucursal ? (
          <div className="sagva-panel p-6 text-sm text-slate-600">
            No existe una sucursal configurada. Crea una sucursal antes de abrir caja.
          </div>
        ) : null}

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_390px]">
          <div className="space-y-5">
            <div className="sagva-panel overflow-hidden">
              <div className="sagva-panel-title">
                {cajaActiva ? "Caja activa" : "Apertura de caja"}
              </div>

              {cajaActiva ? (
                <div className="p-5">
                  <div className="grid gap-4 md:grid-cols-4">
                    <div className="rounded-lg bg-blue-50 p-4">
                      <p className="text-xs font-bold uppercase text-blue-700">Estado</p>
                      <p className="mt-1 text-xl font-bold text-slate-950">{cajaActiva.estado}</p>
                    </div>
                    <div className="rounded-lg bg-slate-50 p-4">
                      <p className="text-xs font-bold uppercase text-slate-500">Sucursal</p>
                      <p className="mt-1 font-bold text-slate-950">{cajaActiva.sucursal.nombre}</p>
                    </div>
                    <div className="rounded-lg bg-slate-50 p-4">
                      <p className="text-xs font-bold uppercase text-slate-500">Cajero</p>
                      <p className="mt-1 font-bold text-slate-950">{cajaActiva.usuario.nombre}</p>
                    </div>
                    <div className="rounded-lg bg-slate-50 p-4">
                      <p className="text-xs font-bold uppercase text-slate-500">Monto inicial</p>
                      <p className="mt-1 font-bold text-slate-950">
                        {formatCurrency(toNumber(cajaActiva.montoInicial))}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    <div className="rounded-lg border border-[#d8dee8] p-4">
                      <p className="text-xs font-bold uppercase text-slate-500">Movimientos caja</p>
                      <p className="mt-1 text-2xl font-bold text-[#064ea4]">
                        {formatCurrency(totalMovimientos)}
                      </p>
                    </div>
                    <div className="rounded-lg border border-[#d8dee8] p-4">
                      <p className="text-xs font-bold uppercase text-slate-500">Ventas cobradas</p>
                      <p className="mt-1 text-2xl font-bold text-[#064ea4]">
                        {formatCurrency(ventasTurno)}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <form action={abrirCajaAction} className="grid gap-4 p-5 md:grid-cols-2">
                  <div>
                    <label className="sagva-label">Monto inicial</label>
                    <input
                      className="sagva-field"
                      name="montoInicial"
                      type="number"
                      min={0}
                      defaultValue={0}
                      required
                    />
                  </div>
                  <div>
                    <label className="sagva-label">Sucursal</label>
                    <input className="sagva-field" value={sucursal?.nombre ?? "-"} readOnly />
                  </div>
                  <div className="md:col-span-2">
                    <label className="sagva-label">Observación</label>
                    <textarea
                      className="sagva-field min-h-24"
                      name="observacion"
                      placeholder="Observación de apertura"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <button className="sagva-button-primary" type="submit" disabled={!sucursal}>
                      Abrir caja
                    </button>
                  </div>
                </form>
              )}
            </div>

            {cajaActiva ? (
              <div className="sagva-panel overflow-hidden">
                <div className="sagva-panel-title">Movimientos de caja</div>
                <div className="overflow-x-auto">
                  <table className="sagva-table">
                    <thead>
                      <tr>
                        <th>Fecha</th>
                        <th>Tipo</th>
                        <th>Concepto</th>
                        <th>Monto</th>
                        <th>Observación</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cajaActiva.movimientos.map((mov) => (
                        <tr key={mov.id}>
                          <td>{mov.createdAt.toLocaleString("es-CL")}</td>
                          <td className="font-bold text-slate-950">{mov.tipo}</td>
                          <td>{mov.concepto}</td>
                          <td className={toNumber(mov.monto) < 0 ? "font-bold text-red-700" : "font-bold text-green-700"}>
                            {formatCurrency(toNumber(mov.monto))}
                          </td>
                          <td>{mov.observacion ?? "-"}</td>
                        </tr>
                      ))}
                      {cajaActiva.movimientos.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-slate-500">
                            No hay movimientos registrados.
                          </td>
                        </tr>
                      ) : null}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}
          </div>

          <aside className="space-y-5">
            {cajaActiva ? (
              <>
                <div className="sagva-panel p-5">
                  <h2 className="text-lg font-bold text-slate-950">Ingreso / retiro</h2>
                  <form action={registrarMovimientoCajaAction} className="mt-4 space-y-3">
                    <input type="hidden" name="cajaId" value={cajaActiva.id} />
                    <div>
                      <label className="sagva-label">Tipo</label>
                      <select className="sagva-field" name="tipo" defaultValue="ingreso">
                        <option value="ingreso">Ingreso</option>
                        <option value="retiro">Retiro</option>
                      </select>
                    </div>
                    <div>
                      <label className="sagva-label">Monto</label>
                      <input className="sagva-field" name="monto" type="number" min={1} required />
                    </div>
                    <div>
                      <label className="sagva-label">Concepto</label>
                      <input className="sagva-field" name="concepto" placeholder="Ej: vuelto, retiro supervisor" />
                    </div>
                    <div>
                      <label className="sagva-label">Observación</label>
                      <textarea className="sagva-field min-h-20" name="observacionMovimiento" />
                    </div>
                    <button className="w-full sagva-button-secondary" type="submit">
                      Registrar movimiento
                    </button>
                  </form>
                </div>

                <div className="sagva-panel p-5">
                  <h2 className="text-lg font-bold text-slate-950">Cerrar caja</h2>
                  <form action={cerrarCajaAction} className="mt-4 space-y-3">
                    <input type="hidden" name="cajaId" value={cajaActiva.id} />
                    <div>
                      <label className="sagva-label">Efectivo contado</label>
                      <input
                        className="sagva-field"
                        name="efectivoContado"
                        type="number"
                        min={0}
                        required
                      />
                    </div>
                    <div>
                      <label className="sagva-label">Observación de cierre</label>
                      <textarea className="sagva-field min-h-20" name="observacionCierre" />
                    </div>
                    <button className="w-full rounded-md border border-red-200 bg-white px-4 py-3 text-sm font-bold text-red-700 hover:bg-red-50" type="submit">
                      Cerrar caja
                    </button>
                    <p className="text-xs text-slate-500">
                      Para pruebas se muestra el total esperado. Más adelante esto debe depender del permiso del usuario.
                    </p>
                  </form>
                </div>
              </>
            ) : (
              <div className="sagva-panel p-5 text-sm text-slate-600">
                No hay caja activa. Abre una caja para habilitar el cobro en ventas.
              </div>
            )}
          </aside>
        </div>

        <div className="sagva-panel overflow-hidden">
          <div className="sagva-panel-title">Historial reciente de cajas</div>
          <div className="overflow-x-auto">
            <table className="sagva-table">
              <thead>
                <tr>
                  <th>Fecha apertura</th>
                  <th>Sucursal</th>
                  <th>Cajero</th>
                  <th>Estado</th>
                  <th>Monto inicial</th>
                  <th>Efectivo contado</th>
                  <th>Diferencia</th>
                </tr>
              </thead>
              <tbody>
                {historial.map((caja) => {
                  const cierre = caja.cierres[0];
                  return (
                    <tr key={caja.id}>
                      <td>{caja.fechaApertura.toLocaleString("es-CL")}</td>
                      <td>{caja.sucursal.nombre}</td>
                      <td>{caja.usuario.nombre}</td>
                      <td>
                        <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-bold text-slate-700">
                          {caja.estado}
                        </span>
                      </td>
                      <td>{formatCurrency(toNumber(caja.montoInicial))}</td>
                      <td>{cierre ? formatCurrency(toNumber(cierre.efectivoContado)) : "-"}</td>
                      <td>{cierre ? formatCurrency(toNumber(cierre.diferencia)) : "-"}</td>
                    </tr>
                  );
                })}
                {historial.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500">
                      No hay cajas registradas todavía.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
