import { Database, CheckCircle2, AlertTriangle, TrendingUp, Activity } from "lucide-react";

export function Overview() {
  const stats = [
    { 
      label: "Climate Records", 
      value: "0", 
      change: "0%",
      icon: Database,
      color: "blue"
    },
    { 
      label: "Infrastructure Assets", 
      value: "0", 
      change: "0",
      icon: Activity,
      color: "green"
    },
    { 
      label: "High Risk Alerts", 
      value: "0", 
      change: "0",
      icon: AlertTriangle,
      color: "red"
    },
    { 
      label: "Data Quality", 
      value: "0%", 
      change: "0%",
      icon: CheckCircle2,
      color: "green"
    },
  ];

  const pipelines = [
    { 
      name: "Climate Data Collection", 
      source: "",
      status: "Idle", 
      records: "0",
      lastRun: ""
    },
    { 
      name: "Satellite Data Processing", 
      source: "",
      status: "Idle", 
      records: "0",
      lastRun: ""
    },
    { 
      name: "Infrastructure Monitoring", 
      source: "",
      status: "Idle", 
      records: "0",
      lastRun: ""
    },
  ];

  const vulnerabilities = [
    { 
      location: "", 
      risk: "", 
      factor: "",
      priority: ""
    },
    { 
      location: "", 
      risk: "", 
      factor: "",
      priority: ""
    },
    { 
      location: "", 
      risk: "", 
      factor: "",
      priority: ""
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
    switch(risk) {
      case "High": return "bg-red-50 text-red-700 border-red-200";
      case "Medium": return "bg-yellow-50 text-yellow-700 border-yellow-200";
      case "Low": return "bg-green-50 text-green-700 border-green-200";
      default: return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Infrastructure Monitoring Dashboard</h2>
        <p className="text-sm text-gray-600 mt-1">Climate-Resilient Infrastructure Pipeline - Zambia</p>
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
            <p className="text-xs text-blue-600">{stat.change} from last month</p>
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
            {pipelines.map((pipeline, index) => (
              <div key={index} className="px-6 py-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div
                        className={`size-2 rounded-full ${
                          pipeline.status === "Running" ? "bg-blue-500" : "bg-green-500"
                        }`}
                      />
                      <span className="text-sm font-medium text-gray-900">{pipeline.name}</span>
                    </div>
                    <p className="text-xs text-gray-500">{pipeline.source}</p>
                  </div>
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                      pipeline.status === "Running"
                        ? "bg-blue-50 text-blue-700"
                        : "bg-green-50 text-green-700"
                    }`}
                  >
                    {pipeline.status}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-500 mt-2">
                  <span>{pipeline.records} records</span>
                  <span>•</span>
                  <span>Last run: {pipeline.lastRun}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Infrastructure Vulnerabilities */}
        <div className="bg-white border border-gray-200 rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">Infrastructure Risk Alerts</h3>
            <p className="text-xs text-gray-500 mt-0.5">Climate vulnerability analysis</p>
          </div>
          <div className="divide-y divide-gray-200">
            {vulnerabilities.map((item, index) => (
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
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}