import Sidebar from "@/components/layout/Sidebar";
import TopNavbar from "@/components/layout/TopNavbar";
import StatusBar from "@/components/layout/StatusBar";
import AIAssistantPanel from "@/components/ai-assistant/AssistantPanel";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", height: "100vh", background: "var(--bg-base)", overflow: "hidden" }}>
      <Sidebar />
      <div style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0 }}>
        <TopNavbar />
        <main style={{ flex: 1, overflowY: "auto", padding: 24, scrollBehavior: "smooth" }}>
          {children}
        </main>
        <StatusBar />
      </div>
      <AIAssistantPanel />
    </div>
  );
}
