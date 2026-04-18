import { createBrowserRouter } from "react-router";
import { Layout } from "./components/Layout";
import { Overview } from "./components/pages/Overview";
import { PipelineFlow } from "./components/pages/PipelineFlow";
import { DataSources } from "./components/pages/DataSources";
import { Monitoring } from "./components/pages/Monitoring";
import { Analytics } from "./components/pages/Analytics";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: Overview },
      { path: "pipeline", Component: PipelineFlow },
      { path: "sources", Component: DataSources },
      { path: "monitoring", Component: Monitoring },
      { path: "analytics", Component: Analytics },
    ],
  },
]);
