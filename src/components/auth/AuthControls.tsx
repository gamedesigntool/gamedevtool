import { useState, type Dispatch, type FormEvent, type SetStateAction } from "react";
import {
  signInWithEmailPassword,
  signOutAuthSession,
  type AuthSessionSnapshot,
} from "../../services/auth/authSessionService";

type AuthControlsProps = {
  authSession: AuthSessionSnapshot;
  setAuthSession: Dispatch<SetStateAction<AuthSessionSnapshot>>;
};

const inputStyle = {
  background: "var(--gdd-bg3)",
  border: "1px solid var(--gdd-border)",
  borderRadius: 7,
  color: "var(--gdd-text)",
  fontSize: 12,
  outline: "none",
  padding: "7px 9px",
  width: 130,
};

const quietButtonStyle = {
  background: "var(--gdd-border)",
  border: "none",
  borderRadius: 7,
  color: "var(--gdd-muted)",
  cursor: "pointer",
  fontSize: 12,
  fontWeight: 700,
  padding: "7px 12px",
};

export function AuthControls({ authSession, setAuthSession }: AuthControlsProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (authSession.status === "unconfigured" || authSession.status === "loading") {
    return null;
  }

  const signOut = async () => {
    const result = await signOutAuthSession();
    if (result.status !== "error") {
      setAuthSession({ status: "anonymous", session: null, user: null });
    }
  };

  const signIn = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Email and password required");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await signInWithEmailPassword(email.trim(), password);

      if (result.status === "authenticated") {
        setAuthSession(result.snapshot);
        setPassword("");
        return;
      }

      if (result.status === "error") {
        setError(result.error.message || "Sign in failed");
        return;
      }

      setError("Sign in unavailable");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authSession.status === "authenticated") {
    return (
      <button style={quietButtonStyle} onClick={signOut}>
        Sign out
      </button>
    );
  }

  return (
    <form onSubmit={signIn} style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <input
        value={email}
        onChange={event => setEmail(event.target.value)}
        placeholder="Email"
        type="email"
        style={inputStyle}
      />
      <input
        value={password}
        onChange={event => setPassword(event.target.value)}
        placeholder="Password"
        type="password"
        style={inputStyle}
      />
      <button
        type="submit"
        disabled={isSubmitting}
        style={{
          ...quietButtonStyle,
          color: "#fff",
          opacity: isSubmitting ? 0.6 : 1,
        }}
      >
        {isSubmitting ? "..." : "Sign in"}
      </button>
      {error && <span style={{ color: "#f87171", fontSize: 11 }}>{error}</span>}
    </form>
  );
}
