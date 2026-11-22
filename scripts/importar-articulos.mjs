#!/usr/bin/env node
// Importador manual. Sin --aplicar, solo analiza y genera un reporte.
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { Prisma } from "@prisma/client";

const args = process.argv.slice(2);
const arg = (key, fallback) => args.find(x => x.startsWith("--" + key + "="))?.slice(key.length + 3) ?? fallback;
const aplicar = args.includes("--aplicar");
const origen = path.resolve(arg("archivo", "SAGVA_articulos_migracion_privada.json"));
const sucursalCodigo = arg("sucursal", "principal");
const comparable = v => String(v ?? "").normalize("NFC").trim().replace(/\s+/g, " ").toLocaleLowerCase("es");
const texto = v => typeof v === "string" ? v.trim() : "";
const dinero = v => typeof v === "string" && /^-?\d+(\.\d+)?$/.test(v) && Number.isFinite(Number(v)) && Math.abs(Number(v)) < 1e12 ? Number(v) : null;
const costoConIva = valor => new Prisma.Decimal(valor).mul("1.19").toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP).toNumber();

function datosTributarios(r) {
  if (r.tipoOrigen === "PRODUCTO") return ["PRODUCTO", "IVA"];
  if (r.tipoOrigen === "ARTICULO") return ["ARTICULO", "IVA"];
  if (r.tipoOrigen === "EXENTOS") {
    if (["cigarros", "tabaqueria"].includes(comparable(r.familia))) return ["PRODUCTO", "IVA_RETENIDO"];
    return null; // Revisión manual: no todo EXENTOS es IVA retenido.
  }
  return null; // Nunca migrar PROMOCION.
}

