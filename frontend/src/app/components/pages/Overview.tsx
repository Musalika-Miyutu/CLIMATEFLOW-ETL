import { useState, useEffect } from "react";
import { Database, CheckCircle2, AlertTriangle, TrendingUp, Activity } from "lucide-react";
import { assetsAPI, weatherAPI, riskAPI, pipelineAPI } from "../../../imports/api";

export function Overview() {
  const [totalObservations, setTotalObservations]   = useState(0);
  const [totalAssets, setTotalAssets]               = useState(0);
  const [highRiskAlerts, setHighRiskAlerts]         = useState(0);
  const [dataQuality, setDataQuality]               = useState(0);
  const [pipelines, setPipelines]                   = useState<any[]>([]);
  const [vulnerabilities, setVulnerabilities]       = useState<any[]>([]);
  const [loading, setLoading]                       = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch all data in parallel
        const [assets, alerts, pipelineRuns, sourcesSummary] = await Promise.all([
          assetsAPI.getAll(),
          riskAPI.getAllAlerts(),
          pipelineAPI.getRuns(),
          weatherAPI.getSourcesSummary(),
        ]);

        // Total observations across all sources
        const totalObs = sourcesSummary.reduce(
          (sum: number, s: any) => sum + s.total_observations, 0
        );
        setTotalObservations(totalObs);
        setTotalAssets(assets.length);

        // High risk alerts
        const highAlerts = alerts.filter(
          (a: any) => a.severity === "high" || a.severity === "critical"
        );
        setHighRiskAlerts(highAlerts.length);

        // Data quality — percentage of successful pipeline runs
        const successRuns = pipelineRuns.filter(
          (r: any) => r.status === "success"
        ).length;
        const quality = pipelineRuns.length > 0
          ? Math.round((successRuns / pipelineRuns.length) * 100)
          : 0;
        setDataQuality(quality);

        // Pipeline display — show last 3 runs
        const recentRuns = pipelineRuns.slice(0, 3).map((run: any) => ({
          name: run.pipeline_name.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()),
          source: run.pipeline_name.includes("nasa") ? "NASA POWER API" :
                  run.pipeline_name.includes("openweather") ? "OpenWeather API" :
                  run.pipeline_name.includes("era5") ? "ERA5 Copernicus" :
                  "Internal Engine",
          status: run.status === "running" ? "Running" : "Complete",
          records: run.records_processed?.toString() || "0",
          lastRun: run.ended_at
            ? new Date(run.ended_at).toLocaleString()
            : "In progress..."
        }));
        setPipelines(recentRuns);

        // Vulnerabilities — show top alerts with asset info
        const topAlerts = alerts.slice(0, 3).map((alert: any) => ({
          location: alert.message?.split("(")[0]?.replace(/RISK LEVEL \d+ \(\w+\): /, "") || "Unknown Asset",
          risk: alert.severity === "critical" ? "High" :
                alert.severity === "high" ? "High" :
                alert.severity === "medium" ? "Medium" : "Low",
          factor: alert.message?.split("due to")[1]?.split(".")[0] || "Weather conditions",
          priority: alert.acknowledged ? "Acknowledged" : "Immediate Action Required"
        }));
        setVulnerabilities(topAlerts);

      } catch (error) {
        console.error("Error fetching overview data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
    // Refresh every 60 seconds
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  const stats = [
    {
      label: "Climate Records",
      value: loading ? "..." : totalObservations.toLocaleString(),
      change: "Live data",
      icon: Database,
      color: "blue"
    },
    {
      label: "Infrastructure Assets",
      value: loading ? "..." : totalAssets.toString(),
      change: "Kitwe, Copperbelt",
      icon: Activity,
      color: "green"
    },
    {
      label: "High Risk Alerts",
      value: loading ? "..." : highRiskAlerts.toString(),
      change: "Active alerts",
      icon: AlertTriangle,
      color: "red"
    },
    {
      label: "Data Quality",
      value: loading ? "..." : `${dataQuality}%`,
      change: "Pipeline success rate",
      icon: CheckCircle2,
      color: "green"
    },
  ];

  const getIconColor = (color: string) => {
    const colors = {
      blue: "text-blue-600",
      green: "text-green-600",
      red: "text-red-600",
    };
    return colors[color as keyof typeof colors] || "text-gray-600";
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "High":    return "bg-red-50 text-red-700 border-red-200";
      case "Medium":  return "bg-yellow-50 text-yellow-700 border-yellow-200";
      case "Low":     return "bg-green-50 text-green-700 border-green-200";
      default:        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Infrastructure Monitoring Dashboard</h2>
          <p className="text-sm text-gray-600 mt-1">Climate-Resilient Infrastructure Pipeline — Zambia</p>
        </div>
        <button
          onClick={() => pipelineAPI.downloadReport()}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          Download PDF Report
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white border border-gray-200 rounded-lg p-5">
            <div className="flex items-start justify-between mb-3">
              <p className="text-sm text-gray-600">{stat.label}</p>
              <stat.icon className={`size-5 ${getIconColor(stat.color)}`} />
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</p>
            <p className="text-xs text-blue-600">{stat.change}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Active Pipelines */}
        <div className="bg-white border border-gray-200 rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">Active Data Pipelines</h3>
            <p className="text-xs text-gray-500 mt-0.5">Automated data collection status</p>
          </div>
          <div className="divide-y divide-gray-200">
            {loading ? (
              <div className="px-6 py-8 text-center text-gray-400 text-sm">Loading pipelines...</div>
            ) : pipelines.length === 0 ? (
              <div className="px-6 py-8 text-center text-gray-400 text-sm">No pipeline runs yet</div>
            ) : (
              pipelines.map((pipeline, index) => (
                <div key={index} className="px-6 py-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <div className={`size-2 rounded-full ${
                          pipeline.status === "Running" ? "bg-blue-500" : "bg-green-500"
                        }`} />
                        <span className="text-sm font-medium text-gray-900">{pipeline.name}</span>
                      </div>
                      <p className="text-xs text-gray-500">{pipeline.source}</p>
                    </div>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                      pipeline.status === "Running"
                        ? "bg-blue-50 text-blue-700"
                        : "bg-green-50 text-green-700"
                    }`}>
                      {pipeline.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-500 mt-2">
                    <span>{pipeline.records} records</span>
                    <span>•</span>
                    <span>Last run: {pipeline.lastRun}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Infrastructure Risk Alerts */}
        <div className="bg-white border border-gray-200 rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">Infrastructure Risk Alerts</h3>
            <p className="text-xs text-gray-500 mt-0.5">Climate vulnerability analysis</p>
          </div>
          <div className="divide-y divide-gray-200">
            {loading ? (
              <div className="px-6 py-8 text-center text-gray-400 text-sm">Loading alerts...</div>
            ) : vulnerabilities.length === 0 ? (
              <div className="px-6 py-8 text-center text-green-600 text-sm">
                ✓ No active risk alerts — all assets within safe thresholds
              </div>
            ) : (
              vulnerabilities.map((item, index) => (
                <div key={index} className="px-6 py-4">
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900">{item.location}</span>
                    <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${getRiskColor(item.risk)}`}>
                      {item.risk} Risk
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mb-2">{item.factor}</p>
                  <span className="text-xs font-medium text-blue-600">{item.priority}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>cdcd
    </div>
  );
}    