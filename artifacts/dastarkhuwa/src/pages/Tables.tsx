import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { auth, db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, serverTimestamp, limit } from "firebase/firestore";
import { sanitizeStr, sanitizeNum, isValidTableStatus, isValidTableLocation, safeErrorMessage } from "@/lib/security";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Users, Edit } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export default function Tables() {
  const { restaurantId, loading: authLoading } = useAuth();
  const [tables, setTables] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const [tableNumber, setTableNumber] = useState("");
  const [capacity, setCapacity] = useState("");
  const [location, setLocation] = useState("indoor");
  const [status, setStatus] = useState("available");

  const { toast } = useToast();

  useEffect(() => {
    if (authLoading) return;
    if (!restaurantId) { setLoading(false); return; }

    setLoading(true);
    const q = query(
      collection(db, `tables/${restaurantId}/slots`),
      where("isDeleted", "==", false),
      limit(100)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        setTables(data.sort((a, b) =>
          a.tableNumber.localeCompare(b.tableNumber, undefined, { numeric: true })
        ));
        setLoading(false);
      },
      (error) => {
        console.error("[Tables] listener error:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [restaurantId, authLoading]);

  const resetForm = () => {
    setTableNumber(""); setCapacity(""); setLocation("indoor");
    setStatus("available"); setEditingTable(null);
  };

  const handleOpenModal = (table: any = null) => {
    if (table) {
      setEditingTable(table);
      setTableNumber(table.tableNumber);
      setCapacity(table.capacity.toString());
      setLocation(table.location);
      setStatus(table.status || "available");
    } else {
      resetForm();
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (isSaving) return;

    const cleanTableNum = sanitizeStr(tableNumber, 20);
    const cleanCapacity = sanitizeNum(capacity, 1, 100);
    const cleanLocation = isValidTableLocation(location) ? location : null;
    const cleanStatus = isValidTableStatus(status) ? status : null;

    if (!cleanTableNum) {
      toast({ title: "Validation Error", description: "Table number/name is required.", variant: "destructive" });
      return;
    }
    if (cleanCapacity === null) {
      toast({ title: "Validation Error", description: "Capacity must be between 1 and 100.", variant: "destructive" });
      return;
    }
    if (!cleanLocation) {
      toast({ title: "Validation Error", description: "Invalid location selected.", variant: "destructive" });
      return;
    }
    if (!cleanStatus) {
      toast({ title: "Validation Error", description: "Invalid status selected.", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    try {
      const baseData = {
        tableNumber: cleanTableNum,
        capacity: cleanCapacity,
        location: cleanLocation,
        status: cleanStatus,
        restaurantId,
        updatedAt: serverTimestamp(),
      };

      if (editingTable) {
        await updateDoc(doc(db, `tables/${restaurantId}/slots`, editingTable.id), baseData);
        toast({ title: "Table Updated", description: "Table has been updated successfully." });
      } else {
        const uid = auth.currentUser?.uid;
        if (!uid) throw new Error("Not authenticated — cannot write ownerId");
        await addDoc(collection(db, `tables/${restaurantId}/slots`), {
          ...baseData,
          ownerId: uid,
          isDeleted: false,
          createdAt: serverTimestamp(),
        });
        toast({ title: "Table Added", description: "Table has been added successfully." });
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
      // Soft delete — never permanently remove
      await updateDoc(doc(db, `tables/${restaurantId}/slots`, id), {
        isDeleted: true,
        deletedAt: serverTimestamp(),
      });
      toast({ title: "Table Removed", description: "Table has been removed." });
    } catch (error) {
      toast({ title: "Error", description: safeErrorMessage(error), variant: "destructive" });
    } finally {
      setIsDeleting(null);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    if (!isValidTableStatus(newStatus)) return;
    try {
      await updateDoc(doc(db, `tables/${restaurantId}/slots`, id), {
        status: newStatus,
        updatedAt: serverTimestamp(),
      });
      toast({ title: "Status Updated", description: `Table status changed to ${newStatus}.` });
    } catch (error) {
      toast({ title: "Error", description: safeErrorMessage(error), variant: "destructive" });
    }
  };

  const getStatusColor = (s: string) => {
    switch (s) {
      case "available": return "bg-green-500/10 border-green-500 text-green-500";
      case "occupied": return "bg-red-500/10 border-red-500 text-red-500";
      case "reserved": return "bg-yellow-500/10 border-yellow-500 text-yellow-500";
      case "maintenance": return "bg-gray-500/10 border-gray-500 text-gray-400";
      default: return "bg-card border-border";
    }
  };

  if (loading) {
    return <div className="grid gap-4 md:grid-cols-4 lg:grid-cols-6">{[1, 2, 3, 4, 5, 6, 7, 8].map(i => <Skeleton key={i} className="h-32 w-full" />)}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Table Management</h2>
          <div className="flex gap-4 mt-2 text-sm">
            <span className="flex items-center"><span className="w-3 h-3 rounded-full bg-green-500 mr-2"></span>Available</span>
            <span className="flex items-center"><span className="w-3 h-3 rounded-full bg-red-500 mr-2"></span>Occupied</span>
            <span className="flex items-center"><span className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></span>Reserved</span>
          </div>
        </div>

        <Dialog open={isModalOpen} onOpenChange={(open) => { setIsModalOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenModal()} className="gap-2">
              <Plus className="h-4 w-4" /> Add Table
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{editingTable ? "Edit Table" : "Add Table"}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tableNumber">Table Number/Name</Label>
                  <Input id="tableNumber" placeholder="e.g. T1, Balcony-1" value={tableNumber} onChange={(e) => setTableNumber(e.target.value)} maxLength={20} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="capacity">Capacity (Seats)</Label>
                  <Input id="capacity" type="number" min="1" max="100" value={capacity} onChange={(e) => setCapacity(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Location</Label>
                <Select value={location} onValueChange={setLocation}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="indoor">Indoor</SelectItem>
                    <SelectItem value="outdoor">Outdoor</SelectItem>
                    <SelectItem value="rooftop">Rooftop</SelectItem>
                    <SelectItem value="patio">Patio</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Current Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="occupied">Occupied</SelectItem>
                    <SelectItem value="reserved">Reserved</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-between items-center">
              {editingTable ? (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm" disabled={isDeleting === editingTable?.id}>Remove Table</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Remove Table</AlertDialogTitle>
                      <AlertDialogDescription>Are you sure? The table will be hidden from all views.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => { handleDelete(editingTable.id); setIsModalOpen(false); }}>Remove</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              ) : <div />}
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button onClick={handleSave} disabled={isSaving}>{isSaving ? "Saving..." : "Save"}</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {tables.length === 0 ? (
          <div className="col-span-full py-12 text-center text-muted-foreground border-2 border-dashed border-border rounded-lg">
            No tables configured yet.
          </div>
        ) : (
          tables.map(table => (
            <Card key={table.id} className={cn("relative overflow-hidden cursor-pointer border-2 transition-all hover:-translate-y-1", getStatusColor(table.status))}>
              <div
                className="absolute inset-0"
                onClick={() => {
                  const nextStatus =
                    table.status === "available" ? "occupied" :
                    table.status === "occupied" ? "available" :
                    table.status === "reserved" ? "occupied" : "available";
                  handleStatusChange(table.id, nextStatus);
                }}
              />
              <CardContent className="p-4 flex flex-col items-center justify-center text-center h-32 relative z-10 pointer-events-none">
                <span className="text-2xl font-bold mb-1">{table.tableNumber}</span>
                <div className="flex items-center text-sm font-medium opacity-80">
                  <Users className="h-4 w-4 mr-1" /> {table.capacity}
                </div>
                <span className="text-xs mt-2 uppercase tracking-wider opacity-60 font-semibold">{table.location}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-1 right-1 h-6 w-6 pointer-events-auto bg-background/50 hover:bg-background"
                  onClick={(e) => { e.stopPropagation(); handleOpenModal(table); }}
                >
                  <Edit className="h-3 w-3" />
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
