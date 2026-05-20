-- Quita el campo referencia de venta_pagos.
-- SQLite soporta DROP COLUMN en versiones modernas. Si tu SQLite local es antiguo,
-- usa prisma db push o recrea la base de prueba.

ALTER TABLE "venta_pagos" DROP COLUMN "referencia";
