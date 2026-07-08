import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import DashboardPage from './pages/DashboardPage';
import CreateProject from './pages/CreateProject';
import ProjectDetails from './pages/ProjectDetails';
import Monitoring from './pages/Monitoring';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import AdminDashboard from './pages/AdminDashboard';

// Components
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';

// Protected Route Wrapper
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="h-screen w-screen bg-darkBg flex items-center justify-center text-gray-500 font-mono text-xs">
        Validating secure credentials...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

// Admin Route Wrapper
const AdminRoute = ({ children }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen w-screen bg-darkBg flex items-center justify-center text-gray-500 font-mono text-xs">
        Verifying administrator clearances...
      </div>
    );
  }

  if (!isAuthenticated || !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Layout wrapper for logged in dashboard pages
const DashboardLayout = ({ children, title }) => {
  return (
    <div className="flex bg-[#070b13] min-h-screen text-gray-100">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar title={title} />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Landing Pages */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Developer Dashboard Routes */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <DashboardLayout title="Developer Dashboard">
                  <DashboardPage />
                </DashboardLayout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/projects/create" 
            element={
              <ProtectedRoute>
                <DashboardLayout title="Create Deployment Project">
                  <CreateProject />
                </DashboardLayout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/projects/:id" 
            element={
              <ProtectedRoute>
                <DashboardLayout title="Pipeline Console">
                  <ProjectDetails />
                </DashboardLayout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/monitoring" 
            element={
              <ProtectedRoute>
                <DashboardLayout title="Engine Monitoring Telemetry">
                  <Monitoring />
                </DashboardLayout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute>
                <DashboardLayout title="User Profile Management">
                  <Profile />
                </DashboardLayout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/settings" 
            element={
              <ProtectedRoute>
                <DashboardLayout title="System Preferences">
                  <Settings />
                </DashboardLayout>
              </ProtectedRoute>
            } 
          />

          {/* Protected Admin routes */}
          <Route 
            path="/admin" 
            element={
              <AdminRoute>
                <DashboardLayout title="Staff Administration Console">
                  <AdminDashboard />
                </DashboardLayout>
              </AdminRoute>
            } 
          />

          {/* Fallback redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
