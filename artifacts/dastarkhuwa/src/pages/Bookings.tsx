import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { formatKarachiTime } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Check, X, CheckCheck, Search } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Bookings() {
  const { restaurantId } = useAuth();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [timeFilter, setTimeFilter] = useState("all");
  const { toast } = useToast();

  useEffect(() => {
    if (!restaurantId) return;

    const q = query(
      collection(db, "bookings"),
      where("restaurantId", "==", restaurantId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setBookings(data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      setLoading(false);
    });

    return () => unsubscribe();
  }, [restaurantId]);

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, "bookings", id), { status: newStatus });
      toast({ title: "Status Updated", description: `Booking is now ${newStatus}.` });
    } catch (error) {
      toast({ title: "Error", description: "Failed to update status", variant: "destructive" });
    }
  };

  const filteredBookings = bookings.filter(b => {
    const matchesSearch = b.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          b.phone?.includes(searchTerm);
    const matchesStatus = statusFilter === "all" || b.status === statusFilter;
    
    let matchesTime = true;
    const bDate = new Date(b.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (timeFilter === "today") {
      matchesTime = bDate >= today && bDate < new Date(today.getTime() + 86400000);
    } else if (timeFilter === "week") {
      matchesTime = bDate >= today && bDate < new Date(today.getTime() + 7 * 86400000);
    } else if (timeFilter === "month") {
      matchesTime = bDate.getMonth() === today.getMonth() && bDate.getFullYear() === today.getFullYear();
    }

    return matchesSearch && matchesStatus && matchesTime;
  });

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'confirmed': return <Badge className="bg-green-500 hover:bg-green-600">Confirmed</Badge>;
      case 'pending': return <Badge variant="secondary" className="bg-secondary text-secondary-foreground">Pending</Badge>;
      case 'cancelled': return <Badge variant="destructive">Cancelled</Badge>;
      case 'completed': return <Badge className="bg-blue-500 hover:bg-blue-600 text-white">Completed</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return <div className="space-y-4">{[1,2,3].map(i => <Skeleton key={i} className="h-24 w-full" />)}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-3xl font-bold tracking-tight">Bookings</h2>
        
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search name or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 w-[200px] bg-input border-border"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Select value={timeFilter} onValueChange={setTimeFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Time" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4">
        {filteredBookings.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground border-dashed">
            No bookings found matching your filters.
          </Card>
        ) : (
          filteredBookings.map(booking => (
            <Card key={booking.id} className="overflow-hidden transition-all hover:border-primary/30">
              <CardContent className="p-0">
                <div className="flex flex-col md:flex-row md:items-center justify-between p-6 gap-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 flex-1">
                    <div>
                      <p className="text-sm text-muted-foreground">Customer</p>
                      <p className="font-semibold text-foreground">{booking.customerName}</p>
                      <p className="text-xs text-muted-foreground">{booking.phone}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Date & Time</p>
                      <p className="font-medium">{formatKarachiTime(booking.date)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Details</p>
                      <p className="font-medium">{booking.partySize} People</p>
                      {booking.specialRequest && <p className="text-xs text-muted-foreground truncate" title={booking.specialRequest}>Req: {booking.specialRequest}</p>}
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Status</p>
                      {getStatusBadge(booking.status)}
                    </div>
                  </div>
                  
                  <div className="flex flex-row md:flex-col lg:flex-row gap-2 shrink-0 border-t md:border-t-0 md:border-l border-border pt-4 md:pt-0 md:pl-4">
                    {booking.status === 'pending' && (
                      <>
                        <Button size="sm" onClick={() => updateStatus(booking.id, 'confirmed')} className="bg-green-500 hover:bg-green-600 text-white">
                          <Check className="h-4 w-4 mr-1" /> Confirm
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => updateStatus(booking.id, 'cancelled')}>
                          <X className="h-4 w-4 mr-1" /> Reject
                        </Button>
                      </>
                    )}
                    {booking.status === 'confirmed' && (
                      <Button size="sm" onClick={() => updateStatus(booking.id, 'completed')} className="bg-blue-500 hover:bg-blue-600 text-white">
                        <CheckCheck className="h-4 w-4 mr-1" /> Complete
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
