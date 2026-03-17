import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { API_URL } from './config';

// Layouts
import { DashboardLayout } from './layouts/DashboardLayout';
import { AdminLayout } from './layouts/AdminLayout';

// Lazy Pages
const LandingPage = lazy(() => import('./pages/LandingPage').then(m => ({ default: m.LandingPage })));
const LoginPage = lazy(() => import('./pages/LoginPage').then(m => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('./pages/RegisterPage').then(m => ({ default: m.RegisterPage })));

// Admin Pages
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const AdminPlansPage = lazy(() => import('./pages/admin/AdminPlansPage').then(m => ({ default: m.AdminPlansPage })));
const AdminUsersPage = lazy(() => import('./pages/admin/AdminUsersPage').then(m => ({ default: m.AdminUsersPage })));
const AdminFinancialPage = lazy(() => import('./pages/admin/AdminFinancialPage').then(m => ({ default: m.AdminFinancialPage })));
const AdminSupportPage = lazy(() => import('./pages/admin/AdminSupportPage').then(m => ({ default: m.AdminSupportPage })));
const AdminSettingsPage = lazy(() => import('./pages/admin/AdminSettingsPage').then(m => ({ default: m.AdminSettingsPage })));

// Dashboard Pages
const DashboardHome = lazy(() => import('./pages/DashboardHome').then(m => ({ default: m.DashboardHome })));
const PropertiesPage = lazy(() => import('./pages/PropertiesPage').then(m => ({ default: m.PropertiesPage })));
const LeadsPage = lazy(() => import('./pages/LeadsPage').then(m => ({ default: m.LeadsPage })));
const WhatsappPage = lazy(() => import('./pages/WhatsappPage').then(m => ({ default: m.WhatsappPage })));
const TrainingPage = lazy(() => import('./pages/TrainingPage').then(m => ({ default: m.TrainingPage })));
const ConsultasPage = lazy(() => import('./pages/ConsultasPage').then(m => ({ default: m.ConsultasPage })));
const ContactsPage = lazy(() => import('./pages/ContactsPage').then(m => ({ default: m.ContactsPage })));
const FinancialPage = lazy(() => import('./pages/FinancialPage').then(m => ({ default: m.FinancialPage })));
const AgendaPage = lazy(() => import('./pages/AgendaPage').then(m => ({ default: m.AgendaPage })));
const StorePlansPage = lazy(() => import('./pages/StorePlansPage').then(m => ({ default: m.StorePlansPage })));
const SimulatorPage = lazy(() => import('./pages/SimulatorPage').then(m => ({ default: m.SimulatorPage })));
const SettingsPage = lazy(() => import('./pages/SettingsPage').then(m => ({ default: m.SettingsPage })));

// Public Pages
const PublicStorePage = lazy(() => import('./pages/PublicStorePage').then(m => ({ default: m.PublicStorePage })));
const PropertyDetailPage = lazy(() => import('./pages/PropertyDetailPage').then(m => ({ default: m.PropertyDetailPage })));

const LoadingPage = () => (
  <div className="fixed inset-0 bg-[#0B2B26] flex flex-col items-center justify-center z-[9999]">
    <div className="relative w-16 h-16">
      <div className="absolute inset-0 border-4 border-white/10 border-t-green-500 rounded-full animate-spin" />
    </div>
    <span className="text-white mt-4 font-bold tracking-widest text-xs animate-pulse">CARREGANDO...</span>
  </div>
);

const RootRedirect = () => {
  const token = localStorage.getItem('token');
  return token ? <Navigate to="/dashboard" replace /> : <LoginPage />;
};

function App() {
  useEffect(() => {
    console.log('🚀 Zapilar Application Started');
    console.log('📡 Connected to Backend API:', API_URL);
  }, []);

  return (
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={<LoadingPage />}>
          <Routes>
            <Route path="/" element={<RootRedirect />} />
            <Route path="/register" element={<RegisterPage />} />

            <Route path="/login" element={<LoginPage />} />

            {/* Admin Routes */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="plans" element={<AdminPlansPage />} />
              <Route path="users" element={<AdminUsersPage />} />
              <Route path="financial" element={<AdminFinancialPage />} />
              <Route path="support" element={<AdminSupportPage />} />
              <Route path="system" element={<AdminSettingsPage />} />
            </Route>

            {/* Dashboard Routes */}
            <Route path="/dashboard" element={<DashboardLayout />}>
              <Route index element={<DashboardHome />} />
              <Route path="properties" element={<PropertiesPage />} />
              <Route path="leads" element={<LeadsPage />} />
              <Route path="whatsapp" element={<WhatsappPage />} />
              <Route path="training" element={<TrainingPage />} />
              <Route path="consultas" element={<ConsultasPage />} />
              <Route path="contacts" element={<ContactsPage />} />
              <Route path="financial" element={<FinancialPage />} />
              <Route path="agenda" element={<AgendaPage />} />
              <Route path="plans" element={<StorePlansPage />} />
              <Route path="simulator" element={<SimulatorPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>

            {/* Public Store Route - Must be last to avoid conflicts */}
            <Route path="/:slug" element={<PublicStorePage />} />
            <Route path="/:slug/imovel/:propertyId" element={<PropertyDetailPage />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
