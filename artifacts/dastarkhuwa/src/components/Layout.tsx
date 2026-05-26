import { useState, useEffect, useCallback, useRef } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
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
  X,
} from "lucide-react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { secureLogout } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useBookingAlert } from "@/hooks/useBookingAlert";

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

const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { logout, restaurantData, restaurantId } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [newBookingPulse, setNewBookingPulse] = useState(false);
  const { toast } = useToast();
  const inactivityTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Auto-logout on 30 min inactivity ────────────────────────────────────────
  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    inactivityTimer.current = setTimeout(async () => {
      toast({ title: "Session Expired", description: "You have been signed out due to inactivity." });
      await logout();
    }, INACTIVITY_TIMEOUT_MS);
  }, [logout, toast]);

  useEffect(() => {
    const events = ["mousemove", "keydown", "click", "scroll", "touchstart"];
    events.forEach(e => window.addEventListener(e, resetInactivityTimer, { passive: true }));
    resetInactivityTimer();
    return () => {
      events.forEach(e => window.removeEventListener(e, resetInactivityTimer));
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    };
  }, [resetInactivityTimer]);

  // ── Live unread notification count ──────────────────────────────────────────
  useEffect(() => {
    if (!restaurantId) return;
    const q = query(
      collection(db, `notifications/${restaurantId}/alerts`),
      where("read", "==", false)
    );
    const unsubscribe = onSnapshot(
      q,
      (snap) => setUnreadCount(snap.docs.length),
      (err) => console.error("[Notifications] listener error:", err)
    );
    return () => unsubscribe();
  }, [restaurantId]);

  // ── Live booking alert — sound + toast ──────────────────────────────────────
  const handleNewBooking = useCallback((booking: any) => {
    const name = booking.customerName || booking.name || "A customer";
    const people = booking.partySize || booking.numberOfPeople || "";
    toast({
      title: "New Booking Request",
      description: people ? `${name} — party of ${people}` : name,
      duration: 6000,
    });
    setNewBookingPulse(true);
    setTimeout(() => setNewBookingPulse(false), 3000);
  }, [toast]);

  useBookingAlert({ restaurantId, onNewBooking: handleNewBooking });

  const handleLogout = async () => {
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
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
              const isNotif = item.label === "Notifications";
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
                    data-testid={`nav-${item.label.toLowerCase()}`}
                  >
                    <span className="relative">
                      <Icon className="h-5 w-5" />
                      {isNotif && newBookingPulse && (
                        <span className="absolute -right-1 -top-1 flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                        </span>
                      )}
                    </span>
                    {item.label}
                    {isNotif && unreadCount > 0 && (
                      <span className="ml-auto rounded-full bg-primary px-2 py-0.5 text-xs font-bold text-primary-foreground">
                        {unreadCount > 99 ? "99+" : unreadCount}
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
            data-testid="button-logout"
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
