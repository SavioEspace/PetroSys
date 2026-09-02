import {
  LogOut,
  Menu,
  UserCircle
} from "lucide-react";

import {
  useNavigate
} from "react-router-dom";

import {
  useAuth
} from "../../auth/AuthContext";

import {
  getRoleLabel
} from "../../auth/roleRouting";

interface HeaderProps {
  onOpenSidebar: () => void;
}

export function Header({
  onOpenSidebar
}: HeaderProps) {
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
    <header className="app-header">
      <button
        type="button"
        className="header-menu-button"
        onClick={
          onOpenSidebar
        }
        aria-label="Abrir menu"
      >
        <Menu size={22} />
      </button>

      <div className="header-spacer" />

      <div className="header-user">
        <div className="header-user-icon">
          <UserCircle
            size={25}
          />
        </div>

        <div className="header-user-data">
          <strong>
            {user?.nome}
          </strong>

          <span>
            {user
              ? getRoleLabel(
                  user.perfil.nome
                )
              : ""}
          </span>
        </div>
      </div>

      <button
        type="button"
        className="header-logout"
        onClick={
          handleLogout
        }
        title="Sair"
        aria-label="Sair do PetroSys"
      >
        <LogOut size={18} />

        <span>
          Sair
        </span>
      </button>
    </header>
  );
}