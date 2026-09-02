-- CreateEnum
CREATE TYPE "StatusServico" AS ENUM ('ATIVO', 'SUSPENSO', 'ENCERRADO');

-- CreateTable
CREATE TABLE "servicos_tecnologicos" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(150) NOT NULL,
    "descricao" TEXT NOT NULL,
    "categoria" VARCHAR(100) NOT NULL,
    "status" "StatusServico" NOT NULL DEFAULT 'ATIVO',
    "contrato_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "servicos_tecnologicos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "servicos_tecnologicos_contrato_id_idx" ON "servicos_tecnologicos"("contrato_id");

-- CreateIndex
CREATE INDEX "servicos_tecnologicos_status_idx" ON "servicos_tecnologicos"("status");

-- CreateIndex
CREATE INDEX "servicos_tecnologicos_categoria_idx" ON "servicos_tecnologicos"("categoria");

-- CreateIndex
CREATE UNIQUE INDEX "servicos_tecnologicos_contrato_id_nome_key" ON "servicos_tecnologicos"("contrato_id", "nome");

-- AddForeignKey
ALTER TABLE "servicos_tecnologicos" ADD CONSTRAINT "servicos_tecnologicos_contrato_id_fkey" FOREIGN KEY ("contrato_id") REFERENCES "contratos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
