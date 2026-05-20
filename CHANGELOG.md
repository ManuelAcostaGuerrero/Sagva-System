# Changelog

## 0.2.0 - Modulo de Seguridad

### Agregado

- Panel principal en `/seguridad`.
- Navegacion interna del modulo de seguridad.
- Pantalla de usuarios con acceso a edicion.
- Pantalla para editar usuario existente y cambiar rol o estado.
- Pantalla de roles con alta, modificacion controlada y eliminacion protegida.
- Pantalla de permisos con matriz por rol y modulo.
- Campos sensibles separados por modulo.
- Guardado matricial de permisos por campo y accion.
- Pagina 404 amigable en espanol.

### Cambiado

- Version del proyecto actualizada a `0.2.0`.
- Los roles ya no usan descripcion en la pantalla operativa.
- La edicion de roles queda bloqueada hasta presionar `Modificar`.
- Al guardar un rol, la fila vuelve a su estado normal.

### Reglas de seguridad aplicadas

- Un rol no puede eliminarse si tiene usuarios asignados.
- Los permisos se configuran por rol, modulo, campo y accion.
- Caja, venta, articulos, facturas, inventario y ensamblaje tienen campos sensibles propios.
- Los cambios importantes generan registros de auditoria.
