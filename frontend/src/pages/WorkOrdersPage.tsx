import {
  useEffect,
  useMemo,
  useState
} from "react";

import type {
  FormEvent
} from "react";

import {
  AlertTriangle,
  ArrowRight,
  Building2,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Eye,
  FileText,
  History,
  Plus,
  Search,
  UserRound,
  Wrench,
  X
} from "lucide-react";

import {
  ApiError,
  apiRequest
} from "../api/http";

import {
  useAuth
} from "../auth/AuthContext";

type WorkOrderStatus =
  | "ABERTA"
  | "EM_ANDAMENTO"
  | "BLOQUEADA"
  | "CONCLUIDA"
  | "CANCELADA";

type Priority =
  | "BAIXA"
  | "MEDIA"
  | "ALTA"
  | "CRITICA";

interface Cliente {
  id: number;
  razaoSocial: string;
  nomeFantasia: string | null;
  ativo: boolean;
}

interface Contrato {
  id: number;
  numero: string;
  status: string;
  dataInicio: string;
  dataFim: string;
  vencido?: boolean;

  cliente: Cliente;
}

interface Servico {
  id: number;
  nome: string;
  categoria: string;
  status: string;

  contrato?: Contrato;
}

interface Tecnico {
  id: number;
  nome: string;
  email: string;
}

interface OrdemServico {
  id: number;
  codigo: string;
  titulo: string;
  descricao: string;
  prioridade: Priority;
  status: WorkOrderStatus;
  dataAbertura: string;
  prazo: string;
  dataConclusao: string | null;
  atrasada: boolean;
  createdAt: string;
  updatedAt: string;

  contrato: Contrato;

  servico: {
    id: number;
    nome: string;
    categoria: string;
    status: string;
  };

  responsavel: {
    id: number;
    nome: string;
    email: string;
    ativo: boolean;

    perfil: {
      nome: string;
    };
  };

  criadoPor: {
    id: number;
    nome: string;
    email: string;
  };
}

interface HistoricoStatus {
  id: number;

  statusAnterior:
    | WorkOrderStatus
    | null;

  statusNovo: WorkOrderStatus;

  observacao:
    | string
    | null;

  createdAt: string;

  usuario: {
    id: number;
    nome: string;
    email?: string;
  };
}

interface WorkOrdersResponse {
  ordens: OrdemServico[];
}

interface WorkOrderResponse {
  ordem: OrdemServico;
}

interface HistoryResponse {
  historicos: HistoricoStatus[];
}

interface ContractsResponse {
  contratos: Contrato[];
}

interface ServicesResponse {
  servicos: Servico[];
}

interface TechniciansResponse {
  tecnicos: Tecnico[];
}

interface WorkOrderForm {
  titulo: string;
  descricao: string;
  prioridade: Priority;
  prazo: string;
  contratoId: string;
  servicoId: string;
  responsavelId: string;
}

const emptyForm: WorkOrderForm = {
  titulo: "",
  descricao: "",
  prioridade: "MEDIA",
  prazo: "",
  contratoId: "",
  servicoId: "",
  responsavelId: ""
};

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

function formatDateTime(
  value: string
): string {
  return new Intl.DateTimeFormat(
    "pt-BR",
    {
      dateStyle: "short",
      timeStyle: "short",
      timeZone:
        "America/Sao_Paulo"
    }
  ).format(
    new Date(value)
  );
}

function statusLabel(
  status: WorkOrderStatus
): string {
  const labels: Record<
    WorkOrderStatus,
    string
  > = {
    ABERTA: "Aberta",
    EM_ANDAMENTO:
      "Em andamento",
    BLOQUEADA: "Bloqueada",
    CONCLUIDA: "Concluída",
    CANCELADA: "Cancelada"
  };

  return labels[status];
}

function statusClass(
  status: WorkOrderStatus
): string {
  return status
    .toLowerCase()
    .replaceAll("_", "-");
}

