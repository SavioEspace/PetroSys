import request from "supertest";

import {
  beforeAll,
  describe,
  expect,
  it
} from "vitest";

import {
  app
} from "../src/app.js";

import {
  createBusinessTestData,
  dateInput,
  resetTestDatabase
} from "./test-data.js";

describe.sequential(
  "Regras de negócio do PetroSys",
  () => {
    let data:
      Awaited<
        ReturnType<
          typeof createBusinessTestData
        >
      >;

    let gestorCookie = "";
    let tecnicoCookie = "";

    beforeAll(
      async () => {
        await resetTestDatabase();

        data =
          await createBusinessTestData();

        const gestorLogin =
          await request(app)
            .post(
              "/api/v1/auth/login"
            )
            .send(
              data.credentials.gestor
            );

        expect(
          gestorLogin.status
        ).toBe(200);

        const gestorCookies =
          gestorLogin.headers[
            "set-cookie"
          ];

        gestorCookie =
          Array.isArray(
            gestorCookies
          )
            ? gestorCookies
                .map(
                  (cookie) =>
                    cookie.split(
                      ";"
                    )[0]
                )
                .join("; ")
            : gestorCookies
              ? gestorCookies.split(
                  ";"
                )[0]
              : "";

        const tecnicoLogin =
          await request(app)
            .post(
              "/api/v1/auth/login"
            )
            .send(
              data.credentials.tecnico
            );

        expect(
          tecnicoLogin.status
        ).toBe(200);

        const tecnicoCookies =
          tecnicoLogin.headers[
            "set-cookie"
          ];

        tecnicoCookie =
          Array.isArray(
            tecnicoCookies
          )
            ? tecnicoCookies
                .map(
                  (cookie) =>
                    cookie.split(
                      ";"
                    )[0]
                )
                .join("; ")
            : tecnicoCookies
              ? tecnicoCookies.split(
                  ";"
                )[0]
              : "";
      }
    );

    it(
      "não deve permitir criar contrato para cliente inativo",
      async () => {
        const response =
          await request(app)
            .post(
              "/api/v1/contracts"
            )
            .set(
              "Cookie",
              gestorCookie
            )
            .send({
              numero:
                "TEST-CTR-INVALID-CLIENT",

              objeto:
                "Contrato que deve ser rejeitado por cliente inativo.",

              dataInicio:
                dateInput(0),

              dataFim:
                dateInput(90),

              clienteId:
                data.clientes
                  .inativo.id
            });

        expect(
          response.status
        ).toBe(409);

        expect(
          response.body.error
        ).toBe(
          "CLIENT_INACTIVE"
        );
      }
    );

    it(
      "não deve permitir criar serviço em contrato suspenso",
      async () => {
        const response =
          await request(app)
            .post(
              "/api/v1/services"
            )
            .set(
              "Cookie",
              gestorCookie
            )
            .send({
              nome:
                "Serviço Inválido",

              descricao:
                "Serviço que deve ser rejeitado porque o contrato está suspenso.",

              categoria:
                "Teste",

              contratoId:
                data.contratos
                  .suspenso.id
            });

        expect(
          response.status
        ).toBe(409);

        expect(
          response.body.error
        ).toBe(
          "CONTRACT_NOT_ACTIVE"
        );
      }
    );

    it(
      "não deve permitir OS com serviço pertencente a outro contrato",
      async () => {
        const response =
          await request(app)
            .post(
              "/api/v1/work-orders"
            )
            .set(
              "Cookie",
              gestorCookie
            )
            .send({
              titulo:
                "OS com vínculo inválido",

              descricao:
                "Teste da integridade entre contrato e serviço tecnológico.",

              prioridade:
                "MEDIA",

              prazo:
                dateInput(10),

              contratoId:
                data.contratos
                  .ativoA.id,

              servicoId:
                data.servicos
                  .ativoB.id,

              responsavelId:
                data.users
                  .tecnico.id
            });

        expect(
          response.status
        ).toBe(409);

        expect(
          response.body.error
        ).toBe(
          "SERVICE_CONTRACT_MISMATCH"
        );
      }
    );

    it(
      "deve criar OS válida e preservar todo o ciclo de status no histórico",
      async () => {
        const createResponse =
          await request(app)
            .post(
              "/api/v1/work-orders"
            )
            .set(
              "Cookie",
              gestorCookie
            )
            .send({
              titulo:
                "Validar ciclo completo da ordem",

              descricao:
                "Ordem criada pelo teste automatizado para validar rastreabilidade.",

              prioridade:
                "CRITICA",

              prazo:
                dateInput(15),

              contratoId:
                data.contratos
                  .ativoA.id,

              servicoId:
                data.servicos
                  .ativoA.id,

              responsavelId:
                data.users
                  .tecnico.id
            });

        expect(
          createResponse.status
        ).toBe(201);

        expect(
          createResponse.body
            .ordem.status
        ).toBe("ABERTA");

        const orderId =
          createResponse.body
            .ordem.id as number;

        const initialHistory =
          await request(app)
            .get(
              `/api/v1/work-orders/${orderId}/history`
            )
            .set(
              "Cookie",
              gestorCookie
            );

        expect(
          initialHistory.status
        ).toBe(200);

        expect(
          initialHistory.body
            .historicos
        ).toHaveLength(1);

        expect(
          initialHistory.body
            .historicos[0]
        ).toMatchObject({
          statusAnterior:
            null,

          statusNovo:
            "ABERTA"
        });

        const startResponse =
          await request(app)
            .patch(
              `/api/v1/work-orders/${orderId}/status`
            )
            .set(
              "Cookie",
              gestorCookie
            )
            .send({
              status:
                "EM_ANDAMENTO",

              observacao:
                "Atendimento iniciado pelo teste automatizado."
            });

        expect(
          startResponse.status
        ).toBe(200);

        expect(
          startResponse.body
            .ordem.status
        ).toBe(
          "EM_ANDAMENTO"
        );

        const invalidReturn =
          await request(app)
            .patch(
              `/api/v1/work-orders/${orderId}/status`
            )
            .set(
              "Cookie",
              gestorCookie
            )
            .send({
              status:
                "ABERTA"
            });

        expect(
          invalidReturn.status
        ).toBe(409);

        expect(
          invalidReturn.body.error
        ).toBe(
          "INVALID_STATUS_TRANSITION"
        );

        const blockResponse =
          await request(app)
            .patch(
              `/api/v1/work-orders/${orderId}/status`
            )
            .set(
              "Cookie",
              gestorCookie
            )
            .send({
              status:
                "BLOQUEADA",

              observacao:
                "Atendimento bloqueado durante o teste."
            });

        expect(
          blockResponse.status
        ).toBe(200);

        const resumeResponse =
          await request(app)
            .patch(
              `/api/v1/work-orders/${orderId}/status`
            )
            .set(
              "Cookie",
              gestorCookie
            )
            .send({
              status:
                "EM_ANDAMENTO",

              observacao:
                "Atendimento retomado."
            });

        expect(
          resumeResponse.status
        ).toBe(200);

        const finishResponse =
          await request(app)
            .patch(
              `/api/v1/work-orders/${orderId}/status`
            )
            .set(
              "Cookie",
              gestorCookie
            )
            .send({
              status:
                "CONCLUIDA",

              observacao:
                "Ordem concluída pelo teste automatizado."
            });

        expect(
          finishResponse.status
        ).toBe(200);

        expect(
          finishResponse.body
            .ordem.status
        ).toBe(
          "CONCLUIDA"
        );

        expect(
          finishResponse.body
            .ordem.dataConclusao
        ).not.toBeNull();

        expect(
          finishResponse.body
            .ordem.atrasada
        ).toBe(false);

        const terminalResponse =
          await request(app)
            .patch(
              `/api/v1/work-orders/${orderId}/status`
            )
            .set(
              "Cookie",
              gestorCookie
            )
            .send({
              status:
                "EM_ANDAMENTO"
            });

        expect(
          terminalResponse.status
        ).toBe(409);

        expect(
          terminalResponse.body.error
        ).toBe(
          "INVALID_STATUS_TRANSITION"
        );

        const finalHistory =
          await request(app)
            .get(
              `/api/v1/work-orders/${orderId}/history`
            )
            .set(
              "Cookie",
              gestorCookie
            );

        expect(
          finalHistory.status
        ).toBe(200);

        expect(
          finalHistory.body
            .historicos.map(
              (
                item: {
                  statusNovo:
                    string;
                }
              ) =>
                item.statusNovo
            )
        ).toEqual([
          "ABERTA",
          "EM_ANDAMENTO",
          "BLOQUEADA",
          "EM_ANDAMENTO",
          "CONCLUIDA"
        ]);
      }
    );

    it(
      "Técnico deve acessar e atualizar somente ordens atribuídas a ele",
      async () => {
        const ownGet =
          await request(app)
            .get(
              `/api/v1/work-orders/${data.ordens.propriaTecnico.id}`
            )
            .set(
              "Cookie",
              tecnicoCookie
            );

        expect(
          ownGet.status
        ).toBe(200);

        const otherGet =
          await request(app)
            .get(
              `/api/v1/work-orders/${data.ordens.outroTecnico.id}`
            )
            .set(
              "Cookie",
              tecnicoCookie
            );

        expect(
          otherGet.status
        ).toBe(403);

        expect(
          otherGet.body.error
        ).toBe("FORBIDDEN");

        const ownUpdate =
          await request(app)
            .patch(
              `/api/v1/work-orders/${data.ordens.propriaTecnico.id}/status`
            )
            .set(
              "Cookie",
              tecnicoCookie
            )
            .send({
              status:
                "EM_ANDAMENTO",

              observacao:
                "Técnico iniciou sua própria ordem."
            });

        expect(
          ownUpdate.status
        ).toBe(200);

        expect(
          ownUpdate.body
            .ordem.status
        ).toBe(
          "EM_ANDAMENTO"
        );

        const otherUpdate =
          await request(app)
            .patch(
              `/api/v1/work-orders/${data.ordens.outroTecnico.id}/status`
            )
            .set(
              "Cookie",
              tecnicoCookie
            )
            .send({
              status:
                "EM_ANDAMENTO"
            });

        expect(
          otherUpdate.status
        ).toBe(403);

        expect(
          otherUpdate.body.error
        ).toBe("FORBIDDEN");
      }
    );
  }
);