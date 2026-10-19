/**
 * The signed-in user as the app sees it: the subset of Firebase's `User` that
 * is safe to hold in Redux (plain, serialisable data).
 */
export interface AuthUser {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  emailVerified: boolean;
  /** `password` or `google.com`. */
  provider: string;
}
