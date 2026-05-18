import type { Session, User } from "@supabase/supabase-js";
import { supabaseClient } from "../supabase/supabaseClient";

export type AuthSessionSnapshot =
  | { status: "loading"; session: null; user: null }
  | { status: "unconfigured"; session: null; user: null }
  | { status: "anonymous"; session: null; user: null }
  | { status: "authenticated"; session: Session; user: User };

export type AuthSessionObserver = (snapshot: AuthSessionSnapshot) => void;

export type AuthSessionUnsubscribe = () => void;

export type AuthSignOutResult =
  | { status: "unconfigured" }
  | { status: "signed-out" }
  | { status: "error"; error: Error };

export type AuthSignInResult =
  | { status: "unconfigured" }
  | { status: "anonymous" }
  | { status: "authenticated"; snapshot: Extract<AuthSessionSnapshot, { status: "authenticated" }> }
  | { status: "error"; error: Error };

const unconfiguredAuthSession: AuthSessionSnapshot = {
  status: "unconfigured",
  session: null,
  user: null,
};

const anonymousAuthSession: AuthSessionSnapshot = {
  status: "anonymous",
  session: null,
  user: null,
};

function toAuthSessionSnapshot(session: Session | null): AuthSessionSnapshot {
  if (!session) return anonymousAuthSession;

  return {
    status: "authenticated",
    session,
    user: session.user,
  };
}

export async function getCurrentAuthSession(): Promise<AuthSessionSnapshot> {
  if (!supabaseClient) return unconfiguredAuthSession;

  const { data, error } = await supabaseClient.auth.getSession();

  if (error) {
    console.warn("Failed to read Supabase auth session", error);
    return anonymousAuthSession;
  }

  return toAuthSessionSnapshot(data.session);
}

export function observeAuthSession(
  callback: AuthSessionObserver,
): AuthSessionUnsubscribe {
  if (!supabaseClient) {
    callback(unconfiguredAuthSession);
    return () => {};
  }

  const {
    data: { subscription },
  } = supabaseClient.auth.onAuthStateChange((_event, session) => {
    callback(toAuthSessionSnapshot(session));
  });

  return () => {
    subscription.unsubscribe();
  };
}

export async function signInWithEmailPassword(
  email: string,
  password: string,
): Promise<AuthSignInResult> {
  if (!supabaseClient) return { status: "unconfigured" };

  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.warn("Failed to sign in with Supabase auth", error);
    return { status: "error", error };
  }

  const snapshot = toAuthSessionSnapshot(data.session);

  if (snapshot.status === "authenticated") {
    return { status: "authenticated", snapshot };
  }

  return { status: "anonymous" };
}

export async function signOutAuthSession(): Promise<AuthSignOutResult> {
  if (!supabaseClient) return { status: "unconfigured" };

  const { error } = await supabaseClient.auth.signOut();

  if (error) {
    console.warn("Failed to sign out Supabase auth session", error);
    return { status: "error", error };
  }

  return { status: "signed-out" };
}
