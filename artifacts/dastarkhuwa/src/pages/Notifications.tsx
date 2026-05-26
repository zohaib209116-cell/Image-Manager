import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { db } from "@/lib/firebase";
import { collection, query, onSnapshot, doc, updateDoc, writeBatch } from "firebase/firestore";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatKarachiTime } from "@/lib/utils";
import { Bell, Check, CheckAll } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export default function Notifications() {
  const { restaurantId } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!restaurantId) return;

    const q = query(collection(db, `notifications/${restaurantId}/alerts`));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setNotifications(data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      setLoading(false);
    });

    return () => unsubscribe();
  }, [restaurantId]);

  const markAsRead = async (id: string) => {
    try {
      await updateDoc(doc(db, `notifications/${restaurantId}/alerts`, id), { read: true });
    } catch (error) {
      console.error(error);
    }
  };

  const markAllAsRead = async () => {
    const batch = writeBatch(db);
    notifications.filter(n => !n.read).forEach(n => {
      const ref = doc(db, `notifications/${restaurantId}/alerts`, n.id);
      batch.update(ref, { read: true });
    });
    try {
      await batch.commit();
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) {
    return <div className="space-y-4">{[1,2,3,4].map(i => <Skeleton key={i} className="h-20 w-full" />)}</div>;
  }

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Notifications</h2>
          <p className="text-muted-foreground mt-1">You have {unreadCount} unread alerts.</p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" onClick={markAllAsRead} className="gap-2">
             Mark all as read
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
            <Card key={notif.id} className={cn("transition-colors", !notif.read ? "border-primary bg-primary/5" : "bg-card/50")}>
              <CardContent className="p-4 flex items-start gap-4">
                <div className={cn("mt-1 p-2 rounded-full", !notif.read ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground")}>
                  <Bell className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <p className={cn("text-sm", !notif.read ? "font-semibold text-foreground" : "text-muted-foreground")}>
                    {notif.message}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatKarachiTime(notif.createdAt)}
                  </p>
                </div>
                {!notif.read && (
                  <Button variant="ghost" size="icon" onClick={() => markAsRead(notif.id)} className="shrink-0 h-8 w-8 text-muted-foreground hover:text-primary">
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
