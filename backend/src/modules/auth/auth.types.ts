export interface AuthTokenPayload {
  userId: number;
  email: string;
  perfil: string;
}

export interface AuthenticatedRequestData {
  userId: number;
  email: string;
  perfil: string;
}