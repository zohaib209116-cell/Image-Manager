import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ImageUpload } from "@/components/ImageUpload";
import { uploadRestaurantImage, uploadMultipleImages } from "@/lib/imageUpload";
import { Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Profile() {
  const { restaurantId } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    city: "",
    area: "",
    cuisineType: "",
    priceRange: "mid",
    description: "",
    phone: "",
    coverImage: "",
    galleryImages: [] as string[]
  });

  const [hours, setHours] = useState({
    monday: { open: "11:00", close: "23:00", closed: false },
    tuesday: { open: "11:00", close: "23:00", closed: false },
    wednesday: { open: "11:00", close: "23:00", closed: false },
    thursday: { open: "11:00", close: "23:00", closed: false },
    friday: { open: "11:00", close: "00:00", closed: false },
    saturday: { open: "11:00", close: "00:00", closed: false },
    sunday: { open: "11:00", close: "23:00", closed: false },
  });

  useEffect(() => {
    const fetchProfile = async () => {
      if (!restaurantId) return;
      try {
        const docRef = doc(db, "restaurants", restaurantId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setFormData(prev => ({ ...prev, ...data }));
          if (data.hours) {
            setHours(data.hours);
          }
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [restaurantId]);

  const handleSave = async () => {
    if (!restaurantId) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, "restaurants", restaurantId), {
        ...formData,
        hours,
        updatedAt: new Date().toISOString()
      });
      toast({ title: "Profile Updated", description: "Your restaurant profile has been saved." });
    } catch (error) {
      toast({ title: "Error", description: "Failed to update profile.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleHoursChange = (day: string, field: string, value: string | boolean) => {
    setHours(prev => ({
      ...prev,
      [day]: { ...prev[day as keyof typeof prev], [field]: value }
    }));
  };

  if (loading) {
    return <div className="space-y-6"><Skeleton className="h-96 w-full" /><Skeleton className="h-64 w-full" /></div>;
  }

  const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Restaurant Profile</h2>
        <p className="text-muted-foreground mt-1">Manage how your restaurant appears to customers.</p>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Changes
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>Essential details about your restaurant.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Cover Image</Label>
            <ImageUpload 
              onUpload={(url) => setFormData(prev => ({ ...prev, coverImage: url }))} 
              uploadFn={uploadRestaurantImage}
              currentImageUrl={formData.coverImage}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="name">Restaurant Name</Label>
              <Input id="name" value={formData.name} onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input id="phone" value={formData.phone} onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input id="city" value={formData.city} onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="area">Area / Neighborhood</Label>
              <Input id="area" value={formData.area} onChange={(e) => setFormData(prev => ({ ...prev, area: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cuisineType">Cuisine Type</Label>
              <Input id="cuisineType" placeholder="e.g. Desi, Chinese, Continental" value={formData.cuisineType} onChange={(e) => setFormData(prev => ({ ...prev, cuisineType: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Price Range</Label>
              <Select value={formData.priceRange} onValueChange={(val) => setFormData(prev => ({ ...prev, priceRange: val }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="budget">Budget (Rs)</SelectItem>
                  <SelectItem value="mid">Mid-range (Rs Rs)</SelectItem>
                  <SelectItem value="fine">Fine Dining (Rs Rs Rs)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea 
              id="description" 
              rows={4}
              placeholder="Tell customers about your restaurant's vibe and specialties..."
              value={formData.description} 
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))} 
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Operating Hours</CardTitle>
          <CardDescription>Set your regular opening and closing times.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {days.map((day) => {
              const dayData = hours[day as keyof typeof hours];
              return (
                <div key={day} className="flex items-center justify-between gap-4 p-3 border rounded-lg bg-card/50">
                  <div className="w-24 font-medium capitalize">{day}</div>
                  <div className="flex items-center gap-4 flex-1">
                    {!dayData.closed ? (
                      <>
                        <Input 
                          type="time" 
                          value={dayData.open} 
                          onChange={(e) => handleHoursChange(day, 'open', e.target.value)}
                          className="w-32"
                        />
                        <span>to</span>
                        <Input 
                          type="time" 
                          value={dayData.close} 
                          onChange={(e) => handleHoursChange(day, 'close', e.target.value)}
                          className="w-32"
                        />
                      </>
                    ) : (
                      <span className="text-muted-foreground italic px-4">Closed all day</span>
                    )}
                  </div>
                  <Button 
                    variant={dayData.closed ? "default" : "outline"} 
                    size="sm"
                    onClick={() => handleHoursChange(day, 'closed', !dayData.closed)}
                  >
                    {dayData.closed ? "Open" : "Mark Closed"}
                  </Button>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
