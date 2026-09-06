-- Renombra el campo tecnico de proveedores para usar solo RUT.
-- No borra datos: conserva los valores existentes en la misma columna renombrada.

ALTER TABLE "proveedores" RENAME COLUMN "rut_ruc" TO "rut";
