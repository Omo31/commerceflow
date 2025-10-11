"use client";
import { PageHeader } from "@/components/page-header";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, addDoc, deleteDoc, doc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Trash2 } from "lucide-react";

type UnitOfMeasure = {
  id: string;
  name: string;
};

export default function AdminSettingsPage() {
  const firestore = useFirestore();
  const { toast } = useToast();

  const [newUnit, setNewUnit] = useState("");

  // --- Data Fetching ---
  const unitsQuery = useMemoFirebase(
    () => (firestore ? query(collection(firestore, "units_of_measure")) : null),
    [firestore],
  );
  const { data: unitsOfMeasure, isLoading: unitsLoading } =
    useCollection<UnitOfMeasure>(unitsQuery);

  // --- Units of Measure Handlers ---
  const handleAddUnit = async () => {
    if (!firestore || !newUnit.trim()) return;
    try {
      await addDoc(collection(firestore, "units_of_measure"), {
        name: newUnit.trim(),
      });
      toast({ title: "Unit added!" });
      setNewUnit("");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error adding unit",
        description: error.message,
      });
    }
  };

  const handleDeleteUnit = async (id: string) => {
    if (!firestore) return;
    try {
      await deleteDoc(doc(firestore, "units_of_measure", id));
      toast({ title: "Unit deleted!" });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error deleting unit",
        description: error.message,
      });
    }
  };

  return (
    <>
      <PageHeader title="Admin Settings" />
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Order Settings</CardTitle>
            <CardDescription>
              Configure settings related to custom orders.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Accepted Units of Measure</Label>
                <div className="space-y-2">
                  {unitsLoading && <p>Loading units...</p>}
                  {unitsOfMeasure?.map((unit) => (
                    <div
                      key={unit.id}
                      className="flex items-center justify-between gap-2 rounded-md bg-secondary px-3 py-2 text-sm"
                    >
                      <span>{unit.name}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground"
                        onClick={() => handleDeleteUnit(unit.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  {unitsOfMeasure?.length === 0 && !unitsLoading && (
                    <p className="text-sm text-muted-foreground">
                      No units added yet.
                    </p>
                  )}
                </div>
                <div className="flex gap-2 pt-4">
                  <Input
                    value={newUnit}
                    onChange={(e) => setNewUnit(e.target.value)}
                    placeholder="Add new unit (e.g., pieces)"
                  />
                  <Button onClick={handleAddUnit}>Add Unit</Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
