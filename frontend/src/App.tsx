import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { DashboardLayout } from './layouts/DashboardLayout';
import { DashboardHome } from './pages/DashboardHome';
import { VehiclesPage } from './pages/VehiclesPage';
import { LoginPage } from './pages/LoginPage';
import { WhatsappPage } from './pages/WhatsappPage';
import { LandingPage } from './pages/LandingPage';
import { RegisterPage } from './pages/RegisterPage';
import { SettingsPage } from './pages/SettingsPage';
import { AuthProvider } from './contexts/AuthContext';
import { AdminLayout } from './layouts/AdminLayout';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminPlansPage } from './pages/admin/AdminPlansPage';
import { AdminUsersPage } from './pages/admin/AdminUsersPage';
import { AdminFinancialPage } from './pages/admin/AdminFinancialPage';
import { StorePlansPage } from './pages/StorePlansPage';
import { TrainingPage } from './pages/TrainingPage';
import { LiveChatPage } from './pages/LiveChatPage';

import { useEffect } from 'react';
import { API_URL } from './config';

function App() {
  useEffect(() => {
    console.log('🚀 ZapCar Application Started');
    console.log('📡 Connected to Backend API:', API_URL);
  }, []);

  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route path="/login" element={<LoginPage />} />

          {/* Admin Routes */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="plans" element={<AdminPlansPage />} />
            <Route path="users" element={<AdminUsersPage />} />
            <Route path="financial" element={<AdminFinancialPage />} />
          </Route>

          {/* Dashboard Routes */}
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<DashboardHome />} />
            <Route path="vehicles" element={<VehiclesPage />} />
            <Route path="chat" element={<LiveChatPage />} />
            <Route path="whatsapp" element={<WhatsappPage />} />
            <Route path="training" element={<TrainingPage />} />
            <Route path="plans" element={<StorePlansPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