function prevalidar(data) {
  if (data?.formato !== "SAGVA-ARTICULOS-1" || !Array.isArray(data.registros)) {
    throw Error("El archivo no corresponde al formato privado SAGVA-ARTICULOS-1.");
  }
  const contarIds = new Map(), contarBarras = new Map(), contarNombres = new Map();
  for (const r of data.registros) {
    const id = texto(r.idAnterior), barra = texto(r.codigoBarra), nombre = comparable(r.nombre);
    if (nombre) contarNombres.set(nombre, (contarNombres.get(nombre) || 0) + 1);
    if (id) contarIds.set(id, (contarIds.get(id) || 0) + 1);
    if (barra) contarBarras.set(barra, (contarBarras.get(barra) || 0) + 1);
  }
  const validos = [], pendientes = [], alertas = [];
  for (const r of data.registros) {
    const id = texto(r.idAnterior), barra = texto(r.codigoBarra);
    const nombre = typeof r.nombre === "string" ? r.nombre : "", familia = texto(r.familia);
    const trib = datosTributarios(r);
    const costo = dinero(r.costoNeto), precio = dinero(r.precioPublico), stock = dinero(r.stock);
    const bruto = costo !== null ? costoConIva(r.costoNeto) : null;
    const recargo = bruto !== null && bruto > 0 && precio !== null ? Number((precio / bruto - 1).toFixed(10)) : null;
    const motivos = [];
    if (!/^\d{1,15}$/.test(id)) motivos.push("ID antiguo no numérico o no confiable");
    if ((contarIds.get(id) || 0) > 1) motivos.push("ID anterior duplicado");
    if (barra && /[eE]\s*[+-]\s*\d+/.test(barra)) motivos.push("Código de barras en notación científica: valor original incierto");
    if (/^\d{16,}$/.test(barra)) motivos.push("Código de barras con más de 15 dígitos: comprobar precisión en el original");
    if (/^d\s*-/i.test(barra) || /^https?:\/\//i.test(barra) || /[{}]/.test(barra)) motivos.push("Código de barras parece una marca, enlace o dato dañado: revisar");
    if (barra.length > 100) motivos.push("Código de barras demasiado largo");
    if (barra && (contarBarras.get(barra) || 0) > 1) motivos.push("Código de barras duplicado en Excel");
    if (!trib) motivos.push("Tipo EXENTOS fuera de CIGARROS/TABAQUERIA u otro tipo no autorizado");
    if (!nombre.trim()) motivos.push("Nombre vacío");
    if (nombre.trim() && (contarNombres.get(comparable(nombre)) || 0) > 1) motivos.push("Nombre repetido en el archivo; confirmar si es duplicado");
    if (/\b(duplicado|eliminar|prueba|test)\b/i.test(nombre)) motivos.push("Nombre marcado para revisión manual");
    if (precio === null || precio <= 0) motivos.push("Precio público faltante o no positivo");
    if (costo === null || costo <= 0) motivos.push("Costo neto faltante o no positivo");
    if (typeof r.costoNeto === "string" && (r.costoNeto.split(".")[1]?.length || 0) > 5) motivos.push("Costo neto con más de cinco decimales");
    if (bruto !== null && bruto <= 0) motivos.push("Costo con IVA redondeado a cero");
    if (stock === null) motivos.push("Stock ilegible");
    if (!["SI", "NO"].includes(r.activo)) motivos.push("Estado ACTIVO desconocido");
    if (recargo !== null && recargo < 0) motivos.push("Precio público inferior al costo con IVA");
    if (recargo !== null && recargo > 100) motivos.push("Recargo superior a 10.000%");
    if (motivos.length) {
      pendientes.push({ filaExcel: r.filaExcel, id, nombre, motivos });
      continue;
    }
    if (stock < 0) alertas.push({ filaExcel: r.filaExcel, id, nombre, mensaje: "Stock negativo: se cargará cero" });
    validos.push({
      filaExcel: r.filaExcel, id, barra: barra || null, nombre, familia,
      tipoArticulo: trib[0], tipoImpuesto: trib[1],
      estado: r.activo === "SI" ? "activo" : "inactivo",
      costo, bruto, precio, recargo, stock: Math.max(0, stock)
    });
  }
  return { validos, pendientes, alertas, total: data.registros.length };
}

async function cargarEnv() {
  if (process.env.DATABASE_URL) return;
  const content = await fs.readFile(".env", "utf8").catch(() => "");
  const line = content.split(/\r?\n/).find(x => /^\s*DATABASE_URL\s*=/.test(x));
  if (!line) throw Error("Falta DATABASE_URL en .env.");
  process.env.DATABASE_URL = line.slice(line.indexOf("=") + 1).trim().replace(/^["']|["']$/g, "");
}
function rutaBD() {
  const url = process.env.DATABASE_URL;
  if (!url?.startsWith("file:")) throw Error("El importador solo admite la SQLite local de SAGVA.");
  const file = decodeURIComponent(url.slice(5).split("?")[0]);
  return path.isAbsolute(file) ? file : path.resolve("prisma", file);
}
async function backupBD(prisma) {
  const folder = path.resolve("backups", "migracion-articulos");
  await fs.mkdir(folder, { recursive: true });
  const name = "catalogo-" + new Date().toISOString().replace(/[:.]/g, "-") + ".sqlite";
  const dest = path.join(folder, name);
  // Copia consistente, incluso si SQLite usa WAL; no modificar el origen.
  await prisma.$executeRawUnsafe("VACUUM INTO '" + dest.replace(/'/g, "''") + "'");
  return dest;
}
async function guardarReporte(reporte) {
  const folder = path.resolve("reportes-importacion");
  await fs.mkdir(folder, { recursive: true });
  const name = "catalogo-" + new Date().toISOString().replace(/[:.]/g, "-") + (aplicar ? "-aplicado.json" : "-analisis.json");
  const file = path.join(folder, name);
  await fs.writeFile(file, JSON.stringify(reporte, null, 2), "utf8");
  return file;
}

async function main() {
  if (!/^[a-zA-Z0-9_-]+$/.test(sucursalCodigo)) throw Error("Código de sucursal inválido.");
  const contenido = JSON.parse(await fs.readFile(origen, "utf8"));
  const plan = prevalidar(contenido);
  await cargarEnv();
  const bd = rutaBD();
  const stat = await fs.stat(bd).catch(() => null);
  if (!stat?.isFile() || stat.size < 1000) throw Error("No se encontró la SQLite actual en " + bd + "; no se creará otra base.");
  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient();
  try {
    const cols = await prisma.$queryRawUnsafe('PRAGMA table_info("articulos")');
    if (!cols.some(c => c.name === "tipo_articulo")) throw Error("Falta tipo_articulo en SQLite; actualizar SAGVA y Prisma primero.");
    const sucursal = await prisma.sucursal.findUnique({ where: { codigo: sucursalCodigo } });
    if (!sucursal) throw Error("Sucursal " + sucursalCodigo + " no existe; no se creará automáticamente.");
    const [actuales, catalogo, preciosVigentes, stocksSucursal] = await Promise.all([
      prisma.articulo.findMany({ select: {
        id: true, codigoProducto: true, codigoBarra: true, nombre: true, tipoArticulo: true,
        tipoImpuesto: true, estado: true, unidadMedida: true, subfamiliaId: true, marcaId: true, familiaId: true
      } }),
      prisma.familia.findMany({ select: { id: true, nombre: true } }),
      prisma.articuloPrecio.findMany({ where: { vigente: true }, orderBy: { createdAt: "desc" },
        select: { articuloId: true, precioSinIva: true, precioConIva: true, precioPublico: true } }),
      prisma.inventarioStock.findMany({ where: { sucursalId: sucursal.id },
        select: { articuloId: true, stockActual: true } })
    ]);
    const nombreFamiliaPorId = new Map(catalogo.map(f => [f.id, f.nombre]));
    const precioPorArticulo = new Map(), cantidadPrecios = new Map();
    for (const p of preciosVigentes) {
      cantidadPrecios.set(p.articuloId, (cantidadPrecios.get(p.articuloId) || 0) + 1);
      if (!precioPorArticulo.has(p.articuloId)) precioPorArticulo.set(p.articuloId, p);
    }
    const stockPorArticulo = new Map(stocksSucursal.map(stock => [stock.articuloId, stock]));
    const porId = new Map(actuales.map(a => [a.codigoProducto, a]));
    const porBarra = new Map(actuales.filter(a => a.codigoBarra).map(a => [a.codigoBarra, a]));
    const porNombre = new Map();
    for (const a of actuales) {
      const key = comparable(a.nombre), grupo = porNombre.get(key) ?? [];
      grupo.push(a); porNombre.set(key, grupo);
    }
    const familias = new Map();
    for (const f of catalogo) {
      const k = comparable(f.nombre), grupo = familias.get(k) ?? [];
      grupo.push(f); familias.set(k, grupo);
    }
    const listos = [], existentes = [];
    for (const r of plan.validos) {
      const anterior = porId.get(r.id);
      if (anterior) {
        if (comparable(anterior.nombre) === comparable(r.nombre) && anterior.codigoBarra === r.barra) {
          const precio = precioPorArticulo.get(anterior.id), stock = stockPorArticulo.get(anterior.id);
          const igual = (a, b) => a != null && b != null && new Prisma.Decimal(a).equals(new Prisma.Decimal(b));
          const diferencias = [];
          if (anterior.tipoArticulo !== r.tipoArticulo) diferencias.push("tipo de artículo");
          if (anterior.tipoImpuesto !== r.tipoImpuesto) diferencias.push("tratamiento tributario");
          if (anterior.estado !== r.estado) diferencias.push("estado");
          if (anterior.unidadMedida !== "UNIDAD") diferencias.push("unidad");
          if (comparable(nombreFamiliaPorId.get(anterior.familiaId)) !== comparable(r.familia)) diferencias.push("familia");
          if (anterior.subfamiliaId || anterior.marcaId) diferencias.push("subfamilia o marca");
          if ((cantidadPrecios.get(anterior.id) || 0) > 1) diferencias.push("múltiples precios vigentes");
          if (!precio || !igual(precio.precioSinIva, r.costo)) diferencias.push("costo neto");
          if (!precio || !igual(precio.precioConIva, r.bruto)) diferencias.push("costo con IVA");
          if (!precio || !igual(precio.precioPublico, r.precio)) diferencias.push("precio público");
          if (!stock || !igual(stock.stockActual, r.stock)) diferencias.push("stock de la sucursal");
          if (diferencias.length) {
            plan.pendientes.push({ filaExcel: r.filaExcel, id: r.id, nombre: r.nombre,
              motivos: ["Ya existe con diferencias; no modificado: " + diferencias.join(", ")] });
          } else {
            existentes.push({ filaExcel: r.filaExcel, id: r.id, nombre: r.nombre, nota: "Ya existe y coincide; no modificado" });
          }
        } else {
          plan.pendientes.push({ filaExcel: r.filaExcel, id: r.id, nombre: r.nombre, motivos: ["El ID está ocupado por otro artículo de SAGVA"] });
        }
        continue;
      }
      if (r.barra && porBarra.has(r.barra)) {
        plan.pendientes.push({ filaExcel: r.filaExcel, id: r.id, nombre: r.nombre, motivos: ["El código de barras está ocupado en SAGVA"] });
        continue;
      }
      if ((porNombre.get(comparable(r.nombre))?.length || 0) > 0) {
        plan.pendientes.push({ filaExcel: r.filaExcel, id: r.id, nombre: r.nombre, motivos: ["El nombre coincide con otro artículo de SAGVA; revisar"] });
        continue;
      }
      if (r.familia && (familias.get(comparable(r.familia))?.length || 0) > 1) {
        plan.pendientes.push({ filaExcel: r.filaExcel, id: r.id, nombre: r.nombre, motivos: ["La familia está duplicada en SAGVA; revisar"] });
        continue;
      }
      listos.push(r);
    }
    let respaldo = null, importados = 0, familiasCreadas = 0;
    if (aplicar && listos.length) {
      respaldo = await backupBD(prisma);
      console.log("Respaldo SQLite previo: " + respaldo);
      for (const r of listos) {
        try {
          const k = comparable(r.familia);
          let familiaId = k ? familias.get(k)?.[0]?.id ?? null : null;
          if (k && !familiaId) {
            const creada = await prisma.familia.create({ data: { nombre: r.familia }, select: { id: true, nombre: true } });
            familiaId = creada.id; familias.set(k, [creada]); familiasCreadas++;
          }
          await prisma.articulo.create({
            data: {
              codigoProducto: r.id, codigoBarra: r.barra, nombre: r.nombre,
              tipoArticulo: r.tipoArticulo, tipoImpuesto: r.tipoImpuesto,
              impuestoAdicional: 0, familiaId, subfamiliaId: null, marcaId: null,
              unidadMedida: "UNIDAD", estado: r.estado,
              precios: { create: {
                precioSinIva: r.costo, precioConIva: r.bruto,
                precioPublico: r.precio, margen: r.recargo
              } },
              stocks: { create: { sucursalId: sucursal.id, stockActual: r.stock } },
              movimientos: r.stock > 0 ? { create: {
                sucursalId: sucursal.id, tipoMovimiento: "entrada",
                cantidad: r.stock, observacion: "Migración inicial del ID " + r.id
              } } : undefined
            }
          });
          importados++;
        } catch (error) {
          plan.pendientes.push({ filaExcel: r.filaExcel, id: r.id, nombre: r.nombre, motivos: ["Error al importar: " + String(error)] });
        }
      }
    }
    const reporte = {
      modo: aplicar ? "aplicacion" : "analisis",
      origen: contenido.origen, base: bd,
      sucursal: { codigo: sucursal.codigo, nombre: sucursal.nombre },
      totalSinPromociones: plan.total, listos: listos.length,
      yaExistentes: existentes.length, importados, familiasCreadas,
      respaldo, pendientes: plan.pendientes, alertas: plan.alertas, existentes
    };
    const reportPath = await guardarReporte(reporte);
    console.log(JSON.stringify({
      modo: reporte.modo, totalSinPromociones: plan.total, listos: listos.length,
      yaExistentes: existentes.length, importados, pendientes: plan.pendientes.length,
      stockNegativo: plan.alertas.length, familiasCreadas,
      sucursal: sucursal.nombre, respaldo, reporte: reportPath
    }, null, 2));
    if (!aplicar) console.log("Solo análisis. SQLite no fue modificada.");
    if (aplicar && plan.pendientes.length) process.exitCode = 2;
  } finally {
    await prisma.$disconnect();
  }
}
main().catch(error => { console.error("IMPORTACIÓN DETENIDA:", error.message || error); process.exitCode = 1; });

