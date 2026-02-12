-- AlterTable
ALTER TABLE "proyectos" ADD COLUMN "tarifario_revenue_plan_id" TEXT;

-- AddForeignKey
ALTER TABLE "proyectos" ADD CONSTRAINT "proyectos_tarifario_revenue_plan_id_fkey" FOREIGN KEY ("tarifario_revenue_plan_id") REFERENCES "tarifarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
