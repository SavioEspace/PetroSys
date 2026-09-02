import {
  useEffect,
  useMemo,
  useState
} from "react";

import type {
  FormEvent
} from "react";

import {
  FileCog,
  Pencil,
  Plus,
  Search,
  X
} from "lucide-react";

import {
  ApiError,
  apiRequest
} from "../api/http";

type ServiceStatus =
  | "ATIVO"
  | "SUSPENSO"
  | "ENCERRADO";

type ContractStatus =
  | "ATIVO"
  | "SUSPENSO"
  | "ENCERRADO";

interface Cliente {
  id: number;
  razaoSocial: string;
  nomeFantasia: string | null;
  ativo: boolean;
}

interface Contrato {
  id: number;
  numero: string;
  objeto: string;
  dataInicio: string;
  dataFim: string;
  status: ContractStatus;
  vencido: boolean;

  cliente: Cliente;
}

interface ServicoTecnologico {
  id: number;
  nome: string;
  descricao: string;
  categoria: string;
  status: ServiceStatus;
  createdAt: string;
  updatedAt: string;

  contrato: Contrato;
}

interface ServicesResponse {
  servicos: ServicoTecnologico[];
}

interface ServiceResponse {
  servico: ServicoTecnologico;
}

interface ContractsResponse {
  contratos: Contrato[];
}

interface ServiceForm {
  nome: string;
  descricao: string;
  categoria: string;
  contratoId: string;
}

const emptyForm: ServiceForm = {
  nome: "",
  descricao: "",
  categoria: "",
  contratoId: ""
};

function statusLabel(
  status: ServiceStatus
): string {
  const labels: Record<
    ServiceStatus,
    string
  > = {
    ATIVO: "Ativo",
    SUSPENSO: "Suspenso",
    ENCERRADO: "Encerrado"
  };

  return labels[status];
}

function contractStatusLabel(
  status: ContractStatus
): string {
  const labels: Record<
    ContractStatus,
    string
  > = {
    ATIVO: "Ativo",
    SUSPENSO: "Suspenso",
    ENCERRADO: "Encerrado"
  };

  return labels[status];
}

function statusClass(
  status: ServiceStatus
): string {
  return status.toLowerCase();
}

