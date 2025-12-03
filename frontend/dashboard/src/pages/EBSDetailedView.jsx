import React from 'react';
import { HardDrive, Activity, Database, TrendingUp, AlertCircle, Zap } from 'lucide-react';
import EBSCard from '../components/EBSCard';
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
  Legend
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d'];

const EBSDetailedView = ({ volumes, region }) => {
  // Calculate metrics
  const totalVolumes = volumes.length;
  const inUseVolumes = volumes.filter(v => v.state === 'in-use').length;
  const availableVolumes = volumes.filter(v => v.state === 'available').length;

  const totalStorage = volumes.reduce((sum, vol) => {
    const size = parseFloat(vol.size);
    return sum + (isNaN(size) ? 0 : size);
  }, 0);

  const totalReadOps = volumes.reduce((sum, vol) => {
    const ops = parseFloat(vol.metrics.readOps);
    return sum + (isNaN(ops) ? 0 : ops);
  }, 0);

  const totalWriteOps = volumes.reduce((sum, vol) => {
    const ops = parseFloat(vol.metrics.writeOps);
    return sum + (isNaN(ops) ? 0 : ops);
  }, 0);

  // Volume type distribution
  const typeDistribution = volumes.reduce((acc, vol) => {
    acc[vol.volumeType] = (acc[vol.volumeType] || 0) + 1;
    return acc;
  }, {});

  const typeData = Object.entries(typeDistribution).map(([type, count]) => ({
    name: type,
    value: count
  }));

  // State distribution
  const stateData = [
    { name: 'In-Use', value: inUseVolumes, color: '#10B981' },
    { name: 'Available', value: availableVolumes, color: '#3B82F6' },
    { name: 'Other', value: totalVolumes - inUseVolumes - availableVolumes, color: '#6B7280' }
  ].filter(item => item.value > 0);

  // Storage by volume
  const storageData = volumes
    .map(vol => ({
      name: vol.volumeId.substring(4, 15),
      size: parseFloat(vol.size) || 0
    }))
    .sort((a, b) => b.size - a.size)
    .slice(0, 10);

  // IOPS activity
  const iopsData = volumes
    .filter(vol => vol.state === 'in-use')
    .map(vol => ({
      name: vol.volumeId.substring(4, 12),
      read: parseFloat(vol.metrics.readOps) || 0,
      write: parseFloat(vol.metrics.writeOps) || 0
    }))
    .sort((a, b) => (b.read + b.write) - (a.read + a.write))
    .slice(0, 10);

  // Availability zone distribution
  const azDistribution = volumes.reduce((acc, vol) => {
    acc[vol.availabilityZone] = (acc[vol.availabilityZone] || 0) + 1;
    return acc;
  }, {});

  const azData = Object.entries(azDistribution).map(([az, count]) => ({
    name: az,
    value: count
  }));

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Total Volumes</p>
              <p className="text-3xl font-bold mt-1">{totalVolumes}</p>
            </div>
            <HardDrive size={40} className="text-purple-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Total Storage</p>
              <p className="text-3xl font-bold mt-1">{totalStorage} GB</p>
            </div>
            <Database size={40} className="text-blue-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">In-Use</p>
              <p className="text-3xl font-bold mt-1">{inUseVolumes}</p>
            </div>
            <Activity size={40} className="text-green-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm">Available (Unused)</p>
              <p className="text-3xl font-bold mt-1">{availableVolumes}</p>
            </div>
            <AlertCircle size={40} className="text-orange-200" />
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Storage by Volume */}
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <Database size={20} className="mr-2 text-blue-600" />
            Top 10 Volumes by Size
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={storageData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
              <YAxis label={{ value: 'Size (GB)', angle: -90, position: 'insideLeft' }} />
              <Tooltip formatter={(value) => `${value} GB`} />
              <Bar dataKey="size" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Volume Type Distribution */}
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <HardDrive size={20} className="mr-2 text-purple-600" />
            Volume Type Distribution
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={typeData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {typeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* IOPS Activity */}
        {iopsData.length > 0 && (
          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 lg:col-span-2">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <Activity size={20} className="mr-2 text-green-600" />
              IOPS Activity (Read/Write Operations)
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={iopsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="read" fill="#10b981" name="Read Ops" />
                <Bar dataKey="write" fill="#f59e0b" name="Write Ops" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Availability Zone Distribution */}
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <Database size={20} className="mr-2 text-orange-600" />
            Distribution by Availability Zone
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={azData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {azData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* State Overview */}
      <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <Activity size={20} className="mr-2 text-green-600" />
          Volume State Overview
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {stateData.map((state, index) => (
            <div key={index} className="p-4 rounded-lg border-2" style={{ borderColor: state.color, backgroundColor: `${state.color}10` }}>
              <div className="flex items-center justify-between">
                <span className="font-semibold" style={{ color: state.color }}>{state.name}</span>
                <span className="text-2xl font-bold" style={{ color: state.color }}>{state.value}</span>
              </div>
              <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full transition-all duration-500" 
                  style={{ 
                    width: `${(state.value / totalVolumes) * 100}%`,
                    backgroundColor: state.color 
                  }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Detailed Volume Cards */}
      <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Volume Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {volumes.map((volume) => (
            <EBSCard key={volume.volumeId} volume={volume} />
          ))}
        </div>
      </div>

      {/* Recommendations */}
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-6 rounded-xl border border-purple-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <Zap size={20} className="mr-2 text-purple-600" />
          Cost & Performance Optimization
        </h3>
        <ul className="space-y-2">
          {availableVolumes > 0 && (
            <li className="flex items-start space-x-2">
              <span className="text-orange-600">⚠️</span>
              <span className="text-sm text-gray-700">
                <strong>{availableVolumes} volumes</strong> are not attached to any instance. You're paying for unused storage. Consider creating snapshots and deleting.
              </span>
            </li>
          )}
          <li className="flex items-start space-x-2">
            <span className="text-blue-600">💡</span>
            <span className="text-sm text-gray-700">
              Upgrade <strong>gp2 volumes to gp3</strong> for better performance and 20% cost savings.
            </span>
          </li>
          <li className="flex items-start space-x-2">
            <span className="text-green-600">✓</span>
            <span className="text-sm text-gray-700">
              Enable <strong>EBS encryption by default</strong> for all new volumes to meet security compliance.
            </span>
          </li>
          <li className="flex items-start space-x-2">
            <span className="text-purple-600">🔄</span>
            <span className="text-sm text-gray-700">
              Set up <strong>automated snapshot lifecycle policies</strong> for disaster recovery.
            </span>
          </li>
          <li className="flex items-start space-x-2">
            <span className="text-red-600">🔥</span>
            <span className="text-sm text-gray-700">
              Delete old snapshots that are no longer needed to reduce storage costs.
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default EBSDetailedView;