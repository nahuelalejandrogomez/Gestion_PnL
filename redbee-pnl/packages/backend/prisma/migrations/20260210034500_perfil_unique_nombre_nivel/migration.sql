-- DropIndex: Drop the unique constraint on nombre
DROP INDEX IF EXISTS "perfiles_nombre_key";

-- CreateIndex: Add unique constraint on (nombre, nivel)
CREATE UNIQUE INDEX "perfiles_nombre_nivel_key" ON "perfiles"("nombre", "nivel");
