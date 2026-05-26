import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { db } from "@/lib/firebase";
import { collection, query, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, User, Phone, Edit, Trash2, ShieldCheck } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export default function Staff() {
  const { restaurantId } = useAuth();
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<any>(null);
  
  const [name, setName] = useState("");
  const [role, setRole] = useState("Waiter");
  const [phone, setPhone] = useState("");
  const [isActive, setIsActive] = useState(true);

  const { toast } = useToast();

  useEffect(() => {
    if (!restaurantId) return;

    const q = query(collection(db, `staff/${restaurantId}/members`));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setStaff(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [restaurantId]);

  const resetForm = () => {
    setName("");
    setRole("Waiter");
    setPhone("");
    setIsActive(true);
    setEditingStaff(null);
  };

  const handleOpenModal = (member: any = null) => {
    if (member) {
      setEditingStaff(member);
      setName(member.name);
      setRole(member.role);
      setPhone(member.phone || "");
      setIsActive(member.isActive !== false);
    } else {
      resetForm();
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!name || !role) {
      toast({ title: "Validation Error", description: "Name and role are required.", variant: "destructive" });
      return;
    }

    try {
      const data = {
        name,
        role,
        phone,
        isActive,
        updatedAt: new Date().toISOString()
      };

      if (editingStaff) {
        await updateDoc(doc(db, `staff/${restaurantId}/members`, editingStaff.id), data);
        toast({ title: "Staff Updated", description: "Staff member has been updated." });
      } else {
        await addDoc(collection(db, `staff/${restaurantId}/members`), {
          ...data,
          createdAt: new Date().toISOString()
        });
        toast({ title: "Staff Added", description: "Staff member has been added successfully." });
      }
      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      toast({ title: "Error", description: "Failed to save staff member.", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, `staff/${restaurantId}/members`, id));
      toast({ title: "Staff Deleted", description: "Staff member has been removed." });
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete staff member.", variant: "destructive" });
    }
  };

  if (loading) {
    return <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{[1,2,3].map(i => <Skeleton key={i} className="h-32 w-full" />)}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Staff Management</h2>
          <p className="text-muted-foreground mt-1">Manage roles and access for your team.</p>
        </div>
        
        <Dialog open={isModalOpen} onOpenChange={(open) => { setIsModalOpen(open); if(!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenModal()} className="gap-2">
              <Plus className="h-4 w-4" /> Add Staff
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{editingStaff ? "Edit Staff Member" : "Add Staff Member"}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Manager">Manager</SelectItem>
                    <SelectItem value="Chef">Chef</SelectItem>
                    <SelectItem value="Waiter">Waiter</SelectItem>
                    <SelectItem value="Cashier">Cashier</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <div className="flex items-center space-x-2 pt-2">
                <Switch id="active" checked={isActive} onCheckedChange={setIsActive} />
                <Label htmlFor="active">Active employee</Label>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button onClick={handleSave}>Save</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {staff.length === 0 ? (
          <div className="col-span-full py-12 text-center text-muted-foreground border-2 border-dashed border-border rounded-lg">
            No staff members configured. Add your team here.
          </div>
        ) : (
          staff.map(member => (
            <Card key={member.id} className={cn("overflow-hidden transition-all", !member.isActive && "opacity-60")}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                      {member.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{member.name}</h3>
                      <div className="flex items-center text-xs text-muted-foreground mt-0.5">
                        <ShieldCheck className="h-3 w-3 mr-1" /> {member.role}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => handleOpenModal(member)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive/70 hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remove Staff Member</AlertDialogTitle>
                          <AlertDialogDescription>Are you sure you want to remove {member.name}? This action cannot be undone.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => handleDelete(member.id)}>Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
                
                {member.phone && (
                  <div className="mt-4 flex items-center text-sm text-muted-foreground border-t border-border pt-4">
                    <Phone className="h-4 w-4 mr-2" /> {member.phone}
                  </div>
                )}
                
                {!member.isActive && (
                  <div className="mt-2 text-xs font-semibold text-destructive">Inactive Account</div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
