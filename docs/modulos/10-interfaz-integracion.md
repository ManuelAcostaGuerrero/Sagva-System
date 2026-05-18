# Módulo 10 - Interfaz e Integración

## Objetivo

Definir cómo se ve, navega y conecta Sagva System.

## Responsabilidad principal

Unificar diseño, menús, componentes visuales, navegación y relación entre módulos.

## Qué incluye

- Arquitectura visual del sistema.
- Menú principal.
- Layout común.
- Componentes reutilizables.
- Formularios estándar.
- Estados visuales.
- Navegación.
- Matriz de integración entre módulos.
- Variables reutilizables.

## Qué no incluye

- No define reglas de negocio propias de otros módulos.
- No define permisos.
- No calcula inventario, ventas ni facturas.

## Pantallas / elementos

1. Menú principal.
2. Layout general.
3. Componentes comunes.
4. Tablas y filtros.
5. Formularios base.
6. Estados visuales.
7. Mapa de navegación.
8. Matriz de integración.

## Reglas de negocio

1. Mantener estructura visual consistente.
2. Evitar duplicar variables.
3. Centralizar catálogos comunes.
4. Definir conexiones entre módulos.
5. No mezclar lógica visual con reglas de negocio complejas.

## Variables reutilizables

- Estados.
- Familias.
- Subfamilias.
- Métodos de pago.
- Tipos de documento.
- Tipos de impuesto.
- Sucursales.
- Tipos de movimiento.

## Integraciones

- Todos los módulos consumen componentes visuales comunes.
- Todos los módulos deben respetar navegación y estructura visual.
- Seguridad define visibilidad, pero interfaz aplica la presentación.

## Pendientes

- Definir menú final.
- Definir layout visual definitivo.
- Definir componentes UI principales.
- Definir librería o framework frontend final.
