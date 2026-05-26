import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPKR } from "@/lib/utils";

export default function Analytics() {
  const { restaurantId } = useAuth();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    totalBookings: 0,
    completionRate: 0,
    cancellationRate: 0,
    totalRevenue: 0,
  });
  
  const [bookingsByDay, setBookingsByDay] = useState<any[]>([]);
  const [partySizeData, setPartySizeData] = useState<any[]>([]);
  const [timeSlotData, setTimeSlotData] = useState<any[]>([]);
  const [busyDays, setBusyDays] = useState<any[]>([]);

  const COLORS = ['#E63946', '#F4A261', '#2A9D8F', '#457B9D', '#1D3557'];

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!restaurantId) return;
      try {
        const q = query(collection(db, "bookings"), where("restaurantId", "==", restaurantId));
        const snapshot = await getDocs(q);
        const bookings = snapshot.docs.map(doc => doc.data());

        // Basic Metrics
        const total = bookings.length;
        const completed = bookings.filter(b => b.status === 'completed').length;
        const cancelled = bookings.filter(b => b.status === 'cancelled').length;
        const revenue = bookings.filter(b => b.status === 'completed').reduce((acc, b) => acc + (b.totalAmount || 0), 0);

        setMetrics({
          totalBookings: total,
          completionRate: total ? Math.round((completed / total) * 100) : 0,
          cancellationRate: total ? Math.round((cancelled / total) * 100) : 0,
          totalRevenue: revenue
        });

        // Last 7 days trend
        const last7Days = Array.from({length: 7}, (_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - i);
          return d.toISOString().split('T')[0];
        }).reverse();

        const byDay = last7Days.map(dateStr => {
          const count = bookings.filter(b => b.date.startsWith(dateStr)).length;
          return { date: new Date(dateStr).toLocaleDateString('en-US', {weekday: 'short'}), count };
        });
        setBookingsByDay(byDay);

        // Party Size Distribution
        const sizes = { "2": 0, "4": 0, "6": 0, "8+": 0 };
        bookings.forEach(b => {
          const s = b.partySize;
          if (s <= 2) sizes["2"]++;
          else if (s <= 4) sizes["4"]++;
          else if (s <= 6) sizes["6"]++;
          else sizes["8+"]++;
        });
        setPartySizeData([
          { name: "1-2 People", value: sizes["2"] },
          { name: "3-4 People", value: sizes["4"] },
          { name: "5-6 People", value: sizes["6"] },
          { name: "7+ People", value: sizes["8+"] },
        ].filter(d => d.value > 0));

        // Time Slots
        const slots: Record<string, number> = {};
        bookings.forEach(b => {
          const hour = new Date(b.date).getHours();
          const slot = `${hour}:00 - ${hour+1}:00`;
          slots[slot] = (slots[slot] || 0) + 1;
        });
        setTimeSlotData(Object.entries(slots).map(([time, count]) => ({ time, count })).sort((a,b) => b.count - a.count).slice(0, 5));

        setLoading(false);
      } catch (error) {
        console.error(error);
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [restaurantId]);

  if (loading) {
    return <div className="space-y-6"><div className="grid grid-cols-4 gap-4"><Skeleton className="h-24" /><Skeleton className="h-24" /><Skeleton className="h-24" /><Skeleton className="h-24" /></div><Skeleton className="h-96 w-full" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Analytics</h2>
        <p className="text-muted-foreground mt-1">Insights and performance metrics for your restaurant.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{metrics.totalBookings}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{formatPKR(metrics.totalRevenue)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-500">{metrics.completionRate}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Cancellation Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-destructive">{metrics.cancellationRate}%</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="col-span-2 md:col-span-1">
          <CardHeader>
            <CardTitle>Bookings Last 7 Days</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={bookingsByDay} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="date" stroke="#888" />
                <YAxis stroke="#888" allowDecimals={false} />
                <Tooltip contentStyle={{ backgroundColor: '#16213E', borderColor: '#2A2A4A' }} />
                <Line type="monotone" dataKey="count" stroke="#E63946" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="col-span-2 md:col-span-1">
          <CardHeader>
            <CardTitle>Popular Time Slots</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={timeSlotData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="time" stroke="#888" />
                <YAxis stroke="#888" allowDecimals={false} />
                <Tooltip contentStyle={{ backgroundColor: '#16213E', borderColor: '#2A2A4A' }} cursor={{fill: '#2A2A4A'}} />
                <Bar dataKey="count" fill="#F4A261" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="col-span-2 md:col-span-1">
          <CardHeader>
            <CardTitle>Party Size Distribution</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            {partySizeData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={partySizeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {partySizeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#16213E', borderColor: '#2A2A4A' }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">Not enough data</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
