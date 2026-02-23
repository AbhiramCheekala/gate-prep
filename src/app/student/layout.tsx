import { ReactNode } from "react";
import Link from "next/link";
import { LayoutDashboard, History, AlertCircle, BarChart2, LogOut } from "lucide-react";
import LogoutButton from "@/components/student/LogoutButton";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { sessionOptions, SessionData } from "@/lib/session";

export default async function StudentLayout({ children }: { children: ReactNode }) {
  const session = await getIronSession<SessionData>(cookies(), sessionOptions);
  const studentName = session.name || "Student";
  const initials = studentName.split(" ").map(n => n[0]).join("").toUpperCase().substring(0, 2);

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-[#003087] text-white flex flex-col">
        <div className="p-6 text-2xl font-bold border-b border-[#00266b]">GATE Prep</div>
        <nav className="flex-1 p-4 space-y-2">
          <Link href="/student/dashboard" className="flex items-center space-x-3 p-3 rounded-md hover:bg-[#00266b]">
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </Link>
          <Link href="/student/history" className="flex items-center space-x-3 p-3 rounded-md hover:bg-[#00266b]">
            <History size={20} />
            <span>History</span>
          </Link>
          <Link href="/student/mistakes" className="flex items-center space-x-3 p-3 rounded-md hover:bg-[#00266b]">
            <AlertCircle size={20} />
            <span>Mistakes</span>
          </Link>
          <Link href="/student/analytics" className="flex items-center space-x-3 p-3 rounded-md hover:bg-[#00266b]">
            <BarChart2 size={20} />
            <span>Analytics</span>
          </Link>
        </nav>
        <div className="p-4 border-t border-[#00266b]">
          <LogoutButton />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8">
          <h1 className="text-xl font-semibold text-[#003087]">GATE Student Portal</h1>
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium">{studentName}</span>
            <div className="w-8 h-8 rounded-full bg-[#003087] text-white flex items-center justify-center text-xs">{initials}</div>
          </div>
        </header>
        <div className="flex-1 overflow-auto p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
