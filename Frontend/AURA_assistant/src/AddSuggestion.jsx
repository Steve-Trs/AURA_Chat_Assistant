import React, { useState } from "react";
import {
  Plus,
  Send,
  CheckCircle,
  AlertCircle,
  MessageSquare,
  BookOpen,
} from "lucide-react";

const API_URL = "http://localhost:8888/api";

const AddSuggestion = ({ onClose }) => {
  const [type, setType] = useState("qa"); // 'qa' or 'instruction'
  const [question, setQuestion] = useState("");
  const [suggestedReply, setSuggestedReply] = useState("");
  const [instruction, setInstruction] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null); // 'success', 'error', null

  const handleSubmit = async () => {
    // Validation based on type
    if (type === "qa" && (!question.trim() || !suggestedReply.trim())) {
      setSubmitStatus("error");
      setTimeout(() => setSubmitStatus(null), 3000);
      return;
    }

    if (type === "instruction" && !instruction.trim()) {
      setSubmitStatus("error");
      setTimeout(() => setSubmitStatus(null), 3000);
      return;
    }

    setIsSubmitting(true);

    try {
      let requestBody = {};
      let endpoint = ""; // FIX: We will now set the endpoint dynamically

      if (type === "qa") {
        requestBody = {
          question: question.trim(),
          suggested_reply: suggestedReply.trim(),
          created_by: "user",
        };
        endpoint = `${API_URL}/suggestions`;
      } else {
        requestBody = {
          content: instruction.trim(),
          created_by: "user",
        };
        endpoint = `${API_URL}/instructions`; // FIX: Use the correct instructions endpoint
      }

      const response = await fetch(endpoint, {
        // FIX: Use the dynamic endpoint variable
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        setSubmitStatus("success");
        setQuestion("");
        setSuggestedReply("");
        setInstruction("");

        // Auto-close after success
        setTimeout(() => {
          setSubmitStatus(null);
          if (onClose) onClose();
        }, 2000);
      } else {
        const errorData = await response.json();
        console.error("Error submitting suggestion:", errorData);
        setSubmitStatus("error");
        setTimeout(() => setSubmitStatus(null), 3000);
      }
    } catch (error) {
      console.error("Error submitting suggestion:", error);
      setSubmitStatus("error");
      setTimeout(() => setSubmitStatus(null), 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getValidationMessage = () => {
    if (type === "qa") {
      return "Please fill in both question and suggested reply fields.";
    }
    return "Please fill in the instruction field.";
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg">
                <Plus className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Add Knowledge Suggestion
                </h2>
                <p className="text-sm text-gray-600">
                  Help improve the AI by suggesting new Q&As or instructions
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Type Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              What would you like to add?
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setType("qa")}
                className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all ${
                  type === "qa"
                    ? "border-purple-500 bg-purple-50 text-purple-700"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <MessageSquare className="w-5 h-5" />
                <div className="text-left">
                  <div className="font-medium">Question & Answer</div>
                  <div className="text-xs text-gray-500">
                    Add a specific Q&A pair
                  </div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setType("instruction")}
                className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all ${
                  type === "instruction"
                    ? "border-purple-500 bg-purple-50 text-purple-700"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <BookOpen className="w-5 h-5" />
                <div className="text-left">
                  <div className="font-medium">General Instruction</div>
                  <div className="text-xs text-gray-500">
                    Add behavioral guidance
                  </div>
                </div>
              </button>
            </div>
          </div>

          <div className="space-y-6">
            {type === "qa" ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Question/Scenario
                  </label>
                  <textarea
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="e.g., What if they ask about payment methods?"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                    rows="3"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Describe a question or scenario that users might encounter
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Suggested Reply
                  </label>
                  <textarea
                    value={suggestedReply}
                    onChange={(e) => setSuggestedReply(e.target.value)}
                    placeholder="e.g., We handle all payments securely through our platform. Giannis can explain the exact payment structure in detail. Would you like me to connect you with him?"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                    rows="4"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Provide a helpful, on-brand reply that the AI should give
                  </p>
                </div>
              </>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Instruction
                </label>
                <textarea
                  value={instruction}
                  onChange={(e) => setInstruction(e.target.value)}
                  placeholder="e.g., Always be flirty but respectful when responding to compliments. Use emojis sparingly and maintain a confident tone."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                  rows="4"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Provide general behavioral guidance or tone instructions for
                  the AI
                </p>
              </div>
            )}

            {submitStatus === "success" && (
              <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-800">
                <CheckCircle className="w-5 h-5" />
                <span className="text-sm">
                  Suggestion submitted successfully! It will be reviewed before
                  being added.
                </span>
              </div>
            )}

            {submitStatus === "error" && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800">
                <AlertCircle className="w-5 h-5" />
                <span className="text-sm">{getValidationMessage()}</span>
              </div>
            )}

            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={
                  isSubmitting ||
                  (type === "qa" &&
                    (!question.trim() || !suggestedReply.trim())) ||
                  (type === "instruction" && !instruction.trim())
                }
                className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Submit {type === "qa" ? "Q&A" : "Instruction"}
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-2">
              <div className="p-1 bg-blue-100 rounded-full mt-0.5">
                <svg
                  className="w-3 h-3 text-blue-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div>
                <h4 className="text-sm font-medium text-blue-900 mb-1">
                  How it works
                </h4>
                <p className="text-xs text-blue-800">
                  Your suggestions will be reviewed by an admin before being
                  added to the AI's knowledge base. Q&As help with specific
                  scenarios, while instructions guide the AI's overall behavior
                  and tone.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddSuggestion;
