import GuardPanel from "./_components/GuardPanel";
import { getSession } from "@/lib/auth";
import { getVisitors } from "@/lib/visitors";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Panel ochrony | BHP",
};

export default async function OchronaPage() {
  const user = await getSession();
  const visitors = user && ["admin", "guard"].includes(user.role) ? await getVisitors() : null;
  return <GuardPanel initialVisitors={visitors ? JSON.parse(JSON.stringify(visitors)) : null} />;
}
