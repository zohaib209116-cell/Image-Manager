import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { formatPKR, formatKarachiTime } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users, CalendarClock, TrendingUp, Clock, ArrowRight,
  Sparkles, BookOpen, GraduationCap, Heart, Bot,
  Zap, Star, Send,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";

// ── Helpers ────────────────────────────────────────────────────────────────

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, ease: [0.33, 1, 0.68, 1], delay },
});

// ── Feature Module Data ────────────────────────────────────────────────────

const FEATURE_MODULES = [
  {
    key: "discover",
    label: "Discover",
    icon: Sparkles,
    desc: "AI-powered restaurant recommendations tailored to your guests.",
    badge: "AI Powered",
    color: "#0E6B63",
    bg: "#0E6B6310",
    accent: "#0E6B63",
  },
  {
    key: "reserve",
    label: "Reserve",
    icon: BookOpen,
    desc: "Seamless table reservations with real-time slot management.",
    badge: "Live",
    color: "#FF8A3D",
    bg: "#FF8A3D10",
    accent: "#FF8A3D",
  },
  {
    key: "student",
    label: "Student Offers",
    icon: GraduationCap,
    desc: "Exclusive deals and verified discounts for student diners.",
    badge: "New",
    color: "#FFC857",
    bg: "#FFC85710",
    accent: "#b8891e",
  },
  {
    key: "community",
    label: "Community",
    icon: Heart,
    desc: "Communal dining metrics, reviews, and social engagement hub.",
    badge: "Growing",
    color: "#0E6B63",
    bg: "#0E6B6310",
    accent: "#0E6B63",
  },
];

// ── Component ──────────────────────────────────────────────────────────────

