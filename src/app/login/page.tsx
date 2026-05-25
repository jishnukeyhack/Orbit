"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import OrbitLogo from "@/components/layout/OrbitLogo";
import { Mail, Lock, ArrowRight, Sparkles, AlertCircle, Loader } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Redirect if already logged in
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        window.location.href = '/dashboard';
      }
    });

    // Listen for auth state changes (handles OAuth callback)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        window.location.href = '/dashboard';
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
          },
        });
        if (error) throw error;
        
        if (data.user && data.session) {
          window.location.href = '/dashboard';
        } else {
          setSuccessMsg("Check your email for the confirmation link to complete signup!");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        window.location.href = '/dashboard';
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An authentication error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = async (provider: "google" | "github") => {
    setErrorMsg("");
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
          queryParams: provider === 'google' ? { access_type: 'offline', prompt: 'consent' } : undefined,
        },
      });
      if (error) throw error;
      // OAuth will redirect automatically — no need to push
    } catch (err: any) {
      setErrorMsg(err.message || `Failed to initiate ${provider} authentication.`);
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: "relative",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#030712",
        overflow: "hidden",
        fontFamily: "Inter, sans-serif",
      }}
    >
      {/* Dynamic Background Gradients */}
      <div
        style={{
          position: "absolute",
          top: "-20%",
          left: "-10%",
          width: "60vw",
          height: "60vw",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)",
          filter: "blur(60px)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "-20%",
          right: "-10%",
          width: "60vw",
          height: "60vw",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)",
          filter: "blur(60px)",
          pointerEvents: "none",
        }}
      />

      {/* Grid Pattern */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
          pointerEvents: "none",
        }}
      />

      {/* Main Glassmorphic Wrapper */}
      <div
        style={{
          position: "relative",
          zIndex: 10,
          width: "100%",
          maxWidth: 440,
          margin: "0 20px",
          background: "rgba(10, 15, 30, 0.45)",
          backdropFilter: "blur(18px) saturate(160%)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          borderRadius: 24,
          padding: "40px 32px",
          boxShadow: "0 10px 40px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.03) inset",
          display: "flex",
          flexDirection: "column",
          gap: 24,
        }}
      >
        {/* Brand & Heading */}
        <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <OrbitLogo variant="full" size={32} />
          </div>
          <div>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#fff", margin: 0, letterSpacing: "-0.02em" }}>
              {isSignUp ? "Create your Orbit account" : "Welcome back to Orbit"}
            </h1>
            <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", marginTop: 6, margin: 0 }}>
              {isSignUp
                ? "Start building and orchestrating global-scale agent swarms."
                : "Orchestrating autonomous intelligence into action."}
            </p>
          </div>
        </div>

        {/* Messaging Feedback */}
        {errorMsg && (
          <div
            style={{
              background: "rgba(239, 68, 68, 0.12)",
              border: "1px solid rgba(239, 68, 68, 0.25)",
              borderRadius: 10,
              padding: "10px 14px",
              display: "flex",
              alignItems: "center",
              gap: 10,
              fontSize: "0.78rem",
              color: "#f87171",
            }}
          >
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div
            style={{
              background: "rgba(34, 197, 94, 0.12)",
              border: "1px solid rgba(34, 197, 94, 0.25)",
              borderRadius: 10,
              padding: "10px 14px",
              display: "flex",
              alignItems: "center",
              gap: 10,
              fontSize: "0.78rem",
              color: "#4ade80",
            }}
          >
            <Sparkles size={16} style={{ flexShrink: 0 }} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Email Password Form */}
        <form onSubmit={handleEmailAuth} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: "0.72rem", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Email address
            </label>
            <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
              <Mail size={16} style={{ position: "absolute", left: 14, color: "var(--text-muted)", pointerEvents: "none" }} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@domain.com"
                style={{
                  width: "100%",
                  height: 42,
                  borderRadius: 10,
                  background: "rgba(255, 255, 255, 0.04)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  padding: "0 16px 0 42px",
                  fontSize: "0.875rem",
                  color: "#fff",
                  outline: "none",
                  transition: "all 0.18s ease",
                }}
                onFocus={(e) => {
                  e.target.style.background = "rgba(255, 255, 255, 0.06)";
                  e.target.style.border = "1px solid var(--accent-blue)";
                  e.target.style.boxShadow = "0 0 10px rgba(59, 130, 246, 0.2)";
                }}
                onBlur={(e) => {
                  e.target.style.background = "rgba(255, 255, 255, 0.04)";
                  e.target.style.border = "1px solid rgba(255, 255, 255, 0.08)";
                  e.target.style.boxShadow = "none";
                }}
              />
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: "0.72rem", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Password
            </label>
            <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
              <Lock size={16} style={{ position: "absolute", left: 14, color: "var(--text-muted)", pointerEvents: "none" }} />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{
                  width: "100%",
                  height: 42,
                  borderRadius: 10,
                  background: "rgba(255, 255, 255, 0.04)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  padding: "0 16px 0 42px",
                  fontSize: "0.875rem",
                  color: "#fff",
                  outline: "none",
                  transition: "all 0.18s ease",
                }}
                onFocus={(e) => {
                  e.target.style.background = "rgba(255, 255, 255, 0.06)";
                  e.target.style.border = "1px solid var(--accent-blue)";
                  e.target.style.boxShadow = "0 0 10px rgba(59, 130, 246, 0.2)";
                }}
                onBlur={(e) => {
                  e.target.style.background = "rgba(255, 255, 255, 0.04)";
                  e.target.style.border = "1px solid rgba(255, 255, 255, 0.08)";
                  e.target.style.boxShadow = "none";
                }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              height: 42,
              borderRadius: 10,
              background: "linear-gradient(135deg, var(--accent-blue), var(--accent-purple))",
              border: "none",
              fontWeight: 600,
              fontSize: "0.875rem",
              color: "#fff",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              transition: "opacity 0.18s ease",
              marginTop: 6,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.9")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          >
            {loading ? (
              <Loader size={18} className="animate-spin" />
            ) : (
              <>
                <span>{isSignUp ? "Sign Up" : "Sign In"}</span>
                <ArrowRight size={15} />
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ flex: 1, height: 1, background: "rgba(255, 255, 255, 0.08)" }} />
          <span style={{ fontSize: "0.68rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Or continue with
          </span>
          <div style={{ flex: 1, height: 1, background: "rgba(255, 255, 255, 0.08)" }} />
        </div>

        {/* Social logins */}
        <div style={{ display: "flex", gap: 12 }}>
          <button
            onClick={() => handleOAuth("google")}
            style={{
              flex: 1,
              height: 40,
              borderRadius: 10,
              background: "rgba(255, 255, 255, 0.04)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              fontSize: "0.8125rem",
              fontWeight: 500,
              color: "#fff",
              transition: "all 0.16s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)";
              e.currentTarget.style.border = "1px solid rgba(255, 255, 255, 0.15)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.04)";
              e.currentTarget.style.border = "1px solid rgba(255, 255, 255, 0.08)";
            }}
          >
            {/* Google SVG */}
            <svg width="15" height="15" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.92h6.69c-.29 1.5-.1.8-2.4 2.8l3.7 2.88c2.17-2 3.42-4.94 3.42-8.53z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.7-2.88c-1.03.69-2.35 1.11-4.23 1.11-3.26 0-6.01-2.2-7-5.15H1.15v2.98C3.17 20.18 7.25 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5 14.17A7.03 7.03 0 0 1 5 9.83V6.85H1.15a11.97 11.97 0 0 0 0 10.3L5 14.17z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.25 0 3.17 3.82 1.15 7.85L5 10.83c.99-2.95 3.74-5.08 7-5.08z"
              />
            </svg>
            <span>Google</span>
          </button>

          <button
            onClick={() => handleOAuth("github")}
            style={{
              flex: 1,
              height: 40,
              borderRadius: 10,
              background: "rgba(255, 255, 255, 0.04)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              fontSize: "0.8125rem",
              fontWeight: 500,
              color: "#fff",
              transition: "all 0.16s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)";
              e.currentTarget.style.border = "1px solid rgba(255, 255, 255, 0.15)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.04)";
              e.currentTarget.style.border = "1px solid rgba(255, 255, 255, 0.08)";
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"></path>
              <path d="M9 18c-4.51 2-5-2-7-2"></path>
            </svg>
            <span>GitHub</span>
          </button>
        </div>

        {/* Footer / Toggle mode */}
        <div style={{ textAlign: "center", fontSize: "0.8125rem", color: "var(--text-secondary)", marginTop: 6 }}>
          <span>{isSignUp ? "Already have an account?" : "Don't have an account?"} </span>
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--accent-blue)",
              fontWeight: 600,
              cursor: "pointer",
              padding: 0,
              fontSize: "inherit",
              transition: "color 0.14s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--accent-cyan)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--accent-blue)")}
          >
            {isSignUp ? "Sign In" : "Sign Up"}
          </button>
        </div>
      </div>
    </div>
  );
}
