"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { UseFormReturn } from "react-hook-form";
import { LandingPageData } from "@/lib/landingPageSchema";

interface FooterFormProps {
  form: UseFormReturn<LandingPageData>;
}

export function FooterForm({ form }: FooterFormProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Footer</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="footer.twitter">Twitter URL</Label>
          <Input id="footer.twitter" {...form.register("footer.twitter")} />
          {form.formState.errors.footer?.twitter && (
            <p className="text-red-500 text-sm">
              {form.formState.errors.footer.twitter.message}
            </p>
          )}
        </div>
        <div className="grid gap-2">
          <Label htmlFor="footer.instagram">Instagram URL</Label>
          <Input id="footer.instagram" {...form.register("footer.instagram")} />
          {form.formState.errors.footer?.instagram && (
            <p className="text-red-500 text-sm">
              {form.formState.errors.footer.instagram.message}
            </p>
          )}
        </div>
        <div className="grid gap-2">
          <Label htmlFor="footer.facebook">Facebook URL</Label>
          <Input id="footer.facebook" {...form.register("footer.facebook")} />
          {form.formState.errors.footer?.facebook && (
            <p className="text-red-500 text-sm">
              {form.formState.errors.footer.facebook.message}
            </p>
          )}
        </div>
        <div className="grid gap-2">
          <Label htmlFor="footer.address">Address</Label>
          <Textarea id="footer.address" {...form.register("footer.address")} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="footer.hours">Working Hours</Label>
          <Input id="footer.hours" {...form.register("footer.hours")} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="footer.privacyPolicy">Privacy Policy URL</Label>
          <Input
            id="footer.privacyPolicy"
            {...form.register("footer.privacyPolicy")}
          />
          {form.formState.errors.footer?.privacyPolicy && (
            <p className="text-red-500 text-sm">
              {form.formState.errors.footer.privacyPolicy.message}
            </p>
          )}
        </div>
        <div className="grid gap-2">
          <Label htmlFor="footer.termsOfService">Terms of Service URL</Label>
          <Input
            id="footer.termsOfService"
            {...form.register("footer.termsOfService")}
          />
          {form.formState.errors.footer?.termsOfService && (
            <p className="text-red-500 text-sm">
              {form.formState.errors.footer.termsOfService.message}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
