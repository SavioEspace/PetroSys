import {
  useState
} from "react";

import type {
  FormEvent
} from "react";

import {
  Navigate,
  useLocation,
  useNavigate
} from "react-router-dom";

import {
  LockKeyhole,
  Mail,
  ShieldCheck
} from "lucide-react";

import {
  ApiError
} from "../api/http";

import {
  useAuth
} from "../auth/AuthContext";

interface LocationState {
  from?: string;
}

export function LoginPage() {
  const {
    user,
    loading,
    login
  } = useAuth();

  const navigate =
    useNavigate();

  const location =
    useLocation();

  const [email, setEmail] =
    useState("");

  const [senha, setSenha] =
    useState("");

  const [
    submitting,
    setSubmitting
  ] = useState(false);

  const [
    errorMessage,
    setErrorMessage
  ] = useState("");

  if (loading) {
    return (
      <div className="screen-center">
        <div className="loading-card">
          <div className="spinner" />

          <p>
            Verificando sessão...
          </p>
        </div>
      </div>
    );
  }

  if (user) {
    return (
      <Navigate
        to="/dashboard"
        replace
      />
    );
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setErrorMessage("");
    setSubmitting(true);

    try {
      await login({
        email,
        senha
      });

      const state =
        location.state as
          | LocationState
          | null;

      navigate(
        state?.from ??
          "/dashboard",
        {
          replace: true
        }
      );
    } catch (error) {
      if (
        error instanceof ApiError
      ) {
        setErrorMessage(
          error.message
        );
      } else {
        setErrorMessage(
          "Não foi possível conectar ao PetroSys."
        );
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-brand">
        <div className="brand-content">
          <div className="brand-icon">
            <ShieldCheck
              size={32}
            />
          </div>

          <span className="brand-kicker">
            Gestão integrada
          </span>

          <h1>
            Petro
            <strong>
              Sys
            </strong>
          </h1>

          <p>
            Plataforma integrada
            para gestão de
            contratos, serviços
            tecnológicos e ordens
            de serviço.
          </p>

          <div className="brand-features">
            <div>
              <span>01</span>
              Centralização
            </div>

            <div>
              <span>02</span>
              Rastreabilidade
            </div>

            <div>
              <span>03</span>
              Monitoramento
            </div>
          </div>
        </div>
      </section>

      <section className="login-panel">
        <div className="login-card">
          <div className="login-heading">
            <span>
              Acesso ao sistema
            </span>

            <h2>
              Bem-vindo
            </h2>

            <p>
              Informe suas
              credenciais para
              acessar o PetroSys.
            </p>
          </div>

          <form
            onSubmit={
              handleSubmit
            }
            className="login-form"
          >
            <label>
              E-mail

              <div className="input-wrapper">
                <Mail
                  size={18}
                />

                <input
                  type="email"
                  value={email}
                  onChange={(
                    event
                  ) =>
                    setEmail(
                      event.target
                        .value
                    )
                  }
                  placeholder="seu@email.com"
                  autoComplete="email"
                  required
                />
              </div>
            </label>

            <label>
              Senha

              <div className="input-wrapper">
                <LockKeyhole
                  size={18}
                />

              <input
  type="text"
  name="password"
  value={senha}
  onChange={(event) =>
    setSenha(event.target.value)
  }
  placeholder="••••••••"
  autoComplete="current-password"
  className="password-input"
  spellCheck={false}
  autoCapitalize="none"
  required
/>
              </div>
            </label>

            {errorMessage && (
              <div
                className="form-error"
                role="alert"
              >
                {errorMessage}
              </div>
            )}

            <button
              type="submit"
              className="primary-button"
              disabled={
                submitting
              }
            >
              {submitting
                ? "Entrando..."
                : "Entrar no PetroSys"}
            </button>
          </form>

          <p className="login-footer">
            PetroSys • Ambiente
            corporativo
          </p>
        </div>
      </section>
    </main>
  );
}