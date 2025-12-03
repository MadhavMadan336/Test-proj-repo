import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import CostDashboard from "./pages/CostDashboard";

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userId, setUserId] = useState("");
  const [region, setRegion] = useState("us-east-1");

  useEffect(() => {
    const storedUserId = localStorage.getItem('userId');
    const storedRegion = localStorage.getItem('region');
    
    if (storedUserId) {
      setUserId(storedUserId);
      setRegion(storedRegion || 'us-east-1');
      setIsLoggedIn(true);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('userId');
    localStorage.removeItem('username');
    localStorage.removeItem('email');
    localStorage.removeItem('region');
    setIsLoggedIn(false);
    setUserId("");
    setRegion("us-east-1");
  };

  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50">
        <Routes>
          <Route 
            path="/register" 
            element={
              isLoggedIn ? <Navigate to="/dashboard" /> : <Register />
            } 
          />
          <Route 
            path="/login" 
            element={
              isLoggedIn ? (
                <Navigate to="/dashboard" />
              ) : (
                <Login 
                  setIsLoggedIn={setIsLoggedIn}
                  setUserId={setUserId}
                  setRegion={setRegion}
                />
              )
            } 
          />
          <Route 
            path="/dashboard" 
            element={
              isLoggedIn ? (
                <Dashboard
                  userId={userId}
                  initialRegion={region}
                  onLogout={handleLogout}
                />
              ) : (
                <Navigate to="/login" />
              )
            } 
          />
          <Route 
            path="/profile" 
            element={
              isLoggedIn ? (
                <Profile />
              ) : (
                <Navigate to="/login" />
              )
            } 
          />
          <Route 
            path="/costs" 
            element={
              isLoggedIn ? (
                <CostDashboard userId={userId} />
              ) : (
                <Navigate to="/login" />
              )
            } 
          />
          <Route 
            path="*" 
            element={<Navigate to={isLoggedIn ? "/dashboard" : "/login"} />} 
          />
        </Routes>
      </div>
    </Router>
  );
};

export default App;