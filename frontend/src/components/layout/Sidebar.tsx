import {
  ClipboardList,
  FileText,
  LayoutDashboard,
  ShieldCheck,
  UserCog,
  Users,
  Wrench,
  X
} from "lucide-react";

import {
  NavLink
} from "react-router-dom";

import {
  useAuth
} from "../../auth/AuthContext";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({
  open,
  onClose
}: SidebarProps) {
  const {
    user
  } = useAuth();

  const perfil =
    user?.perfil.nome;

  const showManagement =
    perfil === "GESTOR" ||
    perfil === "ANALISTA";

  return (
    <>
      {open && (
        <button
          type="button"
          className="sidebar-overlay"
          aria-label="Fechar menu"
          onClick={onClose}
        />
      )}

      <aside
        className={`app-sidebar ${
          open
            ? "app-sidebar-open"
            : ""
        }`}
      >
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon">
            <ShieldCheck
              size={23}
            />
          </div>

          <div>
            <strong>
              PetroSys
            </strong>

            <span>
              Gestão integrada
            </span>
          </div>

          <button
            type="button"
            className="sidebar-close"
            onClick={onClose}
            aria-label="Fechar menu"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="sidebar-nav">
          <span className="sidebar-section-label">
            Navegação
          </span>

          {showManagement && (
            <NavLink
              to="/dashboard"
              onClick={onClose}
              className={({
                isActive
              }) =>
                isActive
                  ? "sidebar-link active"
                  : "sidebar-link"
              }
            >
              <LayoutDashboard
                size={19}
              />

              <span>
                Dashboard
              </span>
            </NavLink>
          )}

          {showManagement && (
            <NavLink
              to="/clients"
              onClick={onClose}
              className={({
                isActive
              }) =>
                isActive
                  ? "sidebar-link active"
                  : "sidebar-link"
              }
            >
              <Users size={19} />

              <span>
                Clientes
              </span>
            </NavLink>
          )}

          {showManagement && (
            <NavLink
              to="/contracts"
              onClick={onClose}
              className={({
                isActive
              }) =>
                isActive
                  ? "sidebar-link active"
                  : "sidebar-link"
              }
            >
              <FileText size={19} />

              <span>
                Contratos
              </span>
            </NavLink>
          )}

          {showManagement && (
            <NavLink
              to="/services"
              onClick={onClose}
              className={({
                isActive
              }) =>
                isActive
                  ? "sidebar-link active"
                  : "sidebar-link"
              }
            >
              <Wrench size={19} />

              <span>
                Serviços
              </span>
            </NavLink>
          )}

          <NavLink
            to="/work-orders"
            onClick={onClose}
            className={({
              isActive
            }) =>
              isActive
                ? "sidebar-link active"
                : "sidebar-link"
            }
          >
            <ClipboardList
              size={19}
            />

            <span>
              Ordens de Serviço
            </span>
          </NavLink>

          {perfil === "GESTOR" && (
            <NavLink
              to="/users"
              onClick={onClose}
              className={({
                isActive
              }) =>
                isActive
                  ? "sidebar-link active"
                  : "sidebar-link"
              }
            >
              <UserCog size={19} />

              <span>
                Usuários
              </span>
            </NavLink>
          )}
        </nav>

        <div className="sidebar-footer">
          <span>
            PetroSys
          </span>

          <small>
            Plataforma corporativa
          </small>
        </div>
      </aside>
    </>
  );
}