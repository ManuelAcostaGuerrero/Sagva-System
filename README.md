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

## Principio modular

Cada módulo debe:

- Tener una responsabilidad clara.
- Definir qué datos recibe.
- Definir qué procesos ejecuta.
- Definir qué resultados entrega.
- Comunicarse con otros módulos mediante contratos claros.
- No invadir responsabilidades de otros módulos.

La idea es evitar el clásico desastre de software donde ventas calcula inventario, caja decide permisos y el sistema termina pareciendo una licuadora con login.
