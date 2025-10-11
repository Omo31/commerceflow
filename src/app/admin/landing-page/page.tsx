"use client";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useDoc } from "@/firebase/firestore/use-doc";
import { doc, setDoc } from "firebase/firestore";
import { useFirestore } from "@/firebase/provider";
import { useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { LandingPageData, landingPageSchema } from "@/lib/landingPageSchema";
import { HeroForm } from "./components/HeroForm";
import { ProductsForm } from "./components/ProductsForm";
import { ServicesForm } from "./components/ServicesForm"; // Import the new component
import { FooterForm } from "./components/FooterForm";
import { Loader2 } from "lucide-react";

export default function LandingPageSettings() {
  const firestore = useFirestore();
  const [loading, setLoading] = useState(false);

  const landingPageRef = useMemo(() => {
    if (!firestore) return null;
    return doc(firestore, "landingPage", "main");
  }, [firestore]);

  const { data: landingPageData, isLoading } = useDoc(landingPageRef);

  const form = useForm<LandingPageData>({
    resolver: zodResolver(landingPageSchema),
    defaultValues: landingPageData || {
      hero: { title: "", subtitle: "" },
      products: [],
      services: [],
      footer: {},
    },
  });

  const { toast } = useToast();

  useEffect(() => {
    if (landingPageData) {
      form.reset(landingPageData);
    }
  }, [landingPageData, form]);

  const onSubmit = async (data: LandingPageData) => {
    if (!landingPageRef) return;
    setLoading(true);
    try {
      await setDoc(landingPageRef, data, { merge: true });
      toast({
        title: "Success",
        description: "Landing page updated successfully.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>Landing Page Content</CardTitle>
          <CardDescription>
            Manage the content displayed on the public landing page.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-6">
            <HeroForm form={form} />
            <ProductsForm form={form} />
            <ServicesForm form={form} />{" "}
            {/* Add the new component to the form */}
            <FooterForm form={form} />
            <Button type="submit" disabled={loading}>
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Save Changes
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
