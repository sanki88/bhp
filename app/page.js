import HomeContent from "./home-content";
import { normalizeLanguage } from "@/lib/languages";

export default async function Home({ searchParams }) {
  const params = await searchParams;
  const activeLanguage = normalizeLanguage(params?.language);

  return <HomeContent activeLanguage={activeLanguage} />;
}
