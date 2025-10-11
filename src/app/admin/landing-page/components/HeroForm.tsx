"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { UseFormReturn } from "react-hook-form";
import { LandingPageData } from "@/lib/landingPageSchema";

interface HeroFormProps {
  form: UseFormReturn<LandingPageData>;
}

export function HeroForm({ form }: HeroFormProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Hero Section</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="hero.title">Title</Label>
          <Input id="hero.title" {...form.register("hero.title")} />
          {form.formState.errors.hero?.title && (
            <p className="text-red-500 text-sm">
              {form.formState.errors.hero.title.message}
            </p>
          )}
        </div>
        <div className="grid gap-2">
          <Label htmlFor="hero.subtitle">Subtitle</Label>
          <Textarea id="hero.subtitle" {...form.register("hero.subtitle")} />
        </div>
      </CardContent>
    </Card>
  );
}
