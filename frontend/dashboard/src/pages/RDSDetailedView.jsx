import React from 'react';
import { Database, Cpu, Activity, HardDrive, Zap, TrendingUp, Shield, Clock } from 'lucide-react';
import RDSCard from '../components/RDSCard';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d'];

const RDSDetailedView = ({ databases, region }) => {
  // Calculate metrics
  const totalDatabases = databases.length;
  const availableDatabases = databases.filter(db => db.status === 'available').length;
  const stoppedDatabases = databases.filter(db => db.status === 'stopped').length;

  const avgCpu = databases
    .map(db => parseFloat(db.metrics.cpuUtilization))
    .filter(v => !isNaN(v))
    .reduce((a, b) => a + b, 0) / databases.length || 0;

  const totalConnections = databases
    .map(db => parseInt(db.metrics.connections))
    .filter(v => !isNaN(v))
    .reduce((a, b) => a + b, 0);

  // Engine distribution
  const engineDistribution = databases.reduce((acc, db) => {
    const engine = db.engine.split(' ')[0]; // Get engine name without version
    acc[engine] = (acc[engine] || 0) + 1;
    return acc;
  }, {});

  const engineData = Object.entries(engineDistribution).map(([engine, count]) => ({
    name: engine,
    value: count
  }));

  // Instance class distribution
  const instanceClassData = databases.reduce((acc, db) => {
    acc[db.instanceClass] = (acc[db.instanceClass] || 0) + 1;
    return acc;
  }, {});

  const classData = Object.entries(instanceClassData).map(([className, count]) => ({
    name: className,
    value: count
  }));

  // Status distribution
  const statusData = [
    { name: 'Available', value: availableDatabases, color: '#10B981' },
    { name: 'Stopped', value: stoppedDatabases, color: '#EF4444' },
    { name: 'Other', value: totalDatabases - availableDatabases - stoppedDatabases, color: '#6B7280' }
  ].filter(item => item.value > 0);

  // CPU Utilization by database
  const cpuData = databases.map(db => ({
    name: db.identifier.substring(0, 15),
    cpu: parseFloat(db.metrics.cpuUtilization) || 0
  })).sort((a, b) => b.cpu - a.cpu);

  // Connections by database
  const connectionsData = databases.map(db => ({
    name: db.identifier.substring(0, 15),
    connections: parseInt(db.metrics.connections) || 0
  })).sort((a, b) => b.connections - a.connections);

  // Performance radar data
  const performanceRadarData = databases.slice(0, 5).map(db => ({
    database: db.identifier.substring(0, 10),
    cpu: parseFloat(db.metrics.cpuUtilization) || 0,
    connections: Math.min(parseInt(db.metrics.connections) || 0, 100),
    storage: parseFloat(db.storage) || 0,
  }));

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Total Databases</p>
              <p className="text-3xl font-bold mt-1">{totalDatabases}</p>
            </div>
            <Database size={40} className="text-blue-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Available</p>
              <p className="text-3xl font-bold mt-1">{availableDatabases}</p>
            </div>
            <Activity size={40} className="text-green-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm">Avg CPU</p>
              <p className="text-3xl font-bold mt-1">{avgCpu.toFixed(1)}%</p>
            </div>
            <Cpu size={40} className="text-orange-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Total Connections</p>
              <p className="text-3xl font-bold mt-1">{totalConnections}</p>
            </div>
            <Zap size={40} className="text-purple-200" />
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CPU Utilization by Database */}
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <Cpu size={20} className="mr-2 text-orange-600" />
            CPU Utilization by Database
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={cpuData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
              <YAxis label={{ value: 'CPU %', angle: -90, position: 'insideLeft' }} />
              <Tooltip formatter={(value) => `${value}%`} />
              <Bar dataKey="cpu" fill="#f97316" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Engine Distribution */}
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <Database size={20} className="mr-2 text-blue-600" />
            Database Engine Distribution
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={engineData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {engineData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Connections by Database */}
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <Activity size={20} className="mr-2 text-purple-600" />
            Active Connections
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={connectionsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="connections" fill="#a855f7" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Instance Class Distribution */}
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <HardDrive size={20} className="mr-2 text-green-600" />
            Instance Class Distribution
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={classData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {classData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Performance Radar (if multiple databases) */}
      {databases.length > 1 && (
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <TrendingUp size={20} className="mr-2 text-indigo-600" />
            Database Performance Comparison
          </h3>
          <ResponsiveContainer width="100%" height={400}>
            <RadarChart data={performanceRadarData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="database" />
              <PolarRadiusAxis />
              <Radar name="CPU" dataKey="cpu" stroke="#f97316" fill="#f97316" fillOpacity={0.6} />
              <Radar name="Connections" dataKey="connections" stroke="#a855f7" fill="#a855f7" fillOpacity={0.6} />
              <Legend />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Status Overview */}
      <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <Activity size={20} className="mr-2 text-green-600" />
          Database Status Overview
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {statusData.map((status, index) => (
            <div key={index} className="p-4 rounded-lg border-2" style={{ borderColor: status.color, backgroundColor: `${status.color}10` }}>
              <div className="flex items-center justify-between">
                <span className="font-semibold" style={{ color: status.color }}>{status.name}</span>
                <span className="text-2xl font-bold" style={{ color: status.color }}>{status.value}</span>
              </div>
              <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full transition-all duration-500" 
                  style={{ 
                    width: `${(status.value / totalDatabases) * 100}%`,
                    backgroundColor: status.color 
                  }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Detailed Database Cards */}
      <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Database Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {databases.map((db) => (
            <RDSCard key={db.identifier} database={db} />
          ))}
        </div>
      </div>

      {/* Recommendations */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <Shield size={20} className="mr-2 text-blue-600" />
          Performance & Security Recommendations
        </h3>
        <ul className="space-y-2">
          {avgCpu > 70 && (
            <li className="flex items-start space-x-2">
              <span className="text-red-600">🔥</span>
              <span className="text-sm text-gray-700">
                Average CPU is high (<strong>{avgCpu.toFixed(1)}%</strong>). Consider upgrading instance class or optimizing queries.
              </span>
            </li>
          )}
          {stoppedDatabases > 0 && (
            <li className="flex items-start space-x-2">
              <span className="text-yellow-600">⚠️</span>
              <span className="text-sm text-gray-700">
                <strong>{stoppedDatabases} databases</strong> are stopped. You're still paying for storage. Consider creating final snapshot and deleting.
              </span>
            </li>
          )}
          <li className="flex items-start space-x-2">
            <span className="text-green-600">✓</span>
            <span className="text-sm text-gray-700">
              Enable <strong>automated backups</strong> with retention period of 7-35 days for disaster recovery.
            </span>
          </li>
          <li className="flex items-start space-x-2">
            <span className="text-blue-600">💡</span>
            <span className="text-sm text-gray-700">
              Use <strong>RDS Performance Insights</strong> to identify slow queries and optimize database performance.
            </span>
          </li>
          <li className="flex items-start space-x-2">
            <span className="text-purple-600">🔒</span>
            <span className="text-sm text-gray-700">
              Enable <strong>encryption at rest</strong> for all databases to meet compliance requirements.
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default RDSDetailedView;