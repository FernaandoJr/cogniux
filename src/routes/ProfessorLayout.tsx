import { Link, Outlet } from "react-router-dom";
import { LandingNavbar } from "@/components/landing/Navbar";
import { UserPopover } from "@/components/UserPopover";
import { useAuth } from "@/hooks/useAuth";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ProfessorLayout() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <LandingNavbar
        forceBlur
        trailingSlot={
          <div className="flex items-center gap-1">
            <Link
              to="/dashboard"
              className={cn(buttonVariants({ variant: "ghost" }))}
            >
              Dashboard
            </Link>
            <UserPopover user={user} />
          </div>
        }
      />
      <main className="flex-1 pt-14 pb-6">
        <div className="container">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
