import VisitorTraining from "../visitor-training";
import { normalizeLanguage } from "@/lib/languages";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Szkolenie BHP",
};

export default async function TrainingPage({ searchParams }) {
  const params = await searchParams;
  const audience = params?.typ === "subcontractor" ? "subcontractor" : "guest";
  const language = normalizeLanguage(params?.language);

  return <VisitorTraining audience={audience} language={language} />;
}
