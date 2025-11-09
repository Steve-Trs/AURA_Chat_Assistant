import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_PERSONAL_API_URL;

const ProtectedPersonalRoute = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(null); // null = checking
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const verifySession = async () => {
      const token = localStorage.getItem("personal_access_token");

      if (!token) {
        setIsAuthenticated(false);
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_URL}/auth/verify`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ access_token: token }),
        });

        if (response.ok) {
          const data = await response.json();
          setIsAuthenticated(data.valid);
        } else {
          localStorage.removeItem("personal_access_token");
          localStorage.removeItem("personal_user");
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error("Verification error:", error);
        localStorage.removeItem("personal_access_token");
        localStorage.removeItem("personal_user");
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    verifySession();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex p-4 bg-white rounded-full shadow-lg mb-4">
            <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-gray-600">Verifying your session...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (isAuthenticated === false) {
    return <Navigate to="/personal-ai-login" replace />;
  }

  // Render protected content if authenticated
  return children;
};

export default ProtectedPersonalRoute;