function priorityLabel(
  priority: Priority
): string {
  const labels: Record<
    Priority,
    string
  > = {
    BAIXA: "Baixa",
    MEDIA: "Média",
    ALTA: "Alta",
    CRITICA: "Crítica"
  };

  return labels[priority];
}

function getAllowedTransitions(
  status: WorkOrderStatus
): WorkOrderStatus[] {
  const transitions: Record<
    WorkOrderStatus,
    WorkOrderStatus[]
  > = {
    ABERTA: [
      "EM_ANDAMENTO",
      "CANCELADA"
    ],

    EM_ANDAMENTO: [
      "BLOQUEADA",
      "CONCLUIDA",
      "CANCELADA"
    ],

    BLOQUEADA: [
      "EM_ANDAMENTO",
      "CANCELADA"
    ],

    CONCLUIDA: [],

    CANCELADA: []
  };

  return transitions[status];
}

export function WorkOrdersPage() {
  const {
    user
  } = useAuth();

  const [
    ordens,
    setOrdens
  ] =
    useState<OrdemServico[]>(
      []
    );

  const [
    contratos,
    setContratos
  ] =
    useState<Contrato[]>([]);

  const [
    servicos,
    setServicos
  ] =
    useState<Servico[]>([]);

  const [
    tecnicos,
    setTecnicos
  ] =
    useState<Tecnico[]>([]);

  const [
    search,
    setSearch
  ] = useState("");

  const [
    loading,
    setLoading
  ] = useState(true);

  const [
    pageError,
    setPageError
  ] = useState("");

  const [
    createModalOpen,
    setCreateModalOpen
  ] = useState(false);

  const [
    form,
    setForm
  ] =
    useState<WorkOrderForm>(
      emptyForm
    );

  const [
    formError,
    setFormError
  ] = useState("");

  const [
    submitting,
    setSubmitting
  ] = useState(false);

  const [
    detailModalOpen,
    setDetailModalOpen
  ] = useState(false);

  const [
    selectedOrder,
    setSelectedOrder
  ] =
    useState<OrdemServico | null>(
      null
    );

  const [
    historicos,
    setHistoricos
  ] =
    useState<HistoricoStatus[]>(
      []
    );

  const [
    detailLoading,
    setDetailLoading
  ] = useState(false);

  const [
    detailError,
    setDetailError
  ] = useState("");

  const [
    nextStatus,
    setNextStatus
  ] =
    useState<
      WorkOrderStatus | ""
    >("");

  const [
    statusObservation,
    setStatusObservation
  ] = useState("");

  const [
    statusSubmitting,
    setStatusSubmitting
  ] = useState(false);

  const canCreate =
    user?.perfil.nome ===
      "GESTOR" ||
    user?.perfil.nome ===
      "ANALISTA";

  async function loadData() {
    try {
      setLoading(true);
      setPageError("");

      if (canCreate) {
        const [
          workOrdersResponse,
          contractsResponse,
          servicesResponse,
          techniciansResponse
        ] = await Promise.all([
          apiRequest<WorkOrdersResponse>(
            "/work-orders"
          ),

          apiRequest<ContractsResponse>(
            "/contracts"
          ),

          apiRequest<ServicesResponse>(
            "/services"
          ),

          apiRequest<TechniciansResponse>(
            "/work-orders/technicians"
          )
        ]);

        setOrdens(
          workOrdersResponse.ordens
        );

        setContratos(
          contractsResponse.contratos
        );

        setServicos(
          servicesResponse.servicos
        );

        setTecnicos(
          techniciansResponse.tecnicos
        );
      } else {
        const response =
          await apiRequest<WorkOrdersResponse>(
            "/work-orders"
          );

        setOrdens(
          response.ordens
        );
      }
    } catch (error) {
      if (
        error instanceof ApiError
      ) {
        setPageError(
          error.message
        );
      } else {
        setPageError(
          "Não foi possível carregar as ordens de serviço."
        );
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  const eligibleContracts =
    useMemo(
      () =>
        contratos.filter(
          (contrato) =>
            contrato.status ===
              "ATIVO" &&
            !contrato.vencido &&
            contrato.cliente.ativo
        ),
      [contratos]
    );

  const selectableServices =
    useMemo(() => {
      if (!form.contratoId) {
        return [];
      }

      const contractId =
        Number(
          form.contratoId
        );

      return servicos.filter(
        (servico) =>
          servico.status ===
            "ATIVO" &&
          servico.contrato?.id ===
            contractId
      );
    }, [
      servicos,
      form.contratoId
    ]);

  const filteredOrders =
    useMemo(() => {
      const term =
        search
          .trim()
          .toLowerCase();

      if (!term) {
        return ordens;
      }

      return ordens.filter(
        (ordem) =>
          ordem.codigo
            .toLowerCase()
            .includes(term) ||
          ordem.titulo
            .toLowerCase()
            .includes(term) ||
          ordem.responsavel.nome
            .toLowerCase()
            .includes(term) ||
          ordem.contrato.numero
            .toLowerCase()
            .includes(term) ||
          ordem.servico.nome
            .toLowerCase()
            .includes(term) ||
          (
            ordem.contrato.cliente
              .nomeFantasia ??
            ordem.contrato.cliente
              .razaoSocial
          )
            .toLowerCase()
            .includes(term)
      );
    }, [
      ordens,
      search
    ]);

  function openCreateModal() {
    setForm(emptyForm);
    setFormError("");
    setCreateModalOpen(true);
  }

  function closeCreateModal() {
    if (submitting) {
      return;
    }

    setCreateModalOpen(false);
    setForm(emptyForm);
    setFormError("");
  }

  async function handleSubmit(
    event:
      FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setSubmitting(true);
    setFormError("");

    try {
      const response =
        await apiRequest<WorkOrderResponse>(
          "/work-orders",
          {
            method: "POST",

            body: JSON.stringify({
              titulo:
                form.titulo.trim(),

              descricao:
                form.descricao.trim(),

              prioridade:
                form.prioridade,

              prazo:
                form.prazo,

              contratoId:
                Number(
                  form.contratoId
                ),

              servicoId:
                Number(
                  form.servicoId
                ),

              responsavelId:
                Number(
                  form.responsavelId
                )
            })
          }
        );

      setOrdens(
        (current) => [
          response.ordem,
          ...current
        ]
      );

      closeCreateModal();
    } catch (error) {
      if (
        error instanceof ApiError
      ) {
        setFormError(
          error.message
        );
      } else {
        setFormError(
          "Não foi possível criar a ordem de serviço."
        );
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function loadHistory(
    orderId: number
  ) {
    const response =
      await apiRequest<HistoryResponse>(
        `/work-orders/${orderId}/history`
      );

    setHistoricos(
      response.historicos
    );
  }

  async function openDetails(
    orderId: number
  ) {
    setDetailModalOpen(true);
    setDetailLoading(true);
    setDetailError("");
    setNextStatus("");
    setStatusObservation("");

    try {
      const [
        orderResponse,
        historyResponse
      ] = await Promise.all([
        apiRequest<WorkOrderResponse>(
          `/work-orders/${orderId}`
        ),

        apiRequest<HistoryResponse>(
          `/work-orders/${orderId}/history`
        )
      ]);

      setSelectedOrder(
        orderResponse.ordem
      );

      setHistoricos(
        historyResponse.historicos
      );
    } catch (error) {
      if (
        error instanceof ApiError
      ) {
        setDetailError(
          error.message
        );
      } else {
        setDetailError(
          "Não foi possível carregar os detalhes da ordem."
        );
      }
    } finally {
      setDetailLoading(false);
    }
  }

  function closeDetails() {
    if (statusSubmitting) {
      return;
    }

    setDetailModalOpen(false);
    setSelectedOrder(null);
    setHistoricos([]);
    setDetailError("");
    setNextStatus("");
    setStatusObservation("");
  }

  async function handleStatusChange(
    event:
      FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (
      !selectedOrder ||
      !nextStatus
    ) {
      return;
    }

    setStatusSubmitting(true);
    setDetailError("");

    try {
      const response =
        await apiRequest<WorkOrderResponse>(
          `/work-orders/${selectedOrder.id}/status`,
          {
            method: "PATCH",

            body:
              JSON.stringify({
                status:
                  nextStatus,

                observacao:
                  statusObservation
                    .trim() ||
                  undefined
              })
          }
        );

      setSelectedOrder(
        response.ordem
      );

      setOrdens(
        (current) =>
          current.map(
            (ordem) =>
              ordem.id ===
              response.ordem.id
                ? response.ordem
                : ordem
          )
      );

      await loadHistory(
        response.ordem.id
      );

      setNextStatus("");
      setStatusObservation("");
    } catch (error) {
      if (
        error instanceof ApiError
      ) {
        setDetailError(
          error.message
        );
      } else {
        setDetailError(
          "Não foi possível alterar o status da ordem."
        );
      }
    } finally {
      setStatusSubmitting(false);
    }
  }

  const allowedTransitions =
    selectedOrder
      ? getAllowedTransitions(
          selectedOrder.status
        )
      : [];

  return (
    <section className="page-container">
      <div className="page-heading">
        <div>
          <span className="page-kicker">
            Operação
          </span>

          <h1>
            Ordens de Serviço
          </h1>

          <p>
            Acompanhe atividades,
            responsáveis,
            prioridades e prazos
            operacionais.
          </p>
        </div>

        {canCreate && (
          <button
            type="button"
            className="page-primary-action"
            onClick={
              openCreateModal
            }
          >
            <Plus size={18} />

            Nova ordem
          </button>
        )}
      </div>

      <div className="work-order-summary">
        <div>
          <span>
            Total
          </span>

          <strong>
            {ordens.length}
          </strong>
        </div>

        <div>
          <span>
            Em andamento
          </span>

          <strong>
            {
              ordens.filter(
                (ordem) =>
                  ordem.status ===
                  "EM_ANDAMENTO"
              ).length
            }
          </strong>
        </div>

        <div>
          <span>
            Atrasadas
          </span>

          <strong className="danger-number">
            {
              ordens.filter(
                (ordem) =>
                  ordem.atrasada
              ).length
            }
          </strong>
        </div>

        <div>
          <span>
            Críticas ativas
          </span>

          <strong>
            {
              ordens.filter(
                (ordem) =>
                  ordem.prioridade ===
                    "CRITICA" &&
                  ordem.status !==
                    "CONCLUIDA" &&
                  ordem.status !==
                    "CANCELADA"
              ).length
            }
          </strong>
        </div>
      </div>

      <div className="list-toolbar">
        <div className="search-field">
          <Search size={18} />

          <input
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
            placeholder="Buscar por código, título, cliente, contrato, serviço ou técnico..."
          />
        </div>

        <div className="list-summary">
          <strong>
            {
              filteredOrders.length
            }
          </strong>

          <span>
            {filteredOrders.length ===
            1
              ? "ordem"
              : "ordens"}
          </span>
        </div>
      </div>

      {loading ? (
        <div className="module-loading">
          <div className="spinner" />

          <span>
            Carregando ordens...
          </span>
        </div>
      ) : pageError ? (
        <div className="dashboard-error">
          <AlertTriangle
            size={22}
          />

          <div>
            <strong>
              Não foi possível
              carregar as ordens
            </strong>

            <p>
              {pageError}
            </p>
          </div>
        </div>
      ) : (
        <article className="module-panel">
          {filteredOrders.length ===
          0 ? (
            <div className="empty-state module-empty">
              <ClipboardList
                size={31}
              />

              <strong>
                Nenhuma ordem
                encontrada
              </strong>

              <span>
                {search
                  ? "Tente utilizar outro termo de busca."
                  : "Nenhuma ordem de serviço foi cadastrada."}
              </span>
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="data-table work-orders-table">
                <thead>
                  <tr>
                    <th>
                      Ordem
                    </th>

                    <th>
                      Cliente / Serviço
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

                    <th className="work-order-actions-header">
                      Ações
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredOrders.map(
                    (ordem) => (
                      <tr
                        key={
                          ordem.id
                        }
                        className={
                          ordem.atrasada
                            ? "work-order-overdue"
                            : ""
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
                            {ordem.contrato
                              .cliente
                              .nomeFantasia ??
                              ordem.contrato
                                .cliente
                                .razaoSocial}
                          </strong>

                          <span className="table-secondary">
                            {
                              ordem.servico
                                .nome
                            }
                          </span>
                        </td>

                        <td>
                          <strong className="table-primary">
                            {
                              ordem
                                .responsavel
                                .nome
                            }
                          </strong>

                          <span className="table-secondary">
                            {
                              ordem
                                .responsavel
                                .email
                            }
                          </span>
                        </td>

                        <td>
                          <div
                            className={
                              ordem.atrasada
                                ? "order-deadline overdue"
                                : "order-deadline"
                            }
                          >
                            <CalendarClock
                              size={14}
                            />

                            {formatDate(
                              ordem.prazo
                            )}
                          </div>

                          {ordem.atrasada && (
                            <span className="expired-label">
                              Em atraso
                            </span>
                          )}
                        </td>

                        <td>
                          <span
                            className={`priority-badge priority-${ordem.prioridade.toLowerCase()}`}
                          >
                            {priorityLabel(
                              ordem.prioridade
                            )}
                          </span>
                        </td>

                        <td>
                          <span
                            className={`status-badge status-${statusClass(
                              ordem.status
                            )}`}
                          >
                            {statusLabel(
                              ordem.status
                            )}
                          </span>
                        </td>

                        <td className="work-order-actions-cell">
                          <div className="row-actions work-order-row-actions">
                            <button
                              type="button"
                              className="icon-action"
                              title="Visualizar ordem"
                              aria-label={`Visualizar ${ordem.codigo}`}
                              onClick={() =>
                                void openDetails(
                                  ordem.id
                                )
                              }
                            >
                              <Eye
                                size={16}
                              />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}
        </article>
      )}

      {createModalOpen && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeCreateModal();
            }
          }}
        >
          <div
            className="entity-modal work-order-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="work-order-modal-title"
          >
            <div className="modal-header">
              <div>
                <span>
                  Nova atividade
                </span>

                <h2
                  id="work-order-modal-title"
                >
                  Criar ordem de serviço
                </h2>
              </div>

              <button
                type="button"
                className="modal-close"
                onClick={
                  closeCreateModal
                }
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={
                handleSubmit
              }
            >
              <div className="modal-body">
                <div className="form-grid">
                  <label className="form-field form-field-full">
                    <span>
                      Título *
                    </span>

                    <input
                      value={
                        form.titulo
                      }
                      onChange={(event) =>
                        setForm(
                          (current) => ({
                            ...current,
                            titulo:
                              event
                                .target
                                .value
                          })
                        )
                      }
                      maxLength={200}
                      required
                    />
                  </label>

                  <label className="form-field">
                    <span>
                      Contrato *
                    </span>

                    <select
                      value={
                        form.contratoId
                      }
                      onChange={(event) =>
                        setForm(
                          (current) => ({
                            ...current,

                            contratoId:
                              event
                                .target
                                .value,

                            servicoId:
                              ""
                          })
                        )
                      }
                      required
                    >
                      <option value="">
                        Selecione...
                      </option>

                      {eligibleContracts.map(
                        (contrato) => (
                          <option
                            key={
                              contrato.id
                            }
                            value={
                              contrato.id
                            }
                          >
                            {contrato.numero}
                            {" — "}
                            {contrato
                              .cliente
                              .nomeFantasia ??
                              contrato
                                .cliente
                                .razaoSocial}
                          </option>
                        )
                      )}
                    </select>
                  </label>

                  <label className="form-field">
                    <span>
                      Serviço *
                    </span>

                    <select
                      value={
                        form.servicoId
                      }
                      disabled={
                        !form.contratoId
                      }
                      onChange={(event) =>
                        setForm(
                          (current) => ({
                            ...current,

                            servicoId:
                              event
                                .target
                                .value
                          })
                        )
                      }
                      required
                    >
                      <option value="">
                        {form.contratoId
                          ? "Selecione..."
                          : "Selecione o contrato primeiro"}
                      </option>

                      {selectableServices.map(
                        (servico) => (
                          <option
                            key={
                              servico.id
                            }
                            value={
                              servico.id
                            }
                          >
                            {
                              servico.nome
                            }
                          </option>
                        )
                      )}
                    </select>
                  </label>

                  <label className="form-field">
                    <span>
                      Responsável *
                    </span>

                    <select
                      value={
                        form.responsavelId
                      }
                      onChange={(event) =>
                        setForm(
                          (current) => ({
                            ...current,

                            responsavelId:
                              event
                                .target
                                .value
                          })
                        )
                      }
                      required
                    >
                      <option value="">
                        Selecione...
                      </option>

                      {tecnicos.map(
                        (tecnico) => (
                          <option
                            key={
                              tecnico.id
                            }
                            value={
                              tecnico.id
                            }
                          >
                            {
                              tecnico.nome
                            }
                            {" — "}
                            {
                              tecnico.email
                            }
                          </option>
                        )
                      )}
                    </select>
                  </label>

                  <label className="form-field">
                    <span>
                      Prioridade *
                    </span>

                    <select
                      value={
                        form.prioridade
                      }
                      onChange={(event) =>
                        setForm(
                          (current) => ({
                            ...current,

                            prioridade:
                              event
                                .target
                                .value as
                                Priority
                          })
                        )
                      }
                    >
                      <option value="BAIXA">
                        Baixa
                      </option>

                      <option value="MEDIA">
                        Média
                      </option>

                      <option value="ALTA">
                        Alta
                      </option>

                      <option value="CRITICA">
                        Crítica
                      </option>
                    </select>
                  </label>

                  <label className="form-field">
                    <span>
                      Prazo *
                    </span>

                    <input
                      type="date"
                      value={
                        form.prazo
                      }
                      onChange={(event) =>
                        setForm(
                          (current) => ({
                            ...current,

                            prazo:
                              event
                                .target
                                .value
                          })
                        )
                      }
                      required
                    />
                  </label>

                  <label className="form-field form-field-full">
                    <span>
                      Descrição *
                    </span>

                    <textarea
                      value={
                        form.descricao
                      }
                      onChange={(event) =>
                        setForm(
                          (current) => ({
                            ...current,

                            descricao:
                              event
                                .target
                                .value
                          })
                        )
                      }
                      rows={5}
                      required
                    />
                  </label>
                </div>

                {formError && (
                  <div className="form-error client-form-error">
                    {formError}
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={
                    closeCreateModal
                  }
                  disabled={
                    submitting
                  }
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="page-primary-action"
                  disabled={
                    submitting
                  }
                >
                  {submitting
                    ? "Criando..."
                    : "Criar ordem"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {detailModalOpen && (
        <div
          className="modal-backdrop work-order-detail-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeDetails();
            }
          }}
        >
          <div
            className="work-order-detail-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="work-order-detail-title"
          >
            <div className="modal-header">
              <div>
                <span>
                  Rastreabilidade operacional
                </span>

                <h2
                  id="work-order-detail-title"
                >
                  {selectedOrder
                    ? selectedOrder.codigo
                    : "Ordem de serviço"}
                </h2>
              </div>

              <button
                type="button"
                className="modal-close"
                onClick={
                  closeDetails
                }
                disabled={
                  statusSubmitting
                }
              >
                <X size={20} />
              </button>
            </div>

            {detailLoading ? (
              <div className="detail-loading">
                <div className="spinner" />

                <span>
                  Carregando detalhes...
                </span>
              </div>
            ) : detailError &&
              !selectedOrder ? (
              <div className="detail-error">
                <AlertTriangle
                  size={24}
                />

                <div>
                  <strong>
                    Não foi possível
                    carregar a ordem
                  </strong>

                  <p>
                    {detailError}
                  </p>
                </div>
              </div>
            ) : selectedOrder ? (
              <div className="work-order-detail-content">
                <section className="work-order-detail-main">
                  <div className="detail-title-area">
                    <div>
                      <div className="detail-badges">
                        <span
                          className={`priority-badge priority-${selectedOrder.prioridade.toLowerCase()}`}
                        >
                          {priorityLabel(
                            selectedOrder.prioridade
                          )}
                        </span>

                        <span
                          className={`status-badge status-${statusClass(
                            selectedOrder.status
                          )}`}
                        >
                          {statusLabel(
                            selectedOrder.status
                          )}
                        </span>

                        {selectedOrder.atrasada && (
                          <span className="detail-overdue-badge">
                            Em atraso
                          </span>
                        )}
                      </div>

                      <h3>
                        {
                          selectedOrder.titulo
                        }
                      </h3>

                      <p>
                        {
                          selectedOrder.descricao
                        }
                      </p>
                    </div>
                  </div>

                  <div className="detail-information-grid">
                    <article>
                      <Building2
                        size={18}
                      />

                      <div>
                        <span>
                          Cliente
                        </span>

                        <strong>
                          {selectedOrder
                            .contrato
                            .cliente
                            .nomeFantasia ??
                            selectedOrder
                              .contrato
                              .cliente
                              .razaoSocial}
                        </strong>
                      </div>
                    </article>

                    <article>
                      <FileText
                        size={18}
                      />

                      <div>
                        <span>
                          Contrato
                        </span>

                        <strong>
                          {
                            selectedOrder
                              .contrato
                              .numero
                          }
                        </strong>
                      </div>
                    </article>

                    <article>
                      <Wrench
                        size={18}
                      />

                      <div>
                        <span>
                          Serviço
                        </span>

                        <strong>
                          {
                            selectedOrder
                              .servico
                              .nome
                          }
                        </strong>

                        <small>
                          {
                            selectedOrder
                              .servico
                              .categoria
                          }
                        </small>
                      </div>
                    </article>

                    <article>
                      <UserRound
                        size={18}
                      />

                      <div>
                        <span>
                          Responsável
                        </span>

                        <strong>
                          {
                            selectedOrder
                              .responsavel
                              .nome
                          }
                        </strong>

                        <small>
                          {
                            selectedOrder
                              .responsavel
                              .email
                          }
                        </small>
                      </div>
                    </article>

                    <article>
                      <CalendarClock
                        size={18}
                      />

                      <div>
                        <span>
                          Abertura
                        </span>

                        <strong>
                          {formatDateTime(
                            selectedOrder
                              .dataAbertura
                          )}
                        </strong>
                      </div>
                    </article>

                    <article>
                      <CalendarClock
                        size={18}
                      />

                      <div>
                        <span>
                          Prazo
                        </span>

                        <strong
                          className={
                            selectedOrder.atrasada
                              ? "detail-danger-text"
                              : ""
                          }
                        >
                          {formatDate(
                            selectedOrder.prazo
                          )}
                        </strong>
                      </div>
                    </article>

                    <article>
                      <UserRound
                        size={18}
                      />

                      <div>
                        <span>
                          Criada por
                        </span>

                        <strong>
                          {
                            selectedOrder
                              .criadoPor
                              .nome
                          }
                        </strong>

                        <small>
                          {
                            selectedOrder
                              .criadoPor
                              .email
                          }
                        </small>
                      </div>
                    </article>

                    <article>
                      <CheckCircle2
                        size={18}
                      />

                      <div>
                        <span>
                          Conclusão
                        </span>

                        <strong>
                          {selectedOrder
                            .dataConclusao
                            ? formatDateTime(
                                selectedOrder
                                  .dataConclusao
                              )
                            : "Ainda não concluída"}
                        </strong>
                      </div>
                    </article>
                  </div>

                  <section className="status-transition-panel">
                    <div className="panel-heading status-transition-heading">
                      <div>
                        <span>
                          Fluxo operacional
                        </span>

                        <h2>
                          Alterar status
                        </h2>
                      </div>
                    </div>

                    {allowedTransitions.length ===
                    0 ? (
                      <div className="terminal-status-message">
                        <CheckCircle2
                          size={20}
                        />

                        <div>
                          <strong>
                            Estado final
                          </strong>

                          <span>
                            Esta ordem não
                            permite novas
                            transições de
                            status.
                          </span>
                        </div>
                      </div>
                    ) : (
                      <form
                        className="status-transition-form"
                        onSubmit={
                          handleStatusChange
                        }
                      >
                        <label className="form-field">
                          <span>
                            Próximo status *
                          </span>

                          <select
                            value={
                              nextStatus
                            }
                            onChange={(event) =>
                              setNextStatus(
                                event
                                  .target
                                  .value as
                                  WorkOrderStatus
                              )
                            }
                            required
                          >
                            <option value="">
                              Selecione...
                            </option>

                            {allowedTransitions.map(
                              (
                                status
                              ) => (
                                <option
                                  key={
                                    status
                                  }
                                  value={
                                    status
                                  }
                                >
                                  {statusLabel(
                                    status
                                  )}
                                </option>
                              )
                            )}
                          </select>
                        </label>

                        <label className="form-field status-observation-field">
                          <span>
                            Observação
                          </span>

                          <textarea
                            value={
                              statusObservation
                            }
                            onChange={(event) =>
                              setStatusObservation(
                                event
                                  .target
                                  .value
                              )
                            }
                            placeholder="Registre uma observação sobre esta alteração..."
                            maxLength={
                              1000
                            }
                            rows={3}
                          />
                        </label>

                        <div className="status-transition-footer">
                          <span>
                            Somente transições
                            permitidas pelo fluxo
                            da OS são exibidas.
                          </span>

                          <button
                            type="submit"
                            className="page-primary-action"
                            disabled={
                              !nextStatus ||
                              statusSubmitting
                            }
                          >
                            {statusSubmitting
                              ? "Atualizando..."
                              : "Atualizar status"}
                          </button>
                        </div>
                      </form>
                    )}

                    {detailError && (
                      <div className="form-error detail-form-error">
                        {detailError}
                      </div>
                    )}
                  </section>
                </section>

                <aside className="work-order-history-panel">
                  <div className="history-heading">
                    <History
                      size={20}
                    />

                    <div>
                      <span>
                        Histórico
                      </span>

                      <h3>
                        Linha do tempo
                      </h3>
                    </div>
                  </div>

                  {historicos.length ===
                  0 ? (
                    <div className="history-empty">
                      Nenhuma movimentação
                      registrada.
                    </div>
                  ) : (
                    <div className="history-timeline">
                      {historicos.map(
                        (
                          historico,
                          index
                        ) => (
                          <article
                            key={
                              historico.id
                            }
                            className="history-entry"
                          >
                            <div className="history-marker">
                              <span />

                              {index <
                                historicos.length -
                                  1 && (
                                <i />
                              )}
                            </div>

                            <div className="history-content">
                              <div className="history-status-flow">
                                {historico.statusAnterior ? (
                                  <>
                                    <span>
                                      {statusLabel(
                                        historico.statusAnterior
                                      )}
                                    </span>

                                    <ArrowRight
                                      size={13}
                                    />

                                    <strong>
                                      {statusLabel(
                                        historico.statusNovo
                                      )}
                                    </strong>
                                  </>
                                ) : (
                                  <strong>
                                    {statusLabel(
                                      historico.statusNovo
                                    )}
                                  </strong>
                                )}
                              </div>

                              {historico.observacao && (
                                <p>
                                  {
                                    historico.observacao
                                  }
                                </p>
                              )}

                              <div className="history-meta">
                                <span>
                                  {
                                    historico
                                      .usuario
                                      .nome
                                  }
                                </span>

                                <span>
                                  {formatDateTime(
                                    historico.createdAt
                                  )}
                                </span>
                              </div>
                            </div>
                          </article>
                        )
                      )}
                    </div>
                  )}
                </aside>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </section>
  );
}