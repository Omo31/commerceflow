"use client";
import {
  PlusCircle,
  MoreHorizontal,
  File,
  Wand2,
  Loader2,
  X,
} from "lucide-react";
import Image from "next/image";
import { useMemo, useState, useTransition } from "react";
import {
  collection,
  query,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";

import { Button } from "@/components/ui/button";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import type { Product, ProductVariant } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { generateProductDetails } from "@/ai/flows/generate-product-details";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const productImages = PlaceHolderImages.filter((p) =>
  p.id.startsWith("product-"),
);

export default function ProductsPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Partial<Product> | null>(
    null,
  );
  const [isGenerating, startTransition] = useTransition();
  const [aiKeywords, setAiKeywords] = useState("");

  const productsQuery = useMemoFirebase(
    () => (firestore ? query(collection(firestore, "products")) : null),
    [firestore],
  );
  const { data: products } = useCollection<Product>(productsQuery);

  const handleAddNew = () => {
    setCurrentProduct({
      variants: [],
      tags: [],
      status: "draft",
      relatedProducts: [],
    });
    setAiKeywords("");
    setIsDialogOpen(true);
  };

  const handleEdit = (product: Product) => {
    setCurrentProduct(JSON.parse(JSON.stringify(product)));
    setAiKeywords("");
    setIsDialogOpen(true);
  };

  const handleDelete = async (productId: string) => {
    if (!firestore) return;
    try {
      await deleteDoc(doc(firestore, "products", productId));
      toast({ title: "Product deleted successfully!" });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error deleting product",
        description: error.message,
      });
    }
  };

  const handleSave = async () => {
    if (!firestore || !currentProduct) return;

    if (
      !currentProduct.name ||
      !currentProduct.price ||
      !currentProduct.category
    ) {
      toast({
        variant: "destructive",
        title: "Missing Fields",
        description: "Please fill in all required fields.",
      });
      return;
    }

    const productData = { ...currentProduct };

    try {
      if (productData.id) {
        const productRef = doc(firestore, "products", productData.id);
        await updateDoc(productRef, {
          ...productData,
          updatedAt: serverTimestamp(),
        });
        toast({ title: "Product updated successfully!" });
      } else {
        const randomImage =
          productImages[Math.floor(Math.random() * productImages.length)];
        await addDoc(collection(firestore, "products"), {
          ...productData,
          imageUrl: productData.imageUrl || randomImage.imageUrl,
          imageHint: productData.imageHint || randomImage.imageHint,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        toast({ title: "Product created successfully!" });
      }
      setIsDialogOpen(false);
      setCurrentProduct(null);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error saving product",
        description: error.message,
      });
    }
  };

  const handleFieldChange = (field: keyof Product, value: any) => {
    setCurrentProduct((prev) => ({ ...prev, [field]: value }));
  };

  const handleVariantChange = (
    index: number,
    field: keyof ProductVariant,
    value: string | number,
  ) => {
    const variants = [...(currentProduct?.variants || [])];
    variants[index] = { ...variants[index], [field]: value };
    setCurrentProduct((prev) => ({ ...prev, variants }));
  };

  const addVariant = () => {
    const variants = [
      ...(currentProduct?.variants || []),
      { name: "", price: 0, quantity: 0, sku: "" },
    ];
    setCurrentProduct((prev) => ({ ...prev, variants }));
  };

  const removeVariant = (index: number) => {
    const variants = [...(currentProduct?.variants || [])];
    variants.splice(index, 1);
    setCurrentProduct((prev) => ({ ...prev, variants }));
  };

  const handleAiGenerate = () => {
    if (!aiKeywords) {
      toast({
        variant: "destructive",
        title: "Keywords required",
        description: "Please enter some keywords to generate details.",
      });
      return;
    }
    startTransition(async () => {
      try {
        const result = await generateProductDetails({ keywords: aiKeywords });
        setCurrentProduct((prev) => ({
          ...prev,
          name: result.name,
          description: result.description,
          category: result.category,
        }));
        toast({
          title: "AI Generation Complete",
          description: "Product details have been populated.",
        });
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "AI Generation Failed",
          description: error.message,
        });
      }
    });
  };

  return (
    <>
      <PageHeader title="Products">
        <div className="flex gap-2">
          <Button size="sm" variant="outline">
            <File className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button size="sm" onClick={handleAddNew}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Product
          </Button>
        </div>
      </PageHeader>
      <Card>
        <CardHeader>
          <CardTitle>Manage Products</CardTitle>
          <CardDescription>
            A list of all products in your store.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="hidden w-[100px] sm:table-cell">
                  <span className="sr-only">Image</span>
                </TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="hidden md:table-cell">Price</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead className="hidden md:table-cell">
                  Created at
                </TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products?.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="hidden sm:table-cell">
                    <Image
                      alt={product.name}
                      className="aspect-square rounded-md object-cover"
                      height="64"
                      src={product.imageUrl || "/placeholder.svg"}
                      width="64"
                    />
                  </TableCell>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        product.status === "active" ? "default" : "secondary"
                      }
                    >
                      {product.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{product.category}</Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    ₦{product.price.toFixed(2)}
                  </TableCell>
                  <TableCell>{product.quantity}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    {product.createdAt
                      ? new Date(product.createdAt).toLocaleDateString()
                      : "N/A"}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          aria-haspopup="true"
                          size="icon"
                          variant="ghost"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Toggle menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleEdit(product)}>
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(product.id)}
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter>
          <div className="text-xs text-muted-foreground">
            Showing <strong>1-{products?.length ?? 0}</strong> of{" "}
            <strong>{products?.length ?? 0}</strong> products
          </div>
        </CardFooter>
      </Card>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {currentProduct?.id ? "Edit Product" : "Add New Product"}
            </DialogTitle>
            <DialogDescription>
              Fill in the details for the product. Click save when you&apos;re
              done.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2 p-4 border rounded-lg">
              <Label htmlFor="ai-keywords">Generate with AI</Label>
              <div className="flex gap-2">
                <Input
                  id="ai-keywords"
                  placeholder="e.g., red silk fabric, summer dress"
                  value={aiKeywords}
                  onChange={(e) => setAiKeywords(e.target.value)}
                />
                <Button
                  type="button"
                  onClick={handleAiGenerate}
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Wand2 className="mr-2 h-4 w-4" />
                  )}
                  Generate
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Enter keywords and let AI create the product details for you.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={currentProduct?.name || ""}
                  onChange={(e) => handleFieldChange("name", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Price (₦)</Label>
                <Input
                  id="price"
                  type="number"
                  value={currentProduct?.price || ""}
                  onChange={(e) =>
                    handleFieldChange("price", Number(e.target.value))
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={currentProduct?.description || ""}
                onChange={(e) =>
                  handleFieldChange("description", e.target.value)
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={currentProduct?.category || ""}
                  onChange={(e) =>
                    handleFieldChange("category", e.target.value)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tags">Tags</Label>
                <Input
                  id="tags"
                  value={currentProduct?.tags?.join(", ") || ""}
                  onChange={(e) =>
                    handleFieldChange("tags", e.target.value.split(", "))
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sku">SKU</Label>
                <Input
                  id="sku"
                  value={currentProduct?.sku || ""}
                  onChange={(e) => handleFieldChange("sku", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quantity">Stock Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  value={currentProduct?.quantity || ""}
                  onChange={(e) =>
                    handleFieldChange("quantity", Number(e.target.value))
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={currentProduct?.status}
                  onValueChange={(value) => handleFieldChange("status", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="weight">Weight (kg)</Label>
                <Input
                  id="weight"
                  type="number"
                  value={currentProduct?.weight || ""}
                  onChange={(e) =>
                    handleFieldChange("weight", Number(e.target.value))
                  }
                />
              </div>
            </div>

            <div>
              <Label>Dimensions (cm)</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Length"
                  type="number"
                  value={currentProduct?.dimensions?.length || ""}
                  onChange={(e) =>
                    setCurrentProduct((prev) => ({
                      ...prev,
                      dimensions: {
                        ...prev?.dimensions,
                        length: Number(e.target.value),
                      },
                    }))
                  }
                />
                <Input
                  placeholder="Width"
                  type="number"
                  value={currentProduct?.dimensions?.width || ""}
                  onChange={(e) =>
                    setCurrentProduct((prev) => ({
                      ...prev,
                      dimensions: {
                        ...prev?.dimensions,
                        width: Number(e.target.value),
                      },
                    }))
                  }
                />
                <Input
                  placeholder="Height"
                  type="number"
                  value={currentProduct?.dimensions?.height || ""}
                  onChange={(e) =>
                    setCurrentProduct((prev) => ({
                      ...prev,
                      dimensions: {
                        ...prev?.dimensions,
                        height: Number(e.target.value),
                      },
                    }))
                  }
                />
              </div>
            </div>

            <div>
              <Label>Variants</Label>
              {currentProduct?.variants?.map((variant, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 p-2 border rounded-md"
                >
                  <Input
                    placeholder="Name (e.g., Red, Large)"
                    value={variant.name}
                    onChange={(e) =>
                      handleVariantChange(index, "name", e.target.value)
                    }
                  />
                  <Input
                    placeholder="Price"
                    type="number"
                    value={variant.price}
                    onChange={(e) =>
                      handleVariantChange(
                        index,
                        "price",
                        Number(e.target.value),
                      )
                    }
                  />
                  <Input
                    placeholder="Quantity"
                    type="number"
                    value={variant.quantity}
                    onChange={(e) =>
                      handleVariantChange(
                        index,
                        "quantity",
                        Number(e.target.value),
                      )
                    }
                  />
                  <Input
                    placeholder="SKU"
                    value={variant.sku}
                    onChange={(e) =>
                      handleVariantChange(index, "sku", e.target.value)
                    }
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeVariant(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={addVariant}
              >
                <PlusCircle className="mr-2 h-4 w-4" /> Add Variant
              </Button>
            </div>

            <div>
              <Label htmlFor="relatedProducts">Related Products</Label>
              <Select
                value={currentProduct?.relatedProducts}
                onValueChange={(value) =>
                  handleFieldChange("relatedProducts", value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select related products" />
                </SelectTrigger>
                <SelectContent>
                  {products?.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleSave}>Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
