"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { UseFormReturn, useFieldArray } from "react-hook-form";
import { LandingPageData } from "@/lib/landingPageSchema";

interface ServicesFormProps {
  form: UseFormReturn<LandingPageData>;
}

export function ServicesForm({ form }: ServicesFormProps) {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "services",
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Services Section</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div>
          {fields.map((field, index) => (
            <div key={field.id} className="border p-4 rounded-md mb-4">
              <div className="grid gap-2">
                <Label>Service Name</Label>
                <Input {...form.register(`services.${index}.name`)} />
                {form.formState.errors.services?.[index]?.name && (
                  <p className="text-red-500 text-sm">
                    {form.formState.errors.services[index].name.message}
                  </p>
                )}
              </div>
              <div className="grid gap-2">
                <Label>Description</Label>
                <Textarea {...form.register(`services.${index}.description`)} />
              </div>
              <Button
                type="button"
                variant="destructive"
                onClick={() => remove(index)}
                className="mt-4"
              >
                Remove Service
              </Button>
            </div>
          ))}
          <Button
            type="button"
            onClick={() => append({ name: "", description: "" })}
          >
            Add Service
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
