import { FirebaseError } from "@firebase/util";

const FIREBASE_ERRORS = {
  "auth/user-not-found": {
    title: "User not found",
    message: "The user with the given email address does not exist.",
  },
  "auth/wrong-password": {
    title: "Wrong password",
    message: "The password you entered is incorrect.",
  },
  "auth/invalid-email": {
    title: "Invalid email address",
    message: "The email address you entered is not valid.",
  },
  "auth/email-already-in-use": {
    title: "Email already in use",
    message:
      "The email address you entered is already in use by another account.",
  },
  "auth/weak-password": {
    title: "Weak password",
    message: "The password you entered is not strong enough.",
  },
  "auth/requires-recent-login": {
    title: "Requires recent login",
    message:
      "This operation is sensitive and requires recent authentication. Please log in again.",
  },
  "permission-denied": {
    title: "Permission denied",
    message: "You do not have permission to access this resource.",
  },
};

const UNKNOWN_ERROR = {
  title: "Unknown error",
  message: "An unknown error has occurred. Please try again later.",
};

export class FirestorePermissionError extends Error {
  constructor() {
    super("You do not have permission to perform this action.");
    this.name = "FirestorePermissionError";
  }
}

export function getFirebaseError(code: string) {
  return FIREBASE_ERRORS[code as keyof typeof FIREBASE_ERRORS] || UNKNOWN_ERROR;
}

export function getUnknownError() {
  return UNKNOWN_ERROR;
}

export function isFirebaseError(error: unknown): error is FirebaseError {
  return error instanceof FirebaseError;
}
