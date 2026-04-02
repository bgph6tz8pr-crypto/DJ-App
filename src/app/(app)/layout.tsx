import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  return (
    <div className="min-h-screen bg-dj-950">
      <Sidebar />
      {/* Main content with sidebar offset */}
      <div className="lg:pl-64 pt-14 lg:pt-0">
        <main className="min-h-screen">{children}</main>
      </div>
    </div>
  );
}
