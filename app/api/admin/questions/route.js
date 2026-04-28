import {
  createQuestion,
  deleteQuestion,
  getQuestions,
  updateQuestion,
} from "@/lib/question-store";

export const dynamic = "force-dynamic";

export async function GET() {
  const questions = await getQuestions();
  return Response.json({ questions });
}

export async function POST(request) {
  const payload = await request.json();
  const validationError = validateQuestion(payload);

  if (validationError) {
    return Response.json({ error: validationError }, { status: 400 });
  }

  const question = await createQuestion(payload);
  return Response.json({ question }, { status: 201 });
}

export async function PUT(request) {
  const payload = await request.json();

  if (!payload.id) {
    return Response.json({ error: "Brakuje ID pytania." }, { status: 400 });
  }

  const validationError = validateQuestion(payload);

  if (validationError) {
    return Response.json({ error: validationError }, { status: 400 });
  }

  const question = await updateQuestion(payload.id, payload);

  if (!question) {
    return Response.json({ error: "Nie znaleziono pytania." }, { status: 404 });
  }

  return Response.json({ question });
}

export async function DELETE(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return Response.json({ error: "Brakuje ID pytania." }, { status: 400 });
  }

  const deleted = await deleteQuestion(id);

  if (!deleted) {
    return Response.json({ error: "Nie znaleziono pytania." }, { status: 404 });
  }

  return Response.json({ ok: true });
}

function validateQuestion(question) {
  if (!String(question.text || "").trim()) {
    return "Wpisz tresc pytania.";
  }

  if (!["a", "b", "c", "d"].includes(question.correctOptionId)) {
    return "Wybierz poprawna odpowiedz.";
  }

  if (!Array.isArray(question.options) || question.options.length !== 4) {
    return "Pytanie musi miec 4 odpowiedzi.";
  }

  if (question.options.some((option) => !String(option.text || "").trim())) {
    return "Uzupelnij wszystkie odpowiedzi.";
  }

  return null;
}
