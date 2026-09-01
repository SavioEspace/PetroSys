import { app } from "./app.js";
import { env } from "./config/env.js";

const server = app.listen(env.PORT, () => {
  console.log("");
  console.log("🚀 PetroSys API iniciada");
  console.log(`📡 Ambiente: ${env.NODE_ENV}`);
  console.log(`🌐 URL: http://localhost:${env.PORT}`);
  console.log(`❤️ Health: http://localhost:${env.PORT}/api/v1/health`);
  console.log("");
});

const shutdown = (signal: string) => {
  console.log(`\n${signal} recebido. Encerrando PetroSys API...`);

  server.close(() => {
    console.log("Servidor encerrado com sucesso.");
    process.exit(0);
  });
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));