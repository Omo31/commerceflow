"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { UseFormReturn, useFieldArray } from "react-hook-form";
import { LandingPageData } from "@/lib/landingPageSchema";

interface ProductsFormProps {
  form: UseFormReturn<LandingPageData>;
}

export function ProductsForm({ form }: ProductsFormProps) {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "products",
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Products Section</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div>
          {fields.map((field, index) => (
            <div key={field.id} className="border p-4 rounded-md mb-4">
              <div className="grid gap-2">
                <Label>Product Name</Label>
                <Input {...form.register(`products.${index}.name`)} />
                {form.formState.errors.products?.[index]?.name && (
                  <p className="text-red-500 text-sm">
                    {form.formState.errors.products[index].name.message}
                  </p>
                )}
              </div>
              <div className="grid gap-2">
                <Label>Description</Label>
                <Textarea {...form.register(`products.${index}.description`)} />
              </div>
              <div className="grid gap-2">
                <Label>Price</Label>
                <Input {...form.register(`products.${index}.price`)} />
              </div>

              <ImageArray form={form} productIndex={index} />
              <VideoArray form={form} productIndex={index} />

              <Button
                type="button"
                variant="destructive"
                onClick={() => remove(index)}
                className="mt-4"
              >
                Remove Product
              </Button>
            </div>
          ))}
          <Button
            type="button"
            onClick={() =>
              append({
                name: "",
                description: "",
                price: "",
                images: [],
                videos: [],
              })
            }
          >
            Add Product
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function ImageArray({
  form,
  productIndex,
}: {
  form: UseFormReturn<LandingPageData>;
  productIndex: number;
}) {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: `products.${productIndex}.images`,
  });

  return (
    <div className="mt-4">
      <Label>Images</Label>
      {fields.map((field, index) => (
        <div key={field.id} className="flex gap-2 mb-2">
          <Input
            {...form.register(`products.${productIndex}.images.${index}.url`)}
          />
          <Button
            type="button"
            variant="destructive"
            onClick={() => remove(index)}
          >
            Remove
          </Button>
        </div>
      ))}
      <Button type="button" onClick={() => append({ url: "" })}>
        Add Image
      </Button>
    </div>
  );
}

function VideoArray({
  form,
  productIndex,
}: {
  form: UseFormReturn<LandingPageData>;
  productIndex: number;
}) {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: `products.${productIndex}.videos`,
  });

  return (
    <div className="mt-4">
      <Label>Videos</Label>
      {fields.map((field, index) => (
        <div key={field.id} className="flex gap-2 mb-2">
          <Input
            {...form.register(`products.${productIndex}.videos.${index}.url`)}
          />
          <Button
            type="button"
            variant="destructive"
            onClick={() => remove(index)}
          >
            Remove
          </Button>
        </div>
      ))}
      <Button type="button" onClick={() => append({ url: "" })}>
        Add Video
      </Button>
    </div>
  );
}
