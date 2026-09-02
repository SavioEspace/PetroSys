-- CreateEnum
CREATE TYPE "PrioridadeOrdemServico" AS ENUM ('BAIXA', 'MEDIA', 'ALTA', 'CRITICA');

-- CreateEnum
CREATE TYPE "StatusOrdemServico" AS ENUM ('ABERTA', 'EM_ANDAMENTO', 'BLOQUEADA', 'CONCLUIDA', 'CANCELADA');

-- CreateTable
CREATE TABLE "ordens_servico" (
    "id" SERIAL NOT NULL,
    "codigo" VARCHAR(20) NOT NULL,
    "titulo" VARCHAR(200) NOT NULL,
    "descricao" TEXT NOT NULL,
    "prioridade" "PrioridadeOrdemServico" NOT NULL DEFAULT 'MEDIA',
    "status" "StatusOrdemServico" NOT NULL DEFAULT 'ABERTA',
    "data_abertura" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "prazo" DATE NOT NULL,
    "data_conclusao" TIMESTAMP(3),
    "contrato_id" INTEGER NOT NULL,
    "servico_id" INTEGER NOT NULL,
    "responsavel_id" INTEGER NOT NULL,
    "criado_por_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ordens_servico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "historicos_status" (
    "id" SERIAL NOT NULL,
    "ordem_servico_id" INTEGER NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "status_anterior" "StatusOrdemServico",
    "status_novo" "StatusOrdemServico" NOT NULL,
    "observacao" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "historicos_status_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ordens_servico_codigo_key" ON "ordens_servico"("codigo");

-- CreateIndex
CREATE INDEX "ordens_servico_contrato_id_idx" ON "ordens_servico"("contrato_id");

-- CreateIndex
CREATE INDEX "ordens_servico_servico_id_idx" ON "ordens_servico"("servico_id");

-- CreateIndex
CREATE INDEX "ordens_servico_responsavel_id_idx" ON "ordens_servico"("responsavel_id");

-- CreateIndex
CREATE INDEX "ordens_servico_criado_por_id_idx" ON "ordens_servico"("criado_por_id");

-- CreateIndex
CREATE INDEX "ordens_servico_status_idx" ON "ordens_servico"("status");

-- CreateIndex
CREATE INDEX "ordens_servico_prioridade_idx" ON "ordens_servico"("prioridade");

-- CreateIndex
CREATE INDEX "ordens_servico_prazo_idx" ON "ordens_servico"("prazo");

-- CreateIndex
CREATE INDEX "historicos_status_ordem_servico_id_idx" ON "historicos_status"("ordem_servico_id");

-- CreateIndex
CREATE INDEX "historicos_status_usuario_id_idx" ON "historicos_status"("usuario_id");

-- CreateIndex
CREATE INDEX "historicos_status_created_at_idx" ON "historicos_status"("created_at");

-- AddForeignKey
ALTER TABLE "ordens_servico" ADD CONSTRAINT "ordens_servico_contrato_id_fkey" FOREIGN KEY ("contrato_id") REFERENCES "contratos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordens_servico" ADD CONSTRAINT "ordens_servico_servico_id_fkey" FOREIGN KEY ("servico_id") REFERENCES "servicos_tecnologicos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordens_servico" ADD CONSTRAINT "ordens_servico_responsavel_id_fkey" FOREIGN KEY ("responsavel_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordens_servico" ADD CONSTRAINT "ordens_servico_criado_por_id_fkey" FOREIGN KEY ("criado_por_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historicos_status" ADD CONSTRAINT "historicos_status_ordem_servico_id_fkey" FOREIGN KEY ("ordem_servico_id") REFERENCES "ordens_servico"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historicos_status" ADD CONSTRAINT "historicos_status_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
