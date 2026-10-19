import { useEffect } from "react";

import { subscribeToAuth } from "../database/auth";
import { isFirebaseConfigured } from "../database/firebase";
import { upsertProfile } from "../database/request";
import { useAppDispatch } from "../store/hooks";
import { setUser } from "../store/slices/authSlice";

/**
 * Subscribe once to Firebase Auth and mirror it into Redux. Firebase restores
 * the stored session asynchronously, so `auth.status` stays `initializing`
 * until its first callback — protected routes wait on that rather than
 * bouncing a signed-in user to the login page on every reload.
 */
export function useAuthListener() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (!isFirebaseConfigured) {
      dispatch(setUser(null));
      return;
    }
    return subscribeToAuth((user) => {
      dispatch(setUser(user));
      if (user?.emailVerified) {
        // Best effort: a failed profile write must never block sign-in.
        void upsertProfile(user).catch((error) =>
          console.warn("[capitalcv] could not update profile", error),
        );
      }
    });
  }, [dispatch]);
}
