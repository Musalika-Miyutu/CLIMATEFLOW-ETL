import { useState, useEffect } from "react";
import { Database, Zap, HardDrive, ArrowRight, Cloud, Satellite, FileSpreadsheet, type LucideIcon } from "lucide-react";
import { pipelineAPI, weatherAPI } from "../../../imports/api";

type StageItem = {
  name: string;
  detail: string;
  icon?: LucideIcon;
  action?: () => Promise<any>;
};

type Stage = {
  name: string;
  icon: LucideIcon;
  color: string;
  description: string;
  items: StageItem[];
};

export function PipelineFlow() {
  const [stats, setStats]     = useState({
    totalSources:    0,
    processingSpeed: 0,
    totalRecords:    0,
  });
  const [running, setRunning] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const [runs, summary] = await Promise.all([
          pipelineAPI.getRuns(),
          weatherAPI.getSourcesSummary(),
        ]);

        const totalRecords = summary.reduce(
          (sum: number, s: any) => sum + s.total_observations, 0
        );

        const successRuns = runs.filter((r: any) => r.status === "success");
        const avgSpeed = successRuns.length > 0
          ? Math.round(
              successRuns.reduce((sum: number, r: any) => {
                if (r.ended_at && r.started_at) {
                  return sum + (new Date(r.ended_at).getTime() - new Date(r.started_at).getTime()) / 1000;
                }
                return sum;
              }, 0) / successRuns.length
            )
          : 0;

        setStats({
          totalSources:    summary.filter((s: any) => s.total_observations > 0).length,
          processingSpeed: avgSpeed,
          totalRecords,
        });

      } catch (error) {
        console.error("Error fetching pipeline stats:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  async function triggerPipeline(name: string, fn: () => Promise<any>) {
    setRunning(name);
    setMessage("");
    try {
      await fn();
      setMessage(`✓ ${name} pipeline triggered successfully! Check Monitoring for live logs.`);
    } catch (error) {
      setMessage(`✗ Failed to trigger ${name} pipeline. Make sure the backend is running.`);
    } finally {
      setRunning(null);
    }
  }

  const stages: Stage[] = [
    {
      name:        "Extract",
      icon:        Database,
      color:       "blue",
      description: "Data Collection",
      items: [
        {
          name:   "NASA POWER",
          detail: "Climate reanalysis data",
          icon:   Cloud,
          action: () => triggerPipeline("NASA POWER", () => pipelineAPI.runNasaPower())
        },
        {
          name:   "OpenWeather",
          detail: "Live weather conditions",
          icon:   Satellite,
          action: () => triggerPipeline("OpenWeather", () => pipelineAPI.runOpenWeather())
        },
        {
          name:   "ERA5 Copernicus",
          detail: "Historical reanalysis",
          icon:   FileSpreadsheet,
          action: () => triggerPipeline("ERA5", () => pipelineAPI.runEra5())
        }
      ],
    },
    {
      name:        "Transform",
      icon:        Zap,
      color:       "purple",
      description: "Data Processing",
      items: [
        { name: "Data Cleaning",    detail: "Remove duplicates and outliers" },
        { name: "Standardization",  detail: "Harmonize units across sources" },
        { name: "Risk Analysis",    detail: "Calculate infrastructure risk levels",
          action: () => triggerPipeline("Risk Assessment", () => pipelineAPI.runRiskAssessment())
        }
      ],
    },
    {
      name:        "Load",
      icon:        HardDrive,
      color:       "green",
      description: "Data Storage",
      items: [
        { name: "PostgreSQL DB",     detail: "Primary data store" },
        { name: "Parquet Files",     detail: "Analysis-ready format" },
        { name: "Dashboard Cache",   detail: "Real-time API serving" }
      ],
    },
  ];

  const getColorClasses = (color: string) => {
    const colors = {
      blue:   "bg-blue-600 text-white",
      purple: "bg-purple-600 text-white",
      green:  "bg-green-600 text-white",
    };
    return colors[color as keyof typeof colors] || "bg-gray-600 text-white";
  };

  const getBorderColor = (color: string) => {
    const colors = {
      blue:   "border-blue-200",
      purple: "border-purple-200",
      green:  "border-green-200",
    };
    return colors[color as keyof typeof colors] || "border-gray-200";
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">ETL Pipeline Flow</h2>
        <p className="text-sm text-gray-600 mt-1">Automated data pipeline architecture — click to trigger pipelines</p>
      </div>

      {/* Message Banner */}
      {message && (
        <div className={`mb-6 px-4 py-3 rounded-lg text-sm font-medium ${
          message.startsWith("✓")
            ? "bg-green-50 text-green-700 border border-green-200"
            : "bg-red-50 text-red-700 border border-red-200"
        }`}>
          {message}
        </div>
      )}

      <div className="flex items-start gap-6">
        {stages.map((stage, index) => (
          <div key={index} className="flex items-start gap-6 flex-1">
            <div className="w-full">
              {/* Stage Header */}
              <div className={`flex items-center gap-3 mb-4 px-5 py-3 rounded-lg ${getColorClasses(stage.color)}`}>
                <stage.icon className="size-6" />
                <div>
                  <h3 className="font-bold text-base">{stage.name}</h3>
                  <p className="text-xs opacity-90">{stage.description}</p>
                </div>
              </div>

              {/* Stage Items */}
              <div className={`bg-white border-2 ${getBorderColor(stage.color)} rounded-lg divide-y divide-gray-200`}>
                {stage.items.map((item, idx) => (
                  <div
                    key={idx}
                    className={`px-5 py-4 ${item.action ? "cursor-pointer hover:bg-gray-50 transition-colors" : ""}`}
                    onClick={item.action}
                  >
                    <div className="flex items-start gap-3">
                      {item.icon && <item.icon className="size-5 text-gray-400 mt-0.5" />}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold text-gray-900">{item.name}</p>
                          {item.action && (
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              running === item.name.split(" ")[0]
                                ? "bg-blue-100 text-blue-700"
                                : "bg-gray-100 text-gray-600"
                            }`}>
                              {running === item.name.split(" ")[0] ? "Running..." : "▶ Run"}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{item.detail}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Arrow between stages */}
            {index < stages.length - 1 && (
              <div className="flex items-center pt-12">
                <ArrowRight className="size-6 text-gray-400" strokeWidth={2} />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Pipeline Stats */}
      <div className="mt-8 grid grid-cols-3 gap-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-5">
          <p className="text-sm text-blue-700 font-medium mb-1">Total Data Sources</p>
          <p className="text-3xl font-bold text-blue-900">{loading ? "..." : stats.totalSources}</p>
          <p className="text-xs text-blue-600 mt-1">NASA POWER, OpenWeather, ERA5</p>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-5">
          <p className="text-sm text-purple-700 font-medium mb-1">Avg Processing Speed</p>
          <p className="text-3xl font-bold text-purple-900">{loading ? "..." : `${stats.processingSpeed}s`}</p>
          <p className="text-xs text-purple-600 mt-1">Average pipeline run time</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-5">
          <p className="text-sm text-green-700 font-medium mb-1">Records Stored</p>
          <p className="text-3xl font-bold text-green-900">{loading ? "..." : stats.totalRecords.toLocaleString()}</p>
          <p className="text-xs text-green-600 mt-1">Across all sources in PostgreSQL</p>
        </div>
      </div>
    </div>
  );
}