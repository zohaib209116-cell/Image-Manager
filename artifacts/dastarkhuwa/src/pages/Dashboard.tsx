import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { formatPKR, formatKarachiTime } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  CalendarClock, 
  TrendingUp, 
  Clock,
  Plus,
  ArrowRight,
  MenuSquare,
  Grid2X2
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const { restaurantData, restaurantId } = useAuth();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!restaurantId) return;

    const q = query(
      collection(db, "bookings"),
      where("restaurantId", "==", restaurantId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setBookings(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [restaurantId]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todaysBookings = bookings.filter(b => {
    const bDate = new Date(b.date);
    return bDate >= today && bDate < new Date(today.getTime() + 86400000);
  });

  const pendingBookings = bookings.filter(b => b.status === 'pending');
  const monthlyBookings = bookings.filter(b => {
    const bDate = new Date(b.date);
    return bDate.getMonth() === today.getMonth() && bDate.getFullYear() === today.getFullYear();
  });
  const monthlyRevenue = monthlyBookings.filter(b => b.status === 'completed').reduce((acc, curr) => acc + (curr.totalAmount || 0), 0);
  const recentBookings = [...bookings].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
        </div>
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Welcome back, {restaurantData?.name}</h2>
        <p className="text-muted-foreground mt-1">Here's what's happening at your restaurant today.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Today's Bookings</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{todaysBookings.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Requests</CardTitle>
            <Clock className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{pendingBookings.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Monthly Bookings</CardTitle>
            <CalendarClock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{monthlyBookings.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Monthly Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{formatPKR(monthlyRevenue)}</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-4">
        <Button asChild className="gap-2">
          <Link href="/bookings">
            <Plus className="h-4 w-4" /> New Booking
          </Link>
        </Button>
        <Button asChild variant="outline" className="gap-2">
          <Link href="/menu">
            <MenuSquare className="h-4 w-4" /> Manage Menu
          </Link>
        </Button>
        <Button asChild variant="outline" className="gap-2">
          <Link href="/tables">
            <Grid2X2 className="h-4 w-4" /> Manage Tables
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Bookings</CardTitle>
          <Button asChild variant="ghost" size="sm" className="gap-1">
            <Link href="/bookings">View all <ArrowRight className="h-4 w-4" /></Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentBookings.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No recent bookings</p>
            ) : (
              recentBookings.map((booking) => (
                <div key={booking.id} className="flex items-center justify-between p-4 rounded-lg border border-border bg-card/50">
                  <div>
                    <p className="font-medium text-foreground">{booking.customerName}</p>
                    <p className="text-sm text-muted-foreground">{formatKarachiTime(booking.date)} · {booking.partySize} people</p>
                  </div>
                  <Badge variant={
                    booking.status === 'confirmed' ? 'default' : 
                    booking.status === 'pending' ? 'secondary' : 
                    booking.status === 'cancelled' ? 'destructive' : 'outline'
                  } className={
                    booking.status === 'confirmed' ? 'bg-green-500 hover:bg-green-600' :
                    booking.status === 'completed' ? 'bg-blue-500 hover:bg-blue-600' : ''
                  }>
                    {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
