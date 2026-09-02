export type Role =
  | "GESTOR"
  | "ANALISTA"
  | "TECNICO";

export function getHomeRouteForRole(
  role: Role
): string {
  if (role === "TECNICO") {
    return "/work-orders";
  }

  return "/dashboard";
}

export function getRoleLabel(
  role: Role
): string {
  switch (role) {
    case "GESTOR":
      return "Gestor";

    case "ANALISTA":
      return "Analista";

    case "TECNICO":
      return "Técnico";
  }
}