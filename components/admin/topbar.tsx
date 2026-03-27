import { auth, signOut } from "@/lib/auth";
import { LogOut } from "lucide-react";

export async function AdminTopbar() {
  const session = await auth();

  return (
    <header className="h-14 bg-code-bg/50 border-b border-ochre/10 flex items-center justify-between px-6">
      <div />
      <div className="flex items-center gap-4">
        <span className="text-sm text-sand/60">{session?.user?.email}</span>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/admin/login" });
          }}
        >
          <button className="text-sand/40 hover:text-sand transition">
            <LogOut size={18} />
          </button>
        </form>
      </div>
    </header>
  );
}
