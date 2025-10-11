"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Image from "next/image";
import { Wand2, Loader2, Share2, Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { handleGenerateFlyer } from "@/app/actions";

const formSchema = z.object({
  topic: z.string().min(2, {
    message: "Topic must be at least 2 characters.",
  }),
  keyMessage: z.string().min(10, {
    message: "Key message must be at least 10 characters.",
  }),
  promotionalDetails: z.string().min(2, {
    message: "Promotional details are required.",
  }),
  targetAudience: z.string().min(2, {
    message: "Target audience is required.",
  }),
  brandStyle: z.string(),
});

type FlyerData = {
  flyerImage: string;
  callToAction: string;
};

export function FlyerGenerator() {
  const [isPending, startTransition] = useTransition();
  const [flyerData, setFlyerData] = useState<FlyerData | null>(null);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      topic: "CommerceFlow App",
      keyMessage:
        "Streamline your business with our all-in-one commerce solution. Manage orders, payments, and customers with ease.",
      promotionalDetails: "Sign up for a free trial!",
      targetAudience: "Small Business Owners",
      brandStyle: "modern",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    startTransition(async () => {
      setFlyerData(null);
      const result = await handleGenerateFlyer(values);
      if ("error" in result) {
        toast({
          variant: "destructive",
          title: "Generation Failed",
          description: result.error,
        });
      } else {
        setFlyerData(result);
        toast({
          title: "Flyer Generated!",
          description: "Your new marketing material is ready.",
        });
      }
    });
  }

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle>Flyer Details</CardTitle>
          <CardDescription>
            Provide details to generate a marketing flyer for a product,
            service, or your brand.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="topic">Ad Topic</Label>
              <Input
                id="topic"
                placeholder="e.g., CommerceFlow App, Summer Sale"
                {...form.register("topic")}
              />
              {form.formState.errors.topic && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.topic.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="keyMessage">Key Message</Label>
              <Textarea
                id="keyMessage"
                placeholder="e.g., Streamline your business operations."
                {...form.register("keyMessage")}
              />
              {form.formState.errors.keyMessage && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.keyMessage.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="promotionalDetails">Promotional Details</Label>
              <Input
                id="promotionalDetails"
                placeholder="e.g., 20% OFF, Free Trial"
                {...form.register("promotionalDetails")}
              />
              {form.formState.errors.promotionalDetails && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.promotionalDetails.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="targetAudience">Target Audience</Label>
              <Input
                id="targetAudience"
                placeholder="e.g., Students, Professionals"
                {...form.register("targetAudience")}
              />
              {form.formState.errors.targetAudience && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.targetAudience.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="brandStyle">Brand Style</Label>
              <Select
                onValueChange={(value) => form.setValue("brandStyle", value)}
                defaultValue={form.getValues("brandStyle")}
              >
                <SelectTrigger id="brandStyle">
                  <SelectValue placeholder="Select a style" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="modern">Modern</SelectItem>
                  <SelectItem value="minimalist">Minimalist</SelectItem>
                  <SelectItem value="playful">Playful</SelectItem>
                  <SelectItem value="elegant">Elegant</SelectItem>
                  <SelectItem value="retro">Retro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" disabled={isPending} className="w-full">
              {isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Wand2 className="mr-2 h-4 w-4" />
              )}
              Generate Flyer
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="lg:col-span-2">
        <Card className="h-full">
          <CardHeader>
            <CardTitle>Generated Flyer</CardTitle>
            <CardDescription>
              Your AI-generated marketing material will appear here.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex h-full min-h-[400px] items-center justify-center">
            {isPending && (
              <div className="flex flex-col items-center gap-4 text-muted-foreground">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p>Generating your masterpiece...</p>
                <p className="text-sm text-center">This may take a moment.</p>
              </div>
            )}
            {!isPending && flyerData && (
              <div className="w-full space-y-4">
                <Card className="overflow-hidden">
                  <div className="relative aspect-[4/3] w-full">
                    <Image
                      src={flyerData.flyerImage}
                      alt="Generated Flyer"
                      fill
                      className="object-cover"
                    />
                  </div>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Suggested Call to Action</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-primary font-headline tracking-tight">
                      &quot;{flyerData.callToAction}&quot;
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}
            {!isPending && !flyerData && (
              <div className="text-center text-muted-foreground">
                <p>Your generated flyer will be displayed here.</p>
              </div>
            )}
          </CardContent>
          {flyerData && !isPending && (
            <CardFooter className="flex justify-end gap-2">
              <Button variant="outline">
                <Share2 className="mr-2 h-4 w-4" /> Share
              </Button>
              <Button>
                <Download className="mr-2 h-4 w-4" /> Download
              </Button>
            </CardFooter>
          )}
        </Card>
      </div>
    </div>
  );
}
