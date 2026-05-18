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
