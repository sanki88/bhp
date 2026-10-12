export async function clientFetch(url, options) {
  try { return await fetch(url, options); }
  catch { return Response.json({ error: "Brak połączenia z serwerem. Spróbuj ponownie." }, { status: 503 }); }
}
