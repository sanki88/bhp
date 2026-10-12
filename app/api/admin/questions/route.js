import { protectedEndpoint } from "@/lib/auth";
import { readJson } from "@/lib/http";
import {
  createQuestion,
  deleteQuestion,
  getQuestions,
  updateQuestion,
} from "@/lib/question-store";
import { normalizeLanguage } from "@/lib/languages";

export const dynamic = "force-dynamic";

export const GET = protectedEndpoint(["admin"], async (request) => {
  const { searchParams } = new URL(request.url);
  const language = normalizeLanguage(searchParams.get("language"));
  const questions = await getQuestions(language);

  return Response.json({ questions, language });
});

export const POST = protectedEndpoint(["admin"], async (request) => {
  const payload = await readJson(request);
  const language = normalizeLanguage(payload.language);
  const validationError = validateQuestion(payload);

  if (validationError) {
    return Response.json({ error: validationError }, { status: 400 });
  }

  const question = await createQuestion(payload, language);
  return Response.json({ question }, { status: 201 });
});

export const PUT = protectedEndpoint(["admin"], async (request) => {
  const payload = await readJson(request);
  const language = normalizeLanguage(payload.language);

  if (typeof payload.id !== "string" || payload.id.length > 100) {
    return Response.json({ error: "Brakuje ID pytania." }, { status: 400 });
  }

  const validationError = validateQuestion(payload);

  if (validationError) {
    return Response.json({ error: validationError }, { status: 400 });
  }

  const question = await updateQuestion(payload.id, payload, language);

  if (!question) {
    return Response.json({ error: "Nie znaleziono pytania." }, { status: 404 });
  }

  return Response.json({ question });
});

export const DELETE = protectedEndpoint(["admin"], async (request) => {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const language = normalizeLanguage(searchParams.get("language"));

  if (!id) {
    return Response.json({ error: "Brakuje ID pytania." }, { status: 400 });
  }

  const deleted = await deleteQuestion(id, language);

  if (!deleted) {
    return Response.json({ error: "Nie znaleziono pytania." }, { status: 404 });
  }

  return Response.json({ ok: true });
});

function validateQuestion(question) {
  if (typeof question.text !== "string" || !question.text.trim() || question.text.length > 500) {
    return "Wpisz tresc pytania.";
  }

  if (!["a", "b", "c", "d"].includes(question.correctOptionId)) {
    return "Wybierz poprawna odpowiedz.";
  }

  if (!Array.isArray(question.options) || question.options.length !== 4) {
    return "Pytanie musi miec 4 odpowiedzi.";
  }

  if (question.options.some((option) => !option || typeof option.text !== "string" || !option.text.trim() || option.text.length > 500)) {
    return "Uzupelnij wszystkie odpowiedzi.";
  }

  return null;
}
