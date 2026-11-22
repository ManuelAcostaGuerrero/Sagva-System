-- Migración aditiva para reglas de precios mayoristas por artículo.
-- No elimina ni altera la tabla articulo_precios ni sus precios mayoristas legados.
CREATE TABLE IF NOT EXISTS "articulo_reglas_mayoristas" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "articulo_id" TEXT NOT NULL,
  "cantidad_minima" DECIMAL NOT NULL,
  "precio_unitario" DECIMAL NOT NULL,
  "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "articulo_reglas_mayoristas_articulo_id_fkey"
    FOREIGN KEY ("articulo_id") REFERENCES "articulos" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "articulo_reglas_mayoristas_articulo_id_cantidad_minima_key"
  ON "articulo_reglas_mayoristas"("articulo_id", "cantidad_minima");
