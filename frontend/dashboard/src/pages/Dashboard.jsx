import React, { useState, useEffect } from "react";
import { Server, Activity, Cpu, Cloud, RefreshCw, User, Settings, LogOut, ChevronDown, Database, Zap, HardDrive, DollarSign } from "lucide-react";
import { useNavigate } from "react-router-dom";
import MetricCard from "../components/MetricCard";
import MetricPill from "../components/MetricPill";
import S3Card from "../components/S3Card";
import RDSCard from "../components/RDSCard";
import LambdaCard from "../components/LambdaCard";
import EBSCard from "../components/EBSCard";

// Import detailed views
import EC2DetailedView from "./EC2Dashboard";
import S3DetailedView from "./S3Dashboard";
import RDSDetailedView from "./RDSDetailedView";
import LambdaDetailedView from "./LambdaDetailedView";
import EBSDetailedView from "./EBSDetailedView";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

const API_GATEWAY_URL = "http://localhost:3003";

const Dashboard = ({ userId, initialRegion, onLogout }) => {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState({
    totalInstances: 0,
    runningInstances: 0,
    avgCpu: 0,
    totalS3Buckets: 0,
    totalRDS: 0,
    totalLambda: 0,
    totalEBS: 0,
  });
  const [cpuHistory, setCpuHistory] = useState([]);
  const [resources, setResources] = useState({
    ec2: [],
    s3: [],
    rds: [],
    lambda: [],
    ebs: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [region, setRegion] = useState(initialRegion || "us-east-1");
  const [username, setUsername] = useState("");
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [selectedService, setSelectedService] = useState('all');

  const awsRegions = [
    { value: 'us-east-1', label: 'US East (N. Virginia)' },
    { value: 'us-east-2', label: 'US East (Ohio)' },
    { value: 'us-west-1', label: 'US West (N. California)' },
    { value: 'us-west-2', label: 'US West (Oregon)' },
    { value: 'eu-west-1', label: 'Europe (Ireland)' },
    { value: 'eu-central-1', label: 'Europe (Frankfurt)' },
    { value: 'ap-south-1', label: 'Asia Pacific (Mumbai)' },
    { value: 'ap-southeast-1', label: 'Asia Pacific (Singapore)' },
    { value: 'ap-northeast-1', label: 'Asia Pacific (Tokyo)' }
  ];

  const services = [
    { id: 'all', label: 'All Services', icon: Cloud },
    { id: 'ec2', label: 'EC2', icon: Server },
    { id: 's3', label: 'S3', icon: Database },
    { id: 'rds', label: 'RDS', icon: Database },
    { id: 'lambda', label: 'Lambda', icon: Zap },
    { id: 'ebs', label: 'EBS', icon: HardDrive },
  ];

  useEffect(() => {
    const storedUsername = localStorage.getItem('username');
    if (storedUsername) {
      setUsername(storedUsername);
    }
  }, []);

  const fetchMetrics = async () => {
    if (!userId) {
      console.error('No userId provided');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      console.log('Fetching metrics for userId:', userId, 'region:', region);
      
      const url = `${API_GATEWAY_URL}/api/data/metrics/${userId}?region=${region}`;
      console.log('API URL:', url);
      
      const res = await fetch(url);
      
      console.log('Response status:', res.status);
      
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Server returned non-JSON response.');
      }
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || `HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      console.log('Received data:', data);

      // Update resources
      setResources({
        ec2: data.resources.ec2 || [],
        s3: data.resources.s3 || [],
        rds: data.resources.rds || [],
        lambda: data.resources.lambda || [],
        ebs: data.resources.ebs || []
      });

      // Calculate metrics
      const ec2Instances = data.resources.ec2 || [];
      const totalInstances = ec2Instances.length;
      const runningInstances = ec2Instances.filter(r => r.state === "running").length;

      const numericCpus = ec2Instances
        .map((r) => parseFloat(r.metrics.cpuUtilization))
        .filter((v) => !isNaN(v));

      const avgCpu = numericCpus.length > 0
        ? (numericCpus.reduce((a, b) => a + b, 0) / numericCpus.length).toFixed(2)
        : "0.00";

      setCpuHistory((prev) => {
        const now = new Date().toLocaleTimeString();
        const updated = [...prev, { time: now, cpu: parseFloat(avgCpu) }];
        return updated.slice(-15);
      });

      setMetrics({
        totalInstances,
        runningInstances,
        avgCpu,
        totalS3Buckets: (data.resources.s3 || []).length,
        totalRDS: (data.resources.rds || []).length,
        totalLambda: (data.resources.lambda || []).length,
        totalEBS: (data.resources.ebs || []).length,
      });

      setLoading(false);
    } catch (err) {
      console.error("Error fetching metrics:", err);
      setError(err.message || "Failed to fetch AWS data.");
      setLoading(false);
    }
  };

  const handleRegionChange = async (newRegion) => {
    console.log('Region changed to:', newRegion);
    setRegion(newRegion);
    setResources({ ec2: [], s3: [], rds: [], lambda: [], ebs: [] });
    setCpuHistory([]);
    setMetrics({ totalInstances: 0, runningInstances: 0, avgCpu: 0, totalS3Buckets: 0, totalRDS: 0, totalLambda: 0, totalEBS: 0 });
    localStorage.setItem('region', newRegion);
    
    try {
      await fetch(`${API_GATEWAY_URL}/api/auth/update-region`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId, region: newRegion })
      });
      
      setTimeout(() => {
        fetchMetrics();
      }, 2000);
    } catch (err) {
      console.error("Error updating region:", err);
    }
  };

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    }
    navigate('/login');
  };

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 500);
    return () => clearInterval(interval);
  }, [userId, region]);

  const { totalInstances, runningInstances, avgCpu, totalS3Buckets, totalRDS, totalLambda, totalEBS } = metrics;

  // Render service content based on selection
  const renderServiceContent = () => {
    // Show detailed view for individual services
    if (selectedService === 'ec2' && resources.ec2.length > 0) {
      return <EC2DetailedView instances={resources.ec2} region={region} />;
    }

    if (selectedService === 's3' && resources.s3.length > 0) {
      return <S3DetailedView buckets={resources.s3} region={region} />;
    }

    if (selectedService === 'rds' && resources.rds.length > 0) {
      return <RDSDetailedView databases={resources.rds} region={region} />;
    }

    if (selectedService === 'lambda' && resources.lambda.length > 0) {
      return <LambdaDetailedView functions={resources.lambda} region={region} />;
    }

    if (selectedService === 'ebs' && resources.ebs.length > 0) {
      return <EBSDetailedView volumes={resources.ebs} region={region} />;
    }

    // Show "no resources" message for individual services
    if (selectedService !== 'all') {
      return (
        <div className="text-center py-12">
          <Cloud size={64} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">No Resources Found</h3>
          <p className="text-gray-500">No {selectedService.toUpperCase()} resources found in region {region}.</p>
        </div>
      );
    }

    // Show "All Services" overview
    if (selectedService === 'all') {
      return (
        <div className="space-y-8">
          {/* EC2 Section */}
          {resources.ec2.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-700 flex items-center">
                  <Server className="mr-2 text-blue-600" size={24} />
                  EC2 Instances ({resources.ec2.length})
                </h2>
                <button
                  onClick={() => setSelectedService('ec2')}
                  className="text-sm text-indigo-600 hover:text-indigo-800 font-semibold"
                >
                  View Detailed Analysis →
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {resources.ec2.slice(0, 6).map((instance) => (
                  <div
                    key={instance.id}
                    className="bg-white p-5 rounded-2xl shadow-xl border border-gray-100 transition duration-300 hover:shadow-2xl"
                  >
                    <h3 className="text-lg font-semibold text-gray-800 mb-2 truncate" title={instance.name}>
                      {instance.name}
                    </h3>
                    <p className="text-xs text-gray-500 mb-3">
                      ID: <span className="font-mono text-gray-600">{instance.id}</span>
                    </p>
                    
                    <MetricPill
                      label="Status"
                      value={instance.state.toUpperCase()}
                      color={instance.state === "running" ? "green" : "red"}
                    />
                    <MetricPill
                      label="CPU"
                      value={instance.metrics.cpuUtilization + '%'}
                      color="orange"
                    />
                  </div>
                ))}
              </div>
              {resources.ec2.length > 6 && (
                <button
                  onClick={() => setSelectedService('ec2')}
                  className="mt-4 text-indigo-600 hover:text-indigo-800 font-semibold"
                >
                  View all {resources.ec2.length} EC2 instances →
                </button>
              )}
            </div>
          )}

          {/* S3 Section */}
          {resources.s3.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-700 flex items-center">
                  <Database className="mr-2 text-green-600" size={24} />
                  S3 Buckets ({resources.s3.length})
                </h2>
                <button
                  onClick={() => setSelectedService('s3')}
                  className="text-sm text-indigo-600 hover:text-indigo-800 font-semibold"
                >
                  View Detailed Analysis →
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {resources.s3.slice(0, 6).map((bucket) => (
                  <S3Card key={bucket.name} bucket={bucket} />
                ))}
              </div>
              {resources.s3.length > 6 && (
                <button
                  onClick={() => setSelectedService('s3')}
                  className="mt-4 text-indigo-600 hover:text-indigo-800 font-semibold"
                >
                  View all {resources.s3.length} S3 buckets →
                </button>
              )}
            </div>
          )}

          {/* RDS Section */}
          {resources.rds.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-700 flex items-center">
                  <Database className="mr-2 text-blue-600" size={24} />
                  RDS Databases ({resources.rds.length})
                </h2>
                <button
                  onClick={() => setSelectedService('rds')}
                  className="text-sm text-indigo-600 hover:text-indigo-800 font-semibold"
                >
                  View Detailed Analysis →
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {resources.rds.slice(0, 6).map((db) => (
                  <RDSCard key={db.identifier} database={db} />
                ))}
              </div>
              {resources.rds.length > 6 && (
                <button
                  onClick={() => setSelectedService('rds')}
                  className="mt-4 text-indigo-600 hover:text-indigo-800 font-semibold"
                >
                  View all {resources.rds.length} RDS databases →
                </button>
              )}
            </div>
          )}

          {/* Lambda Section */}
          {resources.lambda.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-700 flex items-center">
                  <Zap className="mr-2 text-orange-600" size={24} />
                  Lambda Functions ({resources.lambda.length})
                </h2>
                <button
                  onClick={() => setSelectedService('lambda')}
                  className="text-sm text-indigo-600 hover:text-indigo-800 font-semibold"
                >
                  View Detailed Analysis →
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {resources.lambda.slice(0, 6).map((func) => (
                  <LambdaCard key={func.name} func={func} />
                ))}
              </div>
              {resources.lambda.length > 6 && (
                <button
                  onClick={() => setSelectedService('lambda')}
                  className="mt-4 text-indigo-600 hover:text-indigo-800 font-semibold"
                >
                  View all {resources.lambda.length} Lambda functions →
                </button>
              )}
            </div>
          )}

          {/* EBS Section */}
          {resources.ebs.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-700 flex items-center">
                  <HardDrive className="mr-2 text-purple-600" size={24} />
                  EBS Volumes ({resources.ebs.length})
                </h2>
                <button
                  onClick={() => setSelectedService('ebs')}
                  className="text-sm text-indigo-600 hover:text-indigo-800 font-semibold"
                >
                  View Detailed Analysis →
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {resources.ebs.slice(0, 6).map((volume) => (
                  <EBSCard key={volume.volumeId} volume={volume} />
                ))}
              </div>
              {resources.ebs.length > 6 && (
                <button
                  onClick={() => setSelectedService('ebs')}
                  className="mt-4 text-indigo-600 hover:text-indigo-800 font-semibold"
                >
                  View all {resources.ebs.length} EBS volumes →
                </button>
              )}
            </div>
          )}

          {/* No Resources Message */}
          {resources.ec2.length === 0 && 
           resources.s3.length === 0 && 
           resources.rds.length === 0 && 
           resources.lambda.length === 0 && 
           resources.ebs.length === 0 && (
            <div className="text-center py-12">
              <Cloud size={64} className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No Resources Found</h3>
              <p className="text-gray-500">No AWS resources found in region {region}.</p>
            </div>
          )}
        </div>
      );
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen font-inter">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">
          AWS Monitoring Dashboard
        </h1>
        <div className="flex items-center space-x-3">
          {/* Region Selector */}
          <div className="relative">
            <select
              value={region}
              onChange={(e) => handleRegionChange(e.target.value)}
              className="appearance-none bg-white border-2 border-gray-300 text-gray-700 py-2 pl-4 pr-10 rounded-full text-sm font-semibold shadow-md hover:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition cursor-pointer"
            >
              {awsRegions.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-700">
              <ChevronDown size={16} />
            </div>
          </div>

          {/* View Costs Button */}
          <button
            onClick={() => navigate('/costs')}
            className="flex items-center px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-full shadow-md hover:bg-green-700 transition"
          >
            <DollarSign size={16} className="mr-2" />
            Costs
          </button>

          {/* Refresh Button */}
          <button
            onClick={fetchMetrics}
            disabled={loading}
            className="flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-full shadow-md hover:bg-indigo-700 transition duration-150 disabled:opacity-50"
          >
            {loading ? (
              <span className="animate-spin mr-2"><RefreshCw size={16} /></span>
            ) : (
              <RefreshCw size={16} className="mr-2" />
            )}
            {loading ? "Refreshing..." : "Refresh"}
          </button>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-2 px-4 py-2 bg-white border-2 border-gray-300 rounded-full shadow-md hover:border-indigo-500 transition"
            >
              <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold">
                {username.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm font-semibold text-gray-700">{username}</span>
              <ChevronDown size={16} className="text-gray-600" />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
                <div className="px-4 py-3 border-b border-gray-200">
                  <p className="text-sm font-semibold text-gray-800">{username}</p>
                  <p className="text-xs text-gray-500">{localStorage.getItem('email')}</p>
                </div>
                
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    navigate('/profile');
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 flex items-center space-x-2 transition"
                >
                  <Settings size={16} />
                  <span>Profile Settings</span>
                </button>

                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    handleLogout();
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2 transition"
                >
                  <LogOut size={16} />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Service Selector */}
      <div className="mb-6 flex space-x-2 overflow-x-auto pb-2">
        {services.map((service) => {
          const Icon = service.icon;
          const count = 
            service.id === 'ec2' ? totalInstances :
            service.id === 's3' ? totalS3Buckets :
            service.id === 'rds' ? totalRDS :
            service.id === 'lambda' ? totalLambda :
            service.id === 'ebs' ? totalEBS : null;

          return (
            <button
              key={service.id}
              onClick={() => setSelectedService(service.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-semibold transition whitespace-nowrap ${
                selectedService === service.id
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-indigo-500'
              }`}
            >
              <Icon size={16} />
              <span>{service.label}</span>
              {count !== null && service.id !== 'all' && (
                <span className={`ml-1 px-2 py-0.5 rounded-full text-xs ${
                  selectedService === service.id ? 'bg-white text-indigo-600' : 'bg-gray-200 text-gray-700'
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
      
      {/* Error Display */}
      {error && (
        <div className="p-4 mb-6 text-sm text-red-800 rounded-lg bg-red-100" role="alert">
          <span className="font-medium">Error:</span> {error}
        </div>
      )}

      {/* Summary Cards - Always visible */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        <MetricCard
          title="EC2 Instances"
          value={totalInstances}
          icon={Server}
          color="blue"
        />
        <MetricCard
          title="S3 Buckets"
          value={totalS3Buckets}
          icon={Database}
          color="green"
        />
        <MetricCard
          title="RDS Databases"
          value={totalRDS}
          icon={Database}
          color="blue"
        />
        <MetricCard
          title="Lambda Functions"
          value={totalLambda}
          icon={Zap}
          color="orange"
        />
        <MetricCard
          title="EBS Volumes"
          value={totalEBS}
          icon={HardDrive}
          color="purple"
        />
      </div>

      {/* EC2 CPU Chart - Only show when EC2 or All is selected */}
      {(selectedService === 'all' || selectedService === 'ec2') && cpuHistory.length > 0 && (
        <div className="bg-white p-6 rounded-2xl shadow-xl mb-10 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Live EC2 CPU Usage (Average)
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={cpuHistory} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f1f1" />
              <XAxis dataKey="time" />
              <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
              <Tooltip 
                formatter={(v) => [`${v}%`, 'CPU']} 
                labelFormatter={(l) => `Time: ${l}`} 
                contentStyle={{ borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
              />
              <Line
                type="monotone"
                dataKey="cpu"
                stroke="#f97316"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Service-Specific Content */}
      {loading && Object.values(resources).every(arr => arr.length === 0) ? (
        <p className="text-indigo-500 italic flex items-center">
          <span className="animate-spin mr-2"><RefreshCw size={16} /></span>
          Loading resource data...
        </p>
      ) : (
        renderServiceContent()
      )}
    </div>
  );
};

export default Dashboard;