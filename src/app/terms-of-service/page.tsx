import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default function TermsOfServicePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary">
      <Card className="mx-auto w-full max-w-3xl">
        <CardHeader>
          <CardTitle className="text-2xl font-headline">
            Terms of Service
          </CardTitle>
        </CardHeader>
        <CardContent className="prose dark:prose-invert">
          <h2>Placeholder Terms of Service</h2>
          <p>
            This is a placeholder page for your application's terms of service.
            Before you launch your application to the public, you should replace
            this content with a comprehensive agreement that outlines the rules
            and expectations for your users.
          </p>
          <p>
            You should consult with a legal professional to ensure your terms of
            service are appropriate for your application and protect both you and
            your users.
          </p>
          <Link href="/">Go back to the homepage</Link>
        </CardContent>
      </Card>
    </div>
  );
}
