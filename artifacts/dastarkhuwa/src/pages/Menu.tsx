import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { sanitizeStr, sanitizeNum, isValidMenuCategory, safeErrorMessage } from "@/lib/security";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { ImageUpload } from "@/components/ImageUpload";
import { uploadMenuImage } from "@/lib/imageUpload";
import { formatPKR } from "@/lib/utils";
import { Plus, Edit, Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Menu() {
  const { restaurantId, user, loading: authLoading } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("Starters");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isAvailable, setIsAvailable] = useState(true);

  const { toast } = useToast();

  useEffect(() => {
    if (authLoading) return;
    if (!restaurantId) { setLoading(false); return; }

    setLoading(true);

    const fetchItems = async () => {
      const { data, error } = await supabase
        .from("menu_items")
        .select("*")
        .eq("restaurant_id", restaurantId)
        .eq("is_deleted", false)
        .limit(50);
      if (!error) setItems(data || []);
      setLoading(false);
    };

    fetchItems();

    const channel = supabase
      .channel(`menu-${restaurantId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "menu_items", filter: `restaurant_id=eq.${restaurantId}` }, fetchItems)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [restaurantId, authLoading]);

  const resetForm = () => {
    setName(""); setPrice(""); setCategory("Starters");
    setDescription(""); setImageUrl(""); setIsAvailable(true);
    setEditingItem(null);
  };

  const handleOpenModal = (item: any = null) => {
    if (item) {
      setEditingItem(item);
      setName(item.name);
      setPrice(item.price.toString());
      setCategory(item.category);
      setDescription(item.description || "");
      setImageUrl(item.image_url || "");
      setIsAvailable(item.is_available !== false);
    } else {
      resetForm();
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (isSaving) return;

    const cleanName = sanitizeStr(name, 120);
    const cleanDesc = sanitizeStr(description, 500);
    const cleanPrice = sanitizeNum(price, 0, 999999);
    const cleanCategory = isValidMenuCategory(category) ? category : null;

    if (!cleanName) { toast({ title: "Validation Error", description: "Name is required (max 120 chars).", variant: "destructive" }); return; }
    if (cleanPrice === null) { toast({ title: "Validation Error", description: "Price must be a valid number between 0 and 999,999.", variant: "destructive" }); return; }
    if (!cleanCategory) { toast({ title: "Validation Error", description: "Invalid category selected.", variant: "destructive" }); return; }

    setIsSaving(true);
    try {
      if (editingItem) {
        const { error } = await supabase
          .from("menu_items")
          .update({
            name: cleanName,
            price: cleanPrice,
            category: cleanCategory,
            description: cleanDesc,
            image_url: sanitizeStr(imageUrl, 2000),
            is_available: isAvailable,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingItem.id);
        if (error) throw error;
        toast({ title: "Item Updated", description: "Menu item has been updated successfully." });
      } else {
        const uid = user?.id;
        if (!uid) throw new Error("Not authenticated");
        const { error } = await supabase
          .from("menu_items")
          .insert({
            name: cleanName,
            price: cleanPrice,
            category: cleanCategory,
            description: cleanDesc,
            image_url: sanitizeStr(imageUrl, 2000),
            is_available: isAvailable,
            restaurant_id: restaurantId,
            owner_id: uid,
            is_deleted: false,
          });
        if (error) throw error;
        toast({ title: "Item Added", description: "Menu item has been added successfully." });
      }
      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      toast({ title: "Error", description: safeErrorMessage(error), variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (isDeleting) return;
    setIsDeleting(id);
    try {
      const { error } = await supabase
        .from("menu_items")
        .update({ is_deleted: true, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
      toast({ title: "Item Removed", description: "Menu item has been removed." });
    } catch (error) {
      toast({ title: "Error", description: safeErrorMessage(error), variant: "destructive" });
    } finally {
      setIsDeleting(null);
    }
  };

  const toggleAvailability = async (id: string, current: boolean) => {
    try {
      const { error } = await supabase
        .from("menu_items")
        .update({ is_available: !current, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
      toast({ title: "Availability Updated" });
    } catch (error) {
      toast({ title: "Error", description: safeErrorMessage(error), variant: "destructive" });
    }
  };

  if (loading) {
    return <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-64 w-full" />)}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Menu Management</h2>
        <Dialog open={isModalOpen} onOpenChange={(open) => { setIsModalOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenModal()} className="gap-2"><Plus className="h-4 w-4" /> Add Item</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{editingItem ? "Edit Menu Item" : "Add Menu Item"}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto">
              <div className="space-y-2">
                <Label>Image</Label>
                <ImageUpload onUpload={setImageUrl} uploadFn={uploadMenuImage} currentImageUrl={imageUrl} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="item-name">Name</Label>
                <Input id="item-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={120} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="item-price">Price (PKR)</Label>
                  <Input id="item-price" type="number" min="0" max="999999" value={price} onChange={(e) => setPrice(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Starters">Starters</SelectItem>
                      <SelectItem value="Main Course">Main Course</SelectItem>
                      <SelectItem value="Desserts">Desserts</SelectItem>
                      <SelectItem value="Drinks">Drinks</SelectItem>
                      <SelectItem value="Deals">Deals</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="item-desc">Description</Label>
                <Textarea id="item-desc" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={500} />
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="available" checked={isAvailable} onCheckedChange={setIsAvailable} />
                <Label htmlFor="available">Available for ordering</Label>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={isSaving}>{isSaving ? "Saving..." : "Save"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {items.length === 0 ? (
          <div className="col-span-full py-12 text-center text-muted-foreground border-2 border-dashed border-border rounded-lg">
            No menu items found. Add some items to get started.
          </div>
        ) : (
          items.map(item => (
            <Card key={item.id} className={`overflow-hidden transition-opacity ${!item.is_available ? "opacity-60" : ""}`}>
              {item.image_url ? (
                <div className="h-48 w-full overflow-hidden bg-muted">
                  <img src={item.image_url} alt={item.name} className="h-full w-full object-cover transition-transform hover:scale-105" />
                </div>
              ) : (
                <div className="h-48 w-full bg-muted flex items-center justify-center text-muted-foreground">No Image</div>
              )}
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-semibold text-lg line-clamp-1">{item.name}</h3>
                    <span className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full">{item.category}</span>
                  </div>
                  <span className="font-bold text-primary">{formatPKR(item.price)}</span>
                </div>
                {item.description && <p className="text-sm text-muted-foreground line-clamp-2 mb-4 h-10">{item.description}</p>}
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                  <div className="flex items-center space-x-2">
                    <Switch checked={item.is_available} onCheckedChange={() => toggleAvailability(item.id, item.is_available)} />
                    <span className="text-xs text-muted-foreground">{item.is_available ? "Available" : "Unavailable"}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => handleOpenModal(item)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10" disabled={isDeleting === item.id}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remove Menu Item</AlertDialogTitle>
                          <AlertDialogDescription>Are you sure you want to remove {item.name}?</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => handleDelete(item.id)}>Remove</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
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
