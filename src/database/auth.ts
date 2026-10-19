import { FirebaseError } from "firebase/app";
import {
  EmailAuthProvider,
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  deleteUser,
  onAuthStateChanged,
  reauthenticateWithCredential,
  reauthenticateWithPopup,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updatePassword,
  updateProfile,
} from "firebase/auth";
import type { User } from "firebase/auth";

import type { AuthUser } from "../types/user";
import { auth } from "./firebase";

export function toAuthUser(user: User): AuthUser {
  const provider = user.providerData[0]?.providerId ?? "password";
  return {
    uid: user.uid,
    email: user.email ?? "",
    displayName: user.displayName ?? "",
    photoURL: user.photoURL ?? "",
    emailVerified: user.emailVerified,
    provider,
  };
}

export function subscribeToAuth(callback: (user: AuthUser | null) => void) {
  return onAuthStateChanged(auth, (user) =>
    callback(user ? toAuthUser(user) : null),
  );
}

/** Where the verification / reset email's "continue" link returns to. */
function actionSettings() {
  return { url: `${window.location.origin}/login` };
}

export async function signInWithGoogle(): Promise<AuthUser> {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  const { user } = await signInWithPopup(auth, provider);
  return toAuthUser(user);
}

export async function signUpWithEmail(
  name: string,
  email: string,
  password: string,
): Promise<AuthUser> {
  const { user } = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(user, { displayName: name });
  await sendEmailVerification(user, actionSettings());
  return toAuthUser(user);
}

export async function signInWithEmail(
  email: string,
  password: string,
): Promise<AuthUser> {
  const { user } = await signInWithEmailAndPassword(auth, email, password);
  return toAuthUser(user);
}

export async function sendResetEmail(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email, actionSettings());
}

export async function resendVerification(): Promise<void> {
  if (!auth.currentUser) throw new Error("You are not signed in.");
  await sendEmailVerification(auth.currentUser, actionSettings());
}

/**
 * Re-read the account from Firebase. `onAuthStateChanged` does not fire when
 * `emailVerified` flips, so callers dispatch the returned user themselves.
 */
export async function refreshUser(): Promise<AuthUser | null> {
  if (!auth.currentUser) return null;
  await auth.currentUser.reload();
  // Force a fresh ID token so Firestore/Storage rules see the new claim.
  await auth.currentUser.getIdToken(true);
  return toAuthUser(auth.currentUser);
}

export async function updateDisplayName(name: string): Promise<AuthUser> {
  if (!auth.currentUser) throw new Error("You are not signed in.");
  await updateProfile(auth.currentUser, { displayName: name });
  return toAuthUser(auth.currentUser);
}

export async function changePassword(
  currentPassword: string,
  nextPassword: string,
): Promise<void> {
  const user = auth.currentUser;
  if (!user?.email) throw new Error("You are not signed in.");
  await reauthenticateWithCredential(
    user,
    EmailAuthProvider.credential(user.email, currentPassword),
  );
  await updatePassword(user, nextPassword);
}

export async function logOut(): Promise<void> {
  await signOut(auth);
}

/** Re-authenticate (required by Firebase before deleting an account). */
export async function reauthenticate(password?: string): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error("You are not signed in.");
  const isGoogle = user.providerData.some((p) => p.providerId === "google.com");
  if (isGoogle) {
    await reauthenticateWithPopup(user, new GoogleAuthProvider());
  } else {
    if (!user.email || !password) throw new Error("Enter your password to continue.");
    await reauthenticateWithCredential(
      user,
      EmailAuthProvider.credential(user.email, password),
    );
  }
}

export async function deleteAuthAccount(): Promise<void> {
  if (!auth.currentUser) throw new Error("You are not signed in.");
  await deleteUser(auth.currentUser);
}

const MESSAGES: Record<string, string> = {
  "auth/invalid-email": "That email address does not look right.",
  "auth/user-disabled": "This account has been disabled.",
  "auth/user-not-found": "Incorrect email or password.",
  "auth/wrong-password": "Incorrect email or password.",
  "auth/invalid-credential": "Incorrect email or password.",
  "auth/email-already-in-use":
    "An account with this email already exists. Try signing in instead.",
  "auth/weak-password": "Choose a stronger password (at least 8 characters).",
  "auth/too-many-requests":
    "Too many attempts. Wait a few minutes and try again.",
  "auth/network-request-failed":
    "Could not reach the server. Check your connection and try again.",
  "auth/popup-closed-by-user": "Sign-in was cancelled.",
  "auth/cancelled-popup-request": "Sign-in was cancelled.",
  "auth/popup-blocked":
    "Your browser blocked the sign-in window. Allow pop-ups and try again.",
  "auth/requires-recent-login":
    "For your security, sign in again and then retry.",
  "auth/operation-not-allowed":
    "This sign-in method is not enabled for the project yet.",
  "auth/unauthorized-domain":
    "This domain is not authorised for sign-in. Add it in the Firebase console.",
  "auth/invalid-api-key":
    "Firebase is not configured. Check the VITE_FIREBASE_* values in .env.",
};

/** A user-presentable message for any error thrown by the auth helpers. */
export function authErrorMessage(error: unknown): string {
  if (error instanceof FirebaseError) {
    return MESSAGES[error.code] ?? `Something went wrong (${error.code}).`;
  }
  return error instanceof Error ? error.message : "Something went wrong.";
}

export function isRecentLoginError(error: unknown): boolean {
  return error instanceof FirebaseError && error.code === "auth/requires-recent-login";
}
