"use client";

import { useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { errorEmitter } from "@/firebase/error-emitter";
import {
  isFirebaseError,
  getFirebaseError,
  getUnknownError,
} from "@/firebase/errors";

export function useFirebaseError() {
  const { toast } = useToast();

  useEffect(() => {
    const handleError = (error: any) => {
      if (isFirebaseError(error)) {
        const firebaseError = getFirebaseError(error.code);

        toast({
          variant: "destructive",
          title: firebaseError.title,
          description: firebaseError.message,
        });
      } else {
        const unknownError = getUnknownError();

        toast({
          variant: "destructive",
          title: unknownError.title,
          description: unknownError.message,
        });
      }
    };

    // Subscribe to all error events
    errorEmitter.on("error", handleError);

    // Unsubscribe on cleanup
    return () => {
      errorEmitter.off("error", handleError);
    };
  }, [toast]);
}
