import {
  Navigate,
  Outlet
} from "react-router-dom";

import {
  useAuth
} from "./AuthContext";

type Role =
  | "GESTOR"
  | "ANALISTA"
  | "TECNICO";

interface RoleRouteProps {
  allowedRoles: Role[];
}

export function RoleRoute({
  allowedRoles
}: RoleRouteProps) {
  const {
    user,
    loading
  } = useAuth();

  if (loading) {
    return (
      <div className="screen-center">
        <div className="loading-card">
          <div className="spinner" />

          <p>
            Verificando acesso...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  if (
    !allowedRoles.includes(
      user.perfil.nome
    )
  ) {
    return (
      <Navigate
        to={
          user.perfil.nome ===
          "TECNICO"
            ? "/work-orders"
            : "/dashboard"
        }
        replace
      />
    );
  }

  return <Outlet />;
}