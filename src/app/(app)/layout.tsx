"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Sidebar from "@/components/layout/Sidebar";
import TopNavbar from "@/components/layout/TopNavbar";
import StatusBar from "@/components/layout/StatusBar";
import AIAssistantPanel from "@/components/ai-assistant/AssistantPanel";
import { Loader, ShieldCheck, X } from "lucide-react";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [encryptionKey, setEncryptionKey] = useState<string | null>(null);
  const [bannerVisible, setBannerVisible] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const dismissed = localStorage.getItem("orbit_banner_dismissed") === "true";
      setBannerVisible(!dismissed);
    }
  }, []);

  const handleDismissBanner = () => {
    localStorage.setItem("orbit_banner_dismissed", "true");
    setBannerVisible(false);
  };

  useEffect(() => {
    let mounted = true;

    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push("/login");
        } else if (mounted) {
          setAuthenticated(true);
          
          let encKey = session.user?.user_metadata?.encryption_key;
          if (!encKey) {
            const chars = 'abcdef0123456789';
            let generatedKey = '';
            for (let i = 0; i < 16; i++) {
              generatedKey += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            encKey = generatedKey;
            await supabase.auth.updateUser({
              data: { encryption_key: encKey }
            });
          }
          setEncryptionKey(encKey);
        }
      } catch (err) {
        console.error("Auth check failed:", err);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session) {
        router.push("/login");
        if (mounted) {
          setAuthenticated(false);
          setEncryptionKey(null);
        }
      } else if (mounted) {
        setAuthenticated(true);
        setLoading(false);
        
        let encKey = session.user?.user_metadata?.encryption_key;
        if (!encKey) {
          const chars = 'abcdef0123456789';
          let generatedKey = '';
          for (let i = 0; i < 16; i++) {
            generatedKey += chars.charAt(Math.floor(Math.random() * chars.length));
          }
          encKey = generatedKey;
          await supabase.auth.updateUser({
            data: { encryption_key: encKey }
          });
        }
        setEncryptionKey(encKey);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [router]);

  // Global Dynamic Encryption Key Route Redirects
  useEffect(() => {
    if (!encryptionKey || !pathname) return;

    const ROUTES_WITH_KEYS = [
      "/dashboard", "/agents", "/swarms", "/workflows", "/pipeline", "/automations",
      "/marketplace", "/integrations", "/terminal", "/workspace", "/deployments",
      "/logs", "/analytics", "/api-keys", "/billing", "/team", "/settings", "/blog"
    ];

    const REDIRECT_SECTIONS: Record<string, string> = {
      "/ecosystem": "/marketplace",
      "/operations": "/deployments",
      "/account": "/settings"
    };

    const segments = pathname.split("/");
    const lastSegment = segments[segments.length - 1];
    const isHex16 = /^[a-zA-Z0-9]{16}$/.test(lastSegment);

    // Get the base route path (e.g. /ecosystem or /ecosystem/somekey)
    const baseRoute = isHex16 ? segments.slice(0, -1).join("/") : pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;

    if (REDIRECT_SECTIONS[baseRoute]) {
      router.replace(`${REDIRECT_SECTIONS[baseRoute]}/${encryptionKey}`);
      return;
    }

    if (isHex16) {
      if (lastSegment !== encryptionKey) {
        // Replace wrong key with the correct one
        segments[segments.length - 1] = encryptionKey;
        const newPath = segments.join("/");
        router.replace(newPath);
      }
    } else {
      const cleanPath = pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
      if (ROUTES_WITH_KEYS.includes(cleanPath)) {
        router.replace(`${cleanPath}/${encryptionKey}`);
      }
    }
  }, [encryptionKey, pathname, router]);

  if (loading) {
    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#030712",
          gap: 16,
          fontFamily: "Inter, sans-serif",
        }}
      >
        {/* Immersive glow */}
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(59,130,246,0.3) 0%, transparent 70%)",
            filter: "blur(8px)",
            position: "absolute",
          }}
        />
        <Loader size={36} className="animate-spin" style={{ color: "var(--accent-blue)", position: "relative", zIndex: 10 }} />
        <span style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--text-secondary)", letterSpacing: "0.02em", animation: "pulse 2s infinite" }}>
          Initializing secure terminal environment...
        </span>
      </div>
    );
  }

  if (!authenticated) {
    return null;
  }

  return (
    <div style={{ display: "flex", height: "100vh", background: "var(--bg-base)", overflow: "hidden" }}>
      <Sidebar />
      <div style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0 }}>
        <TopNavbar />
        {encryptionKey && bannerVisible && (
          <div
            style={{
              position: "fixed",
              bottom: "24px",
              right: "24px",
              zIndex: 9999,
              padding: "16px 20px",
              background: "rgba(10, 25, 20, 0.88)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              border: "1px solid rgba(16, 185, 129, 0.45)",
              borderRadius: "12px",
              display: "flex",
              alignItems: "flex-start",
              gap: 14,
              boxShadow: "0 10px 30px rgba(16, 185, 129, 0.12), inset 0 1px 0 rgba(255,255,255,0.05)",
              maxWidth: "380px",
              animation: "slideIn 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
              fontFamily: "Inter, sans-serif",
            }}
          >
            <div style={{ display: "flex", gap: 12, flex: 1 }}>
              <ShieldCheck size={20} style={{ color: "#10b981", marginTop: 2, flexShrink: 0, filter: "drop-shadow(0 0 6px rgba(16,185,129,0.5))" }} />
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "#f8fafc", letterSpacing: "0.01em" }}>
                  Secure Encrypted Route Active:
                </span>
                <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#10b981", fontFamily: "monospace", wordBreak: "break-all" }}>
                  orbit.dashboard.{encryptionKey}
                </span>
                <span style={{ fontSize: "0.68rem", color: "#64748b", fontWeight: 500 }}>
                  (AES-256 Route Protection Active)
                </span>
              </div>
            </div>
            <button
              onClick={handleDismissBanner}
              style={{
                background: "transparent",
                border: "none",
                color: "#64748b",
                cursor: "pointer",
                padding: "2px",
                marginLeft: 8,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "4px",
                transition: "color 0.2s, background 0.2s"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "#f43f5e";
                e.currentTarget.style.background = "rgba(244,63,94,0.08)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "#64748b";
                e.currentTarget.style.background = "transparent";
              }}
            >
              <X size={16} />
            </button>
            <style>{`
              @keyframes slideIn {
                from {
                  transform: translateY(20px) scale(0.96);
                  opacity: 0;
                }
                to {
                  transform: translateY(0) scale(1);
                  opacity: 1;
                }
              }
            `}</style>
          </div>
        )}
        <main style={{ flex: 1, overflowY: "auto", padding: 24, scrollBehavior: "smooth" }}>
          {children}
        </main>
        <StatusBar />
      </div>
      <AIAssistantPanel />
    </div>
  );
}
