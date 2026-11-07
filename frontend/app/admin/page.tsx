import { notFound } from "next/navigation";
import { auth } from "@/auth";
import MasterAdminView from "./MasterAdminView";

export default async function AdminPage() {
  const session = await auth();

  // Strictly verify session and admin role
  // @ts-expect-error custom role attribute in Auth.js session
  const isAdmin = session?.user?.role === "admin";

  if (!isAdmin) {
    notFound();
  }

  return <MasterAdminView />;
}
