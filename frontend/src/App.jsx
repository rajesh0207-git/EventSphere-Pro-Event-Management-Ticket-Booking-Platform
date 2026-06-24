import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Layout/Navbar';
import Footer from './components/Layout/Footer';
import ProtectedRoute from './components/Layout/ProtectedRoute';
import AIAssistantWidget from './components/AIAssistantWidget';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import ProfilePage from './pages/ProfilePage';
import EventsPage from './pages/EventsPage';
import EventDetailPage from './pages/EventDetailPage';
import LiveEventStreamPage from './pages/LiveEventStreamPage';
import CreateEventPage from './pages/CreateEventPage';
import EditEventPage from './pages/EditEventPage';
import MyEventsPage from './pages/MyEventsPage';
import ManageTicketsPage from './pages/ManageTicketsPage';
import MyBookingsPage from './pages/MyBookingsPage';
import OrganizerDashboardPage from './pages/OrganizerDashboardPage';
import SearchPage from './pages/SearchPage';
import DigitalTicketPage from './pages/DigitalTicketPage';
import SeatSelectionPage from './pages/SeatSelectionPage';
import WishlistPage from './pages/WishlistPage';
import PaymentHistoryPage from './pages/PaymentHistoryPage';
import CheckInPage from './pages/CheckInPage';
import NotificationsPage from './pages/NotificationsPage';
import InboxPage from './pages/InboxPage';
import EventAnalyticsPage from './pages/EventAnalyticsPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import ManageCouponsPage from './pages/ManageCouponsPage';
import ManageRefundsPage from './pages/ManageRefundsPage';
import ReportsDashboard from './pages/ReportsDashboard';
import Sponsorships from './pages/Sponsorships';
import AuditLogs from './pages/admin/AuditLogs';
import BIDashboard from './pages/admin/BIDashboard';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50 flex flex-col">
          <Navbar />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/events" element={<EventsPage />} />
              <Route path="/events/:id" element={<EventDetailPage />} />
              <Route path="/events/:id/live" element={<ProtectedRoute><LiveEventStreamPage /></ProtectedRoute>} />
              <Route path="/search" element={<SearchPage />} />

              {/* Auth-protected */}
              <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
              <Route path="/my-bookings" element={<ProtectedRoute><MyBookingsPage /></ProtectedRoute>} />
              <Route path="/tickets/:id" element={<ProtectedRoute><DigitalTicketPage /></ProtectedRoute>} />
              <Route path="/events/:id/seats" element={<ProtectedRoute><SeatSelectionPage /></ProtectedRoute>} />
              <Route path="/wishlist" element={<ProtectedRoute><WishlistPage /></ProtectedRoute>} />
              <Route path="/payment-history" element={<ProtectedRoute><PaymentHistoryPage /></ProtectedRoute>} />
              <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
              <Route path="/inbox" element={<ProtectedRoute><InboxPage /></ProtectedRoute>} />
              <Route path="/sponsorships" element={<ProtectedRoute><Sponsorships /></ProtectedRoute>} />

              {/* Organizer-protected */}
              <Route path="/dashboard" element={<ProtectedRoute requiredRole="ORGANIZER"><OrganizerDashboardPage /></ProtectedRoute>} />
              <Route path="/create-event" element={<ProtectedRoute requiredRole="ORGANIZER"><CreateEventPage /></ProtectedRoute>} />
              <Route path="/events/:id/edit" element={<ProtectedRoute requiredRole="ORGANIZER"><EditEventPage /></ProtectedRoute>} />
              <Route path="/events/:id/tickets" element={<ProtectedRoute requiredRole="ORGANIZER"><ManageTicketsPage /></ProtectedRoute>} />
              <Route path="/my-events" element={<ProtectedRoute requiredRole="ORGANIZER"><MyEventsPage /></ProtectedRoute>} />
              <Route path="/check-in" element={<ProtectedRoute requiredRole="ORGANIZER"><CheckInPage /></ProtectedRoute>} />
              <Route path="/events/:id/analytics" element={<ProtectedRoute requiredRole="ORGANIZER"><EventAnalyticsPage /></ProtectedRoute>} />
              <Route path="/coupons" element={<ProtectedRoute requiredRole="ORGANIZER"><ManageCouponsPage /></ProtectedRoute>} />
              <Route path="/refunds" element={<ProtectedRoute requiredRole="ORGANIZER"><ManageRefundsPage /></ProtectedRoute>} />
              <Route path="/reports" element={<ProtectedRoute requiredRole="ORGANIZER"><ReportsDashboard /></ProtectedRoute>} />

              {/* Admin-protected */}
              <Route path="/admin/dashboard" element={<ProtectedRoute requiredRole="ADMIN"><AdminDashboardPage /></ProtectedRoute>} />
              <Route path="/admin/audit-logs" element={<ProtectedRoute requiredRole="ADMIN"><AuditLogs /></ProtectedRoute>} />
              <Route path="/admin/bi-dashboard" element={<ProtectedRoute requiredRole="ADMIN"><BIDashboard /></ProtectedRoute>} />
            </Routes>
          </main>
          <AIAssistantWidget />
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