export function ServicesPage() {
  const [
    servicos,
    setServicos
  ] = useState<
    ServicoTecnologico[]
  >([]);

  const [
    contratos,
    setContratos
  ] = useState<Contrato[]>([]);

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
    modalOpen,
    setModalOpen
  ] = useState(false);

  const [
    editingService,
    setEditingService
  ] =
    useState<
      ServicoTecnologico | null
    >(null);

  const [
    form,
    setForm
  ] =
    useState<ServiceForm>(
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
    changingStatusId,
    setChangingStatusId
  ] =
    useState<number | null>(
      null
    );

  async function loadData() {
    try {
      setLoading(true);
      setPageError("");

      const [
        servicesResponse,
        contractsResponse
      ] = await Promise.all([
        apiRequest<ServicesResponse>(
          "/services"
        ),

        apiRequest<ContractsResponse>(
          "/contracts"
        )
      ]);

      setServicos(
        servicesResponse.servicos
      );

      setContratos(
        contractsResponse.contratos
      );
    } catch (error) {
      if (
        error instanceof ApiError
      ) {
        setPageError(
          error.message
        );
      } else {
        setPageError(
          "Não foi possível carregar os serviços tecnológicos."
        );
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  const filteredServices =
    useMemo(() => {
      const term =
        search
          .trim()
          .toLowerCase();

      if (!term) {
        return servicos;
      }

      return servicos.filter(
        (servico) =>
          servico.nome
            .toLowerCase()
            .includes(term) ||
          servico.categoria
            .toLowerCase()
            .includes(term) ||
          servico.contrato.numero
            .toLowerCase()
            .includes(term) ||
          servico.contrato.cliente
            .razaoSocial
            .toLowerCase()
            .includes(term) ||
          (
            servico.contrato.cliente
              .nomeFantasia ?? ""
          )
            .toLowerCase()
            .includes(term)
      );
    }, [
      servicos,
      search
    ]);

  const selectableContracts =
    useMemo(() => {
      return contratos.filter(
        (contrato) => {
          const eligible =
            contrato.status ===
              "ATIVO" &&
            !contrato.vencido &&
            contrato.cliente.ativo;

          const isCurrentContract =
            editingService?.contrato
              .id === contrato.id;

          return (
            eligible ||
            isCurrentContract
          );
        }
      );
    }, [
      contratos,
      editingService
    ]);

  function openCreateModal() {
    setEditingService(null);
    setForm(emptyForm);
    setFormError("");
    setModalOpen(true);
  }

  function openEditModal(
    servico: ServicoTecnologico
  ) {
    setEditingService(
      servico
    );

    setForm({
      nome:
        servico.nome,

      descricao:
        servico.descricao,

      categoria:
        servico.categoria,

      contratoId:
        String(
          servico.contrato.id
        )
    });

    setFormError("");
    setModalOpen(true);
  }

  function closeModal() {
    if (submitting) {
      return;
    }

    setModalOpen(false);
    setEditingService(null);
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

    const payload = {
      nome:
        form.nome.trim(),

      descricao:
        form.descricao.trim(),

      categoria:
        form.categoria.trim(),

      contratoId:
        Number(
          form.contratoId
        )
    };

    try {
      if (editingService) {
        const response =
          await apiRequest<ServiceResponse>(
            `/services/${editingService.id}`,
            {
              method:
                "PATCH",

              body:
                JSON.stringify(
                  payload
                )
            }
          );

        setServicos(
          (current) =>
            current.map(
              (servico) =>
                servico.id ===
                editingService.id
                  ? response.servico
                  : servico
            )
        );
      } else {
        const response =
          await apiRequest<ServiceResponse>(
            "/services",
            {
              method:
                "POST",

              body:
                JSON.stringify(
                  payload
                )
            }
          );

        setServicos(
          (current) => [
            response.servico,
            ...current
          ]
        );
      }

      closeModal();
    } catch (error) {
      if (
        error instanceof ApiError
      ) {
        setFormError(
          error.message
        );
      } else {
        setFormError(
          "Não foi possível salvar o serviço tecnológico."
        );
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function changeStatus(
    servico: ServicoTecnologico,
    status: ServiceStatus
  ) {
    if (
      status === servico.status
    ) {
      return;
    }

    const confirmation =
      window.confirm(
        `Deseja alterar o serviço "${servico.nome}" para ${statusLabel(
          status
        )}?`
      );

    if (!confirmation) {
      return;
    }

    try {
      setChangingStatusId(
        servico.id
      );

      const response =
        await apiRequest<ServiceResponse>(
          `/services/${servico.id}/status`,
          {
            method:
              "PATCH",

            body:
              JSON.stringify({
                status
              })
          }
        );

      setServicos(
        (current) =>
          current.map(
            (item) =>
              item.id ===
              servico.id
                ? response.servico
                : item
          )
      );
    } catch (error) {
      if (
        error instanceof ApiError
      ) {
        window.alert(
          error.message
        );
      } else {
        window.alert(
          "Não foi possível alterar o status do serviço."
        );
      }
    } finally {
      setChangingStatusId(
        null
      );
    }
  }

  return (
    <section className="page-container">
      <div className="page-heading">
        <div>
          <span className="page-kicker">
            Gestão de serviços
          </span>

          <h1>
            Serviços Tecnológicos
          </h1>

          <p>
            Gerencie os serviços
            tecnológicos associados
            aos contratos da
            organização.
          </p>
        </div>

        <button
          type="button"
          className="page-primary-action"
          onClick={
            openCreateModal
          }
        >
          <Plus size={18} />

          Novo serviço
        </button>
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
            placeholder="Buscar por serviço, categoria, contrato ou cliente..."
          />
        </div>

        <div className="list-summary">
          <strong>
            {
              filteredServices.length
            }
          </strong>

          <span>
            {filteredServices.length ===
            1
              ? "serviço"
              : "serviços"}
          </span>
        </div>
      </div>

      {loading ? (
        <div className="module-loading">
          <div className="spinner" />

          <span>
            Carregando serviços...
          </span>
        </div>
      ) : pageError ? (
        <div className="dashboard-error">
          <div>
            <strong>
              Não foi possível
              carregar os serviços
            </strong>

            <p>
              {pageError}
            </p>
          </div>
        </div>
      ) : (
        <article className="module-panel">
          {filteredServices.length ===
          0 ? (
            <div className="empty-state module-empty">
              <FileCog
                size={31}
              />

              <strong>
                Nenhum serviço
                encontrado
              </strong>

              <span>
                {search
                  ? "Tente utilizar outro termo de busca."
                  : "Cadastre o primeiro serviço tecnológico."}
              </span>
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="data-table services-table">
                <thead>
                  <tr>
                    <th>
                      Serviço
                    </th>

                    <th>
                      Categoria
                    </th>

                    <th>
                      Contrato
                    </th>

                    <th>
                      Cliente
                    </th>

                    <th>
                      Status
                    </th>

                    <th className="actions-column">
                      Ações
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredServices.map(
                    (servico) => (
                      <tr
                        key={
                          servico.id
                        }
                      >
                        <td>
                          <strong className="table-primary">
                            {
                              servico.nome
                            }
                          </strong>

                          <span className="table-secondary">
                            {
                              servico.descricao
                            }
                          </span>
                        </td>

                        <td>
                          <span className="category-badge">
                            {
                              servico.categoria
                            }
                          </span>
                        </td>

                        <td>
                          <strong className="table-primary">
                            {
                              servico
                                .contrato
                                .numero
                            }
                          </strong>

                          <span className="table-secondary">
                            {contractStatusLabel(
                              servico
                                .contrato
                                .status
                            )}

                            {servico
                              .contrato
                              .vencido
                              ? " • Vencido"
                              : ""}
                          </span>
                        </td>

                        <td>
                          <strong className="table-primary">
                            {servico
                              .contrato
                              .cliente
                              .nomeFantasia ??
                              servico
                                .contrato
                                .cliente
                                .razaoSocial}
                          </strong>
                        </td>

                        <td>
                          <span
                            className={`status-badge service-status-${statusClass(
                              servico.status
                            )}`}
                          >
                            {statusLabel(
                              servico.status
                            )}
                          </span>
                        </td>

                        <td>
                          <div className="row-actions">
                            <button
                              type="button"
                              className="icon-action"
                              title="Editar serviço"
                              onClick={() =>
                                openEditModal(
                                  servico
                                )
                              }
                            >
                              <Pencil
                                size={16}
                              />
                            </button>

                            <select
                              className="status-select"
                              value={
                                servico.status
                              }
                              disabled={
                                changingStatusId ===
                                servico.id
                              }
                              onChange={(event) =>
                                void changeStatus(
                                  servico,
                                  event.target
                                    .value as
                                    ServiceStatus
                                )
                              }
                            >
                              <option value="ATIVO">
                                Ativo
                              </option>

                              <option value="SUSPENSO">
                                Suspenso
                              </option>

                              <option value="ENCERRADO">
                                Encerrado
                              </option>
                            </select>
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

      {modalOpen && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeModal();
            }
          }}
        >
          <div
            className="entity-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="service-modal-title"
          >
            <div className="modal-header">
              <div>
                <span>
                  {editingService
                    ? "Atualização do serviço"
                    : "Novo serviço"}
                </span>

                <h2
                  id="service-modal-title"
                >
                  {editingService
                    ? "Editar serviço tecnológico"
                    : "Cadastrar serviço tecnológico"}
                </h2>
              </div>

              <button
                type="button"
                className="modal-close"
                onClick={
                  closeModal
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
                      Nome *
                    </span>

                    <input
                      value={
                        form.nome
                      }
                      onChange={(event) =>
                        setForm(
                          (current) => ({
                            ...current,

                            nome:
                              event
                                .target
                                .value
                          })
                        )
                      }
                      maxLength={150}
                      required
                    />
                  </label>

                  <label className="form-field">
                    <span>
                      Categoria *
                    </span>

                    <input
                      value={
                        form.categoria
                      }
                      onChange={(event) =>
                        setForm(
                          (current) => ({
                            ...current,

                            categoria:
                              event
                                .target
                                .value
                          })
                        )
                      }
                      placeholder="Ex.: Infraestrutura"
                      maxLength={100}
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
                                .value
                          })
                        )
                      }
                      required
                    >
                      <option value="">
                        Selecione...
                      </option>

                      {selectableContracts.map(
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
                    closeModal
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
                    ? "Salvando..."
                    : editingService
                      ? "Salvar alterações"
                      : "Cadastrar serviço"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}