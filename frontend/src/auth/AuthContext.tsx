import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";

import type {
  ReactNode
} from "react";

import {
  apiRequest
} from "../api/http";

export interface AuthUser {
  id: number;
  nome: string;
  email: string;
  ativo: boolean;

  perfil: {
    id: number;
    nome:
      | "GESTOR"
      | "ANALISTA"
      | "TECNICO";
  };
}

interface LoginInput {
  email: string;
  senha: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;

  login: (
    input: LoginInput
  ) => Promise<void>;

  logout: () => Promise<void>;

  refreshUser: () => Promise<void>;
}

interface AuthResponse {
  usuario: AuthUser;
}

const AuthContext =
  createContext<
    AuthContextValue | undefined
  >(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({
  children
}: AuthProviderProps) {
  const [user, setUser] =
    useState<AuthUser | null>(
      null
    );

  const [loading, setLoading] =
    useState(true);

  const refreshUser =
    useCallback(
      async (): Promise<void> => {
        try {
          const response =
            await apiRequest<AuthResponse>(
              "/auth/me"
            );

          setUser(
            response.usuario
          );
        } catch {
          setUser(null);
        }
      },
      []
    );

  useEffect(() => {
    async function restoreSession() {
      setLoading(true);

      await refreshUser();

      setLoading(false);
    }

    void restoreSession();
  }, [refreshUser]);

  async function login(
    input: LoginInput
  ): Promise<void> {
    const response =
      await apiRequest<AuthResponse>(
        "/auth/login",
        {
          method: "POST",
          body: JSON.stringify(
            input
          )
        }
      );

    setUser(
      response.usuario
    );
  }

  async function logout(): Promise<void> {
    try {
      await apiRequest(
        "/auth/logout",
        {
          method: "POST"
        }
      );
    } finally {
      setUser(null);
    }
  }

  const value =
    useMemo<AuthContextValue>(
      () => ({
        user,
        loading,
        login,
        logout,
        refreshUser
      }),
      [
        user,
        loading,
        refreshUser
      ]
    );

  return (
    <AuthContext.Provider
      value={value}
    >
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const context =
    useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth deve ser utilizado dentro de AuthProvider."
    );
  }

  return context;
}