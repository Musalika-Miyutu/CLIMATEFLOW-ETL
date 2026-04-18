import { Cloud, Satellite, Database, Building2, Droplets, Thermometer } from "lucide-react";

export function DataSources() {
  const sources = [
    {
      name: "Zambia Meteorological Department",
      type: "Climate Data Provider",
      icon: Cloud,
      category: "Climate",
      endpoint: "",
      records: "0",
      status: "Inactive",
      dataTypes: [],
      frequency: ""
    },
    {
      name: "NOAA Climate Data",
      type: "Historical Climate Records",
      icon: Thermometer,
      category: "Climate",
      endpoint: "",
      records: "0",
      status: "Inactive",
      dataTypes: [],
      frequency: ""
    },
    {
      name: "NASA POWER API",
      type: "Solar & Meteorological Data",
      icon: Satellite,
      category: "Satellite",
      endpoint: "",
      records: "0",
      status: "Inactive",
      dataTypes: [],
      frequency: ""
    },
    {
      name: "ESA Sentinel Satellites",
      type: "Earth Observation Data",
      icon: Satellite,
      category: "Satellite",
      endpoint: "",
      records: "0",
      status: "Inactive",
      dataTypes: [],
      frequency: ""
    },
    {
      name: "Road Development Agency (RDA)",
      type: "Infrastructure Asset Database",
      icon: Building2,
      category: "Infrastructure",
      endpoint: "",
      records: "0",
      status: "Inactive",
      dataTypes: [],
      frequency: ""
    },
    {
      name: "Water & Sanitation Department",
      type: "Hydrological Monitoring",
      icon: Droplets,
      category: "Infrastructure",
      endpoint: "",
      records: "0",
      status: "Inactive",
      dataTypes: [],
      frequency: ""
    },
  ];

  const getCategoryColor = (category: string) => {
    switch(category) {
      case "Climate": return "bg-blue-100 text-blue-700";
      case "Satellite": return "bg-purple-100 text-purple-700";
      case "Infrastructure": return "bg-green-100 text-green-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const getIconBg = (category: string) => {
    switch(category) {
      case "Climate": return "bg-blue-100";
      case "Satellite": return "bg-purple-100";
      case "Infrastructure": return "bg-green-100";
      default: return "bg-gray-100";
    }
  };

  const getIconColor = (category: string) => {
    switch(category) {
      case "Climate": return "text-blue-600";
      case "Satellite": return "text-purple-600";
      case "Infrastructure": return "text-green-600";
      default: return "text-gray-600";
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Data Sources</h2>
        <p className="text-sm text-gray-600 mt-1">Integrated climate and infrastructure data providers</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-6 mb-8">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-5">
          <div className="flex items-center gap-3 mb-2">
            <Cloud className="size-5 text-blue-600" />
            <span className="text-sm font-semibold text-blue-900">Climate Sources</span>
          </div>
          <p className="text-2xl font-bold text-blue-900">0</p>
          <p className="text-xs text-blue-600 mt-1">0 records</p>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-5">
          <div className="flex items-center gap-3 mb-2">
            <Satellite className="size-5 text-purple-600" />
            <span className="text-sm font-semibold text-purple-900">Satellite Sources</span>
          </div>
          <p className="text-2xl font-bold text-purple-900">0</p>
          <p className="text-xs text-purple-600 mt-1">0 records</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-5">
          <div className="flex items-center gap-3 mb-2">
            <Database className="size-5 text-green-600" />
            <span className="text-sm font-semibold text-green-900">Infrastructure Sources</span>
          </div>
          <p className="text-2xl font-bold text-green-900">0</p>
          <p className="text-xs text-green-600 mt-1">0 records</p>
        </div>
      </div>

      {/* Data Sources List */}
      <div className="space-y-4">
        {sources.map((source, index) => (
          <div key={index} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`p-3 ${getIconBg(source.category)} rounded-lg`}>
                  <source.icon className={`size-6 ${getIconColor(source.category)}`} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{source.name}</h3>
                  <p className="text-sm text-gray-500">{source.type}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs px-3 py-1.5 rounded-full font-medium ${getCategoryColor(source.category)}`}>
                  {source.category}
                </span>
                <span className="text-xs px-3 py-1.5 rounded-full bg-green-50 text-green-700 font-medium">
                  {source.status}
                </span>
              </div>
            </div>
            
            <div className="px-6 py-4 bg-gray-50">
              <div className="grid grid-cols-4 gap-6">
                <div>
                  <p className="text-xs text-gray-500 mb-1">API Endpoint</p>
                  <p className="text-sm font-mono text-gray-900">{source.endpoint}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Total Records</p>
                  <p className="text-sm font-semibold text-gray-900">{source.records}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Update Frequency</p>
                  <p className="text-sm font-semibold text-gray-900">{source.frequency}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Data Types</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {source.dataTypes.slice(0, 2).map((type, idx) => (
                      <span key={idx} className="text-xs px-2 py-0.5 bg-white border border-gray-200 rounded">
                        {type}
                      </span>
                    ))}
                    {source.dataTypes.length > 2 && (
                      <span className="text-xs px-2 py-0.5 text-gray-500">
                        +{source.dataTypes.length - 2}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}