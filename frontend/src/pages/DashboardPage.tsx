import {
  LogOut,
  ShieldCheck
} from "lucide-react";

import {
  useNavigate
} from "react-router-dom";

import {
  useAuth
} from "../auth/AuthContext";

export function DashboardPage() {
  const {
    user,
    logout
  } = useAuth();

  const navigate =
    useNavigate();

  async function handleLogout() {
    await logout();

    navigate(
      "/login",
      {
        replace: true
      }
    );
  }

  return (
    <main className="dashboard-placeholder">
      <header className="placeholder-header">
        <div className="placeholder-brand">
          <ShieldCheck
            size={26}
          />

          <strong>
            PetroSys
          </strong>
        </div>

        <button
          type="button"
          className="logout-button"
          onClick={
            handleLogout
          }
        >
          <LogOut
            size={17}
          />

          Sair
        </button>
      </header>

      <section className="welcome-card">
        <span>
          Sessão autenticada
        </span>

        <h1>
          Olá, {user?.nome}.
        </h1>

        <p>
          A integração entre
          React e a API PetroSys
          está funcionando.
        </p>

        <div className="user-summary">
          <div>
            <small>
              Usuário
            </small>

            <strong>
              {user?.email}
            </strong>
          </div>

          <div>
            <small>
              Perfil
            </small>

            <strong>
              {user?.perfil.nome}
            </strong>
          </div>
        </div>
      </section>
    </main>
  );
}