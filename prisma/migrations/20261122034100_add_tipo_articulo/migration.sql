-- Agrega la clasificación comercial de artículos sin cambiar impuestos ni precios.
-- Los artículos existentes toman PRODUCTO como valor inicial; no se elimina ningún dato.
ALTER TABLE "articulos" ADD COLUMN "tipo_articulo" TEXT NOT NULL DEFAULT 'PRODUCTO';
