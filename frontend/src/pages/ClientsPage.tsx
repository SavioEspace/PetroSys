import {
  useEffect,
  useMemo,
  useState
} from "react";

import type {
  FormEvent
} from "react";

import {
  Building2,
  Mail,
  Pencil,
  Phone,
  Plus,
  Power,
  Search,
  X
} from "lucide-react";

import {
  ApiError,
  apiRequest
} from "../api/http";

interface Cliente {
  id: number;
  razaoSocial: string;
  nomeFantasia: string | null;
  cnpj: string;
  email: string | null;
  telefone: string | null;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ClientsResponse {
  clientes: Cliente[];
}

interface ClientResponse {
  cliente: Cliente;
}

interface ClientForm {
  razaoSocial: string;
  nomeFantasia: string;
  cnpj: string;
  email: string;
  telefone: string;
}

const emptyForm: ClientForm = {
  razaoSocial: "",
  nomeFantasia: "",
  cnpj: "",
  email: "",
  telefone: ""
};

function onlyDigits(
  value: string
): string {
  return value.replace(
    /\D/g,
    ""
  );
}

function formatCnpj(
  value: string
): string {
  const digits =
    onlyDigits(value).slice(
      0,
      14
    );

  return digits
    .replace(
      /^(\d{2})(\d)/,
      "$1.$2"
    )
    .replace(
      /^(\d{2})\.(\d{3})(\d)/,
      "$1.$2.$3"
    )
    .replace(
      /\.(\d{3})(\d)/,
      ".$1/$2"
    )
    .replace(
      /(\d{4})(\d)/,
      "$1-$2"
    );
}

function formatPhone(
  value: string
): string {
  const digits =
    onlyDigits(value).slice(
      0,
      11
    );

  if (digits.length <= 10) {
    return digits
      .replace(
        /^(\d{2})(\d)/,
        "($1) $2"
      )
      .replace(
        /(\d{4})(\d)/,
        "$1-$2"
      );
  }

  return digits
    .replace(
      /^(\d{2})(\d)/,
      "($1) $2"
    )
    .replace(
      /(\d{5})(\d)/,
      "$1-$2"
    );
}

export function ClientsPage() {
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
    editingClient,
    setEditingClient
  ] =
    useState<Cliente | null>(
      null
    );

