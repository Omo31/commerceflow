import { beforeUserCreated } from "firebase-functions/v2/identity";
import { getFirestore } from "firebase-admin/firestore";
import { initializeApp, getApps } from "firebase-admin/app";

if (getApps().length === 0) {
  initializeApp();
}

export const setupnewuser = beforeUserCreated(async (event) => {
  const user = event.data;
  if (!user) {
    return;
  }
  const firestore = getFirestore();

  const usersCollection = firestore.collection("users");
  const userDocsSnapshot = await usersCollection.limit(1).get();

  const isFirstUser = userDocsSnapshot.empty;
  const role = isFirstUser ? "admin" : "user";

  console.log(`Assigning role: ${role} to user: ${user.email}`);

  const customClaims = {
    role: role,
  };

  const userDocRef = firestore.collection("users").doc(user.uid);
  await userDocRef.set({
    uid: user.uid,
    email: user.email,
    displayName: user.displayName || "",
    photoURL: user.photoURL || "",
    role: role,
    createdAt: new Date(),
  });

  return {
    customClaims: customClaims,
  };
});
