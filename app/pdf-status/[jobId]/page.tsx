"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

interface JobStatus {
  success: boolean;
  status: string;
  progress: number;
  processedTasks: number;
  totalTasks: number;
  downloadUrl?: string;
  error?: string;
  estimatedTimeSeconds?: number;
}

export default function PDFStatusPage() {
  const params = useParams();
  const jobId = params?.jobId as string;

  const [status, setStatus] = useState<JobStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    if (!jobId) return;

    const fetchStatus = async () => {
      try {
        // We need to get campaign ID from somewhere
        // For now, we'll make a generic status check endpoint
        const response = await fetch(`/api/pdf-status/${jobId}`);
        const data = await response.json();
        setStatus(data);
        setLastUpdate(new Date());
      } catch (error) {
        console.error("Failed to fetch status:", error);
      } finally {
        setLoading(false);
      }
    };

    // Initial fetch
    fetchStatus();

    // Poll every 5 seconds
    const interval = setInterval(fetchStatus, 5000);

    return () => clearInterval(interval);
  }, [jobId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-slate-100">
        <div className="text-center">
          <div className="inline-block animate-spin mb-4">
            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full"></div>
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Loading...</h1>
          <p className="text-slate-600 mt-2">Fetching PDF status</p>
        </div>
      </div>
    );
  }

  if (!status || !status.success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-slate-100">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
          <div className="text-red-600 text-5xl mb-4 text-center">⚠️</div>
          <h1 className="text-2xl font-bold text-red-600 text-center mb-4">
            Error Loading Status
          </h1>
          <p className="text-slate-600 text-center">
            {status?.error || "Unable to load PDF status. Please try again later."}
          </p>
          <p className="text-sm text-slate-500 text-center mt-4">
            Job ID: {jobId}
          </p>
        </div>
      </div>
    );
  }

  const isCompleted = status.status === "COMPLETED";
  const isFailed = status.status === "FAILED";
  const isProcessing = status.status === "PROCESSING" || status.status === "PENDING";

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 p-4">
      <div className="max-w-2xl mx-auto mt-10">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-slate-800 mb-2">📄 PDF Report Status</h1>
          <p className="text-slate-600">Track your PDF generation in real-time</p>
        </div>

        {/* Status Card */}
        <div className="bg-white rounded-lg shadow-xl overflow-hidden mb-6">
          {/* Status Header */}
          <div
            className={`px-8 py-6 ${
              isCompleted
                ? "bg-gradient-to-r from-green-500 to-green-600"
                : isFailed
                ? "bg-gradient-to-r from-red-500 to-red-600"
                : "bg-gradient-to-r from-blue-500 to-blue-600"
            }`}
          >
            <div className="text-white text-center">
              <div className="text-5xl mb-2">
                {isCompleted ? "✅" : isFailed ? "❌" : "⏳"}
              </div>
              <h2 className="text-2xl font-bold">
                {isCompleted
                  ? "PDF Ready!"
                  : isFailed
                  ? "Generation Failed"
                  : "Generating PDF"}
              </h2>
              <p className="text-white text-opacity-90 mt-1">
                {isCompleted
                  ? "Your PDF is ready for download"
                  : isFailed
                  ? "There was an error generating the PDF"
                  : `${status.progress}% complete`}
              </p>
            </div>
          </div>

          {/* Content */}
          <div className="px-8 py-8">
            {/* Progress Bar */}
            {isProcessing && (
              <div className="mb-8">
                <div className="flex justify-between mb-2">
                  <span className="font-semibold text-slate-700">Progress</span>
                  <span className="text-blue-600 font-bold">{status.progress}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-blue-600 h-full transition-all duration-500"
                    style={{ width: `${status.progress}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* Task Progress */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-slate-600 text-sm font-medium">Tasks Processed</p>
                <p className="text-3xl font-bold text-blue-600 mt-1">
                  {status.processedTasks}
                </p>
                <p className="text-xs text-slate-500 mt-1">of {status.totalTasks}</p>
              </div>

              <div className="bg-slate-50 rounded-lg p-4">
                <p className="text-slate-600 text-sm font-medium">
                  {isProcessing ? "Est. Time Remaining" : "Generation Time"}
                </p>
                <p className="text-3xl font-bold text-slate-700 mt-1">
                  {isProcessing && status.estimatedTimeSeconds
                    ? status.estimatedTimeSeconds < 60
                      ? `${status.estimatedTimeSeconds}s`
                      : `${Math.ceil(status.estimatedTimeSeconds / 60)}m`
                    : "—"}
                </p>
              </div>
            </div>

            {/* Last Update */}
            {lastUpdate && (
              <p className="text-xs text-slate-500 text-center mb-6">
                Last updated: {lastUpdate.toLocaleTimeString()}
              </p>
            )}

            {/* Error Message */}
            {isFailed && status.error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-red-700 font-semibold mb-1">Error Details:</p>
                <p className="text-red-600 text-sm">{status.error}</p>
              </div>
            )}

            {/* Download Button */}
            {isCompleted && status.downloadUrl ? (
              <div className="text-center">
                <a
                  href={status.downloadUrl}
                  download
                  className="inline-block bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-4 px-8 rounded-lg transition-all transform hover:scale-105 mb-4"
                >
                  📥 Download Full PDF Report
                </a>
                <p className="text-xs text-slate-500">
                  Download link expires in 24 hours
                </p>
              </div>
            ) : isProcessing ? (
              <div className="text-center">
                <div className="inline-block mb-4">
                  <div className="animate-pulse inline-block text-4xl">⏳</div>
                </div>
                <p className="text-slate-600 font-medium">
                  Your PDF is being generated...
                </p>
                <p className="text-slate-500 text-sm mt-2">
                  This page auto-refreshes every 5 seconds
                </p>
              </div>
            ) : null}

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-8">
              <p className="text-blue-900 font-semibold mb-2">💡 Information:</p>
              <ul className="text-blue-800 text-sm space-y-1">
                <li>✓ PDF includes all photos and location maps</li>
                <li>✓ Summary PDF already downloaded to your device</li>
                <li>✓ Full report generation continues in the background</li>
                <li>✓ You can close this page and check anytime</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-slate-600 text-sm">
          <p>Need help? Contact us at tech@experientia.media</p>
          <p className="mt-1">© 2024 Experientia. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
