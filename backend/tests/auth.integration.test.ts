import request from "supertest";

import {
  beforeEach,
  describe,
  expect,
  it
} from "vitest";

import {
  app
} from "../src/app.js";

import {
  createBaseTestData,
  resetTestDatabase
} from "./test-data.js";

describe(
  "Auth e RBAC",
  () => {
    beforeEach(
      async () => {
        await resetTestDatabase();
        await createBaseTestData();
      }
    );

    it(
      "deve autenticar Gestor com credenciais válidas",
      async () => {
        const response =
          await request(app)
            .post(
              "/api/v1/auth/login"
            )
            .send({
              email:
                "gestor@test.petrosys",

              senha:
                "Gestor@Test2026"
            });

        expect(
          response.status
        ).toBe(200);

        expect(
          response.body.usuario
        ).toMatchObject({
          nome:
            "Gestor Teste",

          email:
            "gestor@test.petrosys",

          ativo: true,

          perfil: {
            nome:
              "GESTOR"
          }
        });

        expect(
          response.headers[
            "set-cookie"
          ]
        ).toBeDefined();
      }
    );

    it(
      "deve rejeitar senha incorreta",
      async () => {
        const response =
          await request(app)
            .post(
              "/api/v1/auth/login"
            )
            .send({
              email:
                "gestor@test.petrosys",

              senha:
                "SenhaErrada@Test"
            });

        expect(
          response.status
        ).toBe(401);
      }
    );

    it(
      "deve rejeitar acesso a /users sem autenticação",
      async () => {
        const response =
          await request(app)
            .get(
              "/api/v1/users"
            );

        expect(
          response.status
        ).toBe(401);
      }
    );

    it(
      "Gestor deve acessar /users",
      async () => {
        const agent =
          request.agent(app);

        const login =
          await agent
            .post(
              "/api/v1/auth/login"
            )
            .send({
              email:
                "gestor@test.petrosys",

              senha:
                "Gestor@Test2026"
            });

        expect(
          login.status
        ).toBe(200);

        const response =
          await agent.get(
            "/api/v1/users"
          );

        expect(
          response.status
        ).toBe(200);

        expect(
          Array.isArray(
            response.body.usuarios
          )
        ).toBe(true);
      }
    );

    it(
      "Analista não deve acessar administração de usuários",
      async () => {
        const agent =
          request.agent(app);

        const login =
          await agent
            .post(
              "/api/v1/auth/login"
            )
            .send({
              email:
                "analista@test.petrosys",

              senha:
                "Analista@Test2026"
            });

        expect(
          login.status
        ).toBe(200);

        const response =
          await agent.get(
            "/api/v1/users"
          );

        expect(
          response.status
        ).toBe(403);
      }
    );

    it(
      "Técnico não deve acessar administração de usuários",
      async () => {
        const agent =
          request.agent(app);

        const login =
          await agent
            .post(
              "/api/v1/auth/login"
            )
            .send({
              email:
                "tecnico@test.petrosys",

              senha:
                "Tecnico@Test2026"
            });

        expect(
          login.status
        ).toBe(200);

        const response =
          await agent.get(
            "/api/v1/users"
          );

        expect(
          response.status
        ).toBe(403);
      }
    );
  }
);