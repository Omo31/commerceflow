"use client";
import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { PlusCircle, Trash2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import {
  addDoc,
  collection,
  doc,
  updateDoc,
  serverTimestamp,
  query,
} from "firebase/firestore";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/page-header";
import {
  useAuth,
  useFirestore,
  useCollection,
  useDoc,
  useMemoFirebase,
} from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import type { OrderItem, LandingPageData } from "@/lib/types";

type UnitOfMeasure = {
  id: string;
  name: string;
};

function NewOrderPageContent() {
  const { user } = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const searchParams = useSearchParams();

  const orderId = searchParams.get("orderId");
  const itemsParam = searchParams.get("items");
  const isEditing = !!orderId;

  const unitsQuery = useMemoFirebase(
    () => (firestore ? query(collection(firestore, "units_of_measure")) : null),
    [firestore],
  );
  const { data: unitsOfMeasure, isLoading: unitsLoading } =
    useCollection<UnitOfMeasure>(unitsQuery);

  const landingPageRef = useMemoFirebase(
    () => (firestore ? doc(firestore, "landingPage", "main") : null),
    [firestore],
  );
  const { data: landingPageData } = useDoc<LandingPageData>(landingPageRef);

  const defaultItems = itemsParam
    ? JSON.parse(itemsParam).filter(
        (item: OrderItem) => item.type !== "service",
      )
    : [{ name: "", quantity: 1, unitOfMeasure: "units" }];
  const defaultServices = itemsParam
    ? JSON.parse(itemsParam)
        .filter((item: OrderItem) => item.type === "service")
        .map((item: OrderItem) => item.name)
    : [];

  const { control, handleSubmit, register, reset, watch } = useForm({
    defaultValues: {
      items: defaultItems,
      selectedServices: defaultServices as string[],
    },
  });

  useEffect(() => {
    if (itemsParam) {
      try {
        const parsedItems = JSON.parse(itemsParam);
        reset({
          items: parsedItems.filter(
            (item: OrderItem) => item.type !== "service",
          ),
          selectedServices: parsedItems
            .filter((item: OrderItem) => item.type === "service")
            .map((item: OrderItem) => item.name),
        });
      } catch (e) {
        console.error("Failed to parse items from URL", e);
      }
    }
  }, [itemsParam, reset]);

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const onSubmit = async (data: {
    items: Omit<OrderItem, "id" | "price">[];
    selectedServices?: string[];
  }) => {
    if (!user || !firestore) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "You must be logged in to create an order.",
      });
      return;
    }

    const allItems = [
      ...data.items.map((item) => ({ ...item, type: "product" })),
    ];

    if (data.selectedServices && landingPageData?.services) {
      data.selectedServices.forEach((serviceName) => {
        const service = landingPageData.services.find(
          (s) => s.name === serviceName,
        );
        if (service) {
          allItems.push({
            name: service.name,
            quantity: 1,
            unitOfMeasure: "service",
            type: "service",
            description: service.description || "",
          });
        }
      });
    }

    if (allItems.length === 0) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "You must add at least one item or service.",
      });
      return;
    }

    try {
      const payload = {
        items: allItems,
        status: "Pending Review",
        updatedAt: serverTimestamp(),
        subtotal: 0,
        serviceCharge: 0,
        total: 0,
      };

      if (isEditing && orderId) {
        const orderRef = doc(firestore, "customOrders", orderId);
        await updateDoc(orderRef, payload);
        toast({
          title: "Success!",
          description:
            "Your order has been updated and resubmitted for review.",
        });
        router.push(`/dashboard/orders/${orderId}`);
      } else {
        await addDoc(collection(firestore, "customOrders"), {
          ...payload,
          userId: user.uid,
          createdAt: serverTimestamp(),
        });
        toast({
          title: "Success!",
          description: "Your custom order has been submitted for review.",
        });
        router.push("/dashboard/orders");
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error saving order",
        description: error.message,
      });
    }
  };

  return (
    <>
      <PageHeader
        title={isEditing ? "Edit Custom Order" : "Create New Custom Order"}
      />
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Custom Items</CardTitle>
            <CardDescription>
              {isEditing
                ? "Modify your custom items below and resubmit for a new quote."
                : "Add any custom items you want to order. An admin will price them for you."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-1/2">Item Name</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Unit of Measure</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fields.map((field, index) => (
                  <TableRow key={field.id}>
                    <TableCell>
                      <Input
                        {...register(`items.${index}.name`, { required: true })}
                        placeholder="e.g., Blue Velvet Fabric"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        {...register(`items.${index}.quantity`, {
                          required: true,
                          valueAsNumber: true,
                          min: 1,
                        })}
                      />
                    </TableCell>
                    <TableCell>
                      <Controller
                        control={control}
                        name={`items.${index}.unitOfMeasure`}
                        render={({ field }) => (
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            disabled={unitsLoading}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select unit" />
                            </SelectTrigger>
                            <SelectContent>
                              {unitsOfMeasure?.map((unit) => (
                                <SelectItem key={unit.id} value={unit.name}>
                                  {unit.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => remove(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Button
              type="button"
              variant="outline"
              className="mt-4"
              onClick={() =>
                append({ name: "", quantity: 1, unitOfMeasure: "units" })
              }
            >
              <PlusCircle className="mr-2 h-4 w-4" /> Add Another Item
            </Button>
          </CardContent>
        </Card>

        {landingPageData?.services && landingPageData.services.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Our Services</CardTitle>
              <CardDescription>
                Select any additional services you require.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Controller
                control={control}
                name="selectedServices"
                render={({ field }) => (
                  <div className="space-y-2">
                    {landingPageData.services.map((service) => (
                      <div
                        key={service.name}
                        className="flex items-center space-x-2"
                      >
                        <Checkbox
                          id={service.name}
                          checked={field.value?.includes(service.name)}
                          onCheckedChange={(checked) => {
                            const newValue = [...(field.value || [])];
                            if (checked) {
                              newValue.push(service.name);
                            } else {
                              const index = newValue.indexOf(service.name);
                              if (index > -1) {
                                newValue.splice(index, 1);
                              }
                            }
                            field.onChange(newValue);
                          }}
                        />
                        <Label htmlFor={service.name} className="font-medium">
                          {service.name}
                        </Label>
                        {service.description && (
                          <p className="text-sm text-muted-foreground">
                            - {service.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              />
            </CardContent>
          </Card>
        )}

        <div className="flex justify-between">
          <Button variant="outline" asChild>
            <Link href="/dashboard/orders">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Link>
          </Button>
          <Button type="submit">
            {isEditing
              ? "Resubmit Order for Review"
              : "Submit Order for Review"}
          </Button>
        </div>
      </form>
    </>
  );
}

export default function NewOrderPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <NewOrderPageContent />
    </Suspense>
  );
}