  const [
    form,
    setForm
  ] =
    useState<ClientForm>(
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

  async function loadClients() {
    try {
      setLoading(true);
      setPageError("");

      const response =
        await apiRequest<ClientsResponse>(
          "/clients"
        );

      setClientes(
        response.clientes
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
          "Não foi possível carregar os clientes."
        );
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadClients();
  }, []);

  const filteredClients =
    useMemo(() => {
      const term =
        search
          .trim()
          .toLowerCase();

      if (!term) {
        return clientes;
      }

      const digits =
        onlyDigits(term);

      return clientes.filter(
        (cliente) => {
          const matchesText =
            cliente.razaoSocial
              .toLowerCase()
              .includes(term) ||
            (
              cliente.nomeFantasia ??
              ""
            )
              .toLowerCase()
              .includes(term) ||
            (
              cliente.email ??
              ""
            )
              .toLowerCase()
              .includes(term);

          const matchesCnpj =
            digits.length > 0 &&
            cliente.cnpj.includes(
              digits
            );

          return (
            matchesText ||
            matchesCnpj
          );
        }
      );
    }, [
      clientes,
      search
    ]);

  function openCreateModal() {
    setEditingClient(null);
    setForm(emptyForm);
    setFormError("");
    setModalOpen(true);
  }

  function openEditModal(
    cliente: Cliente
  ) {
    setEditingClient(cliente);

    setForm({
      razaoSocial:
        cliente.razaoSocial,

      nomeFantasia:
        cliente.nomeFantasia ??
        "",

      cnpj:
        formatCnpj(
          cliente.cnpj
        ),

      email:
        cliente.email ?? "",

      telefone:
        formatPhone(
          cliente.telefone ??
          ""
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
    setEditingClient(null);
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
      razaoSocial:
        form.razaoSocial.trim(),

      nomeFantasia:
        form.nomeFantasia.trim() ||
        undefined,

      cnpj:
        onlyDigits(
          form.cnpj
        ),

      email:
        form.email.trim() ||
        undefined,

      telefone:
        onlyDigits(
          form.telefone
        ) || undefined
    };

    try {
      if (editingClient) {
        const response =
          await apiRequest<ClientResponse>(
            `/clients/${editingClient.id}`,
            {
              method: "PATCH",

              body:
                JSON.stringify(
                  payload
                )
            }
          );

        setClientes(
          (current) =>
            current.map(
              (cliente) =>
                cliente.id ===
                editingClient.id
                  ? response.cliente
                  : cliente
            )
        );
      } else {
        const response =
          await apiRequest<ClientResponse>(
            "/clients",
            {
              method: "POST",

              body:
                JSON.stringify(
                  payload
                )
            }
          );

        setClientes(
          (current) => [
            response.cliente,
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
          "Não foi possível salvar o cliente."
        );
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleStatus(
    cliente: Cliente
  ) {
    const nextStatus =
      !cliente.ativo;

    const confirmation =
      window.confirm(
        nextStatus
          ? `Deseja reativar "${cliente.razaoSocial}"?`
          : `Deseja desativar "${cliente.razaoSocial}"?`
      );

    if (!confirmation) {
      return;
    }

    try {
      setChangingStatusId(
        cliente.id
      );

      const response =
        await apiRequest<ClientResponse>(
          `/clients/${cliente.id}/status`,
          {
            method: "PATCH",

            body:
              JSON.stringify({
                ativo:
                  nextStatus
              })
          }
        );

      setClientes(
        (current) =>
          current.map(
            (item) =>
              item.id ===
              cliente.id
                ? response.cliente
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
          "Não foi possível alterar o status do cliente."
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
      <div className="page-heading client-page-heading">
        <div>
          <span className="page-kicker">
            Gestão cadastral
          </span>

          <h1>
            Clientes
          </h1>

          <p>
            Centralize e mantenha
            atualizada a base de
            clientes da organização.
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

          Novo cliente
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
            placeholder="Buscar por razão social, nome, CNPJ ou e-mail..."
          />
        </div>

        <div className="list-summary">
          <strong>
            {
              filteredClients.length
            }
          </strong>

          <span>
            {filteredClients.length ===
            1
              ? "cliente"
              : "clientes"}
          </span>
        </div>
      </div>

      {loading ? (
        <div className="module-loading">
          <div className="spinner" />

          <span>
            Carregando clientes...
          </span>
        </div>
      ) : pageError ? (
        <div className="dashboard-error">
          <div>
            <strong>
              Não foi possível
              carregar os clientes
            </strong>

            <p>
              {pageError}
            </p>
          </div>
        </div>
      ) : (
        <article className="module-panel">
          {filteredClients.length ===
          0 ? (
            <div className="empty-state module-empty">
              <Building2
                size={31}
              />

              <strong>
                Nenhum cliente
                encontrado
              </strong>

              <span>
                {search
                  ? "Tente utilizar outro termo de busca."
                  : "Cadastre o primeiro cliente da base PetroSys."}
              </span>
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="data-table clients-table">
                <thead>
                  <tr>
                    <th>
                      Cliente
                    </th>

                    <th>
                      CNPJ
                    </th>

                    <th>
                      Contato
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
                  {filteredClients.map(
                    (cliente) => (
                      <tr
                        key={
                          cliente.id
                        }
                      >
                        <td>
                          <div className="client-cell">
                            <div className="client-avatar">
                              {(
                                cliente.nomeFantasia ??
                                cliente.razaoSocial
                              )
                                .charAt(0)
                                .toUpperCase()}
                            </div>

                            <div>
                              <strong className="table-primary">
                                {cliente.nomeFantasia ??
                                  cliente.razaoSocial}
                              </strong>

                              {cliente.nomeFantasia && (
                                <span className="table-secondary">
                                  {
                                    cliente.razaoSocial
                                  }
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        <td>
                          {formatCnpj(
                            cliente.cnpj
                          )}
                        </td>

                        <td>
                          <div className="client-contact">
                            {cliente.email && (
                              <span>
                                <Mail
                                  size={13}
                                />

                                {
                                  cliente.email
                                }
                              </span>
                            )}

                            {cliente.telefone && (
                              <span>
                                <Phone
                                  size={13}
                                />

                                {formatPhone(
                                  cliente.telefone
                                )}
                              </span>
                            )}

                            {!cliente.email &&
                              !cliente.telefone && (
                                <span className="muted-value">
                                  Não informado
                                </span>
                              )}
                          </div>
                        </td>

                        <td>
                          <span
                            className={
                              cliente.ativo
                                ? "status-badge status-active"
                                : "status-badge status-inactive"
                            }
                          >
                            {cliente.ativo
                              ? "Ativo"
                              : "Inativo"}
                          </span>
                        </td>

                        <td>
                          <div className="row-actions">
                            <button
                              type="button"
                              className="icon-action"
                              title="Editar cliente"
                              onClick={() =>
                                openEditModal(
                                  cliente
                                )
                              }
                            >
                              <Pencil
                                size={16}
                              />
                            </button>

                            <button
                              type="button"
                              className={
                                cliente.ativo
                                  ? "icon-action danger-action"
                                  : "icon-action success-action"
                              }
                              title={
                                cliente.ativo
                                  ? "Desativar cliente"
                                  : "Reativar cliente"
                              }
                              disabled={
                                changingStatusId ===
                                cliente.id
                              }
                              onClick={() =>
                                void toggleStatus(
                                  cliente
                                )
                              }
                            >
                              <Power
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
            aria-labelledby="client-modal-title"
          >
            <div className="modal-header">
              <div>
                <span>
                  {editingClient
                    ? "Atualização cadastral"
                    : "Novo cadastro"}
                </span>

                <h2
                  id="client-modal-title"
                >
                  {editingClient
                    ? "Editar cliente"
                    : "Cadastrar cliente"}
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
                      Razão social *
                    </span>

                    <input
                      value={
                        form.razaoSocial
                      }
                      onChange={(event) =>
                        setForm(
                          (
                            current
                          ) => ({
                            ...current,
                            razaoSocial:
                              event
                                .target
                                .value
                          })
                        )
                      }
                      maxLength={
                        200
                      }
                      required
                    />
                  </label>

                  <label className="form-field">
                    <span>
                      Nome fantasia
                    </span>

                    <input
                      value={
                        form.nomeFantasia
                      }
                      onChange={(event) =>
                        setForm(
                          (
                            current
                          ) => ({
                            ...current,
                            nomeFantasia:
                              event
                                .target
                                .value
                          })
                        )
                      }
                      maxLength={
                        200
                      }
                    />
                  </label>

                  <label className="form-field">
                    <span>
                      CNPJ *
                    </span>

                    <input
                      value={
                        form.cnpj
                      }
                      onChange={(event) =>
                        setForm(
                          (
                            current
                          ) => ({
                            ...current,
                            cnpj:
                              formatCnpj(
                                event
                                  .target
                                  .value
                              )
                          })
                        )
                      }
                      placeholder="00.000.000/0000-00"
                      inputMode="numeric"
                      required
                    />
                  </label>

                  <label className="form-field">
                    <span>
                      E-mail
                    </span>

                    <input
                      type="email"
                      value={
                        form.email
                      }
                      onChange={(event) =>
                        setForm(
                          (
                            current
                          ) => ({
                            ...current,
                            email:
                              event
                                .target
                                .value
                          })
                        )
                      }
                      maxLength={
                        255
                      }
                    />
                  </label>

                  <label className="form-field">
                    <span>
                      Telefone
                    </span>

                    <input
                      value={
                        form.telefone
                      }
                      onChange={(event) =>
                        setForm(
                          (
                            current
                          ) => ({
                            ...current,
                            telefone:
                              formatPhone(
                                event
                                  .target
                                  .value
                              )
                          })
                        )
                      }
                      placeholder="(21) 99999-9999"
                      inputMode="tel"
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
                    : editingClient
                      ? "Salvar alterações"
                      : "Cadastrar cliente"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}