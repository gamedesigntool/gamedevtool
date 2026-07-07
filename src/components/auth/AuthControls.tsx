import { useState, type CSSProperties, type Dispatch, type FormEvent, type SetStateAction } from "react";
import {
  sendPasswordResetEmail,
  signInWithEmailPassword,
  signOutAuthSession,
  signUpWithEmailPassword,
  type AuthSessionSnapshot,
} from "../../services/auth/authSessionService";

type AuthControlsProps = {
  authSession: AuthSessionSnapshot;
  setAuthSession: Dispatch<SetStateAction<AuthSessionSnapshot>>;
};

type AuthMode = "sign-in" | "sign-up" | "reset-password";

type AuthNotice = {
  kind: "error" | "success";
  text: string;
} | null;

const inputStyle: CSSProperties = {
  background: "var(--gdd-bg3)",
  border: "1px solid var(--gdd-border)",
  borderRadius: 7,
  color: "var(--gdd-text)",
  fontSize: 12,
  outline: "none",
  padding: "7px 9px",
  width: 130,
};

const quietButtonStyle: CSSProperties = {
  background: "var(--gdd-border)",
  border: "none",
  borderRadius: 7,
  color: "var(--gdd-muted)",
  cursor: "pointer",
  fontSize: 12,
  fontWeight: 700,
  padding: "7px 12px",
};

const linkButtonStyle: CSSProperties = {
  background: "none",
  border: "none",
  color: "var(--gdd-muted)",
  cursor: "pointer",
  fontSize: 11,
  padding: 0,
  textDecoration: "underline",
};

const localDataCopy = "Local data stays on this device. Sign in does not enable cloud sync yet.";

export function AuthControls({ authSession, setAuthSession }: AuthControlsProps) {
  const [mode, setMode] = useState<AuthMode>("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [notice, setNotice] = useState<AuthNotice>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (authSession.status === "unconfigured" || authSession.status === "loading") {
    return null;
  }

  const setAuthMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    setNotice(null);
    if (nextMode === "reset-password") {
      setPassword("");
    }
  };

  const signOut = async () => {
    setNotice(null);
    setIsSubmitting(true);

    try {
      const result = await signOutAuthSession();

      if (result.status === "error") {
        setNotice({ kind: "error", text: result.error.message || "Sign out failed" });
        return;
      }

      setAuthSession({ status: "anonymous", session: null, user: null });
      setPassword("");
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitAuth = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setNotice(null);

    const trimmedEmail = email.trim();

    if (!trimmedEmail || (mode !== "reset-password" && !password)) {
      setNotice({ kind: "error", text: mode === "reset-password" ? "Email required" : "Email and password required" });
      return;
    }

    setIsSubmitting(true);

    try {
      if (mode === "sign-in") {
        const result = await signInWithEmailPassword(trimmedEmail, password);

        if (result.status === "authenticated") {
          setAuthSession(result.snapshot);
          setPassword("");
          return;
        }

        if (result.status === "error") {
          setNotice({ kind: "error", text: result.error.message || "Sign in failed" });
          return;
        }

        setNotice({ kind: "error", text: "Sign in unavailable" });
        return;
      }

      if (mode === "sign-up") {
        const result = await signUpWithEmailPassword(trimmedEmail, password);

        if (result.status === "authenticated") {
          setAuthSession(result.snapshot);
          setPassword("");
          return;
        }

        if (result.status === "signed-up") {
          setNotice({ kind: "success", text: "Account created. Check your email to confirm before signing in." });
          setMode("sign-in");
          setPassword("");
          return;
        }

        if (result.status === "error") {
          setNotice({ kind: "error", text: result.error.message || "Account creation failed" });
          return;
        }

        setNotice({ kind: "error", text: "Account creation unavailable" });
        return;
      }

      const result = await sendPasswordResetEmail(trimmedEmail);

      if (result.status === "sent") {
        setNotice({ kind: "success", text: "Password reset email sent. Check your inbox." });
        setMode("sign-in");
        setPassword("");
        return;
      }

      if (result.status === "error") {
        setNotice({ kind: "error", text: result.error.message || "Password reset failed" });
        return;
      }

      setNotice({ kind: "error", text: "Password reset unavailable" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authSession.status === "authenticated") {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2 }}>
          <span style={{ color: "var(--gdd-muted)", fontSize: 11, maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {authSession.user.email || "Signed in"}
          </span>
          <span style={{ color: "#475569", fontSize: 10 }}>{localDataCopy}</span>
          {notice && <span style={{ color: "#f87171", fontSize: 11 }}>{notice.text}</span>}
        </div>
        <button style={{ ...quietButtonStyle, opacity: isSubmitting ? 0.6 : 1 }} onClick={signOut} disabled={isSubmitting}>
          {isSubmitting ? "..." : "Sign out"}
        </button>
      </div>
    );
  }

  const submitLabel = mode === "sign-up"
    ? "Create account"
    : mode === "reset-password"
      ? "Send reset"
      : "Sign in";

  return (
    <form onSubmit={submitAuth} style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", justifyContent: "flex-end", maxWidth: 560 }}>
      <input
        value={email}
        onChange={event => setEmail(event.target.value)}
        placeholder="Email"
        type="email"
        style={inputStyle}
      />
      {mode !== "reset-password" && (
        <input
          value={password}
          onChange={event => setPassword(event.target.value)}
          placeholder="Password"
          type="password"
          style={inputStyle}
        />
      )}
      <button
        type="submit"
        disabled={isSubmitting}
        style={{
          ...quietButtonStyle,
          color: "#fff",
          opacity: isSubmitting ? 0.6 : 1,
        }}
      >
        {isSubmitting ? "..." : submitLabel}
      </button>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexBasis: "100%", justifyContent: "flex-end", minHeight: 14 }}>
        {mode !== "sign-in" && (
          <button type="button" style={linkButtonStyle} onClick={() => setAuthMode("sign-in")}>
            Sign in
          </button>
        )}
        {mode !== "sign-up" && (
          <button type="button" style={linkButtonStyle} onClick={() => setAuthMode("sign-up")}>
            Create account
          </button>
        )}
        {mode !== "reset-password" && (
          <button type="button" style={linkButtonStyle} onClick={() => setAuthMode("reset-password")}>
            Forgot password?
          </button>
        )}
        <span style={{ color: "#475569", fontSize: 10 }}>{localDataCopy}</span>
      </div>
      {notice && (
        <span style={{ color: notice.kind === "error" ? "#f87171" : "#34d399", fontSize: 11, flexBasis: "100%", textAlign: "right" }}>
          {notice.text}
        </span>
      )}
    </form>
  );
}
