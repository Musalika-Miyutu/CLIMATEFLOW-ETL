import { useState, useEffect } from "react";
import { Cloud, Satellite, Database, Building2, Droplets, Thermometer } from "lucide-react";
import { weatherAPI, assetsAPI } from "../../../imports/api";

export function DataSources() {
  const [summary, setSummary]   = useState<any[]>([]);
  const [assets, setAssets]     = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [sourceSummary, assetList] = await Promise.all([
          weatherAPI.getSourcesSummary(),
          assetsAPI.getAll(),
        ]);
        setSummary(sourceSummary);
        setAssets(assetList);
      } catch (error) {
        console.error("Error fetching data sources:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const nasaPower   = summary.find((s: any) => s.source === "NASA POWER")   || { total_observations: 0, total_stations: 0 };
  const openWeather = summary.find((s: any) => s.source === "OpenWeather")  || { total_observations: 0, total_stations: 0 };
  const era5        = summary.find((s: any) => s.source === "ERA5")         || { total_observations: 0, total_stations: 0 };

  const totalClimate        = nasaPower.total_observations + openWeather.total_observations + era5.total_observations;
  const totalInfrastructure = assets.length;

  const sources = [
    {
      name:      "NASA POWER API",
      type:      "Solar & Meteorological Reanalysis Data",
      icon:      Satellite,
      category:  "Climate",
      endpoint:  "power.larc.nasa.gov/api/temporal/daily/point",
      records:   loading ? "..." : nasaPower.total_observations.toLocaleString(),
      status:    nasaPower.total_observations > 0 ? "Active" : "Idle",
      dataTypes: ["Temperature", "Rainfall", "Wind Speed", "Humidity"],
      frequency: "Daily"
    },
    {
      name:      "OpenWeather API",
      type:      "Live Current Weather Conditions",
      icon:      Cloud,
      category:  "Climate",
      endpoint:  "api.openweathermap.org/data/2.5/weather",
      records:   loading ? "..." : openWeather.total_observations.toLocaleString(),
      status:    openWeather.total_observations > 0 ? "Active" : "Idle",
      dataTypes: ["Temperature", "Rainfall", "Wind Speed", "Humidity"],
      frequency: "Real-time"
    },
    {
      name:      "ERA5 Copernicus",
      type:      "Historical Climate Reanalysis",
      icon:      Thermometer,
      category:  "Climate",
      endpoint:  "cds.climate.copernicus.eu/api",
      records:   loading ? "..." : era5.total_observations.toLocaleString(),
      status:    era5.total_observations > 0 ? "Active" : "Idle",
      dataTypes: ["Temperature", "Precipitation", "Wind U/V", "Pressure"],
      frequency: "Monthly"
    },
    {
      name:      "Road Development Agency (RDA)",
      type:      "Infrastructure Asset Database",
      icon:      Building2,
      category:  "Infrastructure",
      endpoint:  "Internal PostgreSQL DB",
      records:   loading ? "..." : assets.filter((a: any) => a.asset_type === "road").length.toString(),
      status:    assets.length > 0 ? "Active" : "Idle",
      dataTypes: ["Road Segments", "Condition Status", "Risk Threshold", "Coordinates"],
      frequency: "On update"
    },
    {
      name:      "Bridge Monitoring System",
      type:      "Structural Infrastructure Data",
      icon:      Database,
      category:  "Infrastructure",
      endpoint:  "Internal PostgreSQL DB",
      records:   loading ? "..." : assets.filter((a: any) => a.asset_type === "bridge").length.toString(),
      status:    assets.length > 0 ? "Active" : "Idle",
      dataTypes: ["Bridge Assets", "Inspection Dates", "Risk Levels", "Coordinates"],
      frequency: "On update"
    },
    {
      name:      "Drainage & Hydrology System",
      type:      "Hydrological Monitoring",
      icon:      Droplets,
      category:  "Infrastructure",
      endpoint:  "Internal PostgreSQL DB",
      records:   loading ? "..." : assets.filter((a: any) => a.asset_type === "drainage").length.toString(),
      status:    assets.length > 0 ? "Active" : "Idle",
      dataTypes: ["Drainage Channels", "Flow Capacity", "Risk Status", "Coordinates"],
      frequency: "On update"
    },
  ];

  const climateActive        = sources.filter(s => s.category === "Climate"        && s.status === "Active").length;
  const satelliteActive      = sources.filter(s => s.category === "Satellite"      && s.status === "Active").length;
  const infrastructureActive = sources.filter(s => s.category === "Infrastructure" && s.status === "Active").length;

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Climate":        return "bg-blue-100 text-blue-700";
      case "Satellite":      return "bg-purple-100 text-purple-700";
      case "Infrastructure": return "bg-green-100 text-green-700";
      default:               return "bg-gray-100 text-gray-700";
    }
  };

  const getIconBg = (category: string) => {
    switch (category) {
      case "Climate":        return "bg-blue-100";
      case "Satellite":      return "bg-purple-100";
      case "Infrastructure": return "bg-green-100";
      default:               return "bg-gray-100";
    }
  };

  const getIconColor = (category: string) => {
    switch (category) {
      case "Climate":        return "text-blue-600";
      case "Satellite":      return "text-purple-600";
      case "Infrastructure": return "text-green-600";
      default:               return "text-gray-600";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active": return "bg-green-50 text-green-700";
      case "Idle":   return "bg-yellow-50 text-yellow-700";
      default:       return "bg-gray-50 text-gray-700";
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
          <p className="text-2xl font-bold text-blue-900">
            {loading ? "..." : climateActive + satelliteActive}
          </p>
          <p className="text-xs text-blue-600 mt-1">
            {loading ? "..." : totalClimate.toLocaleString()} records ingested
          </p>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-5">
          <div className="flex items-center gap-3 mb-2">
            <Satellite className="size-5 text-purple-600" />
            <span className="text-sm font-semibold text-purple-900">Active Stations</span>
          </div>
          <p className="text-2xl font-bold text-purple-900">
            {loading ? "..." : (nasaPower.total_stations + openWeather.total_stations + era5.total_stations)}
          </p>
          <p className="text-xs text-purple-600 mt-1">Kitwe, Copperbelt</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-5">
          <div className="flex items-center gap-3 mb-2">
            <Database className="size-5 text-green-600" />
            <span className="text-sm font-semibold text-green-900">Infrastructure Assets</span>
          </div>
          <p className="text-2xl font-bold text-green-900">
            {loading ? "..." : totalInfrastructure}
          </p>
          <p className="text-xs text-green-600 mt-1">Roads, bridges, drainage</p>
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
                <span className={`text-xs px-3 py-1.5 rounded-full font-medium ${getStatusColor(source.status)}`}>
                  {source.status}
                </span>
              </div>
            </div>
            <div className="px-6 py-4 bg-gray-50">
              <div className="grid grid-cols-4 gap-6">
                <div>
                  <p className="text-xs text-gray-500 mb-1">API Endpoint</p>
                  <p className="text-xs font-mono text-gray-900 truncate">{source.endpoint}</p>
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