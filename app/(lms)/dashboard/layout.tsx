import { requireAuth } from "@/lib/auth-utils";
import { Navbar } from "@/components/public/navbar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  await requireAuth();
  return (
    <>
      <Navbar />
      <div className="pt-16">{children}</div>
    </>
  );
}
