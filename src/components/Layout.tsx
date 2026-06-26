import { Link, useLocation } from "react-router";
import { useAuth } from "@/hooks/useAuth";
import {
  LayoutDashboard,
  Search,
  ArrowLeftRight,
  Wallet,
  Bell,
  Settings,
  LogOut,
  Bot,
  ChevronLeft,
  ChevronRight,
  Menu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const navItems = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard },
  { path: "/opportunities", label: "Opportunities", icon: Search },
  { path: "/bridges", label: "Bridges", icon: ArrowLeftRight },
  { path: "/wallet", label: "Wallet", icon: Wallet },
  { path: "/alerts", label: "Alerts", icon: Bell },
  { path: "/settings", label: "Settings", icon: Settings },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center gap-3 border-b px-4">
        <Bot className="h-7 w-7 text-emerald-500" />
        {!collapsed && (
          <div className="flex flex-col">
            <span className="text-sm font-bold tracking-tight">ArbitrageBot</span>
            <span className="text-[10px] text-muted-foreground">Cross-Chain Alpha</span>
          </div>
        )}
      </div>
      <nav className="flex-1 space-y-1 px-2 py-4">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}
            >
              <item.icon className="h-4.5 w-4.5 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>
      <div className="border-t p-3">
        {user ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <span className="text-xs font-bold text-emerald-600">
                  {user.name?.charAt(0) ?? "U"}
                </span>
              </div>
              {!collapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{user.name ?? "User"}</p>
                  <p className="text-xs text-muted-foreground truncate">{user.email ?? "No email"}</p>
                </div>
              )}
            </div>
            <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-muted-foreground" onClick={logout}>
              <LogOut className="h-4 w-4" />
              {!collapsed && <span>Logout</span>}
            </Button>
          </div>
        ) : (
          <Button variant="outline" size="sm" className="w-full" asChild>
            <Link to="/login">Login</Link>
          </Button>
        )}
      </div>
      <button onClick={() => setCollapsed(!collapsed)} className="absolute -right-3 top-20 h-6 w-6 rounded-full border bg-background shadow-sm flex items-center justify-center hover:bg-accent">
        {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
      </button>
    </div>
  );

  return (
    <div className="flex h-screen bg-background">
      <aside className={`hidden lg:block relative border-r bg-card transition-all duration-200 ${collapsed ? "w-16" : "w-64"}`}>
        <SidebarContent />
      </aside>
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="lg:hidden absolute top-4 left-4 z-50">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <div className="h-full"><SidebarContent /></div>
        </SheetContent>
      </Sheet>
      <main className="flex-1 overflow-auto">
        <div className="p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}