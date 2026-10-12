export class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

export function assertSameOrigin(request) {
  const expected = process.env.APP_ORIGIN || (process.env.NODE_ENV !== "production" ? new URL(request.url).origin : null);
  if (!expected) throw new Error("APP_ORIGIN is required in production");
  if (request.headers.get("origin") !== new URL(expected).origin) {
    throw new HttpError(403, "Niedozwolone źródło żądania.");
  }
}

export async function readJson(request) {
  if (!request.headers.get("content-type")?.includes("application/json")) throw new HttpError(415, "Wymagany format JSON.");
  const reader = request.body?.getReader();
  if (!reader) throw new HttpError(400, "Brak danych.");
  const chunks = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > 32768) { await reader.cancel(); throw new HttpError(413, "Zbyt duże żądanie."); }
    chunks.push(Buffer.from(value));
  }
  try {
    const data = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    if (!data || typeof data !== "object" || Array.isArray(data)) throw new Error();
    return data;
  } catch { throw new HttpError(400, "Nieprawidłowe dane JSON."); }
}

export function endpoint(handler) {
  return async (...args) => {
    try {
      const response = await handler(...args);
      response.headers.set("Cache-Control", "no-store");
      return response;
    } catch (error) {
      if (!(error instanceof HttpError)) console.error("Request failed:", error.code || error.name);
      return Response.json({ error: error instanceof HttpError ? error.message : "Błąd serwera. Spróbuj ponownie później." }, { status: error.status || 500, headers: { "Cache-Control": "no-store" } });
    }
  };
}
