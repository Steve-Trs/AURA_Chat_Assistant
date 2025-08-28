import React, { useState, useEffect } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import {
  CheckCircle,
  XCircle,
  MessageSquare,
  BookOpen,
  ArrowLeft,
} from "lucide-react";
import { supabase } from "./supabaseClient";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8888/api";

const AdminKnowledge = () => {
  const location = useLocation();
  const navigate = useNavigate(); // Add this line
  const [activeTab, setActiveTab] = useState("suggestions");
  const [data, setData] = useState([]);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  // Function to handle logout
  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/admin/login");
  };

  // Get the current user's session on component load
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setCurrentUser(session.user);
      }
    });
  }, []);

  useEffect(() => {
    if (location.pathname.includes("/admin/instructions")) {
      setActiveTab("instructions");
    } else {
      setActiveTab("suggestions");
    }
  }, [location.pathname]);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const endpoint =
        activeTab === "suggestions"
          ? `${API_URL}/suggestions?status=${statusFilter}`
          : `${API_URL}/instructions?status=${statusFilter}`;
      const response = await fetch(endpoint);
      if (!response.ok) {
        throw new Error("Failed to fetch data.");
      }
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab, statusFilter]);

  const handleStatusUpdate = async (id, newStatus) => {
    if (!currentUser) {
      setError("You must be logged in to perform this action.");
      return;
    }

    try {
      const endpoint =
        activeTab === "suggestions"
          ? `${API_URL}/suggestions/${id}`
          : `${API_URL}/instructions/${id}`;
      const response = await fetch(endpoint, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: newStatus,
          approved_by: currentUser.id,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update status.");
      }
      await fetchData();
    } catch (err) {
      console.error("Update error:", err);
      setError("An error occurred while updating the item.");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "approved":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl w-full space-y-8">
        <div className="flex items-center justify-between text-center">
          <Link
            to="/"
            className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-purple-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Chat
          </Link>

          <div className="flex-1 text-center">
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Admin Knowledge Base
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Review and manage all AI knowledge suggestions and instructions.
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="text-sm text-red-600 hover:text-red-700 font-medium"
          >
            Logout
          </button>
        </div>

        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            <a
              href="#"
              onClick={() => {
                setActiveTab("suggestions");
                setStatusFilter("pending");
              }}
              className={`whitespace-nowrap flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === "suggestions"
                  ? "border-purple-500 text-purple-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <MessageSquare className="w-5 h-5" />
              Q&A Suggestions
            </a>
            <a
              href="#"
              onClick={() => {
                setActiveTab("instructions");
                setStatusFilter("pending");
              }}
              className={`whitespace-nowrap flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === "instructions"
                  ? "border-purple-500 text-purple-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <BookOpen className="w-5 h-5" />
              General Instructions
            </a>
          </nav>
        </div>

        <div className="flex justify-end gap-4 items-center">
          <label
            htmlFor="status-filter"
            className="text-sm font-medium text-gray-700"
          >
            Filter by status:
          </label>
          <select
            id="status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="mt-1 block w-40 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm rounded-md"
          >
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        {isLoading && <p className="text-center text-gray-600">Loading...</p>}
        {error && <p className="text-center text-red-500">Error: {error}</p>}
        {!isLoading && !error && data.length === 0 && (
          <p className="text-center text-gray-500 mt-8">
            No {activeTab} found for this status.
          </p>
        )}

        {!isLoading && !error && data.length > 0 && (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <ul className="divide-y divide-gray-200">
              {data.map((item) => (
                <li key={item.id} className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      {activeTab === "suggestions" ? (
                        <>
                          <h3 className="text-lg font-semibold text-gray-900">
                            Q: {item.question}
                          </h3>
                          <p className="mt-1 text-sm text-gray-600 max-w-2xl">
                            A: {item.suggested_reply}
                          </p>
                        </>
                      ) : (
                        <>
                          <h3 className="text-lg font-semibold text-gray-900">
                            Instruction
                          </h3>
                          <p className="mt-1 text-sm text-gray-600 max-w-2xl">
                            {item.content}
                          </p>
                        </>
                      )}
                      <span
                        className={`mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                          item.status
                        )}`}
                      >
                        {item.status}
                      </span>
                      <span className="ml-2 text-xs text-gray-400">
                        {new Date(item.created_at).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex-shrink-0 flex gap-2 ml-4 mt-1">
                      {item.status === "pending" && (
                        <>
                          <button
                            onClick={() =>
                              handleStatusUpdate(item.id, "approved")
                            }
                            className="p-2 border border-transparent rounded-full text-green-600 hover:bg-green-50 transition-colors"
                            title="Approve"
                          >
                            <CheckCircle className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() =>
                              handleStatusUpdate(item.id, "rejected")
                            }
                            className="p-2 border border-transparent rounded-full text-red-600 hover:bg-red-50 transition-colors"
                            title="Reject"
                          >
                            <XCircle className="w-5 h-5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminKnowledge;