export default function Dashboard() {
  const { restaurantData, restaurantId, loading: authLoading } = useAuth();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [zibiQuery, setZibiQuery] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (!restaurantId) { setLoading(false); return; }

    setLoading(true);
    const fetchBookings = async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select("*")
        .eq("restaurant_id", restaurantId)
        .eq("is_deleted", false)
        .limit(200);
      if (!error) setBookings(data || []);
      setLoading(false);
    };
    fetchBookings();

    const channel = supabase
      .channel(`dashboard-bookings-${restaurantId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "bookings", filter: `restaurant_id=eq.${restaurantId}` }, fetchBookings)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [restaurantId, authLoading]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todaysBookings = bookings.filter(b => {
    const bDate = new Date(b.date);
    return bDate >= today && bDate < new Date(today.getTime() + 86400000);
  });

  const pendingBookings = bookings.filter(b => b.status === "pending");
  const monthlyBookings = bookings.filter(b => {
    const bDate = new Date(b.date);
    return bDate.getMonth() === today.getMonth() && bDate.getFullYear() === today.getFullYear();
  });
  const monthlyRevenue = monthlyBookings.filter(b => b.status === "completed").reduce((acc, b) => acc + (b.total_amount || 0), 0);

  const recentBookings = [...bookings]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 4);

  if (authLoading || loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-24 w-full rounded-2xl" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28 rounded-2xl" />)}
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-36 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">

      {/* ── Greeting Banner ── */}
      <motion.div
        {...fadeUp(0)}
        className="relative overflow-hidden rounded-2xl px-7 py-6 text-white shadow-lg"
        style={{ background: "linear-gradient(135deg, #0E6B63 0%, #0a4f49 60%, #1a6b40 100%)" }}
      >
        <div className="relative z-10">
          <p className="text-white/70 text-sm font-medium mb-1">
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </p>
          <h2 className="text-2xl font-bold" style={{ fontFamily: "'Poppins', sans-serif" }}>
            {getGreeting()}, Zohaib! 👋
          </h2>
          <p className="text-white/65 text-sm mt-1">
            {restaurantData?.name
              ? `Here's today's overview for ${restaurantData.name}.`
              : "Here's your restaurant overview for today."}
          </p>
        </div>
        {/* Decorative circles */}
        <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full opacity-10" style={{ background: "#FF8A3D" }} />
        <div className="absolute right-20 -bottom-10 h-32 w-32 rounded-full opacity-10" style={{ background: "#FFC857" }} />
        <div className="absolute -left-6 bottom-0 h-24 w-24 rounded-full opacity-5" style={{ background: "#FFF4E6" }} />
      </motion.div>

      {/* ── Stats Row ── */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Today's Bookings", value: todaysBookings.length, icon: Users, color: "#0E6B63", bg: "#0E6B6312" },
          { label: "Pending Requests", value: pendingBookings.length, icon: Clock, color: "#FF8A3D", bg: "#FF8A3D12" },
          { label: "Monthly Bookings", value: monthlyBookings.length, icon: CalendarClock, color: "#FFC857", bg: "#FFC85718", textColor: "#b8891e" },
          { label: "Monthly Revenue", value: formatPKR(monthlyRevenue), icon: TrendingUp, color: "#0E6B63", bg: "#0E6B6312", isText: true },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div key={stat.label} {...fadeUp(0.05 * i)}>
              <Card className="border-0 shadow-sm rounded-2xl overflow-hidden">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">{stat.label}</p>
                      <p className="text-2xl font-bold" style={{ color: stat.textColor || stat.color, fontFamily: "'Poppins', sans-serif" }}>
                        {stat.value}
                      </p>
                    </div>
                    <div className="h-11 w-11 rounded-xl flex items-center justify-center" style={{ background: stat.bg }}>
                      <Icon className="h-5 w-5" style={{ color: stat.color }} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* ── Feature Modules ── */}
      <motion.div {...fadeUp(0.15)}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold" style={{ color: "#0E6B63", fontFamily: "'Poppins', sans-serif" }}>
            Platform Features
          </h3>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: "#0E6B6312", color: "#0E6B63" }}>
            Powered by Dastarkhuwa
          </span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURE_MODULES.map((mod, i) => {
            const Icon = mod.icon;
            return (
              <motion.div key={mod.key} {...fadeUp(0.08 * i + 0.2)}>
                <Card
                  className="border-0 shadow-sm rounded-2xl overflow-hidden cursor-pointer group transition-all duration-200 hover:-translate-y-1 hover:shadow-md"
                  style={{ background: "#fff" }}
                >
                  <CardContent className="p-5">
                    <div
                      className="h-10 w-10 rounded-xl flex items-center justify-center mb-3"
                      style={{ background: mod.bg }}
                    >
                      <Icon className="h-5 w-5" style={{ color: mod.color }} />
                    </div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <h4 className="font-bold text-sm" style={{ color: "#0E6B63", fontFamily: "'Poppins', sans-serif" }}>
                        {mod.label}
                      </h4>
                      <span
                        className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                        style={{ background: `${mod.color}18`, color: mod.accent }}
                      >
                        {mod.badge}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{mod.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* ── Two-col: Zibi AI + Recent Bookings ── */}
      <div className="grid gap-6 lg:grid-cols-5">

        {/* ── Zibi AI Assistant ── */}
        <motion.div {...fadeUp(0.25)} className="lg:col-span-2">
          <Card
            className="border-0 shadow-sm rounded-2xl overflow-hidden h-full"
            style={{ background: "linear-gradient(160deg, #0E6B63 0%, #0a4f49 100%)" }}
          >
            <CardContent className="p-6 flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="h-11 w-11 rounded-xl flex items-center justify-center shadow-inner"
                  style={{ background: "rgba(255,138,61,0.25)" }}
                >
                  <Bot className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="font-bold text-white text-sm" style={{ fontFamily: "'Poppins', sans-serif" }}>
                    Zibi AI Assistant
                  </p>
                  <p className="text-white/60 text-xs">Your personal dining concierge</p>
                </div>
                <div className="ml-auto flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-white/60 text-xs">Live</span>
                </div>
              </div>

              {/* Chat Bubble */}
              <div
                className="rounded-xl p-4 mb-4 flex-1"
                style={{ background: "rgba(255,255,255,0.08)" }}
              >
                <div className="flex gap-2.5 mb-3">
                  <div className="h-7 w-7 rounded-full bg-orange-400/30 flex items-center justify-center shrink-0 mt-0.5">
                    <Zap className="h-3.5 w-3.5 text-orange-300" />
                  </div>
                  <div>
                    <p className="text-white/90 text-xs leading-relaxed">
                      Hello! I'm Zibi, your AI dining concierge. I can help you optimize reservations, suggest menu pairings, and analyze dining trends for your restaurant.
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {["Analyze bookings", "Menu suggestions", "Peak hours"].map(hint => (
                    <button
                      key={hint}
                      onClick={() => setZibiQuery(hint)}
                      className="text-[10px] font-semibold px-2 py-1 rounded-full transition-colors"
                      style={{ background: "rgba(255,255,255,0.12)", color: "#FFC857" }}
                    >
                      {hint}
                    </button>
                  ))}
                </div>
              </div>

              {/* Input */}
              <div
                className="flex items-center gap-2 rounded-xl p-2"
                style={{ background: "rgba(255,255,255,0.10)" }}
              >
                <input
                  type="text"
                  placeholder="Ask Zibi anything..."
                  value={zibiQuery}
                  onChange={(e) => setZibiQuery(e.target.value)}
                  className="flex-1 bg-transparent text-white placeholder:text-white/40 text-xs outline-none px-2"
                  style={{ fontFamily: "'Poppins', sans-serif" }}
                />
                <button
                  className="h-8 w-8 rounded-lg flex items-center justify-center transition-opacity hover:opacity-80"
                  style={{ background: "#FF8A3D" }}
                >
                  <Send className="h-3.5 w-3.5 text-white" />
                </button>
              </div>

              {/* Stars */}
              <div className="flex items-center gap-1 mt-3">
                {[1,2,3,4,5].map(s => <Star key={s} className="h-3 w-3 text-yellow-400 fill-yellow-400" />)}
                <span className="text-white/50 text-[10px] ml-1">5.0 · 2.4k restaurants</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* ── Recent Bookings ── */}
        <motion.div {...fadeUp(0.3)} className="lg:col-span-3">
          <Card className="border-0 shadow-sm rounded-2xl overflow-hidden h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-3 pt-5 px-6">
              <CardTitle className="text-base font-bold" style={{ color: "#0E6B63", fontFamily: "'Poppins', sans-serif" }}>
                Recent Bookings
              </CardTitle>
              <Button asChild variant="ghost" size="sm" className="gap-1 text-xs" style={{ color: "#FF8A3D" }}>
                <Link href="/bookings">View all <ArrowRight className="h-3.5 w-3.5" /></Link>
              </Button>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <div className="space-y-3">
                {recentBookings.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">No bookings yet.</p>
                ) : (
                  recentBookings.map((booking) => (
                    <div
                      key={booking.id}
                      className="flex items-center justify-between p-3.5 rounded-xl border transition-colors hover:border-primary/20"
                      style={{ borderColor: "#0E6B6315", background: "#0E6B6305" }}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="h-9 w-9 rounded-xl flex items-center justify-center font-bold text-sm text-white shrink-0"
                          style={{ background: "linear-gradient(135deg, #0E6B63, #FF8A3D)" }}
                        >
                          {booking.customer_name?.charAt(0)?.toUpperCase() || "?"}
                        </div>
                        <div>
                          <p className="font-semibold text-sm" style={{ color: "#0E6B63" }}>{booking.customer_name}</p>
                          <p className="text-xs text-muted-foreground">{formatKarachiTime(booking.date)} · {booking.party_size} guests</p>
                        </div>
                      </div>
                      <Badge
                        className="text-xs font-semibold rounded-full border-0"
                        style={
                          booking.status === "confirmed"
                            ? { background: "#0E6B6318", color: "#0E6B63" }
                            : booking.status === "pending"
                            ? { background: "#FF8A3D18", color: "#FF8A3D" }
                            : booking.status === "completed"
                            ? { background: "#FFC85718", color: "#b8891e" }
                            : { background: "#f8717118", color: "#dc2626" }
                        }
                      >
                        {booking.status?.charAt(0).toUpperCase() + booking.status?.slice(1)}
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
