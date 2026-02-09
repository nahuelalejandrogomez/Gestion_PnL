-- CreateTable
CREATE TABLE "app_config" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "app_config_pkey" PRIMARY KEY ("key")
);

-- Insert default costoEmpresaPct
INSERT INTO "app_config" ("key", "value", "updatedAt")
VALUES ('costoEmpresaPct', '45', NOW())
ON CONFLICT ("key") DO NOTHING;
