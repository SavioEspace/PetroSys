const API_URL =
  import.meta.env.VITE_API_URL;

interface ApiRequestOptions
  extends RequestInit {
  body?: BodyInit | null;
}

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(
    message: string,
    status: number,
    data: unknown
  ) {
    super(message);

    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  const response = await fetch(
    `${API_URL}${path}`,
    {
      ...options,

      credentials: "include",

      headers: {
        "Content-Type":
          "application/json",

        ...options.headers
      }
    }
  );

  const contentType =
    response.headers.get(
      "content-type"
    );

  const data =
    contentType?.includes(
      "application/json"
    )
      ? await response.json()
      : null;

  if (!response.ok) {
    const message =
      data &&
      typeof data === "object" &&
      "message" in data &&
      typeof data.message ===
        "string"
        ? data.message
        : "Erro ao processar a solicitação.";

    throw new ApiError(
      message,
      response.status,
      data
    );
  }

  return data as T;
}