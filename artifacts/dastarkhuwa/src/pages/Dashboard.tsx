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
  Sparkles, BookOpen, GraduationCap, Heart, Star, CheckCircle2,
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
  transition: { delay, duration: 0.4, ease: "easeOut" },
});

const stagger = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.15 },
  },
};

const fieldVariants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export default function Dashboard() {
  const { restaurantData, restaurantId, loading: authLoading } = useAuth();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

  const monthlyRevenue = monthlyBookings
    .filter(b => b.status === "completed")
    .reduce((acc, b) => acc + (b.total_amount || 0), 0);

  if (authLoading || loading) {
    return (
      <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-8">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-36 rounded-2xl" />)}
        </div>
      </motion.div>
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
          <h1 className="text-3xl font-bold mb-1">{getGreeting()}, {restaurantData?.name || "Restaurant Owner"}! 👋</h1>
          <p className="text-white/80 text-sm">Here's what's happening at your restaurant today.</p>
        </div>
      </motion.div>

      {/* ── KPI Cards ── */}
      <motion.div variants={stagger} initial="hidden" animate="show" className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Today's Bookings", value: todaysBookings.length, icon: CalendarClock, color: "text-blue-500" },
          { label: "Pending", value: pendingBookings.length, icon: Clock, color: "text-orange-500" },
          { label: "This Month", value: monthlyBookings.length, icon: TrendingUp, color: "text-green-500" },
          { label: "Monthly Revenue", value: formatPKR(monthlyRevenue), icon: Users, color: "text-purple-500" },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div key={i} variants={fieldVariants}>
              <Card className="border-0 shadow-sm rounded-2xl">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                      <p className="text-3xl font-bold text-foreground mt-2">{stat.value}</p>
                    </div>
                    <Icon className={`h-12 w-12 opacity-20 ${stat.color}`} />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>

      {/* ── Quick Actions ── */}
      <motion.div variants={fadeUp(0.2)} className="grid gap-4 md:grid-cols-3">
        {[
          { label: "View Bookings", icon: BookOpen, href: "/bookings", desc: "Manage all reservations" },
          { label: "Menu Items", icon: Sparkles, href: "/menu", desc: "Update your menu" },
          { label: "View Analytics", icon: TrendingUp, href: "/analytics", desc: "Insights & metrics" },
        ].map((action, i) => {
          const Icon = action.icon;
          return (
            <Link key={i} href={action.href}>
              <Card className="cursor-pointer border-0 shadow-sm rounded-2xl hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <Icon className="h-8 w-8 text-primary" />
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{action.label}</p>
                      <p className="text-xs text-muted-foreground">{action.desc}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </motion.div>

      {/* ── Recent Bookings ── */}
      <motion.div variants={fadeUp(0.3)}>
        <Card className="border-0 shadow-sm rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              Recent Bookings
            </CardTitle>
          </CardHeader>
          <CardContent>
            {todaysBookings.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">No bookings today. Check back soon!</p>
            ) : (
              <div className="space-y-4">
                {todaysBookings.slice(0, 5).map(booking => (
                  <div key={booking.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{booking.customer_name}</p>
                      <p className="text-xs text-muted-foreground">{formatKarachiTime(booking.date)} • {booking.party_size} people</p>
                    </div>
                    <Badge variant={booking.status === "confirmed" ? "default" : "outline"}>
                      {booking.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

    </div>
  );
}
