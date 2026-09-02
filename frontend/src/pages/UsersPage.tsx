import {
  useEffect,
  useMemo,
  useState
} from "react";

import type {
  FormEvent
} from "react";

import {
  KeyRound,
  Pencil,
  Plus,
  Power,
  Search,
  UserCog,
  X
} from "lucide-react";

import {
  ApiError,
  apiRequest
} from "../api/http";

import {
  useAuth
} from "../auth/AuthContext";

interface Perfil {
  id: number;
  nome:
    | "GESTOR"
    | "ANALISTA"
    | "TECNICO";
  descricao:
    | string
    | null;
}

interface Usuario {
  id: number;
  nome: string;
  email: string;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;

  perfil: Perfil;
}

interface UsersResponse {
  usuarios: Usuario[];
}

interface UserResponse {
  usuario: Usuario;
}

interface ProfilesResponse {
  perfis: Perfil[];
}

interface UserForm {
  nome: string;
  email: string;
  senha: string;

  perfil:
    | ""
    | "GESTOR"
    | "ANALISTA"
    | "TECNICO";
}

const emptyForm: UserForm = {
  nome: "",
  email: "",
  senha: "",
  perfil: ""
};

function profileLabel(
  profile: Perfil["nome"]
): string {
  const labels: Record<
    Perfil["nome"],
    string
  > = {
    GESTOR: "Gestor",
    ANALISTA: "Analista",
    TECNICO: "Técnico"
  };

  return labels[profile];
}

