import {
  useEffect,
  useMemo,
  useState
} from "react";

import type {
  FormEvent
} from "react";

import {
  CalendarDays,
  FileText,
  Pencil,
  Plus,
  Search,
  X
} from "lucide-react";

import {
  ApiError,
  apiRequest
} from "../api/http";

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
  observacoes: string | null;
  vencido: boolean;
  createdAt: string;
  updatedAt: string;

  cliente: Cliente;
}

interface ContractsResponse {
  contratos: Contrato[];
}

interface ContractResponse {
  contrato: Contrato;
}

interface ClientsResponse {
  clientes: Cliente[];
}

interface ContractForm {
  numero: string;
  objeto: string;
  dataInicio: string;
  dataFim: string;
  observacoes: string;
  clienteId: string;
}

const emptyForm: ContractForm = {
  numero: "",
  objeto: "",
  dataInicio: "",
  dataFim: "",
  observacoes: "",
  clienteId: ""
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

function statusLabel(
  status: ContractStatus
): string {
  const labels:
    Record<
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
  status: ContractStatus
): string {
  return status
    .toLowerCase();
}

export function ContractsPage() {
  const [
    contratos,
    setContratos
  ] = useState<Contrato[]>([]);

  const [
    clientes,
    setClientes
  ] = useState<Cliente[]>([]);

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
    editingContract,
    setEditingContract
  ] =
    useState<Contrato | null>(
      null
    );

  const [
    form,
    setForm
  ] =
    useState<ContractForm>(
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
        contractsResponse,
        clientsResponse
      ] = await Promise.all([
        apiRequest<ContractsResponse>(
          "/contracts"
        ),

        apiRequest<ClientsResponse>(
          "/clients"
        )
      ]);

      setContratos(
        contractsResponse.contratos
      );

      setClientes(
        clientsResponse.clientes
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
          "Não foi possível carregar os contratos."
        );
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  const filteredContracts =
    useMemo(() => {
      const term =
        search
          .trim()
          .toLowerCase();

      if (!term) {
        return contratos;
      }

      return contratos.filter(
        (contrato) =>
          contrato.numero
            .toLowerCase()
            .includes(term) ||
          contrato.objeto
            .toLowerCase()
            .includes(term) ||
          contrato.cliente
            .razaoSocial
            .toLowerCase()
            .includes(term) ||
          (
            contrato.cliente
              .nomeFantasia ?? ""
          )
            .toLowerCase()
            .includes(term)
      );
    }, [
      contratos,
      search
    ]);

  const activeClients =
    useMemo(
      () =>
        clientes.filter(
          (cliente) =>
            cliente.ativo
        ),
      [clientes]
    );

  function openCreateModal() {
    setEditingContract(null);
    setForm(emptyForm);
    setFormError("");
    setModalOpen(true);
  }

  function openEditModal(
    contrato: Contrato
  ) {
    setEditingContract(
      contrato
    );

    setForm({
      numero:
        contrato.numero,

      objeto:
        contrato.objeto,

      dataInicio:
        contrato.dataInicio.slice(
          0,
          10
        ),

      dataFim:
        contrato.dataFim.slice(
          0,
          10
        ),

      observacoes:
        contrato.observacoes ??
        "",

      clienteId:
        String(
          contrato.cliente.id
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
    setEditingContract(null);
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
      numero:
        form.numero.trim(),

      objeto:
        form.objeto.trim(),

      dataInicio:
        form.dataInicio,

      dataFim:
        form.dataFim,

      observacoes:
        form.observacoes.trim() ||
        undefined,

      clienteId:
        Number(
          form.clienteId
        )
    };

    try {
      if (
        editingContract
      ) {
        const response =
          await apiRequest<ContractResponse>(
            `/contracts/${editingContract.id}`,
            {
              method:
                "PATCH",

              body:
                JSON.stringify(
                  payload
                )
            }
          );

        setContratos(
          (current) =>
            current.map(
              (contrato) =>
                contrato.id ===
                editingContract.id
                  ? response.contrato
                  : contrato
            )
        );
      } else {
        const response =
          await apiRequest<ContractResponse>(
            "/contracts",
            {
              method:
                "POST",

              body:
                JSON.stringify(
                  payload
                )
            }
          );

        setContratos(
          (current) => [
            response.contrato,
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
          "Não foi possível salvar o contrato."
        );
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function changeStatus(
    contrato: Contrato,
    status: ContractStatus
  ) {
    const confirmation =
      window.confirm(
        `Deseja alterar o contrato "${contrato.numero}" para ${statusLabel(
          status
        )}?`
      );

    if (!confirmation) {
      return;
    }

    try {
      setChangingStatusId(
        contrato.id
      );

      const response =
        await apiRequest<ContractResponse>(
          `/contracts/${contrato.id}/status`,
          {
            method:
              "PATCH",

            body:
              JSON.stringify({
                status
              })
          }
        );

      setContratos(
        (current) =>
          current.map(
            (item) =>
              item.id ===
              contrato.id
                ? response.contrato
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
          "Não foi possível alterar o status do contrato."
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
            Gestão contratual
          </span>

          <h1>
            Contratos
          </h1>

          <p>
            Acompanhe contratos,
            vigências e vínculos com
            os clientes da organização.
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

          Novo contrato
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
            placeholder="Buscar por número, objeto ou cliente..."
          />
        </div>

        <div className="list-summary">
          <strong>
            {
              filteredContracts.length
            }
          </strong>

          <span>
            {filteredContracts.length ===
            1
              ? "contrato"
              : "contratos"}
          </span>
        </div>
      </div>

      {loading ? (
        <div className="module-loading">
          <div className="spinner" />

          <span>
            Carregando contratos...
          </span>
        </div>
      ) : pageError ? (
        <div className="dashboard-error">
          <div>
            <strong>
              Não foi possível
              carregar os contratos
            </strong>

            <p>
              {pageError}
            </p>
          </div>
        </div>
      ) : (
        <article className="module-panel">
          {filteredContracts.length ===
          0 ? (
            <div className="empty-state module-empty">
              <FileText
                size={31}
              />

              <strong>
                Nenhum contrato
                encontrado
              </strong>

              <span>
                {search
                  ? "Tente utilizar outro termo de busca."
                  : "Cadastre o primeiro contrato do PetroSys."}
              </span>
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="data-table contracts-table">
                <thead>
                  <tr>
                    <th>
                      Contrato
                    </th>

                    <th>
                      Cliente
                    </th>

                    <th>
                      Vigência
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
                  {filteredContracts.map(
                    (contrato) => (
                      <tr
                        key={
                          contrato.id
                        }
                      >
                        <td>
                          <strong className="table-primary">
                            {
                              contrato.numero
                            }
                          </strong>

                          <span className="table-secondary">
                            {
                              contrato.objeto
                            }
                          </span>
                        </td>

                        <td>
                          <strong className="table-primary">
                            {contrato.cliente
                              .nomeFantasia ??
                              contrato
                                .cliente
                                .razaoSocial}
                          </strong>

                          {contrato.cliente
                            .nomeFantasia && (
                            <span className="table-secondary">
                              {
                                contrato
                                  .cliente
                                  .razaoSocial
                              }
                            </span>
                          )}
                        </td>

                        <td>
                          <div className="contract-period">
                            <CalendarDays
                              size={14}
                            />

                            <span>
                              {formatDate(
                                contrato.dataInicio
                              )}
                            </span>

                            <span>
                              →
                            </span>

                            <span>
                              {formatDate(
                                contrato.dataFim
                              )}
                            </span>
                          </div>

                          {contrato.vencido && (
                            <span className="expired-label">
                              Contrato vencido
                            </span>
                          )}
                        </td>

                        <td>
                          <span
                            className={`status-badge contract-status-${statusClass(
                              contrato.status
                            )}`}
                          >
                            {statusLabel(
                              contrato.status
                            )}
                          </span>
                        </td>

                        <td>
                          <div className="row-actions">
                            <button
                              type="button"
                              className="icon-action"
                              title="Editar contrato"
                              onClick={() =>
                                openEditModal(
                                  contrato
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
                                contrato.status
                              }
                              disabled={
                                changingStatusId ===
                                contrato.id
                              }
                              onChange={(event) =>
                                void changeStatus(
                                  contrato,
                                  event.target
                                    .value as
                                    ContractStatus
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
            aria-labelledby="contract-modal-title"
          >
            <div className="modal-header">
              <div>
                <span>
                  {editingContract
                    ? "Atualização contratual"
                    : "Novo contrato"}
                </span>

                <h2
                  id="contract-modal-title"
                >
                  {editingContract
                    ? "Editar contrato"
                    : "Cadastrar contrato"}
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
                  <label className="form-field">
                    <span>
                      Número *
                    </span>

                    <input
                      value={
                        form.numero
                      }
                      onChange={(event) =>
                        setForm(
                          (current) => ({
                            ...current,
                            numero:
                              event
                                .target
                                .value
                          })
                        )
                      }
                      maxLength={50}
                      required
                    />
                  </label>

                  <label className="form-field">
                    <span>
                      Cliente *
                    </span>

                    <select
                      value={
                        form.clienteId
                      }
                      onChange={(event) =>
                        setForm(
                          (current) => ({
                            ...current,
                            clienteId:
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

                      {activeClients.map(
                        (cliente) => (
                          <option
                            key={
                              cliente.id
                            }
                            value={
                              cliente.id
                            }
                          >
                            {cliente.nomeFantasia ??
                              cliente.razaoSocial}
                          </option>
                        )
                      )}
                    </select>
                  </label>

                  <label className="form-field form-field-full">
                    <span>
                      Objeto do contrato *
                    </span>

                    <textarea
                      value={
                        form.objeto
                      }
                      onChange={(event) =>
                        setForm(
                          (current) => ({
                            ...current,
                            objeto:
                              event
                                .target
                                .value
                          })
                        )
                      }
                      rows={4}
                      required
                    />
                  </label>

                  <label className="form-field">
                    <span>
                      Data inicial *
                    </span>

                    <input
                      type="date"
                      value={
                        form.dataInicio
                      }
                      onChange={(event) =>
                        setForm(
                          (current) => ({
                            ...current,
                            dataInicio:
                              event
                                .target
                                .value
                          })
                        )
                      }
                      required
                    />
                  </label>

                  <label className="form-field">
                    <span>
                      Data final *
                    </span>

                    <input
                      type="date"
                      value={
                        form.dataFim
                      }
                      onChange={(event) =>
                        setForm(
                          (current) => ({
                            ...current,
                            dataFim:
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
                      Observações
                    </span>

                    <textarea
                      value={
                        form.observacoes
                      }
                      onChange={(event) =>
                        setForm(
                          (current) => ({
                            ...current,
                            observacoes:
                              event
                                .target
                                .value
                          })
                        )
                      }
                      rows={3}
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
                    : editingContract
                      ? "Salvar alterações"
                      : "Cadastrar contrato"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}