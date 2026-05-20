import {
  assertPositiveAmount,
  calcularLinea,
  calcularTotales,
} from "./ventas.calculations";
import type {
  AgregarArticuloInput,
  AgregarPagoInput,
  AnularVentaInput,
  CrearVentaInput,
  FinalizarVentaInput,
  ID,
  PagoVenta,
  Venta,
  VentaDetalle,
  VentasRepository,
} from "./ventas.types";

function now(): string {
  return new Date().toISOString();
}

function createLocalId(prefix: string): ID {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function generarVentaTemporalId(usuarioId: ID): string {
  return `VT-${usuarioId}-${Date.now()}`;
}

export class VentasService {
  constructor(private readonly repo: VentasRepository) {}

  async crearVenta(input: CrearVentaInput): Promise<Venta> {
    const fecha = now();

    const venta: Venta = {
      id: createLocalId("venta"),
      ventaTemporalId: generarVentaTemporalId(input.usuarioVendedorId),
      numeroDocumento: null,
      tipoDocumento: "BOLETA",
      clienteId: input.clienteId ?? null,
      usuarioVendedorId: input.usuarioVendedorId,
      cajeroId: input.cajeroId,
      sucursalId: input.sucursalId,
      cajaId: input.cajaId,
      cajaTurnoId: input.cajaTurnoId,
      fechaInicio: fecha,
      fechaFinalizacion: null,
      estado: "ABIERTA",
      subtotal: 0,
      descuentoTotal: 0,
      impuestoTotal: 0,
      total: 0,
      totalPagado: 0,
      saldoPendiente: 0,
      vuelto: 0,
      observacion: input.observacion ?? null,
      creadoPor: input.usuarioVendedorId,
      fechaCreacion: fecha,
    };

    return this.repo.crearVenta(venta);
  }

  async agregarArticulo(input: AgregarArticuloInput): Promise<VentaDetalle> {
    assertPositiveAmount(input.cantidad, "cantidad");

    const venta = await this.requireVentaEditable(input.ventaId);

    if (input.articulo.controlaStock && input.articulo.stockDisponible != null) {
      if (input.articulo.stockDisponible < input.cantidad) {
        throw new Error("Stock insuficiente para agregar este artículo a la venta.");
      }
    }

    const descuentoLinea = input.descuentoLinea ?? 0;
    const calculo = calcularLinea({
      cantidad: input.cantidad,
      precioUnitario: input.articulo.precioPublico,
      descuentoLinea,
      impuestoPorcentaje: input.articulo.impuestoPorcentaje,
    });

    const detalle: VentaDetalle = {
      id: createLocalId("venta_detalle"),
      ventaId: venta.id,
      articuloId: input.articulo.articuloId,
      codigoProducto: input.articulo.codigoProducto,
      nombreArticulo: input.articulo.nombreArticulo,
      cantidad: input.cantidad,
      precioUnitario: input.articulo.precioPublico,
      descuentoLinea,
      impuestoPorcentaje: input.articulo.impuestoPorcentaje,
      impuestoMonto: calculo.impuestoMonto,
      subtotalLinea: calculo.subtotalLinea,
      totalLinea: calculo.totalLinea,
      controlaStock: input.articulo.controlaStock,
      unidadMedidaId: input.articulo.unidadMedidaId ?? null,
      creadoPor: input.usuarioId,
      fechaCreacion: now(),
    };

    const created = await this.repo.agregarDetalle(detalle);
    await this.recalcularVenta(venta.id, input.usuarioId);
    return created;
  }

  async agregarPago(input: AgregarPagoInput): Promise<PagoVenta> {
    assertPositiveAmount(input.monto, "monto");
    await this.requireVentaEditable(input.ventaId);

    const pago: PagoVenta = {
      id: createLocalId("pago"),
      ventaId: input.ventaId,
      metodoPago: input.metodoPago,
      monto: input.monto,
      referencia: input.referencia ?? null,
      estado: "REGISTRADO",
      usuarioRegistra: input.usuarioId,
      fechaPago: now(),
    };

    const created = await this.repo.agregarPago(pago);
    await this.recalcularVenta(input.ventaId, input.usuarioId);
    return created;
  }

  async finalizarVenta(input: FinalizarVentaInput): Promise<Venta> {
    const venta = await this.requireVentaEditable(input.ventaId);
    const detalles = await this.repo.obtenerDetalles(venta.id);
    const pagos = await this.repo.obtenerPagos(venta.id);
    const totales = calcularTotales(detalles, pagos);

    if (detalles.length === 0) {
      throw new Error("No se puede finalizar una venta sin artículos.");
    }

    if (!input.permiteVentaConSaldo && totales.saldoPendiente > 0) {
      throw new Error("La venta tiene saldo pendiente. Agrega pagos hasta cubrir el total.");
    }

    const numeroDocumento = await this.repo.obtenerSiguienteNumeroDocumento(
      venta.tipoDocumento,
      venta.sucursalId,
    );

    for (const detalle of detalles) {
      if (!detalle.controlaStock) continue;

      await this.repo.descontarStock(detalle.articuloId, venta.sucursalId, detalle.cantidad);
      await this.repo.registrarMovimientoStock({
        id: createLocalId("stock_mov"),
        articuloId: detalle.articuloId,
        sucursalId: venta.sucursalId,
        tipoMovimiento: "SALIDA_VENTA",
        documentoOrigenId: venta.id,
        tipoDocumentoOrigen: venta.tipoDocumento,
        cantidad: detalle.cantidad,
        fecha: now(),
        usuarioId: input.usuarioId,
        observacion: `Salida por venta ${numeroDocumento}`,
      });
    }

    for (const pago of pagos.filter((item) => item.estado === "REGISTRADO")) {
      await this.repo.registrarMovimientoCaja({
        id: createLocalId("caja_mov"),
        cajaId: venta.cajaId,
        cajaTurnoId: venta.cajaTurnoId,
        sucursalId: venta.sucursalId,
        usuarioId: input.usuarioId,
        tipoMovimiento: "VENTA",
        documentoOrigenId: venta.id,
        tipoDocumentoOrigen: venta.tipoDocumento,
        monto: pago.monto,
        fecha: now(),
        observacion: `Pago ${pago.metodoPago} venta ${numeroDocumento}`,
        estado: "ACTIVO",
      });
    }

    return this.repo.actualizarVenta(venta.id, {
      ...totales,
      numeroDocumento,
      estado: "COBRADA",
      fechaFinalizacion: now(),
      actualizadoPor: input.usuarioId,
      fechaActualizacion: now(),
    });
  }

  async anularVenta(input: AnularVentaInput): Promise<Venta> {
    if (!input.motivo.trim()) {
      throw new Error("Debes indicar un motivo para anular la venta.");
    }

    const venta = await this.repo.obtenerVenta(input.ventaId);
    if (!venta) {
      throw new Error("Venta no encontrada.");
    }

    if (venta.estado !== "COBRADA") {
      throw new Error("Solo se pueden anular ventas cobradas.");
    }

    const detalles = await this.repo.obtenerDetalles(venta.id);

    for (const detalle of detalles) {
      if (!detalle.controlaStock) continue;

      await this.repo.devolverStock(detalle.articuloId, venta.sucursalId, detalle.cantidad);
      await this.repo.registrarMovimientoStock({
        id: createLocalId("stock_mov"),
        articuloId: detalle.articuloId,
        sucursalId: venta.sucursalId,
        tipoMovimiento: "ENTRADA_ANULACION",
        documentoOrigenId: venta.id,
        tipoDocumentoOrigen: venta.tipoDocumento,
        cantidad: detalle.cantidad,
        fecha: now(),
        usuarioId: input.usuarioAnulaId,
        observacion: `Entrada por anulación. Motivo: ${input.motivo}`,
      });
    }

    await this.repo.registrarMovimientoCaja({
      id: createLocalId("caja_mov"),
      cajaId: venta.cajaId,
      cajaTurnoId: venta.cajaTurnoId,
      sucursalId: venta.sucursalId,
      usuarioId: venta.cajeroId,
      tipoMovimiento: "ANULACION",
      documentoOrigenId: venta.id,
      tipoDocumentoOrigen: venta.tipoDocumento,
      monto: venta.totalPagado * -1,
      fecha: now(),
      observacion: `Anulación ejecutada por ${input.usuarioAnulaId}. Motivo: ${input.motivo}`,
      estado: "ACTIVO",
    });

    return this.repo.actualizarVenta(venta.id, {
      estado: "ANULADA",
      actualizadoPor: input.usuarioAnulaId,
      fechaActualizacion: now(),
      observacion: venta.observacion
        ? `${venta.observacion}\nAnulación: ${input.motivo}`
        : `Anulación: ${input.motivo}`,
    });
  }

  private async recalcularVenta(ventaId: ID, usuarioId: ID): Promise<Venta> {
    const detalles = await this.repo.obtenerDetalles(ventaId);
    const pagos = await this.repo.obtenerPagos(ventaId);
    const totales = calcularTotales(detalles, pagos);

    return this.repo.actualizarVenta(ventaId, {
      ...totales,
      actualizadoPor: usuarioId,
      fechaActualizacion: now(),
    });
  }

  private async requireVentaEditable(ventaId: ID): Promise<Venta> {
    const venta = await this.repo.obtenerVenta(ventaId);

    if (!venta) {
      throw new Error("Venta no encontrada.");
    }

    if (!["ABIERTA", "PENDIENTE"].includes(venta.estado)) {
      throw new Error("La venta no se puede modificar en su estado actual.");
    }

    return venta;
  }
}
