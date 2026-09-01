-- CreateTable
CREATE TABLE "perfis" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(30) NOT NULL,
    "descricao" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "perfis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuarios" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(150) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "senha_hash" VARCHAR(255) NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "perfil_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "perfis_nome_key" ON "perfis"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE INDEX "usuarios_perfil_id_idx" ON "usuarios"("perfil_id");

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_perfil_id_fkey" FOREIGN KEY ("perfil_id") REFERENCES "perfis"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
