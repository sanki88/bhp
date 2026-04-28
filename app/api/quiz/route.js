import { addVisitor } from "@/lib/visitors";
import { questions } from "@/lib/questions";

export const dynamic = "force-dynamic";

export async function GET() {
  const selectedQuestions = shuffle(questions).slice(0, 5).map((question) => ({
    id: question.id,
    text: question.text,
    options: shuffle(question.options).map(({ id, text }) => ({ id, text })),
  }));

  return Response.json({ questions: selectedQuestions });
}

export async function POST(request) {
  const payload = await request.json();
  const visitor = sanitizeVisitor(payload.visitor);
  const answers = payload.answers || {};

  if (!visitor) {
    return Response.json({ error: "Niepelne dane goscia." }, { status: 400 });
  }

  const answeredQuestionIds = Object.keys(answers);
  const selectedQuestions = questions.filter((question) =>
    answeredQuestionIds.includes(question.id),
  );
  const score = selectedQuestions.reduce((total, question) => {
    return total + (answers[question.id] === question.correctOptionId ? 1 : 0);
  }, 0);
  const passed = selectedQuestions.length === 5 && score === 5;

  if (!passed) {
    return Response.json({ passed, score, requiredScore: 5 });
  }

  const storedVisitor = await addVisitor({
    ...visitor,
    quizScore: score,
  });

  return Response.json({
    passed,
    score,
    requiredScore: 5,
    visitor: storedVisitor,
  });
}

function sanitizeVisitor(visitor) {
  if (!visitor) {
    return null;
  }

  const sanitized = {
    firstName: clean(visitor.firstName),
    lastName: clean(visitor.lastName),
    phone: clean(visitor.phone),
    company: clean(visitor.company),
    visitPurpose: clean(visitor.visitPurpose),
  };

  if (Object.values(sanitized).some((value) => !value)) {
    return null;
  }

  return sanitized;
}

function clean(value) {
  return String(value || "").trim().slice(0, 160);
}

function shuffle(items) {
  return [...items].sort(() => Math.random() - 0.5);
}
