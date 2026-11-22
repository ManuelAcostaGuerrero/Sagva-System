import { AppShell } from "@/components/layout/app-shell";
import { BusquedaCompra } from "@/components/forms/busqueda-compra";

export default function NuevaFacturaPage() {
  return (
    <AppShell title="Cargar factura de proveedor">
      <BusquedaCompra />
    </AppShell>
  );
}
