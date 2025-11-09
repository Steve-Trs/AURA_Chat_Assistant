import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { supabase } from "./supabaseClient";
import InstagramChatAssistant from "./instagramChatAssistant";
import AdminKnowledge from "./AdminKnowledge";
import AdminLogin from "./AdminLogin";
//=========== My AIs =================//
import MultiplePersonalAIChat from "./multipleAI/MultiplePersonalAIChat";
import PersonalLogin from "./multipleAI/PersonalLogin";
import ProtectedPersonalRoute from "./multipleAI/ProtectedPersonalRoute";
//====================================//

// Supabase-based Protected Route Component
const ProtectedAdminRoute = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
      setIsLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-gray-600">Checking authentication...</span>
        </div>
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/admin/login" replace />;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Main chat interface */}
        <Route path="/" element={<InstagramChatAssistant />} />

        {/* Admin login */}
        <Route path="/admin/login" element={<AdminLogin />} />

        {/* Protected admin dashboard */}
        <Route
          path="/admin-dashboard"
          element={
            <ProtectedAdminRoute>
              <AdminKnowledge />
            </ProtectedAdminRoute>
          }
        />

        {/* Redirect base admin URL to the dashboard */}
        <Route
          path="/admin"
          element={<Navigate to="/admin-dashboard" replace />}
        />
        {/* My Secret Personal AI Chat => Hidden Route */}
        <Route path="/personal-ai-login" element={<PersonalLogin />} />
        <Route
          path="/personal-ai"
          element={
            <ProtectedPersonalRoute>
              <MultiplePersonalAIChat />
            </ProtectedPersonalRoute>
          }
        />

        {/* Catch all - redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
