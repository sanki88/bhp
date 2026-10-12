import AdminPanel from "./_components/AdminPanel";
import { getSession } from "@/lib/auth";
import { getQuestions } from "@/lib/question-store";
import { getVideoStore } from "@/lib/videos";
import { getVisitors } from "@/lib/visitors";
import { getManagedUsers } from "@/lib/users";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Admin BHP",
};

export default async function AdminPage() {
  const user = await getSession();
  if (user?.role !== "admin") return <AdminPanel />;
  const [questions, videoStore, visitors, users] = await Promise.all([getQuestions("pl"), getVideoStore(), getVisitors(), getManagedUsers()]);
  return <AdminPanel initialData={JSON.parse(JSON.stringify({ questions, videoStore, visitors, users, currentUserId: user.id }))} />;
}