export function UsersPage() {
  const {
    user: currentUser
  } = useAuth();

  const [
    usuarios,
    setUsuarios
  ] = useState<Usuario[]>([]);

  const [
    perfis,
    setPerfis
  ] = useState<Perfil[]>([]);

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
    editingUser,
    setEditingUser
  ] =
    useState<Usuario | null>(
      null
    );

  const [
    form,
    setForm
  ] =
    useState<UserForm>(
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
        usersResponse,
        profilesResponse
      ] = await Promise.all([
        apiRequest<UsersResponse>(
          "/users"
        ),

        apiRequest<ProfilesResponse>(
          "/users/profiles"
        )
      ]);

      setUsuarios(
        usersResponse.usuarios
      );

      setPerfis(
        profilesResponse.perfis
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
          "Não foi possível carregar os usuários."
        );
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  const filteredUsers =
    useMemo(() => {
      const term =
        search
          .trim()
          .toLowerCase();

      if (!term) {
        return usuarios;
      }

      return usuarios.filter(
        (usuario) =>
          usuario.nome
            .toLowerCase()
            .includes(term) ||
          usuario.email
            .toLowerCase()
            .includes(term) ||
          usuario.perfil.nome
            .toLowerCase()
            .includes(term)
      );
    }, [
      usuarios,
      search
    ]);

  function openCreateModal() {
    setEditingUser(null);
    setForm(emptyForm);
    setFormError("");
    setModalOpen(true);
  }

  function openEditModal(
    usuario: Usuario
  ) {
    setEditingUser(
      usuario
    );

    setForm({
      nome:
        usuario.nome,

      email:
        usuario.email,

      senha: "",

      perfil:
  usuario.perfil.nome
    });

    setFormError("");
    setModalOpen(true);
  }

  function closeModal() {
    if (submitting) {
      return;
    }

    setModalOpen(false);
    setEditingUser(null);
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
      if (editingUser) {
        const payload: {
  nome: string;
  email: string;
  perfil:
    | "GESTOR"
    | "ANALISTA"
    | "TECNICO";
  senha?: string;
} = {
  nome:
    form.nome.trim(),

  email:
    form.email
      .trim()
      .toLowerCase(),

  perfil:
    form.perfil as
      | "GESTOR"
      | "ANALISTA"
      | "TECNICO"
};

        if (
          form.senha.trim()
        ) {
          payload.senha =
            form.senha;
        }

        const response =
          await apiRequest<UserResponse>(
            `/users/${editingUser.id}`,
            {
              method:
                "PATCH",

              body:
                JSON.stringify(
                  payload
                )
            }
          );

        setUsuarios(
          (current) =>
            current.map(
              (usuario) =>
                usuario.id ===
                editingUser.id
                  ? response.usuario
                  : usuario
            )
        );
      } else {
        const response =
          await apiRequest<UserResponse>(
            "/users",
            {
              method:
                "POST",

              body:
  JSON.stringify({
    nome:
      form.nome.trim(),

    email:
      form.email
        .trim()
        .toLowerCase(),

    senha:
      form.senha,

    perfil:
      form.perfil
  })
            }
          );

        setUsuarios(
          (current) => [
            response.usuario,
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
          "Não foi possível salvar o usuário."
        );
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleStatus(
    usuario: Usuario
  ) {
    const nextStatus =
      !usuario.ativo;

    const confirmation =
      window.confirm(
        nextStatus
          ? `Deseja reativar "${usuario.nome}"?`
          : `Deseja desativar "${usuario.nome}"?`
      );

    if (!confirmation) {
      return;
    }

    try {
      setChangingStatusId(
        usuario.id
      );

      const response =
        await apiRequest<UserResponse>(
          `/users/${usuario.id}/status`,
          {
            method:
              "PATCH",

            body:
              JSON.stringify({
                ativo:
                  nextStatus
              })
          }
        );

      setUsuarios(
        (current) =>
          current.map(
            (item) =>
              item.id ===
              usuario.id
                ? response.usuario
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
          "Não foi possível alterar o status do usuário."
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
            Administração
          </span>

          <h1>
            Usuários
          </h1>

          <p>
            Gerencie contas,
            perfis de acesso e
            disponibilidade dos
            usuários do PetroSys.
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

          Novo usuário
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
            placeholder="Buscar por nome, e-mail ou perfil..."
          />
        </div>

        <div className="list-summary">
          <strong>
            {
              filteredUsers.length
            }
          </strong>

          <span>
            {filteredUsers.length ===
            1
              ? "usuário"
              : "usuários"}
          </span>
        </div>
      </div>

      {loading ? (
        <div className="module-loading">
          <div className="spinner" />

          <span>
            Carregando usuários...
          </span>
        </div>
      ) : pageError ? (
        <div className="dashboard-error">
          <div>
            <strong>
              Não foi possível
              carregar os usuários
            </strong>

            <p>
              {pageError}
            </p>
          </div>
        </div>
      ) : (
        <article className="module-panel">
          {filteredUsers.length ===
          0 ? (
            <div className="empty-state module-empty">
              <UserCog size={31} />

              <strong>
                Nenhum usuário
                encontrado
              </strong>

              <span>
                Tente utilizar
                outro termo de busca.
              </span>
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="data-table users-table">
                <thead>
                  <tr>
                    <th>
                      Usuário
                    </th>

                    <th>
                      E-mail
                    </th>

                    <th>
                      Perfil
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
                  {filteredUsers.map(
                    (usuario) => (
                      <tr
                        key={
                          usuario.id
                        }
                      >
                        <td>
                          <div className="user-list-cell">
                            <div className="user-list-avatar">
                              {usuario.nome
                                .charAt(0)
                                .toUpperCase()}
                            </div>

                            <div>
                              <strong className="table-primary">
                                {
                                  usuario.nome
                                }
                              </strong>

                              {currentUser?.id ===
                                usuario.id && (
                                <span className="current-user-label">
                                  Sua conta
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        <td>
                          {
                            usuario.email
                          }
                        </td>

                        <td>
                          <span
                            className={`profile-badge profile-${usuario.perfil.nome.toLowerCase()}`}
                          >
                            {profileLabel(
                              usuario
                                .perfil
                                .nome
                            )}
                          </span>
                        </td>

                        <td>
                          <span
                            className={
                              usuario.ativo
                                ? "status-badge status-active"
                                : "status-badge status-inactive"
                            }
                          >
                            {usuario.ativo
                              ? "Ativo"
                              : "Inativo"}
                          </span>
                        </td>

                        <td>
                          <div className="row-actions">
                            <button
                              type="button"
                              className="icon-action"
                              title="Editar usuário"
                              onClick={() =>
                                openEditModal(
                                  usuario
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
                                usuario.ativo
                                  ? "icon-action danger-action"
                                  : "icon-action success-action"
                              }
                              title={
                                usuario.ativo
                                  ? "Desativar usuário"
                                  : "Reativar usuário"
                              }
                              disabled={
                                changingStatusId ===
                                  usuario.id ||
                                (
                                  currentUser?.id ===
                                    usuario.id &&
                                  usuario.ativo
                                )
                              }
                              onClick={() =>
                                void toggleStatus(
                                  usuario
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
            aria-labelledby="user-modal-title"
          >
            <div className="modal-header">
              <div>
                <span>
                  {editingUser
                    ? "Atualização de acesso"
                    : "Nova conta"}
                </span>

                <h2
                  id="user-modal-title"
                >
                  {editingUser
                    ? "Editar usuário"
                    : "Cadastrar usuário"}
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
                      required
                    />
                  </label>

                  <label className="form-field">
                    <span>
                      E-mail *
                    </span>

                    <input
                      type="email"
                      value={
                        form.email
                      }
                      onChange={(event) =>
                        setForm(
                          (current) => ({
                            ...current,
                            email:
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
                      Perfil *
                    </span>

                   <select
  value={
    form.perfil
  }
  onChange={(event) =>
    setForm(
      (current) => ({
        ...current,

        perfil:
          event.target.value as
            | ""
            | "GESTOR"
            | "ANALISTA"
            | "TECNICO"
      })
    )
  }
  required
>
                      <option value="">
                        Selecione...
                      </option>

                      {perfis.map(
  (perfil) => (
    <option
      key={
        perfil.id
      }
      value={
        perfil.nome
      }
    >
      {profileLabel(
        perfil.nome
      )}
    </option>
  )
)}
                    </select>
                  </label>

                  <label className="form-field form-field-full">
                    <span>
                      {editingUser
                        ? "Nova senha"
                        : "Senha *"}
                    </span>

                    <div className="user-password-field">
                      <KeyRound
                        size={17}
                      />

                      <input
                        type="text"
                        className="password-input"
                        value={
                          form.senha
                        }
                        onChange={(event) =>
                          setForm(
                            (current) => ({
                              ...current,
                              senha:
                                event
                                  .target
                                  .value
                            })
                          )
                        }
                        autoComplete="new-password"
                        spellCheck={false}
                        autoCapitalize="none"
                        placeholder={
                          editingUser
                            ? "Deixe em branco para manter a senha atual"
                            : "Informe a senha inicial"
                        }
                        required={
                          !editingUser
                        }
                      />
                    </div>

                    {editingUser && (
                      <small className="field-helper">
                        A senha atual será
                        mantida caso este
                        campo permaneça vazio.
                      </small>
                    )}
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
                    : editingUser
                      ? "Salvar alterações"
                      : "Cadastrar usuário"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}