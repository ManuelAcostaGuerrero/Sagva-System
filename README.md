# Sagva System

**Sagva System** significa **Sistema Automatizado de Gestión de Ventas y Análisis**.

Este repositorio contiene la estructura inicial del sistema como software modular. Cada módulo debe mantenerse separado por responsabilidad, con entradas, procesos, salidas, reglas e integraciones claras.

## Objetivo general

Crear una plataforma modular para gestionar ventas, artículos, inventario, proveedores, facturas, caja, ensamblaje, análisis, seguridad, interfaz e integración de datos.

## Módulos principales

1. Artículos
2. Inventario
3. Proveedores
4. Facturas e Integración
5. Venta
6. Caja / Funciones de Cajero
7. Ensamblaje
8. Análisis y Gestión
9. Permisos y Seguridad
10. Interfaz e Integración
11. Calendario / Fechas Especiales

## Documentación

La documentación modular está en la carpeta [`docs`](docs/).

Archivos principales:

- [`docs/00-blueprint-maestro.md`](docs/00-blueprint-maestro.md)
- [`docs/01-fase-aplicacion-armable.md`](docs/01-fase-aplicacion-armable.md)

## Fases del proyecto

### Fase 01 - Aplicación Armable

Convierte los blueprints de Sagva System en una estructura técnica inicial con rutas, carpetas, servicios, modelos, pantallas base, contratos de integración y base de datos mínima para comenzar el desarrollo modular.

## Aplicación técnica inicial

Esta versión ya incluye una base armable con:

- Next.js + React + TypeScript.
- TailwindCSS.
- Prisma.
- SQLite local para desarrollo inmediato.
- Rutas base por módulo.
- Layout principal y menú lateral.
- Pantalla de login base.
- Servicios iniciales por módulo.
- Tipos compartidos.
- Esquema de base de datos inicial.
- Seed con roles, usuario admin y catálogos base.

## Instalación local

1. Instalar dependencias:

```bash
npm install
```

2. Crear archivo `.env` usando `.env.example` como base:

```bash
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="change-this-secret"
APP_URL="http://localhost:3000"
```

3. Generar cliente Prisma:

```bash
npm run prisma:generate
```

4. Crear/actualizar tablas:

```bash
npm run db:push
```

5. Cargar datos iniciales:

```bash
npm run db:seed
```

6. Levantar la aplicación:

```bash
npm run dev
```

La aplicación queda disponible en:

```text
http://localhost:3000
```

Usuario inicial:

```text
admin@sagva.local
admin123
```

## Módulos funcionales actuales

- Login real con cookie de sesión local.
- Artículos: listado, nuevo artículo, edición, precios y stock inicial.
- Inventario: stock actual, entradas, salidas, ajustes y alertas.
- Proveedores: listado y nuevo proveedor.
- Facturas: interfaz de carga de proveedor con entorno visual estilo SAGVA.

## Principio modular

Cada módulo debe:

- Tener una responsabilidad clara.
- Definir qué datos recibe.
- Definir qué procesos ejecuta.
- Definir qué resultados entrega.
- Comunicarse con otros módulos mediante contratos claros.
- No invadir responsabilidades de otros módulos.

La idea es evitar el clásico desastre de software donde ventas calcula inventario, caja decide permisos y el sistema termina pareciendo una licuadora con login.
