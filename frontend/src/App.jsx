import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { AuthProvider } from './hooks/useAuth';
import ProtectedRoute from './components/ProtectedRoute';
import LGPDProtectedRoute from './components/LGPDProtectedRoute';
import Layout from './components/layout/Layout';

// Pages
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import LGPDConsent from './pages/LGPDConsent';
import Dashboard from './pages/Dashboard';
import ExamList from './pages/ExamList';
import ExamDetail from './pages/ExamDetail';
import SharedExams from './pages/SharedExams';
import Delegations from './pages/Delegations';
import Timeline from './pages/Timeline';
import AdminSettings from './pages/AdminSettings';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            
            {/* LGPD Consent Route */}
            <Route 
              path="/lgpd-consent" 
              element={
                <ProtectedRoute>
                  <LGPDConsent />
                </ProtectedRoute>
              } 
            />
            
            {/* Protected Routes with Layout */}
            <Route 
              path="/" 
              element={
                <ProtectedRoute>
                  <LGPDProtectedRoute>
                    <Layout />
                  </LGPDProtectedRoute>
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="exams" element={<ExamList />} />
              <Route path="exams/:id" element={<ExamDetail />} />
              <Route path="shared-exams" element={<SharedExams />} />
              <Route path="delegations" element={<Delegations />} />
              <Route path="timeline" element={<Timeline />} />
              <Route path="admin" element={<AdminSettings />} />
            </Route>

            {/* Catch all route */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;