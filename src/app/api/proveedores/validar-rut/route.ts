import { NextResponse } from "next/server";

type EstadoValidacion = "habilitado" | "no_habilitado" | "invalido" | "error";

type DocumentoAutorizado = {
  codigo: string;
  descripcion: string;
  autorizado?: string;
  desautorizado?: string;
};

const SII_URL = "https://palena.sii.cl/cvc_cgi/dte/ee_empresa_rut";

function limpiarRut(valor: string) {
  return valor.replace(/\./g, "").replace(/-/g, "").replace(/\s/g, "").toUpperCase();
}

function calcularDv(cuerpo: string) {
  let suma = 0;
  let multiplicador = 2;

  for (let index = cuerpo.length - 1; index >= 0; index -= 1) {
    suma += Number(cuerpo[index]) * multiplicador;
    multiplicador = multiplicador === 7 ? 2 : multiplicador + 1;
  }

  const resultado = 11 - (suma % 11);
  if (resultado === 11) return "0";
  if (resultado === 10) return "K";
  return String(resultado);
}

function normalizarRut(valor: unknown) {
  if (typeof valor !== "string") return null;

  const rut = limpiarRut(valor);
  if (!/^\d{7,8}[0-9K]$/.test(rut)) return null;

  const cuerpo = rut.slice(0, -1);
  const dv = rut.slice(-1);

  if (calcularDv(cuerpo) !== dv) return null;

  return {
    cuerpo,
    dv,
    formateado: `${Number(cuerpo).toLocaleString("es-CL")}-${dv}`
  };
}

function decodificarHtml(valor: string) {
  const entidades: Record<string, string> = {
    nbsp: " ",
    aacute: "á",
    eacute: "é",
    iacute: "í",
    oacute: "ó",
    uacute: "ú",
    Aacute: "Á",
    Eacute: "É",
    Iacute: "Í",
    Oacute: "Ó",
    Uacute: "Ú",
    ntilde: "ñ",
    Ntilde: "Ñ",
    deg: "°",
    quot: "\"",
    amp: "&",
    lt: "<",
    gt: ">"
  };

  return valor.replace(/&(#\d+|#x[\da-f]+|[a-zA-Z]+);/g, (entidad, codigo: string) => {
    if (codigo.startsWith("#x")) return String.fromCharCode(parseInt(codigo.slice(2), 16));
    if (codigo.startsWith("#")) return String.fromCharCode(Number(codigo.slice(1)));
    return entidades[codigo] ?? entidad;
  });
}

function textoPlano(html: string) {
  return decodificarHtml(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
  ).replace(/\uFFFD/g, "°").replace(/\s+/g, " ").trim();
}

function extraerEntre(texto: string, inicio: string, finales: string[]) {
  const desde = texto.toLowerCase().indexOf(inicio.toLowerCase());
  if (desde === -1) return undefined;

  const contenidoDesdeInicio = texto.slice(desde + inicio.length).trim();
  const posiciones = finales
    .map((final) => contenidoDesdeInicio.toLowerCase().indexOf(final.toLowerCase()))
    .filter((posicion) => posicion >= 0);

  const hasta = posiciones.length > 0 ? Math.min(...posiciones) : contenidoDesdeInicio.length;
  const valor = contenidoDesdeInicio.slice(0, hasta).replace(/^[:\s]+/, "").trim();
  return valor || undefined;
}

function extraerDocumentos(texto: string): DocumentoAutorizado[] {
  const inicio = texto.indexOf("Código Descripción Autorizado Desautorizado");
  if (inicio === -1) return [];

  const bloque = texto.slice(inicio);
  const documentos: DocumentoAutorizado[] = [];
  const patron = /\b(\d{2})\s+([A-ZÁÉÍÓÚÑ ]+?)\s+(\d{2}-\d{2}-\d{4}|-)(?:\s+(\d{2}-\d{2}-\d{4}|-))?(?=\s+\d{2}\s+[A-ZÁÉÍÓÚÑ ]+\s+(?:\d{2}-\d{2}-\d{4}|-)|\s*$)/g;

  let match = patron.exec(bloque);
  while (match) {
    documentos.push({
      codigo: match[1],
      descripcion: match[2].trim(),
      autorizado: match[3] === "-" ? undefined : match[3],
      desautorizado: match[4] && match[4] !== "-" ? match[4] : undefined
    });
    match = patron.exec(bloque);
  }

  return documentos;
}

