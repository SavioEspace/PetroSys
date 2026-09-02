import {
  Route,
  Routes
} from "react-router-dom";

import {
  HomeRedirect
} from "../auth/HomeRedirect";

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
  ClientsPage
} from "../pages/ClientsPage";

import {
  ContractsPage
} from "../pages/ContractsPage";

import {
  ServicesPage
} from "../pages/ServicesPage";

import {
  WorkOrdersPage
} from "../pages/WorkOrdersPage";

import {
  UsersPage
} from "../pages/UsersPage";

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
                <ServicesPage />
              }
            />
          </Route>

          <Route
            path="/work-orders"
            element={
              <WorkOrdersPage />
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
                <UsersPage />
              }
            />
          </Route>
        </Route>
      </Route>

      <Route
        path="/"
        element={
          <HomeRedirect />
        }
      />

      <Route
        path="*"
        element={
          <HomeRedirect />
        }
      />
    </Routes>
  );
}