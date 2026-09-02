import {
  Navigate
} from "react-router-dom";

import {
  useAuth
} from "./AuthContext";

import {
  getHomeRouteForRole
} from "./roleRouting";

export function HomeRedirect() {
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
            Carregando...
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

  return (
    <Navigate
      to={
        getHomeRouteForRole(
          user.perfil.nome
        )
      }
      replace
    />
  );
}