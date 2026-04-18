import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle2 } from "lucide-react";

export function Analytics() {
  const climateDataTrend = [
    { month: "Sep", records: 98 },
    { month: "Oct", records: 112 },
    { month: "Nov", records: 105 },
    { month: "Dec", records: 127 },
    { month: "Jan", records: 135 },
    { month: "Feb", records: 128 },
    { month: "Mar", records: 145 },
  ];

  const sourceDistribution = [
    { name: "Climate APIs", records: 456, fill: "#2563eb" },
    { name: "Satellite Data", records: 678, fill: "#9333ea" },
    { name: "Infrastructure DB", records: 89, fill: "#16a34a" },
  ];

  const riskByRegion = [
    { region: "Lusaka", high: 8, medium: 15, low: 42 },
    { region: "Copperbelt", high: 5, medium: 12, low: 38 },
    { region: "Southern", high: 12, medium: 18, low: 35 },
    { region: "Eastern", high: 6, medium: 14, low: 40 },
    { region: "Western", high: 9, medium: 16, low: 37 },
  ];

  const vulnerabilityData = [
    { type: "Flooding", count: 23, color: "#ef4444" },
    { type: "Erosion", count: 12, color: "#f59e0b" },
    { type: "Heat Stress", count: 8, color: "#eab308" },
    { type: "Low Risk", count: 142, color: "#22c55e" },
  ];

  const performanceMetrics = [
    {
      label: "Data Processing Rate",
      value: "1.2M",
      change: "+18%",
      trend: "up",
      subtitle: "records/month"
    },
    {
      label: "Pipeline Efficiency",
      value: "96.8%",
      change: "+2.1%",
      trend: "up",
      subtitle: "success rate"
    },
    {
      label: "Infrastructure Coverage",
      value: "3,847",
      change: "+124",
      trend: "up",
      subtitle: "monitored assets"
    },
    {
      label: "Active Vulnerabilities",
      value: "23",
      change: "+5",
      trend: "down",
      subtitle: "high risk alerts"
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
        {performanceMetrics.map((metric, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-3">
                <p className="text-sm text-gray-600">{metric.label}</p>
                {metric.trend === "up" ? (
                  <TrendingUp className="size-4 text-green-600" />
                ) : (
                  <TrendingDown className="size-4 text-red-600" />
                )}
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
        {/* Climate Data Collection Trend */}
        <Card>
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="size-5 text-blue-600" />
              Climate Data Collection Trend
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={climateDataTrend}>
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
            <p className="text-xs text-gray-500 mt-4 text-center">Records processed (thousands) over the last 7 months</p>
          </CardContent>
        </Card>

        {/* Infrastructure Risk by Region */}
        <Card>
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="size-5 text-yellow-600" />
              Infrastructure Risk by Region
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={riskByRegion}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="region" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip />
                <Bar dataKey="high" stackId="a" fill="#ef4444" radius={[0, 0, 0, 0]} />
                <Bar dataKey="medium" stackId="a" fill="#f59e0b" radius={[0, 0, 0, 0]} />
                <Bar dataKey="low" stackId="a" fill="#22c55e" radius={[4, 4, 0, 0]} />
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
        {/* Data Source Distribution */}
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
            <p className="text-xs text-gray-500 mt-4 text-center">Total: 1.2M records across all sources</p>
          </CardContent>
        </Card>

        {/* Vulnerability Type Distribution */}
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
                    <span className="text-sm font-bold text-gray-900">{item.count}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-3">
                    <div
                      className="h-3 rounded-full transition-all"
                      style={{
                        width: `${(item.count / 185) * 100}%`,
                        backgroundColor: item.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-900">
                <strong>Total Infrastructure Assets Monitored:</strong> 185
              </p>
              <p className="text-xs text-blue-700 mt-1">
                23 high-priority vulnerabilities require immediate attention
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}