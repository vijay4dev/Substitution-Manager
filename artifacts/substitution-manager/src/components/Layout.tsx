import { useAuth } from "@/lib/auth";
import { Link, useLocation } from "wouter";
import { LogOut, CalendarDays, FileSpreadsheet, BarChart3, School, UserX } from "lucide-react";
import { Button } from "./ui/button";

export function Layout({ children }: { children: React.ReactNode }) {
  const { signOut } = useAuth();
  const [location] = useLocation();

  const handleSignOut = async () => {
    await signOut();
  };

  const navItems = [
    { href: "/assignments", label: "Daily Assignments", icon: CalendarDays },
    { href: "/absent-teacher", label: "Absent Teacher", icon: UserX },
    { href: "/reports", label: "Reports", icon: BarChart3 },
    { href: "/import", label: "Import Timetable", icon: FileSpreadsheet },
  ];

  return (
    <div className="flex h-[100dvh] w-full overflow-hidden bg-background">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-sidebar text-sidebar-foreground flex flex-col shrink-0">
        <div className="p-6 flex items-center gap-3">
          <School className="w-6 h-6 text-primary" />
          <h1 className="font-serif font-bold text-lg leading-tight">
            Kawar Int'l
            <br />
            <span className="text-sm text-muted-foreground font-sans font-normal">Substitution Manager</span>
          </h1>
        </div>
        
        <nav className="flex-1 px-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href} className="block">
                <div
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                  }`}
                  data-testid={`nav-${item.label.toLowerCase().replace(" ", "-")}`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-sidebar-border">
          <Button
            variant="ghost"
            className="w-full justify-start text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
            onClick={handleSignOut}
            data-testid="button-signout"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-background">
        {children}
      </main>
    </div>
  );
}
