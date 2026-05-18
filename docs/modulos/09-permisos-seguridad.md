# Módulo 09 - Permisos y Seguridad

## Objetivo

Centralizar usuarios, roles, permisos, restricciones, autorizaciones y auditoría.

## Responsabilidad principal

Definir quién puede ver, editar, ejecutar, autorizar o restringir acciones en cada parte del sistema.

## Qué incluye

- Usuarios.
- Roles.
- Permisos por módulo.
- Permisos por acción.
- Permisos por campo.
- Restricciones.
- Autorizaciones.
- Auditoría.
- Control de accesos.

## Qué no incluye

- No registra ventas.
- No administra artículos.
- No controla inventario.
- No procesa facturas.

## Pantallas

1. Usuarios.
2. Roles.
3. Permisos por módulo.
4. Permisos por campo.
5. Autorizaciones.
6. Auditoría.
7. Restricciones.

## Reglas de negocio

1. El administrador puede asignar o restringir privilegios por usuario.
2. Los permisos deben aplicar a módulos, acciones y campos.
3. Un usuario puede ver un módulo pero no editar ciertos campos.
4. Un usuario puede editar precios pero no códigos, o viceversa.
5. Todas las acciones críticas deben dejar registro.
6. Los demás módulos no deben desarrollar seguridad propia; solo consultan este módulo.

## Entradas

- usuario_id.
- rol_id.
- modulo.
- accion.
- campo.
- permiso.
- restricción.

## Salidas

- Permiso concedido o denegado.
- Reglas visibles para cada módulo.
- Registro de auditoría.

## Integraciones

- Todos los módulos consultan este módulo para saber qué puede hacer cada usuario.
- Caja depende de este módulo para mostrar u ocultar totales de cierre.
- Ensamblaje no define permisos, solo respeta lo indicado aquí.

## Pendientes

- Definir matriz base de roles.
- Definir lista oficial de acciones críticas.
- Definir reglas de auditoría obligatoria.
