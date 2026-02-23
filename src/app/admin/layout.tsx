import { ReactNode } from "react";
import Link from "next/link";
import { LayoutDashboard, FileText, Book, Settings, Users, LogOut, PlusSquare } from "lucide-react";
import LogoutButton from "@/components/admin/LogoutButton";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { sessionOptions, SessionData } from "@/lib/session";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await getIronSession<SessionData>(cookies(), sessionOptions);
  const adminName = session.name || "Admin";
  const initials = adminName.split(" ").map(n => n[0]).join("").toUpperCase().substring(0, 2);

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-white flex flex-col">
        <div className="p-6 text-2xl font-bold border-b border-gray-800">GATE Admin</div>
        <nav className="flex-1 p-4 space-y-2">
          <Link href="/admin/dashboard" className="flex items-center space-x-3 p-3 rounded-md hover:bg-gray-800">
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </Link>
          <Link href="/admin/questions" className="flex items-center space-x-3 p-3 rounded-md hover:bg-gray-800">
            <FileText size={20} />
            <span>Question Bank</span>
          </Link>
          <Link href="/admin/subjects" className="flex items-center space-x-3 p-3 rounded-md hover:bg-gray-800">
            <Book size={20} />
            <span>Subjects</span>
          </Link>
          <Link href="/admin/tests" className="flex items-center space-x-3 p-3 rounded-md hover:bg-gray-800">
            <PlusSquare size={20} />
            <span>Tests</span>
          </Link>
          <Link href="/admin/students" className="flex items-center space-x-3 p-3 rounded-md hover:bg-gray-800">
            <Users size={20} />
            <span>Students</span>
          </Link>
        </nav>
        <div className="p-4 border-t border-gray-800">
          <LogoutButton />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8">
          <h1 className="text-xl font-semibold text-gray-800">Administrator Portal</h1>
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium">{adminName}</span>
            <div className="w-8 h-8 rounded-full bg-gray-800 text-white flex items-center justify-center text-xs">{initials}</div>
          </div>
        </header>
        <div className="flex-1 overflow-auto p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
