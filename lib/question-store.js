import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { questions as defaultQuestions } from "./questions";

const dataDirectory = path.join(process.cwd(), "data");
const questionsFile = path.join(dataDirectory, "questions.json");

export async function getQuestions() {
  await ensureQuestionStore();
  const file = await fs.readFile(questionsFile, "utf8");
  return JSON.parse(file);
}

export async function createQuestion(question) {
  const questions = await getQuestions();
  const storedQuestion = normalizeQuestion({
    ...question,
    id: randomUUID(),
  });

  questions.push(storedQuestion);
  await saveQuestions(questions);

  return storedQuestion;
}

export async function updateQuestion(id, question) {
  const questions = await getQuestions();
  const questionIndex = questions.findIndex((item) => item.id === id);

  if (questionIndex === -1) {
    return null;
  }

  const updatedQuestion = normalizeQuestion({
    ...question,
    id,
  });

  questions[questionIndex] = updatedQuestion;
  await saveQuestions(questions);

  return updatedQuestion;
}

export async function deleteQuestion(id) {
  const questions = await getQuestions();
  const filteredQuestions = questions.filter((question) => question.id !== id);

  if (filteredQuestions.length === questions.length) {
    return false;
  }

  await saveQuestions(filteredQuestions);
  return true;
}

async function ensureQuestionStore() {
  await fs.mkdir(dataDirectory, { recursive: true });

  try {
    await fs.access(questionsFile);
  } catch {
    await saveQuestions(defaultQuestions);
  }
}

async function saveQuestions(questions) {
  await fs.mkdir(dataDirectory, { recursive: true });
  await fs.writeFile(questionsFile, JSON.stringify(questions, null, 2), "utf8");
}

function normalizeQuestion(question) {
  const options = (question.options || []).slice(0, 4).map((option, index) => ({
    id: ["a", "b", "c", "d"][index],
    text: clean(option.text),
  }));

  while (options.length < 4) {
    options.push({
      id: ["a", "b", "c", "d"][options.length],
      text: "",
    });
  }

  const correctOptionId = ["a", "b", "c", "d"].includes(question.correctOptionId)
    ? question.correctOptionId
    : "a";

  return {
    id: String(question.id || randomUUID()),
    text: clean(question.text),
    correctOptionId,
    options,
  };
}

function clean(value) {
  return String(value || "").trim().slice(0, 500);
}
