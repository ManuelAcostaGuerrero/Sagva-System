import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { initialRoles } from "../src/config/permissions.config";

const prisma = new PrismaClient();

async function main() {
  for (const role of initialRoles) {
    await prisma.rol.upsert({
      where: { codigo: role.code },
      update: {
        nombre: role.name,
        descripcion: role.description
      },
      create: {
        codigo: role.code,
        nombre: role.name,
        descripcion: role.description
      }
    });
  }

  const adminRole = await prisma.rol.findUniqueOrThrow({
    where: { codigo: "admin" }
  });

  await prisma.usuario.upsert({
    where: { correo: "admin@sagva.local" },
    update: {
      rolId: adminRole.id,
      estado: "activo"
    },
    create: {
      nombre: "Administrador Sagva",
      correo: "admin@sagva.local",
      passwordHash: await bcrypt.hash("admin123", 10),
      rolId: adminRole.id,
      estado: "activo"
    }
  });

  await prisma.sucursal.upsert({
    where: { codigo: "principal" },
    update: { nombre: "Sucursal Principal", estado: "activo" },
    create: { codigo: "principal", nombre: "Sucursal Principal", estado: "activo" }
  });

  await prisma.familia.upsert({
    where: { id: "familia-general" },
    update: { nombre: "General", estado: "activo" },
    create: { id: "familia-general", nombre: "General", estado: "activo" }
  });

  await prisma.marca.upsert({
    where: { id: "marca-generica" },
    update: { nombre: "Genérica", estado: "activo" },
    create: { id: "marca-generica", nombre: "Genérica", estado: "activo" }
  });

  const sucursal = await prisma.sucursal.findUniqueOrThrow({
    where: { codigo: "principal" }
  });

  await prisma.proveedor.upsert({
    where: { codigo: "PROV001" },
    update: {
      rutRuc: "20123456789",
      razonSocial: "DISTRIBUIDORA LA UNIÓN SAC",
      telefono: "987 654 321",
      correo: "ventas@launion.com",
      contacto: "Juan Pérez"
    },
    create: {
      codigo: "PROV001",
      rutRuc: "20123456789",
      razonSocial: "DISTRIBUIDORA LA UNIÓN SAC",
      nombreComercial: "La Unión",
      direccion: "Av. Los Próceres 1234",
      telefono: "987 654 321",
      correo: "ventas@launion.com",
      contacto: "Juan Pérez",
      estado: "activo"
    }
  });

  const articulosBase = [
    {
      codigoProducto: "PRD001",
      nombre: "Aceite Vegetal 1L",
      precioConIva: 1800,
      precioSinIva: 1512.61,
      precioPublico: 2340,
      stock: 24,
      minimo: 8,
      maximo: 80
    },
    {
      codigoProducto: "PRD002",
      nombre: "Arroz Superior 5kg",
      precioConIva: 2500,
      precioSinIva: 2100.84,
      precioPublico: 3250,
      stock: 12,
      minimo: 10,
      maximo: 100
    }
  ];

  for (const item of articulosBase) {
    const articulo = await prisma.articulo.upsert({
      where: { codigoProducto: item.codigoProducto },
      update: {
        nombre: item.nombre,
        stockMinimo: item.minimo,
        stockMaximo: item.maximo
      },
      create: {
        codigoProducto: item.codigoProducto,
        codigoInventario: item.codigoProducto,
        codigoBarra: `7800000${item.codigoProducto.replace("PRD", "")}`,
        nombre: item.nombre,
        familiaId: "familia-general",
        marcaId: "marca-generica",
        unidadMedida: "UND",
        tipoImpuesto: "IVA",
        stockMinimo: item.minimo,
        stockMaximo: item.maximo,
        estado: "activo"
      }
    });

    await prisma.articuloPrecio.updateMany({
      where: { articuloId: articulo.id },
      data: { vigente: false }
    });

    await prisma.articuloPrecio.create({
      data: {
        articuloId: articulo.id,
        precioConIva: item.precioConIva,
        precioSinIva: item.precioSinIva,
        margen: 0.3,
        precioPublico: item.precioPublico,
        vigente: true
      }
    });

    await prisma.inventarioStock.upsert({
      where: {
        articuloId_sucursalId: {
          articuloId: articulo.id,
          sucursalId: sucursal.id
        }
      },
      update: {
        stockActual: item.stock,
        stockMinimo: item.minimo,
        stockMaximo: item.maximo
      },
      create: {
        articuloId: articulo.id,
        sucursalId: sucursal.id,
        stockActual: item.stock,
        stockMinimo: item.minimo,
        stockMaximo: item.maximo
      }
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
