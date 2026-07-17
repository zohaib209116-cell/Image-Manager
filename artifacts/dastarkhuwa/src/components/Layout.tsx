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
  ChevronDown,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000;

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { logout, restaurantData, restaurantId, restaurants, setActiveRestaurant } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [newBookingPulse, setNewBookingPulse] = useState(false);
  const { toast } = useToast();
  const inactivityTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  useEffect(() => {
    if (!restaurantId) return;
    const fetchUnreadCount = async () => {
      const { count } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("restaurant_id", restaurantId)
        .eq("read", false);
      setUnreadCount(count ?? 0);
    };
    fetchUnreadCount();
    const channel = supabase
      .channel(`layout-notif-${restaurantId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications", filter: `restaurant_id=eq.${restaurantId}` }, fetchUnreadCount)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [restaurantId]);

  const handleNewBooking = useCallback((booking: any) => {
    const name = booking.customer_name || "A customer";
    const people = booking.party_size || "";
    toast({ title: "New Booking Request 🔔", description: people ? `${name} — party of ${people}` : name, duration: 6000 });
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

  const hasMultiple = restaurants.length > 1;

  return (
    <div className="flex min-h-screen w-full flex-col bg-background md:flex-row">

      {/* ── Mobile Header ── */}
      <div
        className="flex h-16 items-center justify-between px-4 md:hidden border-b"
        style={{ background: "#0E6B63", borderColor: "#0a4f49" }}
      >
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg overflow-hidden bg-white/10 flex items-center justify-center">
            <img src="/dastarkhuwa-logo.jpeg" alt="Dastarkhuwa" className="h-full w-full object-contain" />
          </div>
          <span className="font-bold text-white text-base" style={{ fontFamily: "'Poppins', sans-serif" }}>Dastarkhuwa</span>
        </div>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="text-white/80 hover:text-white transition-colors p-1.5"
        >
          {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* ── Sidebar ── */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col transition-transform duration-200 ease-in-out md:relative md:translate-x-0",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
        style={{ background: "#0E6B63" }}
      >
        {/* Logo / Brand */}
        <div
          className="flex h-20 shrink-0 items-center gap-3 px-5 border-b"
          style={{ borderColor: "rgba(255,255,255,0.12)" }}
        >
          <div className="h-11 w-11 rounded-xl overflow-hidden bg-white/15 flex items-center justify-center shadow-inner">
            <img src="/dastarkhuwa-logo.jpeg" alt="Dastarkhuwa" className="h-full w-full object-contain" />
          </div>
          <div>
            <div className="text-lg font-bold text-white leading-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
              Dastarkhuwa
            </div>
            <div className="text-[10px] text-white/55 leading-tight mt-0.5 font-medium tracking-wide">
              Communal Dining, Modern Convenience.
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="flex flex-col space-y-0.5 px-3">
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
                      "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150",
                      isActive
                        ? "text-white shadow-sm"
                        : "text-white/65 hover:text-white hover:bg-white/10"
                    )}
                    style={isActive ? { background: "rgba(255,138,61,0.85)", boxShadow: "0 2px 12px rgba(255,138,61,0.4)" } : {}}
                    data-testid={`nav-${item.label.toLowerCase()}`}
                  >
                    <span className="relative">
                      <Icon className="h-4.5 w-4.5" style={{ width: 18, height: 18 }} />
                      {isNotif && newBookingPulse && (
                        <span className="absolute -right-1 -top-1 flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: "#FF8A3D" }} />
                          <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: "#FF8A3D" }} />
                        </span>
                      )}
                    </span>
                    <span>{item.label}</span>
                    {isNotif && unreadCount > 0 && (
                      <span
                        className="ml-auto rounded-full px-1.5 py-0.5 text-xs font-bold text-white"
                        style={{ background: "#FF8A3D", minWidth: 20, textAlign: "center" }}
                      >
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Bottom Actions */}
        <div className="border-t p-4 space-y-2" style={{ borderColor: "rgba(255,255,255,0.12)" }}>
          {hasMultiple && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-between gap-2 text-white/70 hover:text-white hover:bg-white/10 text-sm"
                >
                  <span className="flex items-center gap-2 truncate">
                    <Store className="h-4 w-4 shrink-0" />
                    <span className="truncate">{restaurantData?.name || "Switch Restaurant"}</span>
                  </span>
                  <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                {restaurants.map((r) => (
                  <DropdownMenuItem
                    key={r.queryId}
                    onClick={() => setActiveRestaurant(r.queryId)}
                    className={cn("cursor-pointer", r.queryId === restaurantId && "font-semibold")}
                    style={{ color: r.queryId === restaurantId ? "#0E6B63" : undefined }}
                  >
                    {r.data.name || r.queryId}
                    {r.queryId === restaurantId && <span className="ml-auto text-xs" style={{ color: "#0E6B63" }}>Active</span>}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-muted-foreground" onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-2" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {!hasMultiple && (
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-white/65 hover:bg-red-500/20 hover:text-red-200 transition-colors text-sm"
              onClick={handleLogout}
              data-testid="button-logout"
            >
              <LogOut className="h-4 w-4" /> Sign out
            </Button>
          )}
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main className="flex flex-1 flex-col overflow-hidden">
        <header
          className="hidden h-16 shrink-0 items-center justify-between border-b px-8 md:flex bg-white"
          style={{ borderColor: "#0E6B6318" }}
        >
          <h1 className="text-lg font-semibold" style={{ color: "#0E6B63", fontFamily: "'Poppins', sans-serif" }}>
            {getPageTitle()}
          </h1>
          <div className="flex items-center gap-3">
            <span
              className="text-sm font-semibold px-3 py-1 rounded-full"
              style={{ background: "#0E6B6312", color: "#0E6B63" }}
            >
              {restaurantData?.name || "Loading..."}
            </span>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="mx-auto max-w-6xl">{children}</div>
        </div>
      </main>

      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-black/60 md:hidden" onClick={closeMobileMenu} />
      )}
    </div>
  );
}
