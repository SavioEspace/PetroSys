import {
  useCallback,
  useEffect,
  useState
} from "react";

import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  FileWarning,
  Gauge,
  RefreshCw
} from "lucide-react";

import {
  useNavigate
} from "react-router-dom";

import {
  ApiError,
  apiRequest
} from "../api/http";

interface DashboardSummary {
  clientes: {
    total: number;
    ativos: number;
    inativos: number;
  };

  contratos: {
    total: number;
    ativos: number;
    suspensos: number;
    encerrados: number;
    vencidos: number;
    vencemEm30Dias: number;
  };

  servicos: {
    total: number;
    ativos: number;
    suspensos: number;
    encerrados: number;
  };

  ordensServico: {
    total: number;
    abertas: number;
    emAndamento: number;
    bloqueadas: number;
    concluidas: number;
    canceladas: number;
    atrasadas: number;
    criticasAtivas: number;
    taxaConclusao: number;

    prioridade: {
      baixa: number;
      media: number;
      alta: number;
      critica: number;
    };
  };

  operacao: {
    cargaTecnicos: Array<{
      id: number;
      nome: string;
      email: string;
      totalAtivas: number;
      abertas: number;
      emAndamento: number;
      bloqueadas: number;
      atrasadas: number;
      criticas: number;
    }>;

    ultimasOrdens: Array<{
      id: number;
      codigo: string;
      titulo: string;

      prioridade:
        | "BAIXA"
        | "MEDIA"
        | "ALTA"
        | "CRITICA";

      status:
        | "ABERTA"
        | "EM_ANDAMENTO"
        | "BLOQUEADA"
        | "CONCLUIDA"
        | "CANCELADA";

      prazo: string;
      createdAt: string;
      atrasada: boolean;

      responsavel: {
        id: number;
        nome: string;
      };

      servico: {
        id: number;
        nome: string;
      };

      contrato: {
        id: number;
        numero: string;

        cliente: {
          id: number;
          razaoSocial: string;
          nomeFantasia:
            | string
            | null;
        };
      };
    }>;

    contratosProximosVencimento:
      Array<{
        id: number;
        numero: string;
        status: string;
        dataFim: string;
        diasRestantes: number;

        cliente: {
          id: number;
          razaoSocial: string;
          nomeFantasia:
            | string
            | null;
        };
      }>;
  };
}

interface DashboardResponse {
  resumo: DashboardSummary;
}

function formatDate(
  value: string
): string {
  return new Intl.DateTimeFormat(
    "pt-BR",
    {
      timeZone: "UTC"
    }
  ).format(
    new Date(value)
  );
}

function formatTime(
  value: Date
): string {
  return new Intl.DateTimeFormat(
    "pt-BR",
    {
      hour: "2-digit",
      minute: "2-digit"
    }
  ).format(value);
}

function formatStatus(
  status: string
): string {
  const labels:
    Record<string, string> = {
      ABERTA:
        "Aberta",

      EM_ANDAMENTO:
        "Em andamento",

      BLOQUEADA:
        "Bloqueada",

      CONCLUIDA:
        "Concluída",

      CANCELADA:
        "Cancelada"
    };

  return (
    labels[status] ??
    status
  );
}

function statusClass(
  status: string
): string {
  return status
    .toLowerCase()
    .replaceAll(
      "_",
      "-"
    );
}

function priorityClass(
  prioridade: string
): string {
  return prioridade
    .toLowerCase();
}

