import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatKarachiTime } from "@/lib/utils";
import { Bell, Check, CheckCheck } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export default function Notifications() {
  const { restaurantId, loading: authLoading } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!restaurantId) { setLoading(false); return; }

    setLoading(true);

    const fetchNotifications = async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("restaurant_id", restaurantId)
        .order("created_at", { ascending: false });
      if (!error) setNotifications(data || []);
      setLoading(false);
    };

    fetchNotifications();

    const channel = supabase
      .channel(`notifications-page-${restaurantId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications", filter: `restaurant_id=eq.${restaurantId}` }, fetchNotifications)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [restaurantId, authLoading]);

  const markAsRead = async (id: string) => {
    try {
      await supabase.from("notifications").update({ read: true }).eq("id", id);
    } catch (error) {
      console.error(error);
    }
  };

  const markAllAsRead = async () => {
    const unread = notifications.filter(n => !n.read);
    if (unread.length === 0) return;
    try {
      await supabase
        .from("notifications")
        .update({ read: true })
        .eq("restaurant_id", restaurantId)
        .eq("read", false);
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) {
    return <div className="space-y-4">{[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-20 w-full" />)}</div>;
  }

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Notifications</h2>
          <p className="text-muted-foreground mt-1">
            {unreadCount > 0 ? `You have ${unreadCount} unread alert${unreadCount > 1 ? "s" : ""}.` : "All caught up."}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" onClick={markAllAsRead} className="gap-2">
            <CheckCheck className="h-4 w-4" /> Mark all as read
          </Button>
        )}
      </div>

      <div className="space-y-3">
        {notifications.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground border-2 border-dashed border-border rounded-lg">
            <Bell className="mx-auto h-8 w-8 mb-2 opacity-20" />
            No notifications yet.
          </div>
        ) : (
          notifications.map(notif => (
            <Card
              key={notif.id}
              data-testid={`notification-card-${notif.id}`}
              className={cn(
                "transition-all duration-200",
                !notif.read ? "border-primary bg-primary/5 shadow-sm shadow-primary/10" : "bg-card/50 border-border"
              )}
            >
              <CardContent className="p-4 flex items-start gap-4">
                <div className={cn("mt-1 p-2 rounded-full shrink-0", !notif.read ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground")}>
                  {!notif.read ? (
                    <span className="relative flex h-4 w-4 items-center justify-center">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-30" />
                      <Bell className="h-4 w-4 relative" />
                    </span>
                  ) : (
                    <Bell className="h-4 w-4" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn("text-sm", !notif.read ? "font-semibold text-foreground" : "text-muted-foreground")}>
                    {notif.message}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{formatKarachiTime(notif.created_at)}</p>
                </div>
                {!notif.read && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => markAsRead(notif.id)}
                    className="shrink-0 h-8 w-8 text-muted-foreground hover:text-primary"
                    data-testid={`mark-read-${notif.id}`}
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
