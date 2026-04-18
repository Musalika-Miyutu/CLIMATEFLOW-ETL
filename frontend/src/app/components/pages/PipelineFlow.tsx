import { Database, Zap, HardDrive, ArrowRight, Cloud, Satellite, FileSpreadsheet } from "lucide-react";

export function PipelineFlow() {
  const stages = [
    {
      name: "Extract",
      icon: Database,
      color: "blue",
      description: "Data Collection",
      items: [
        { name: "Climate Data", detail: "Zambia Met Dept, NOAA, Copernicus", icon: Cloud },
        { name: "Satellite Data", detail: "NASA, ESA Sentinel missions", icon: Satellite },
        { name: "Infrastructure DB", detail: "RDA, Municipal records", icon: FileSpreadsheet }
      ],
    },
    {
      name: "Transform",
      icon: Zap,
      color: "purple",
      description: "Data Processing",
      items: [
        { name: "Data Cleaning", detail: "Remove duplicates, validate formats" },
        { name: "Standardization", detail: "Normalize units, combine datasets" },
        { name: "Risk Analysis", detail: "Calculate vulnerability scores" }
      ],
    },
    {
      name: "Load",
      icon: HardDrive,
      color: "green",
      description: "Data Storage",
      items: [
        { name: "PostgreSQL + PostGIS", detail: "Centralized climate database" },
        { name: "Analytics Engine", detail: "Processed insights & reports" },
        { name: "Dashboard Cache", detail: "Fast data retrieval" }
      ],
    },
  ];

  const getColorClasses = (color: string) => {
    const colors = {
      blue: "bg-blue-600 text-white",
      purple: "bg-purple-600 text-white",
      green: "bg-green-600 text-white",
    };
    return colors[color as keyof typeof colors] || "bg-gray-600 text-white";
  };

  const getBorderColor = (color: string) => {
    const colors = {
      blue: "border-blue-200",
      purple: "border-purple-200",
      green: "border-green-200",
    };
    return colors[color as keyof typeof colors] || "border-gray-200";
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">ETL Pipeline Flow</h2>
        <p className="text-sm text-gray-600 mt-1">Automated data pipeline architecture</p>
      </div>

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
                  <div key={idx} className="px-5 py-4">
                    <div className="flex items-start gap-3">
                      {item.icon && <item.icon className="size-5 text-gray-400 mt-0.5" />}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900">{item.name}</p>
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
          <p className="text-3xl font-bold text-blue-900">12</p>
          <p className="text-xs text-blue-600 mt-1">Climate, Satellite, Infrastructure</p>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-5">
          <p className="text-sm text-purple-700 font-medium mb-1">Processing Speed</p>
          <p className="text-3xl font-bold text-purple-900">4.2s</p>
          <p className="text-xs text-purple-600 mt-1">Average transformation time</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-5">
          <p className="text-sm text-green-700 font-medium mb-1">Records Stored</p>
          <p className="text-3xl font-bold text-green-900">1.2M</p>
          <p className="text-xs text-green-600 mt-1">Total database entries</p>
        </div>
      </div>
    </div>
  );
}