function interpretarRespuesta(html: string) {
  const texto = textoPlano(html);
  const documentos = extraerDocumentos(texto);
  const mensajeNoAutorizado =
    texto.match(/Rut que ha ingresado[^.]+\./i)?.[0] ??
    extraerEntre(texto, "El contribuyente", ["Consultar contribuyente", "Ver listado"]);
  const rutExtraido = extraerEntre(texto, "Rut", ["Razón Social/Nombres"]);
  const razonSocial = extraerEntre(texto, "Razón Social/Nombres", [
    "DIRECCION",
    "N° Resolución",
    "N° Resolucion",
    "Nº Resolución",
    "Nº Resolucion",
    "Dirección Regional",
    "Direccion Regional"
  ]);

  const datos = {
    rut: rutExtraido && /^\d{7,8}-[0-9K]$/i.test(rutExtraido) ? rutExtraido : undefined,
    razonSocial,
    numeroResolucion:
      extraerEntre(texto, "N° Resolución", ["Fecha Resolución", "Fecha Resolucion"]) ??
      extraerEntre(texto, "Nº Resolución", ["Fecha Resolución", "Fecha Resolucion"]),
    fechaResolucion: extraerEntre(texto, "Fecha Resolución", ["Dirección Regional", "Direccion Regional"]),
    direccionRegional: extraerEntre(texto, "Dirección Regional", ["El contribuyente", "Código Descripción"]),
    documentosAutorizados: documentos
  };

  if (documentos.length > 0 || /autorizada la emisión/i.test(texto)) {
    return {
      estado: "habilitado" as EstadoValidacion,
      mensaje: "El proveedor figura habilitado en el SII para emitir documentos tributarios electrónicos.",
      datos
    };
  }

  if (/no.*autorizad|no se encuentra|no registra|no existe/i.test(texto)) {
    return {
      estado: "no_habilitado" as EstadoValidacion,
      mensaje: mensajeNoAutorizado?.replace(/^rut/i, "RUT") ?? "El SII no informa autorización vigente para emitir DTE con este RUT.",
      datos
    };
  }

  return {
    estado: "error" as EstadoValidacion,
    mensaje: "El SII respondió, pero Sagva no pudo interpretar el resultado de la consulta.",
    datos: { ...datos, textoRespuesta: texto.slice(0, 700) }
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null) as { rut?: unknown } | null;
    const rut = normalizarRut(body?.rut);

    if (!rut) {
      return NextResponse.json({
        estado: "invalido" satisfies EstadoValidacion,
        mensaje: "Ingresa un RUT chileno válido, con dígito verificador.",
        datos: null
      }, { status: 400 });
    }

    const parametros = new URLSearchParams({
      RUT_EMP: rut.cuerpo,
      DV_EMP: rut.dv,
      ACEPTAR: "Consultar"
    });

    const respuesta = await fetch(SII_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "Sagva-System/0.2"
      },
      body: parametros,
      cache: "no-store"
    });

    if (!respuesta.ok) {
      return NextResponse.json({
        estado: "error" satisfies EstadoValidacion,
        mensaje: `El SII respondió con estado ${respuesta.status}. Intenta nuevamente más tarde.`,
        datos: { rut: rut.formateado }
      }, { status: 502 });
    }

    const html = new TextDecoder("iso-8859-1").decode(await respuesta.arrayBuffer());
    const resultado = interpretarRespuesta(html);

    return NextResponse.json({
      ...resultado,
      datos: {
        rutConsultado: rut.formateado,
        ...resultado.datos
      }
    });
  } catch {
    return NextResponse.json({
      estado: "error" satisfies EstadoValidacion,
      mensaje: "No fue posible consultar el SII en este momento.",
      datos: null
    }, { status: 500 });
  }
}
