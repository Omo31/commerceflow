import { DiscountForm } from "../_components/discount-form";

export default function NewDiscountPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold font-headline">
        Create a New Discount
      </h1>
      <p className="text-muted-foreground">
        Fill out the form below to create a new discount code.
      </p>

      <div className="mt-6">
        <DiscountForm />
      </div>
    </div>
  );
}
