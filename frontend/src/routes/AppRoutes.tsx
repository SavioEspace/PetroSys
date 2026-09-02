import {
  Navigate,
  Route,
  Routes
} from "react-router-dom";

import {
  ProtectedRoute
} from "../auth/ProtectedRoute";

import {
  RoleRoute
} from "../auth/RoleRoute";

import {
  AppLayout
} from "../components/layout/AppLayout";

import {
  DashboardPage
} from "../pages/DashboardPage";

import {
  LoginPage
} from "../pages/LoginPage";

import {
  PlaceholderPage
} from "../pages/PlaceholderPage";

import {
  ClientsPage
} from "../pages/ClientsPage";

import {
  ContractsPage
} from "../pages/ContractsPage";

export function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <LoginPage />
        }
      />

      <Route
        element={
          <ProtectedRoute />
        }
      >
        <Route
          element={
            <AppLayout />
          }
        >
          <Route
            element={
              <RoleRoute
                allowedRoles={[
                  "GESTOR",
                  "ANALISTA"
                ]}
              />
            }
          >
            <Route
              path="/dashboard"
              element={
                <DashboardPage />
              }
            />

           <Route
  path="/clients"
  element={
    <ClientsPage />
  }
/>

           <Route
  path="/contracts"
  element={
    <ContractsPage />
  }
/>

            <Route
              path="/services"
              element={
                <PlaceholderPage
                  title="Serviços Tecnológicos"
                  description="Serviços associados aos contratos corporativos."
                />
              }
            />
          </Route>

          <Route
            path="/work-orders"
            element={
              <PlaceholderPage
                title="Ordens de Serviço"
                description="Gestão e acompanhamento das atividades operacionais."
              />
            }
          />

          <Route
            element={
              <RoleRoute
                allowedRoles={[
                  "GESTOR"
                ]}
              />
            }
          >
            <Route
              path="/users"
              element={
                <PlaceholderPage
                  title="Usuários"
                  description="Administração de usuários, perfis e acessos."
                />
              }
            />
          </Route>
        </Route>
      </Route>

      <Route
        path="/"
        element={
          <Navigate
            to="/dashboard"
            replace
          />
        }
      />

      <Route
        path="*"
        element={
          <Navigate
            to="/dashboard"
            replace
          />
        }
      />
    </Routes>
  );
}