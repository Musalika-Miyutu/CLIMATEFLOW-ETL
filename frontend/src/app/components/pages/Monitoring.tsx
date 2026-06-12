import { useState, useEffect } from "react";
import { CheckCircle, XCircle, AlertTriangle, Info, Clock, Activity } from "lucide-react";
import { pipelineAPI } from "../../../imports/api";

export function Monitoring() {
  const [logs, setLogs]       = useState<any[]>([]);
  const [metrics, setMetrics] = useState({
    totalEvents:   0,
    successRate:   0,
    warnings:      0,
    errors:        0,
  });
  const [lastUpdated, setLastUpdated] = useState("");
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    async function fetchLogs() {
      try {
        const runs = await pipelineAPI.getRuns();

        // Calculate metrics
        const total      = runs.length;
        const successful = runs.filter((r: any) => r.status === "success").length;
        const failed     = runs.filter((r: any) => r.status === "failed").length;
        const successRate = total > 0 ? Math.round((successful / total) * 100) : 0;

        setMetrics({
          totalEvents: total,
          successRate,
          warnings:    failed,
          errors:      runs.filter((r: any) => r.status === "failed" && r.records_processed === 0).length,
        });

        // Fetch logs for the most recent runs
        const recentRuns  = runs.slice(0, 5);
        const allLogs: any[] = [];

        for (const run of recentRuns) {
          try {
            const runLogs = await pipelineAPI.getRunLogs(run.run_id);
            runLogs.forEach((log: any) => {
              allLogs.push({
                time:     new Date(log.logged_at).toLocaleTimeString(),
                level:    log.log_level === "INFO" ? "info" :
                          log.log_level === "WARNING" ? "warning" :
                          log.log_level === "ERROR" ? "error" : "info",
                pipeline: run.pipeline_name.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()),
                message:  log.message,
                duration: run.ended_at && run.started_at
                  ? `${Math.round((new Date(run.ended_at).getTime() - new Date(run.started_at).getTime()) / 1000)}s`
                  : "..."
              });
            });
          } catch (e) {
            console.error("Error fetching logs for run:", run.run_id);
          }
        }

        // Sort by time descending
        allLogs.sort((a, b) => b.time.localeCompare(a.time));
        setLogs(allLogs);
        setLastUpdated(new Date().toLocaleTimeString());

      } catch (error) {
        console.error("Error fetching monitoring data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchLogs();
    const interval = setInterval(fetchLogs, 30000);
    return () => clearInterval(interval);
  }, []);

  const metricsDisplay = [
    { label: "Total Events",    value: metrics.totalEvents.toString(),    color: "blue" },
    { label: "Success Rate",    value: `${metrics.successRate}%`,         color: "green" },
    { label: "Active Warnings", value: metrics.warnings.toString(),       color: "yellow" },
    { label: "Critical Errors", value: metrics.errors.toString(),         color: "red" },
  ];

  const getLogIcon = (level: string) => {
    switch (level) {
      case "success": return <CheckCircle className="size-4 text-green-600" />;
      case "error":   return <XCircle className="size-4 text-red-600" />;
      case "warning": return <AlertTriangle className="size-4 text-yellow-600" />;
      case "info":    return <Info className="size-4 text-blue-600" />;
      default:        return null;
    }
  };

  const getLogColor = (level: string) => {
    switch (level) {
      case "success": return "text-green-700";
      case "error":   return "text-red-700";
      case "warning": return "text-yellow-700";
      case "info":    return "text-blue-700";
      default:        return "text-gray-700";
    }
  };

  const getLogBg = (level: string) => {
    switch (level) {
      case "success": return "hover:bg-green-50";
      case "error":   return "hover:bg-red-50";
      case "warning": return "hover:bg-yellow-50";
      case "info":    return "hover:bg-blue-50";
      default:        return "hover:bg-gray-50";
    }
  };

  const getMetricColor = (color: string) => {
    const colors = {
      blue:   "bg-blue-50 border-blue-200 text-blue-900",
      green:  "bg-green-50 border-green-200 text-green-900",
      yellow: "bg-yellow-50 border-yellow-200 text-yellow-900",
      red:    "bg-red-50 border-red-200 text-red-900",
    };
    return colors[color as keyof typeof colors] || "bg-gray-50 border-gray-200 text-gray-900";
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Pipeline Monitoring</h2>
        <p className="text-sm text-gray-600 mt-1">Real-time system activity and logs</p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        {metricsDisplay.map((metric, index) => (
          <div key={index} className={`border rounded-lg p-5 ${getMetricColor(metric.color)}`}>
            <p className="text-sm font-medium mb-1 opacity-75">{metric.label}</p>
            <p className="text-3xl font-bold">{loading ? "..." : metric.value}</p>
          </div>
        ))}
      </div>

      {/* Activity Logs */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Activity className="size-5 text-gray-700" />
              <h3 className="font-semibold text-gray-900">Activity Log</h3>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Clock className="size-4" />
              <span>Last updated: {lastUpdated}</span>
            </div>
          </div>
        </div>

        <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
          {loading ? (
            <div className="px-6 py-8 text-center text-gray-400 text-sm">Loading logs...</div>
          ) : logs.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-400 text-sm">No logs yet — trigger a pipeline to see activity</div>
          ) : (
            logs.map((log, index) => (
              <div key={index} className={`px-6 py-4 flex items-start gap-4 transition-colors ${getLogBg(log.level)}`}>
                <div className="flex items-center gap-3 min-w-[100px]">
                  {getLogIcon(log.level)}
                  <span className="text-sm font-mono text-gray-500">{log.time}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-gray-700">{log.pipeline}</span>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs text-gray-500">{log.duration}</span>
                  </div>
                  <p className={`text-sm ${getLogColor(log.level)}`}>{log.message}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}