-- CreateTable
CREATE TABLE "clientes" (
    "id" SERIAL NOT NULL,
    "razao_social" VARCHAR(200) NOT NULL,
    "nome_fantasia" VARCHAR(200),
    "cnpj" CHAR(14) NOT NULL,
    "email" VARCHAR(255),
    "telefone" VARCHAR(20),
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clientes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "clientes_cnpj_key" ON "clientes"("cnpj");

-- CreateIndex
CREATE INDEX "clientes_razao_social_idx" ON "clientes"("razao_social");

-- CreateIndex
CREATE INDEX "clientes_ativo_idx" ON "clientes"("ativo");
