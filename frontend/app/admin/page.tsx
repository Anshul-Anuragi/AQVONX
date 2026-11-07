import { notFound } from "next/navigation";
import { auth } from "@/auth";
import MasterAdminView from "./MasterAdminView";

export default async function AdminPage() {
  const session = await auth();

  // Strictly verify session and admin role
  const isAdmin = session?.user?.role === "admin";

  if (!isAdmin) {
    notFound();
  }

  return <MasterAdminView />;
}
