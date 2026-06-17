import { createBrowserRouter, redirect } from "react-router";
import { Layout } from "./components/Layout";
import { Overview } from "./components/pages/Overview";
import { PipelineFlow } from "./components/pages/PipelineFlow";
import { DataSources } from "./components/pages/DataSources";
import { Monitoring } from "./components/pages/Monitoring";
import { Analytics } from "./components/pages/Analytics";
import { Login } from "./components/pages/Login";
import { Register } from "./components/pages/Register";

function requireAuth() {
  const token = localStorage.getItem("token");
  if (!token) throw redirect("/login");
  return null;
}

export const router = createBrowserRouter([
  {
    path: "/login",
    Component: Login,
  },
  {
    path: "/register",
    Component: Register,
  },
  {
    path: "/",
    Component: Layout,
    loader: requireAuth,
    errorElement: (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Page not found</h2>
          <a href="/" className="text-blue-600 hover:underline">Go to Dashboard</a>
        </div>
      </div>
    ),
    children: [
      { index: true,        Component: Overview     },
      { path: "pipeline",   Component: PipelineFlow },
      { path: "sources",    Component: DataSources  },
      { path: "monitoring", Component: Monitoring   },
      { path: "analytics",  Component: Analytics    },
    ],
  },
]);