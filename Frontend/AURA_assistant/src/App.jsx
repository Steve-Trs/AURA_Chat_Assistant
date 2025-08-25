import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import InstagramChatAssistant from "./instagramChatAssistant";
import AdminKnowledge from "./AdminKnowledge";
import AdminLogin from "./AdminLogin";

// Simple admin authentication hook
const useAdminAuth = () => {
  const [isAdmin, setIsAdmin] = React.useState(
    localStorage.getItem("isAdmin") === "true"
  );

  const login = (password) => {
    // Simple password check - in production, use proper authentication
    if (password === "admin123") {
      setIsAdmin(true);
      localStorage.setItem("isAdmin", "true");
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsAdmin(false);
    localStorage.removeItem("isAdmin");
  };

  return { isAdmin, login, logout };
};

// Protected Route Component
const ProtectedAdminRoute = ({ children }) => {
  const { isAdmin } = useAdminAuth();
  return isAdmin ? children : <Navigate to="/admin/login" />;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Main chat interface */}
        <Route path="/" element={<InstagramChatAssistant />} />

        {/* Admin login */}
        <Route path="/admin/login" element={<AdminLogin />} />

        {/* Protected admin routes using a single component */}
        <Route
          path="/admin-dashboard"
          element={
            <ProtectedAdminRoute>
              <AdminKnowledge />
            </ProtectedAdminRoute>
          }
        />

        {/* Redirect base admin URL to the knowledge page */}
        <Route path="/admin" element={<Navigate to="/admin/suggestions" />} />
      </Routes>
    </Router>
  );
}

export default App;