export function DashboardPage() {
  const navigate =
    useNavigate();

  const [
    resumo,
    setResumo
  ] =
    useState<DashboardSummary | null>(
      null
    );

  const [
    loading,
    setLoading
  ] =
    useState(true);

  const [
    refreshing,
    setRefreshing
  ] =
    useState(false);

  const [
    errorMessage,
    setErrorMessage
  ] =
    useState("");

  const [
    lastUpdated,
    setLastUpdated
  ] =
    useState<Date | null>(
      null
    );

  const loadDashboard =
    useCallback(
      async (
        refresh = false
      ) => {
        try {
          if (refresh) {
            setRefreshing(true);
          } else {
            setLoading(true);
          }

          setErrorMessage("");

          const response =
            await apiRequest<DashboardResponse>(
              "/dashboard/summary"
            );

          setResumo(
            response.resumo
          );

          setLastUpdated(
            new Date()
          );
        } catch (error) {
          if (
            error instanceof
            ApiError
          ) {
            setErrorMessage(
              error.message
            );
          } else {
            setErrorMessage(
              "Não foi possível carregar o dashboard."
            );
          }
        } finally {
          setLoading(false);
          setRefreshing(false);
        }
      },
      []
    );

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner" />

        <span>
          Carregando indicadores...
        </span>
      </div>
    );
  }

  if (!resumo) {
    return (
      <div className="dashboard-error">
        <AlertTriangle
          size={24}
        />

        <div>
          <strong>
            Não foi possível
            carregar o dashboard
          </strong>

          <p>
            {errorMessage ||
              "Não foi possível obter os indicadores operacionais."}
          </p>

          <button
            type="button"
            className="dashboard-retry-button"
            onClick={() =>
              void loadDashboard()
            }
          >
            <RefreshCw
              size={15}
            />

            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  const ordensAtivas =
    resumo.ordensServico.abertas +
    resumo.ordensServico.emAndamento +
    resumo.ordensServico.bloqueadas;

  const hasOperationalAlert =
    resumo.ordensServico.atrasadas >
      0 ||
    resumo.ordensServico
      .criticasAtivas >
      0;

  return (
    <section className="page-container">
      <div className="page-heading">
        <div>
          <span className="page-kicker">
            Visão gerencial
          </span>

          <h1>
            Dashboard
          </h1>

          <p>
            Acompanhe os principais
            indicadores operacionais
            do PetroSys.
          </p>
        </div>

        <div className="dashboard-toolbar">
          <div className="dashboard-health">
            <span className="health-dot" />

            {lastUpdated
              ? `Atualizado às ${formatTime(
                  lastUpdated
                )}`
              : "Dados carregados"}
          </div>

          <button
            type="button"
            className="dashboard-refresh-button"
            disabled={
              refreshing
            }
            onClick={() =>
              void loadDashboard(
                true
              )
            }
          >
            <RefreshCw
              size={15}
              className={
                refreshing
                  ? "dashboard-refresh-icon-spinning"
                  : ""
              }
            />

            {refreshing
              ? "Atualizando..."
              : "Atualizar"}
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="dashboard-inline-error">
          <AlertTriangle
            size={16}
          />

          <span>
            {errorMessage}
          </span>
        </div>
      )}

      <div className="metric-grid">
        <article className="metric-card">
          <div className="metric-icon">
            <Activity
              size={21}
            />
          </div>

          <div>
            <span>
              OS ativas
            </span>

            <strong>
              {ordensAtivas}
            </strong>

            <small>
              {
                resumo
                  .ordensServico
                  .total
              }{" "}
              ordens no total
            </small>
          </div>
        </article>

        <article
          className={`metric-card ${
            resumo
              .ordensServico
              .atrasadas >
            0
              ? "metric-card-attention"
              : ""
          }`}
        >
          <div className="metric-icon">
            <Clock3
              size={21}
            />
          </div>

          <div>
            <span>
              OS atrasadas
            </span>

            <strong>
              {
                resumo
                  .ordensServico
                  .atrasadas
              }
            </strong>

            <small>
              Exigem acompanhamento
            </small>
          </div>
        </article>

        <article className="metric-card">
          <div className="metric-icon">
            <CheckCircle2
              size={21}
            />
          </div>

          <div>
            <span>
              Taxa de conclusão
            </span>

            <strong>
              {
                resumo
                  .ordensServico
                  .taxaConclusao
              }
              %
            </strong>

            <small>
              {
                resumo
                  .ordensServico
                  .concluidas
              }{" "}
              ordens concluídas
            </small>
          </div>
        </article>

        <article className="metric-card">
          <div className="metric-icon">
            <FileWarning
              size={21}
            />
          </div>

          <div>
            <span>
              Vencem em 30 dias
            </span>

            <strong>
              {
                resumo
                  .contratos
                  .vencemEm30Dias
              }
            </strong>

            <small>
              {
                resumo
                  .contratos
                  .vencidos
              }{" "}
              contratos vencidos
            </small>
          </div>
        </article>
      </div>

      {hasOperationalAlert && (
        <div className="dashboard-alert-banner">
          <div className="dashboard-alert-content">
            <AlertTriangle
              size={19}
            />

            <div>
              <strong>
                Atenção operacional necessária
              </strong>

              <span>
                {
                  resumo
                    .ordensServico
                    .atrasadas
                }{" "}
                OS atrasada(s) e{" "}
                {
                  resumo
                    .ordensServico
                    .criticasAtivas
                }{" "}
                crítica(s) ativa(s).
              </span>
            </div>
          </div>

          <button
            type="button"
            className="dashboard-panel-action"
            onClick={() =>
              navigate(
                "/work-orders"
              )
            }
          >
            Ver ordens

            <ArrowRight
              size={15}
            />
          </button>
        </div>
      )}

      <div className="dashboard-grid">
        <article className="dashboard-panel status-panel">
          <div className="panel-heading">
            <div>
              <span>
                Operação
              </span>

              <h2>
                Ordens por status
              </h2>
            </div>

            <Gauge
              size={21}
            />
          </div>

          <div className="status-grid">
            <div>
              <span>
                Abertas
              </span>

              <strong>
                {
                  resumo
                    .ordensServico
                    .abertas
                }
              </strong>
            </div>

            <div>
              <span>
                Em andamento
              </span>

              <strong>
                {
                  resumo
                    .ordensServico
                    .emAndamento
                }
              </strong>
            </div>

            <div>
              <span>
                Bloqueadas
              </span>

              <strong>
                {
                  resumo
                    .ordensServico
                    .bloqueadas
                }
              </strong>
            </div>

            <div>
              <span>
                Concluídas
              </span>

              <strong>
                {
                  resumo
                    .ordensServico
                    .concluidas
                }
              </strong>
            </div>

            <div>
              <span>
                Canceladas
              </span>

              <strong>
                {
                  resumo
                    .ordensServico
                    .canceladas
                }
              </strong>
            </div>

            <div>
              <span>
                Críticas ativas
              </span>

              <strong>
                {
                  resumo
                    .ordensServico
                    .criticasAtivas
                }
              </strong>
            </div>
          </div>
        </article>

        <article className="dashboard-panel entity-panel">
          <div className="panel-heading">
            <div>
              <span>
                Estrutura
              </span>

              <h2>
                Base operacional
              </h2>
            </div>
          </div>

          <div className="entity-stats">
            <div>
              <span>
                Clientes
              </span>

              <strong>
                {
                  resumo
                    .clientes
                    .total
                }
              </strong>

              <small>
                {
                  resumo
                    .clientes
                    .ativos
                }{" "}
                ativos
              </small>
            </div>

            <div>
              <span>
                Contratos
              </span>

              <strong>
                {
                  resumo
                    .contratos
                    .total
                }
              </strong>

              <small>
                {
                  resumo
                    .contratos
                    .ativos
                }{" "}
                ativos
              </small>
            </div>

            <div>
              <span>
                Serviços
              </span>

              <strong>
                {
                  resumo
                    .servicos
                    .total
                }
              </strong>

              <small>
                {
                  resumo
                    .servicos
                    .ativos
                }{" "}
                ativos
              </small>
            </div>
          </div>
        </article>
      </div>

      <article className="dashboard-panel">
        <div className="panel-heading">
          <div>
            <span>
              Acompanhamento
            </span>

            <h2>
              Últimas ordens
            </h2>
          </div>

          <button
            type="button"
            className="dashboard-panel-action"
            onClick={() =>
              navigate(
                "/work-orders"
              )
            }
          >
            Ver todas

            <ArrowRight
              size={14}
            />
          </button>
        </div>

        {resumo.operacao
          .ultimasOrdens.length ===
        0 ? (
          <div className="empty-state">
            Nenhuma ordem de
            serviço cadastrada.
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>
                    Ordem
                  </th>

                  <th>
                    Cliente /
                    Serviço
                  </th>

                  <th>
                    Responsável
                  </th>

                  <th>
                    Prazo
                  </th>

                  <th>
                    Prioridade
                  </th>

                  <th>
                    Status
                  </th>
                </tr>
              </thead>

              <tbody>
                {resumo.operacao
                  .ultimasOrdens
                  .map(
                    (ordem) => (
                      <tr
                        key={
                          ordem.id
                        }
                      >
                        <td>
                          <strong className="table-primary">
                            {
                              ordem.codigo
                            }
                          </strong>

                          <span className="table-secondary">
                            {
                              ordem.titulo
                            }
                          </span>
                        </td>

                        <td>
                          <strong className="table-primary">
                            {ordem
                              .contrato
                              .cliente
                              .nomeFantasia ??
                              ordem
                                .contrato
                                .cliente
                                .razaoSocial}
                          </strong>

                          <span className="table-secondary">
                            {
                              ordem
                                .servico
                                .nome
                            }
                          </span>
                        </td>

                        <td>
                          {
                            ordem
                              .responsavel
                              .nome
                          }
                        </td>

                        <td>
                          <span
                            className={
                              ordem.atrasada
                                ? "deadline overdue"
                                : "deadline"
                            }
                          >
                            {formatDate(
                              ordem.prazo
                            )}
                          </span>
                        </td>

                        <td>
                          <span
                            className={`priority-badge priority-${priorityClass(
                              ordem.prioridade
                            )}`}
                          >
                            {
                              ordem.prioridade
                            }
                          </span>
                        </td>

                        <td>
                          <span
                            className={`status-badge status-${statusClass(
                              ordem.status
                            )}`}
                          >
                            {formatStatus(
                              ordem.status
                            )}
                          </span>
                        </td>
                      </tr>
                    )
                  )}
              </tbody>
            </table>
          </div>
        )}
      </article>

      <div className="dashboard-grid">
        <article className="dashboard-panel">
          <div className="panel-heading">
            <div>
              <span>
                Equipe
              </span>

              <h2>
                Carga por técnico
              </h2>
            </div>
          </div>

          {resumo.operacao
            .cargaTecnicos.length ===
          0 ? (
            <div className="empty-state">
              Nenhum técnico ativo.
            </div>
          ) : (
            <div className="technician-list">
              {resumo.operacao
                .cargaTecnicos
                .map(
                  (tecnico) => (
                    <div
                      key={
                        tecnico.id
                      }
                      className="technician-row"
                    >
                      <div className="technician-avatar">
                        {tecnico.nome
                          .charAt(0)
                          .toUpperCase()}
                      </div>

                      <div className="technician-data">
                        <strong>
                          {
                            tecnico.nome
                          }
                        </strong>

                        <span>
                          {
                            tecnico.email
                          }
                        </span>
                      </div>

                      <div className="technician-metrics">
                        <div>
                          <strong>
                            {
                              tecnico.totalAtivas
                            }
                          </strong>

                          <span>
                            Ativas
                          </span>
                        </div>

                        <div>
                          <strong>
                            {
                              tecnico.emAndamento
                            }
                          </strong>

                          <span>
                            Em curso
                          </span>
                        </div>

                        <div>
                          <strong>
                            {
                              tecnico.atrasadas
                            }
                          </strong>

                          <span>
                            Atrasadas
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                )}
            </div>
          )}
        </article>

        <article className="dashboard-panel">
          <div className="panel-heading">
            <div>
              <span>
                Contratos
              </span>

              <h2>
                Próximos vencimentos
              </h2>
            </div>

            <button
              type="button"
              className="dashboard-panel-action"
              onClick={() =>
                navigate(
                  "/contracts"
                )
              }
            >
              Ver contratos

              <ArrowRight
                size={14}
              />
            </button>
          </div>

          {resumo.operacao
            .contratosProximosVencimento
            .length === 0 ? (
            <div className="empty-state">
              Nenhum contrato vence
              nos próximos 30 dias.
            </div>
          ) : (
            <div className="expiration-list">
              {resumo.operacao
                .contratosProximosVencimento
                .map(
                  (contrato) => (
                    <div
                      key={
                        contrato.id
                      }
                      className="expiration-row"
                    >
                      <div>
                        <strong>
                          {
                            contrato.numero
                          }
                        </strong>

                        <span>
                          {contrato
                            .cliente
                            .nomeFantasia ??
                            contrato
                              .cliente
                              .razaoSocial}
                        </span>
                      </div>

                      <div className="expiration-date">
                        <strong>
                          {
                            contrato.diasRestantes
                          }{" "}
                          dias
                        </strong>

                        <span>
                          {formatDate(
                            contrato.dataFim
                          )}
                        </span>
                      </div>
                    </div>
                  )
                )}
            </div>
          )}
        </article>
      </div>
    </section>
  );
}