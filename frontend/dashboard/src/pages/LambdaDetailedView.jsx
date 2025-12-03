import React from 'react';
import { Zap, Activity, Clock, TrendingUp, AlertCircle, DollarSign } from 'lucide-react';
import LambdaCard from '../components/LambdaCard';
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
  LineChart,
  Line,
  ScatterChart,
  Scatter
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d'];

const LambdaDetailedView = ({ functions, region }) => {
  // Calculate metrics
  const totalFunctions = functions.length;
  const totalInvocations = functions.reduce((sum, func) => {
    const inv = parseInt(func.metrics.invocations);
    return sum + (isNaN(inv) ? 0 : inv);
  }, 0);

  const totalErrors = functions.reduce((sum, func) => {
    const err = parseInt(func.metrics.errors);
    return sum + (isNaN(err) ? 0 : err);
  }, 0);

  const errorRate = totalInvocations > 0 ? ((totalErrors / totalInvocations) * 100).toFixed(2) : 0;

  // Runtime distribution
  const runtimeDistribution = functions.reduce((acc, func) => {
    const runtime = func.runtime || 'unknown';
    acc[runtime] = (acc[runtime] || 0) + 1;
    return acc;
  }, {});

  const runtimeData = Object.entries(runtimeDistribution).map(([runtime, count]) => ({
    name: runtime,
    value: count
  }));

  // Memory distribution
  const memoryDistribution = functions.reduce((acc, func) => {
    const memory = `${func.memorySize} MB`;
    acc[memory] = (acc[memory] || 0) + 1;
    return acc;
  }, {});

  const memoryData = Object.entries(memoryDistribution).map(([memory, count]) => ({
    name: memory,
    value: count
  }));

  // Invocations by function
  const invocationsData = functions
    .map(func => ({
      name: func.name.substring(0, 15),
      invocations: parseInt(func.metrics.invocations) || 0
    }))
    .sort((a, b) => b.invocations - a.invocations)
    .slice(0, 10);

  // Errors by function
  const errorsData = functions
    .filter(func => parseInt(func.metrics.errors) > 0)
    .map(func => ({
      name: func.name.substring(0, 15),
      errors: parseInt(func.metrics.errors) || 0
    }))
    .sort((a, b) => b.errors - a.errors)
    .slice(0, 10);

  // Duration analysis
  const durationData = functions
    .map(func => ({
      name: func.name.substring(0, 15),
      duration: parseFloat(func.metrics.avgDuration) || 0
    }))
    .sort((a, b) => b.duration - a.duration)
    .slice(0, 10);

  // Performance vs Usage scatter
  const performanceData = functions.map(func => ({
    name: func.name.substring(0, 10),
    invocations: parseInt(func.metrics.invocations) || 0,
    duration: parseFloat(func.metrics.avgDuration) || 0
  }));

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm">Total Functions</p>
              <p className="text-3xl font-bold mt-1">{totalFunctions}</p>
            </div>
            <Zap size={40} className="text-orange-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Total Invocations (24h)</p>
              <p className="text-3xl font-bold mt-1">{totalInvocations.toLocaleString()}</p>
            </div>
            <Activity size={40} className="text-blue-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-500 to-red-600 text-white p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100 text-sm">Total Errors (24h)</p>
              <p className="text-3xl font-bold mt-1">{totalErrors}</p>
            </div>
            <AlertCircle size={40} className="text-red-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Error Rate</p>
              <p className="text-3xl font-bold mt-1">{errorRate}%</p>
            </div>
            <TrendingUp size={40} className="text-purple-200" />
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Invocations by Function */}
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <Activity size={20} className="mr-2 text-blue-600" />
            Top 10 Functions by Invocations
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={invocationsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="invocations" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Runtime Distribution */}
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <Zap size={20} className="mr-2 text-orange-600" />
            Runtime Distribution
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={runtimeData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {runtimeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Errors by Function */}
        {errorsData.length > 0 && (
          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <AlertCircle size={20} className="mr-2 text-red-600" />
              Functions with Errors
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={errorsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="errors" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Memory Distribution */}
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <Clock size={20} className="mr-2 text-purple-600" />
            Memory Allocation Distribution
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={memoryData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {memoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Duration Analysis */}
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 lg:col-span-2">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <Clock size={20} className="mr-2 text-green-600" />
            Average Duration by Function (Top 10)
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={durationData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
              <YAxis label={{ value: 'Duration (ms)', angle: -90, position: 'insideLeft' }} />
              <Tooltip formatter={(value) => `${value} ms`} />
              <Bar dataKey="duration" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Performance Scatter Plot */}
      {functions.length > 5 && (
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <TrendingUp size={20} className="mr-2 text-indigo-600" />
            Performance vs Usage Analysis
          </h3>
          <ResponsiveContainer width="100%" height={400}>
            <ScatterChart>
              <CartesianGrid />
              <XAxis type="number" dataKey="invocations" name="Invocations" />
              <YAxis type="number" dataKey="duration" name="Duration (ms)" />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} />
              <Scatter name="Functions" data={performanceData} fill="#8884d8">
                {performanceData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
          <p className="text-xs text-gray-500 mt-2 text-center">
            Functions in the top-right have high usage and long duration (consider optimization)
          </p>
        </div>
      )}

      {/* Detailed Function Cards */}
      <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Function Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {functions.map((func) => (
            <LambdaCard key={func.name} func={func} />
          ))}
        </div>
      </div>

      {/* Recommendations */}
      <div className="bg-gradient-to-r from-orange-50 to-yellow-50 p-6 rounded-xl border border-orange-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <DollarSign size={20} className="mr-2 text-orange-600" />
          Cost & Performance Optimization
        </h3>
        <ul className="space-y-2">
          {errorRate > 5 && (
            <li className="flex items-start space-x-2">
              <span className="text-red-600">❌</span>
              <span className="text-sm text-gray-700">
                Error rate is <strong>{errorRate}%</strong>. Investigate failing functions and implement proper error handling.
              </span>
            </li>
          )}
          {durationData.some(d => d.duration > 3000) && (
            <li className="flex items-start space-x-2">
              <span className="text-yellow-600">⚠️</span>
              <span className="text-sm text-gray-700">
                Some functions have <strong>duration &gt; 3 seconds</strong>. Consider optimizing code or increasing memory allocation.
              </span>
            </li>
          )}
          <li className="flex items-start space-x-2">
            <span className="text-blue-600">💡</span>
            <span className="text-sm text-gray-700">
              Use <strong>Lambda Power Tuning</strong> to find the optimal memory/cost balance for each function.
            </span>
          </li>
          <li className="flex items-start space-x-2">
            <span className="text-green-600">✓</span>
            <span className="text-sm text-gray-700">
              Enable <strong>X-Ray tracing</strong> to visualize function performance and identify bottlenecks.
            </span>
          </li>
          <li className="flex items-start space-x-2">
            <span className="text-purple-600">🔒</span>
            <span className="text-sm text-gray-700">
              Implement <strong>least privilege IAM roles</strong> for each function to enhance security.
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default LambdaDetailedView;