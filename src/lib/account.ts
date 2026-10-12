export type Account = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  middleName: string | null;
  displayName: string;
  status: string;
  emailVerified: boolean;
  roles: string[];
  affiliation: {
    requestedRole: string;
    status: string;
    reviewNote: string | null;
    groupId: string | null;
  } | null;
  group: { id: string; code: string } | null;
  teacher: {
    publicTeacherId: string | null;
    scheduleName: string | null;
  } | null;
};
export type SessionInfo = {
  id: string;
  deviceLabel: string;
  createdAt: string;
  lastSeenAt: string;
  expiresAt: string;
  remembered: boolean;
  current: boolean;
};
export class PortalError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}
export async function portalRequest<T>(
  action: string,
  data?: unknown,
  signal?: AbortSignal,
): Promise<T> {
  if (typeof window !== "undefined" && window.location.protocol === "file:")
    throw new PortalError(
      "Для настоящего аккаунта откройте серверную версию портала.",
      503,
    );
  const [route, query] = action.split("?");
  const response = await fetch(
    `/api/portal/${route}/${query ? `?${query}` : ""}`,
    {
      method: data === undefined ? "GET" : "POST",
      credentials: "same-origin",
      cache: "no-store",
      headers:
        data === undefined
          ? {}
          : { "Content-Type": "application/json", "X-Portal-Request": "1" },
      body: data === undefined ? undefined : JSON.stringify(data),
      signal,
    },
  );
  const body = await response
    .json()
    .catch(() => ({
      error: "Сервер аккаунтов недоступен в этой версии сайта.",
    }));
  if (!response.ok)
    throw new PortalError(
      body.error || "Не удалось выполнить запрос",
      response.status,
    );
  return body as T;
}
