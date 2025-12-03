import React from 'react';
import { Database, HardDrive, Clock, TrendingUp, Shield, DollarSign } from 'lucide-react';
import S3Card from '../components/S3Card';
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
  Line
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d'];

const S3DetailedView = ({ buckets, region }) => {
  // Calculate total storage
  const totalStorage = buckets.reduce((sum, bucket) => {
  const sizeInGB = parseFloat(bucket.sizeInGB) || 0;
  return sum + sizeInGB;
}, 0);

  // Smart display function
const formatTotalStorage = (totalGB) => {
  if (totalGB === 0) return '0 Bytes';
  if (totalGB >= 1) return `${totalGB.toFixed(2)} GB`;
  
  const mb = totalGB * 1024;
  if (mb >= 1) return `${mb.toFixed(2)} MB`;
  
  const kb = mb * 1024;
  if (kb >= 1) return `${kb.toFixed(2)} KB`;
  
  const bytes = kb * 1024;
  return `${bytes.toFixed(0)} Bytes`;
};
  // Calculate total objects
  const totalObjects = buckets.reduce((sum, bucket) => {
    const count = parseInt(bucket.numberOfObjects);
    return sum + (isNaN(count) ? 0 : count);
  }, 0);

  // Storage by bucket
  const storageData = buckets
  .filter(bucket => parseFloat(bucket.sizeInGB) > 0)
  .map(bucket => ({
    name: bucket.name.substring(0, 20),
    size: parseFloat(bucket.sizeInGB) || 0,
    sizeDisplay: bucket.sizeDisplay // Keep for tooltip
  }))
  .sort((a, b) => b.size - a.size);



  // Objects by bucket
const objectsData = buckets
  .map(bucket => ({
    name: bucket.name.substring(0, 20),
    count: parseInt(bucket.numberOfObjects) || 0,
    isEmpty: bucket.numberOfObjects === '0'
  }))
  .sort((a, b) => b.count - a.count);

  // Age distribution
  const now = new Date();
  const ageDistribution = buckets.reduce((acc, bucket) => {
    const created = new Date(bucket.creationDate);
    const ageInDays = Math.floor((now - created) / (1000 * 60 * 60 * 24));
    
    if (ageInDays < 30) acc['< 1 month'] = (acc['< 1 month'] || 0) + 1;
    else if (ageInDays < 90) acc['1-3 months'] = (acc['1-3 months'] || 0) + 1;
    else if (ageInDays < 365) acc['3-12 months'] = (acc['3-12 months'] || 0) + 1;
    else acc['> 1 year'] = (acc['> 1 year'] || 0) + 1;
    
    return acc;
  }, {});

  const ageData = Object.entries(ageDistribution).map(([age, count]) => ({
    name: age,
    value: count
  }));

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Total Buckets</p>
              <p className="text-3xl font-bold mt-1">{buckets.length}</p>
            </div>
            <Database size={40} className="text-green-200" />
          </div>
        </div>

        
<div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-xl shadow-lg">
  <div className="flex items-center justify-between">
    <div>
      <p className="text-blue-100 text-sm">Total Storage</p>
      <p className="text-3xl font-bold mt-1">{formatTotalStorage(totalStorage)}</p>
    </div>
    <HardDrive size={40} className="text-blue-200" />
  </div>
</div>


        <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Total Objects</p>
              <p className="text-3xl font-bold mt-1">{totalObjects.toLocaleString()}</p>
            </div>
            <TrendingUp size={40} className="text-purple-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm">Avg Objects/Bucket</p>
              <p className="text-3xl font-bold mt-1">{Math.floor(totalObjects / buckets.length) || 0}</p>
            </div>
            <Database size={40} className="text-orange-200" />
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Storage by Bucket */}
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <HardDrive size={20} className="mr-2 text-blue-600" />
            Storage by Bucket (GB)
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={storageData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              
<Tooltip 
  formatter={(value, name, props) => {
    const bucket = buckets.find(b => b.name.substring(0, 20) === props.payload.name);
    return bucket ? [bucket.sizeDisplay, 'Size'] : [value, 'Size'];
  }} 
/>
              <Bar dataKey="size" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Objects by Bucket */}
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <Database size={20} className="mr-2 text-purple-600" />
            Objects by Bucket
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={objectsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#a855f7" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Bucket Age Distribution */}
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <Clock size={20} className="mr-2 text-orange-600" />
            Bucket Age Distribution
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={ageData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {ageData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Storage Distribution */}
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
    <TrendingUp size={20} className="mr-2 text-green-600" />
    Storage Distribution
  </h3>
  {storageData.length === 0 ? (
    <div className="text-center py-12">
      <Database size={48} className="mx-auto text-gray-300 mb-4" />
      <p className="text-gray-600 mb-2">All buckets are empty</p>
      <p className="text-sm text-gray-500">Upload files to see storage distribution</p>
    </div>
  ) : (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={storageData.slice(0, 6)}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
          outerRadius={100}
          fill="#8884d8"
          dataKey="size"
        >
          {storageData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip 
          formatter={(value, name, props) => {
            const bucket = buckets.find(b => b.name.substring(0, 20) === props.payload.name);
            return bucket ? [bucket.sizeDisplay, 'Size'] : [`${value.toFixed(6)} GB`, 'Size'];
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  )}
</div>
      </div>

      {/* Detailed Bucket List */}
      <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Bucket Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {buckets.map((bucket) => (
            <S3Card key={bucket.name} bucket={bucket} />
          ))}
        </div>
      </div>

      {/* Recommendations */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <Shield size={20} className="mr-2 text-blue-600" />
          Security & Cost Optimization
        </h3>
        <ul className="space-y-2">
          <li className="flex items-start space-x-2">
            <span className="text-blue-600">🔒</span>
            <span className="text-sm text-gray-700">
              Enable <strong>S3 Block Public Access</strong> on all buckets to prevent accidental data exposure.
            </span>
          </li>
          <li className="flex items-start space-x-2">
            <span className="text-green-600">💰</span>
            <span className="text-sm text-gray-700">
              Use <strong>S3 Intelligent-Tiering</strong> to automatically move data to cheaper storage classes and save up to 70%.
            </span>
          </li>
          <li className="flex items-start space-x-2">
            <span className="text-purple-600">📊</span>
            <span className="text-sm text-gray-700">
              Enable <strong>S3 Analytics</strong> to get insights on access patterns and optimize storage classes.
            </span>
          </li>
          <li className="flex items-start space-x-2">
            <span className="text-orange-600">🔄</span>
            <span className="text-sm text-gray-700">
              Set up <strong>lifecycle policies</strong> to automatically delete old objects or move them to Glacier.
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default S3DetailedView;