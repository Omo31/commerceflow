"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const COOKIE_CONSENT_KEY = "cookie_consent_accepted";

export function CookieBanner() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // We can only check localStorage on the client
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (consent !== "true") {
      setShowBanner(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, "true");
    setShowBanner(false);
  };

  if (!showBanner) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 w-full">
      <div className="container mx-auto p-4">
        <div className="p-4 bg-card border rounded-lg shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground flex-grow">
            We use cookies to ensure you get the best experience on our website.
            By continuing to use our site, you acknowledge that you have read and
            understand our{" "}
            <Link href="/privacy-policy" className="underline">
              Privacy Policy
            </Link>
            .
          </p>
          <Button onClick={handleAccept} className="flex-shrink-0">
            Accept & Continue
          </Button>
        </div>
      </div>
    </div>
  );
}
