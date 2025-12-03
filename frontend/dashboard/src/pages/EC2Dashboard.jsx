import React, { useState, useEffect } from 'react';
import { Server, Cpu, Activity, HardDrive, Network, Zap, TrendingUp, AlertCircle } from 'lucide-react';
import MetricPill from '../components/MetricPill';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
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

const EC2DetailedView = ({ instances, region }) => {
  const [selectedInstance, setSelectedInstance] = useState(null);
  const [timeRange, setTimeRange] = useState('1h');

  // Calculate advanced metrics
  const totalInstances = instances.length;
  const runningInstances = instances.filter(i => i.state === 'running').length;
  const stoppedInstances = instances.filter(i => i.state === 'stopped').length;
  
  const avgCpu = instances
    .map(i => parseFloat(i.metrics.cpuUtilization))
    .filter(v => !isNaN(v))
    .reduce((a, b) => a + b, 0) / instances.length || 0;

  // Instance type distribution
  const instanceTypeDistribution = instances.reduce((acc, instance) => {
    const type = instance.instanceType || 'unknown';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});

  const instanceTypeData = Object.entries(instanceTypeDistribution).map(([type, count]) => ({
    name: type,
    value: count
  }));

  // State distribution
  const stateData = [
    { name: 'Running', value: runningInstances, color: '#10B981' },
    { name: 'Stopped', value: stoppedInstances, color: '#EF4444' },
    { name: 'Other', value: totalInstances - runningInstances - stoppedInstances, color: '#6B7280' }
  ].filter(item => item.value > 0);

  // CPU utilization distribution
  const cpuDistribution = instances.map(instance => ({
    name: instance.name,
    cpu: parseFloat(instance.metrics.cpuUtilization) || 0
  })).sort((a, b) => b.cpu - a.cpu);

  // Network traffic data
  const networkData = instances.map(instance => ({
    name: instance.name.substring(0, 10),
    networkIn: parseFloat(instance.metrics.networkIn) || 0,
    networkOut: parseFloat(instance.metrics.networkOut) || 0
  }));

  // Health score calculation
  const calculateHealthScore = (instance) => {
    let score = 100;
    const cpu = parseFloat(instance.metrics.cpuUtilization) || 0;
    
    if (instance.state !== 'running') score -= 50;
    if (cpu > 80) score -= 20;
    if (cpu > 90) score -= 30;
    if (instance.metrics.networkIn === 'N/A') score -= 10;
    
    return Math.max(0, score);
  };

  const healthDistribution = [
    { name: 'Healthy', value: instances.filter(i => calculateHealthScore(i) >= 80).length, color: '#10B981' },
    { name: 'Warning', value: instances.filter(i => calculateHealthScore(i) >= 50 && calculateHealthScore(i) < 80).length, color: '#F59E0B' },
    { name: 'Critical', value: instances.filter(i => calculateHealthScore(i) < 50).length, color: '#EF4444' }
  ].filter(item => item.value > 0);

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Total Instances</p>
              <p className="text-3xl font-bold mt-1">{totalInstances}</p>
            </div>
            <Server size={40} className="text-blue-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Running</p>
              <p className="text-3xl font-bold mt-1">{runningInstances}</p>
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

        <div className="bg-gradient-to-br from-red-500 to-red-600 text-white p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100 text-sm">Stopped</p>
              <p className="text-3xl font-bold mt-1">{stoppedInstances}</p>
            </div>
            <AlertCircle size={40} className="text-red-200" />
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CPU Utilization by Instance */}
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <Cpu size={20} className="mr-2 text-orange-600" />
            CPU Utilization by Instance
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={cpuDistribution}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
              <YAxis label={{ value: 'CPU %', angle: -90, position: 'insideLeft' }} />
              <Tooltip formatter={(value) => `${value}%`} />
              <Bar dataKey="cpu" fill="#f97316" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Instance Type Distribution */}
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <Server size={20} className="mr-2 text-blue-600" />
            Instance Type Distribution
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={instanceTypeData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {instanceTypeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Network Traffic Comparison */}
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <Network size={20} className="mr-2 text-purple-600" />
            Network Traffic (In/Out)
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={networkData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="networkIn" fill="#8b5cf6" name="Network In (KB)" />
              <Bar dataKey="networkOut" fill="#06b6d4" name="Network Out (KB)" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Health Status Distribution */}
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <Activity size={20} className="mr-2 text-green-600" />
            Health Status Distribution
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={healthDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {healthDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Instance State Overview */}
      <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <TrendingUp size={20} className="mr-2 text-indigo-600" />
          Instance State Overview
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
                    width: `${(state.value / totalInstances) * 100}%`,
                    backgroundColor: state.color 
                  }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Detailed Instance List */}
      <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Instance Details</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Instance ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">State</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CPU</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Network In</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Network Out</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Health</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {instances.map((instance) => {
                const healthScore = calculateHealthScore(instance);
                const healthColor = healthScore >= 80 ? 'text-green-600' : healthScore >= 50 ? 'text-yellow-600' : 'text-red-600';
                
                return (
                  <tr key={instance.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedInstance(instance)}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{instance.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500 font-mono">{instance.id}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{instance.instanceType}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        instance.state === 'running' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {instance.state}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{instance.metrics.cpuUtilization}%</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{instance.metrics.networkIn}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{instance.metrics.networkOut}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm font-semibold ${healthColor}`}>{healthScore}%</div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recommendations */}
      <div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-6 rounded-xl border border-indigo-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <Zap size={20} className="mr-2 text-yellow-600" />
          Optimization Recommendations
        </h3>
        <ul className="space-y-2">
          {stoppedInstances > 0 && (
            <li className="flex items-start space-x-2">
              <span className="text-yellow-600">⚠️</span>
              <span className="text-sm text-gray-700">
                You have <strong>{stoppedInstances} stopped instances</strong>. Consider terminating unused instances to save on EBS storage costs.
              </span>
            </li>
          )}
          {avgCpu < 10 && runningInstances > 0 && (
            <li className="flex items-start space-x-2">
              <span className="text-blue-600">💡</span>
              <span className="text-sm text-gray-700">
                Average CPU utilization is low (<strong>{avgCpu.toFixed(1)}%</strong>). Consider rightsizing or using smaller instance types.
              </span>
            </li>
          )}
          {instances.filter(i => parseFloat(i.metrics.cpuUtilization) > 80).length > 0 && (
            <li className="flex items-start space-x-2">
              <span className="text-red-600">🔥</span>
              <span className="text-sm text-gray-700">
                <strong>{instances.filter(i => parseFloat(i.metrics.cpuUtilization) > 80).length} instances</strong> have high CPU usage (&gt;80%). Consider scaling up or distributing load.
              </span>
            </li>
          )}
          <li className="flex items-start space-x-2">
            <span className="text-green-600">✓</span>
            <span className="text-sm text-gray-700">
              Enable <strong>AWS Auto Scaling</strong> for automatic resource optimization based on demand.
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default EC2DetailedView;