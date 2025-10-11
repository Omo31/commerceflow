
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default function PrivacyPolicyPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary">
      <Card className="mx-auto w-full max-w-3xl">
        <CardHeader>
          <CardTitle className="text-2xl font-headline">
            Privacy Policy
          </CardTitle>
        </CardHeader>
        <CardContent className="prose dark:prose-invert">
          <h2>Placeholder Privacy Policy</h2>
          <p>
            This is a placeholder page for your application's privacy policy.
            Before you launch your application to the public, you should replace
            this content with a comprehensive policy that details how you
            collect, use, and protect your users' data.
          </p>
          <p>
            You should consult with a legal professional to ensure your privacy
            policy is compliant with all applicable laws and regulations.
          </p>
          <Link href="/">Go back to the homepage</Link>
        </CardContent>
      </Card>
    </div>
  );
}
