import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { 
  LayoutDashboard, 
  CalendarClock, 
  MenuSquare, 
  Grid2X2, 
  Store, 
  BarChart3, 
  Bell, 
  Users, 
  Settings, 
  LogOut,
  Menu,
  X
} from "lucide-react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/bookings", label: "Bookings", icon: CalendarClock },
  { href: "/menu", label: "Menu", icon: MenuSquare },
  { href: "/tables", label: "Tables", icon: Grid2X2 },
  { href: "/profile", label: "Profile", icon: Store },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/staff", label: "Staff", icon: Users },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { logout, restaurantData, restaurantId } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!restaurantId) return;
    const q = query(collection(db, `notifications/${restaurantId}/alerts`), where("read", "==", false));
    const unsubscribe = onSnapshot(q, (snap) => {
      setUnreadCount(snap.docs.length);
    });
    return () => unsubscribe();
  }, [restaurantId]);

  const handleLogout = async () => {
    await logout();
  };

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const getPageTitle = () => {
    const item = NAV_ITEMS.find((i) => i.href === location);
    return item ? item.label : "Dashboard";
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-background md:flex-row">
      {/* Mobile Header */}
      <div className="flex h-16 items-center justify-between border-b border-border bg-card px-4 md:hidden">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded bg-primary flex items-center justify-center font-bold text-primary-foreground">
            D
          </div>
          <span className="font-bold text-foreground">Dastarkhuwa</span>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>
      </div>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border bg-sidebar transition-transform duration-200 ease-in-out md:relative md:translate-x-0",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 shrink-0 items-center gap-3 border-b border-sidebar-border px-6">
          <div className="h-8 w-8 rounded bg-primary flex items-center justify-center font-bold text-primary-foreground">
            D
          </div>
          <span className="text-lg font-bold text-sidebar-foreground">Dastarkhuwa</span>
        </div>

        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="flex flex-col space-y-1 px-3">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.href;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={closeMobileMenu}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    {item.label}
                    {item.label === "Notifications" && unreadCount > 0 && (
                      <span className="ml-auto rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
                        {unreadCount}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="border-t border-sidebar-border p-4">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-sidebar-foreground/70 hover:bg-destructive/20 hover:text-destructive"
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5" />
            Sign out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex flex-1 flex-col overflow-hidden">
        <header className="hidden h-16 shrink-0 items-center justify-between border-b border-border bg-card px-8 md:flex">
          <h1 className="text-xl font-semibold text-foreground">{getPageTitle()}</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-muted-foreground">
              {restaurantData?.name || "Loading..."}
            </span>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="mx-auto max-w-6xl">{children}</div>
        </div>
      </main>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/80 md:hidden"
          onClick={closeMobileMenu}
        />
      )}
    </div>
  );
}
