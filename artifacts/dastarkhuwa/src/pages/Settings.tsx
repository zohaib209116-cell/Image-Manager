import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { sanitizeNum, safeErrorMessage } from "@/lib/security";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const VALID_SLOT_DURATIONS = ["30", "60", "90", "120"] as const;

export default function Settings() {
  const { restaurantId } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const [settings, setSettings] = useState({
    autoConfirmBookings: false,
    newBookingAlerts: true,
    cancellationAlerts: true,
    slotDuration: "60",
    maxBookingsPerSlot: "10",
  });

  useEffect(() => {
    const fetchSettings = async () => {
      if (!restaurantId) return;
      try {
        const { data, error } = await supabase
          .from("restaurants")
          .select("settings")
          .eq("id", restaurantId)
          .single();
        if (!error && data?.settings) {
          setSettings(data.settings);
        }
      } catch {
        // Silent — defaults remain
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, [restaurantId]);

  const handleSave = async () => {
    if (!restaurantId || saving) return;

    const slotDuration = VALID_SLOT_DURATIONS.includes(settings.slotDuration as any) ? settings.slotDuration : "60";
    const maxPerSlot = sanitizeNum(settings.maxBookingsPerSlot, 1, 100);
    if (maxPerSlot === null) {
      toast({ title: "Validation Error", description: "Max bookings per slot must be between 1 and 100.", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from("restaurants")
        .update({
          settings: {
            autoConfirmBookings: Boolean(settings.autoConfirmBookings),
            newBookingAlerts: Boolean(settings.newBookingAlerts),
            cancellationAlerts: Boolean(settings.cancellationAlerts),
            slotDuration,
            maxBookingsPerSlot: String(maxPerSlot),
          },
          updated_at: new Date().toISOString(),
        })
        .eq("id", restaurantId);
      if (error) throw error;
      toast({ title: "Settings Saved", description: "Your preferences have been updated." });
    } catch (error) {
      toast({ title: "Error", description: safeErrorMessage(error), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return <div className="space-y-6"><Skeleton className="h-64 w-full max-w-2xl" /><Skeleton className="h-64 w-full max-w-2xl" /></div>;
  }

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground mt-1">Manage your platform preferences and automation.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Booking Configuration</CardTitle>
          <CardDescription>Control how reservations are handled.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div className="space-y-0.5">
              <Label className="text-base">Auto-Confirm Bookings</Label>
              <p className="text-sm text-muted-foreground">Automatically accept bookings without manual review.</p>
            </div>
            <Switch checked={settings.autoConfirmBookings} onCheckedChange={(c) => handleChange("autoConfirmBookings", c)} />
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Slot Duration</Label>
              <Select value={settings.slotDuration} onValueChange={(v) => handleChange("slotDuration", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 Minutes</SelectItem>
                  <SelectItem value="60">1 Hour</SelectItem>
                  <SelectItem value="90">1.5 Hours</SelectItem>
                  <SelectItem value="120">2 Hours</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxBookings">Max Bookings per Slot</Label>
              <Input
                id="maxBookings"
                type="number"
                min="1"
                max="100"
                value={settings.maxBookingsPerSlot}
                onChange={(e) => handleChange("maxBookingsPerSlot", e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notification Preferences</CardTitle>
          <CardDescription>Choose what alerts you receive.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">New Booking Alerts</Label>
              <p className="text-sm text-muted-foreground">Get notified when a new request arrives.</p>
            </div>
            <Switch checked={settings.newBookingAlerts} onCheckedChange={(c) => handleChange("newBookingAlerts", c)} />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Cancellation Alerts</Label>
              <p className="text-sm text-muted-foreground">Get notified if a customer cancels.</p>
            </div>
            <Switch checked={settings.cancellationAlerts} onCheckedChange={(c) => handleChange("cancellationAlerts", c)} />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} size="lg">
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Preferences
        </Button>
      </div>
    </div>
  );
}
