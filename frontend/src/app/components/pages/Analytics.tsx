import { useState, useEffect } from "react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle2 } from "lucide-react";
import { weatherAPI, assetsAPI, riskAPI, pipelineAPI } from "../../../imports/api";

export function Analytics() {
  const [sourceDistribution, setSourceDistribution] = useState([
    { name: "NASA POWER",  records: 0, fill: "#2563eb" },
    { name: "OpenWeather", records: 0, fill: "#9333ea" },
    { name: "ERA5",        records: 0, fill: "#16a34a" },
  ]);
  const [riskByAsset, setRiskByAsset]               = useState<any[]>([]);
  const [vulnerabilityData, setVulnerabilityData]   = useState([
    { type: "Critical Risk", count: 0, color: "#ef4444" },
    { type: "High Risk",     count: 0, color: "#f59e0b" },
    { type: "Medium Risk",   count: 0, color: "#eab308" },
    { type: "Low Risk",      count: 0, color: "#22c55e" },
  ]);
  const [performanceMetrics, setPerformanceMetrics] = useState({
    totalRecords:    0,
    pipelineSuccess: 0,
    totalAssets:     0,
    highRiskAlerts:  0,
  });
  const [observationTrend, setObservationTrend]     = useState<any[]>([]);
  const [totalRecords, setTotalRecords]             = useState(0);
  const [loading, setLoading]                       = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [summary, assets, assessments, alerts, runs, observations] = await Promise.all([
          weatherAPI.getSourcesSummary(),
          assetsAPI.getAll(),
          riskAPI.getAll(),
          riskAPI.getAllAlerts(),
          pipelineAPI.getRuns(),
          weatherAPI.getObservations(),
        ]);

        // Source distribution
        const updatedSources = [
          { name: "NASA POWER",  records: summary.find((s: any) => s.source === "NASA POWER")?.total_observations  || 0, fill: "#2563eb" },
          { name: "OpenWeather", records: summary.find((s: any) => s.source === "OpenWeather")?.total_observations || 0, fill: "#9333ea" },
          { name: "ERA5",        records: summary.find((s: any) => s.source === "ERA5")?.total_observations        || 0, fill: "#16a34a" },
        ];
        setSourceDistribution(updatedSources);

        const total = updatedSources.reduce((sum, s) => sum + s.records, 0);
        setTotalRecords(total);

        // Risk by asset type
        const assetRiskMap: Record<string, { high: number, medium: number, low: number }> = {};
        assets.forEach((asset: any) => {
          assetRiskMap[asset.asset_name] = { high: 0, medium: 0, low: 0 };
        });

        assessments.forEach((a: any) => {
          const asset = assets.find((asset: any) => asset.asset_id === a.asset_id);
          if (asset) {
            const name = asset.asset_name.split(" ").slice(0, 2).join(" ");
            if (!assetRiskMap[name]) assetRiskMap[name] = { high: 0, medium: 0, low: 0 };
            if (a.risk_level >= 4)      assetRiskMap[name].high++;
            else if (a.risk_level >= 3) assetRiskMap[name].medium++;
            else                        assetRiskMap[name].low++;
          }
        });

        setRiskByAsset(
          Object.entries(assetRiskMap).map(([region, counts]) => ({ region, ...counts }))
        );

        // Vulnerability distribution
        const critical = assessments.filter((a: any) => a.risk_level === 5).length;
        const high     = assessments.filter((a: any) => a.risk_level === 4).length;
        const medium   = assessments.filter((a: any) => a.risk_level === 3).length;
        const low      = assessments.filter((a: any) => a.risk_level <= 2).length;

        setVulnerabilityData([
          { type: "Critical Risk", count: critical, color: "#ef4444" },
          { type: "High Risk",     count: high,     color: "#f59e0b" },
          { type: "Medium Risk",   count: medium,   color: "#eab308" },
          { type: "Low Risk",      count: low,      color: "#22c55e" },
        ]);

        // Performance metrics
        const successRuns = runs.filter((r: any) => r.status === "success").length;
        const successRate = runs.length > 0
          ? Math.round((successRuns / runs.length) * 100)
          : 0;
        const highAlerts  = alerts.filter(
          (a: any) => a.severity === "high" || a.severity === "critical"
        ).length;

        setPerformanceMetrics({
          totalRecords:    total,
          pipelineSuccess: successRate,
          totalAssets:     assets.length,
          highRiskAlerts:  highAlerts,
        });

        // Observation trend — group by date
        const trendMap: Record<string, number> = {};
        observations.forEach((obs: any) => {
          const date = new Date(obs.observed_at).toLocaleDateString("en-US", {
            month: "short", day: "numeric"
          });
          trendMap[date] = (trendMap[date] || 0) + 1;
        });

        const trend = Object.entries(trendMap)
          .slice(-7)
          .map(([date, records]) => ({ month: date, records }));
        setObservationTrend(trend);

      } catch (error) {
        console.error("Error fetching analytics data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  const maxVulnerability = Math.max(...vulnerabilityData.map(v => v.count), 1);

  const metrics = [
    {
      label:    "Data Processing Rate",
      value:    loading ? "..." : performanceMetrics.totalRecords.toLocaleString(),
      change:   "All sources",
      trend:    "up",
      subtitle: "total records"
    },
    {
      label:    "Pipeline Efficiency",
      value:    loading ? "..." : `${performanceMetrics.pipelineSuccess}%`,
      change:   "Success rate",
      trend:    "up",
      subtitle: "pipeline runs"
    },
    {
      label:    "Infrastructure Coverage",
      value:    loading ? "..." : performanceMetrics.totalAssets.toString(),
      change:   "Kitwe area",
      trend:    "up",
      subtitle: "monitored assets"
    },
    {
      label:    "Active Vulnerabilities",
      value:    loading ? "..." : performanceMetrics.highRiskAlerts.toString(),
      change:   "High & critical",
      trend:    performanceMetrics.highRiskAlerts > 0 ? "down" : "up",
      subtitle: "risk alerts"
    },
  ];

  return (
    <div className="p-8 space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h2>
        <p className="text-gray-600 mt-1">Infrastructure vulnerability and pipeline performance insights</p>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-4 gap-6">
        {metrics.map((metric, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-3">
                <p className="text-sm text-gray-600">{metric.label}</p>
                {metric.trend === "up"
                  ? <TrendingUp  className="size-4 text-green-600" />
                  : <TrendingDown className="size-4 text-red-600" />
                }
              </div>
              <p className="text-3xl font-bold text-gray-900">{metric.value}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className={`text-xs font-medium ${metric.trend === "up" ? "text-green-600" : "text-red-600"}`}>
                  {metric.change}
                </span>
                <span className="text-xs text-gray-500">{metric.subtitle}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Observation Trend */}
        <Card>
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="size-5 text-blue-600" />
              Climate Data Collection Trend
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={observationTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="records"
                  stroke="#2563eb"
                  strokeWidth={3}
                  dot={{ fill: "#2563eb", r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
            <p className="text-xs text-gray-500 mt-4 text-center">
              Observations ingested per day across all sources
            </p>
          </CardContent>
        </Card>

        {/* Risk by Asset */}
        <Card>
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="size-5 text-yellow-600" />
              Infrastructure Risk by Asset
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={riskByAsset}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="region" stroke="#6b7280" tick={{ fontSize: 11 }} />
                <YAxis stroke="#6b7280" />
                <Tooltip />
                <Bar dataKey="high"   stackId="a" fill="#ef4444" />
                <Bar dataKey="medium" stackId="a" fill="#f59e0b" />
                <Bar dataKey="low"    stackId="a" fill="#22c55e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <div className="flex items-center justify-center gap-4 mt-4 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="size-3 bg-red-500 rounded"></div>
                <span className="text-gray-600">High Risk</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="size-3 bg-orange-500 rounded"></div>
                <span className="text-gray-600">Medium Risk</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="size-3 bg-green-500 rounded"></div>
                <span className="text-gray-600">Low Risk</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Source Distribution */}
        <Card>
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="size-5 text-green-600" />
              Data Source Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={sourceDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  dataKey="records"
                >
                  {sourceDistribution.map((entry) => (
                    <Cell key={`cell-${entry.name}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <p className="text-xs text-gray-500 mt-4 text-center">
              Total: {loading ? "..." : totalRecords.toLocaleString()} records across all sources
            </p>
          </CardContent>
        </Card>

        {/* Vulnerability Distribution */}
        <Card>
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="size-5 text-red-600" />
              Vulnerability Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {vulnerabilityData.map((item, index) => (
                <div key={index}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">{item.type}</span>
                    <span className="text-sm font-bold text-gray-900">
                      {loading ? "..." : item.count}
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-3">
                    <div
                      className="h-3 rounded-full transition-all"
                      style={{
                        width: `${(item.count / maxVulnerability) * 100}%`,
                        backgroundColor: item.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-900">
                <strong>Total Infrastructure Assets Monitored:</strong>{" "}
                {loading ? "..." : performanceMetrics.totalAssets}
              </p>
              <p className="text-xs text-blue-700 mt-1">
                {loading ? "..." : performanceMetrics.highRiskAlerts} high-priority vulnerabilities require immediate attention
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}