"use client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import {
  useAuth,
  useFirestore,
  useCollection,
  useMemoFirebase,
} from "@/firebase";
import type { Product, CartItem } from "@/lib/types";
import { collection, query, doc, setDoc } from "firebase/firestore";
import Image from "next/image";
import { useToast } from "@/hooks/use-toast";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";

const ProductsList = () => {
  const firestore = useFirestore();
  const { user } = useAuth();
  const { toast } = useToast();

  const productsQuery = useMemoFirebase(
    () => (firestore ? query(collection(firestore, "products")) : null),
    [firestore],
  );
  const { data: products, isLoading: isProductsLoading } =
    useCollection<Product>(productsQuery);

  const cartQuery = useMemoFirebase(
    () =>
      firestore && user
        ? query(collection(firestore, `users/${user.uid}/cart`))
        : null,
    [firestore, user],
  );
  const { data: cartItems, isLoading: isCartLoading } =
    useCollection<CartItem>(cartQuery);

  const handleAddToCart = (product: Product) => {
    if (!user || !firestore) {
      toast({
        variant: "destructive",
        title: "Authentication Error",
        description: "You must be logged in to add items to your cart.",
      });
      return;
    }

    const cartItemRef = doc(firestore, `users/${user.uid}/cart`, product.id);

    const cartItem: Omit<CartItem, "id"> = {
      productId: product.id,
      name: product.name,
      quantity: 1, // Default to 1, can be updated in the cart
      price: product.price,
      imageUrl: product.imageUrl,
    };

    setDoc(cartItemRef, cartItem, { merge: true })
      .then(() => {
        toast({
          title: "Added to Cart",
          description: `${product.name} has been added to your cart.`,
        });
      })
      .catch(() => {
        const permissionError = new FirestorePermissionError({
          path: cartItemRef.path,
          operation: "write",
          requestResourceData: cartItem,
        });
        errorEmitter.emit("permission-error", permissionError);
      });
  };

  const isItemInCart = (productId: string) => {
    return cartItems?.some((item) => item.productId === productId);
  };

  const showLoadingSkeleton = isProductsLoading || isCartLoading;

  if (showLoadingSkeleton) {
    return (
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <div className="bg-muted aspect-[4/3] w-full rounded-t-lg"></div>
            <CardHeader>
              <div className="h-6 w-3/4 rounded-md bg-muted"></div>
            </CardHeader>
            <CardContent>
              <div className="h-4 w-1/2 rounded-md bg-muted mb-2"></div>
              <div className="h-4 w-1/4 rounded-md bg-muted"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (products?.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center text-center py-12">
          <h3 className="mt-4 text-xl font-semibold">No Products Found</h3>
          <p className="mt-2 text-muted-foreground">
            There are currently no products available in the shop.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {products?.map((product) => (
        <Card key={product.id}>
          <CardHeader className="p-0">
            <div className="aspect-[4/3] w-full relative">
              <Image
                src={product.imageUrl}
                alt={product.name}
                fill
                className="rounded-t-lg object-cover"
              />
            </div>
          </CardHeader>
          <CardContent className="p-4">
            <h3 className="font-space-grotesk text-lg font-semibold">
              {product.name}
            </h3>
            <p className="text-sm text-muted-foreground mt-1 h-10 font-inter">
              {product.description}
            </p>
            <div className="flex justify-between items-center mt-4">
              <p className="font-inter font-bold text-xl">
                ₦{product.price.toFixed(2)}
              </p>
              <Button
                onClick={() => handleAddToCart(product)}
                disabled={!user || isItemInCart(product.id)}
              >
                {isItemInCart(product.id) ? "In Cart" : "Add to Cart"}
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default function ShopPage() {
  return (
    <>
      <PageHeader title="Shop" />
      <ProductsList />
    </>
  );
}
