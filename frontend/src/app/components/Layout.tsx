import { Outlet, NavLink, useNavigate } from "react-router";
import {
  LayoutDashboard, GitBranch, Database,
  Activity, BarChart3, LogOut
} from "lucide-react";
import { authAPI } from "../../imports/api";

export function Layout() {
  const navigate = useNavigate();

  const navItems = [
    { to: "/",           label: "Overview",     icon: LayoutDashboard, end: true },
    { to: "/pipeline",   label: "Pipeline",     icon: GitBranch },
    { to: "/sources",    label: "Data Sources", icon: Database },
    { to: "/monitoring", label: "Logs",         icon: Activity },
    { to: "/analytics",  label: "Analytics",    icon: BarChart3 },
  ];

  function handleLogout() {
    authAPI.logout();
    navigate("/login");
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900">ClimateFlow ETL</h1>
          <p className="text-sm text-gray-500 mt-1">Data Pipeline</p>
        </div>

        {/* Nav Links */}
        <nav className="p-4 space-y-2 flex-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? "bg-blue-600 text-white"
                    : "text-gray-700 hover:bg-gray-100"
                }`
              }
            >
              <item.icon className="size-5" />
              <span className="font-medium">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-lg w-full text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <LogOut className="size-5" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}