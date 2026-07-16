import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { redirect } from "next/navigation";
import StatsClient from "./StatsClient";

export default async function StatsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  return <StatsClient />;
}
