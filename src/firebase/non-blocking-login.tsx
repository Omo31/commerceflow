"use client";

import {
  Auth,
  User,
  signInAnonymously,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { errorEmitter } from "./error-emitter";

interface AuthOptions {
  onSuccess?: (user: User) => void;
  onFinally?: () => void;
}

/** Initiate Google sign-in (non-blocking). */
export function initiateGoogleSignIn(
  authInstance: Auth,
  options: AuthOptions = {},
) {
  const { onSuccess, onFinally } = options;
  const provider = new GoogleAuthProvider();
  signInWithPopup(authInstance, provider)
    .then((result) => {
      onSuccess?.(result.user);
    })
    .catch((error) => {
      errorEmitter.emit("auth-error", error);
    })
    .finally(() => {
      onFinally?.();
    });
}

/** Initiate anonymous sign-in (non-blocking). */
export function initiateAnonymousSignIn(authInstance: Auth): void {
  signInAnonymously(authInstance).catch((error) => {
    errorEmitter.emit("auth-error", error);
  });
}

/** Initiate email/password sign-up (non-blocking). */
export function initiateEmailSignUp(
  authInstance: Auth,
  email: string,
  password: string,
  options: AuthOptions = {},
): void {
  const { onSuccess, onFinally } = options;
  createUserWithEmailAndPassword(authInstance, email, password)
    .then((userCredential) => {
      onSuccess?.(userCredential.user);
    })
    .catch((error) => {
      errorEmitter.emit("auth-error", error);
    })
    .finally(() => {
      onFinally?.();
    });
}

/** Initiate email/password sign-in (non-blocking). */
export function initiateEmailSignIn(
  authInstance: Auth,
  email: string,
  password: string,
  options: AuthOptions = {},
): void {
  const { onSuccess, onFinally } = options;
  signInWithEmailAndPassword(authInstance, email, password)
    .then((userCredential) => {
      onSuccess?.(userCredential.user);
    })
    .catch((error) => {
      errorEmitter.emit("auth-error", error);
    })
    .finally(() => {
      onFinally?.();
    });
}
