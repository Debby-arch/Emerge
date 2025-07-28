"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { Calendar, Clock, User, Check, X, AlertCircle } from "lucide-react";
import type { Appointment } from "../services/api";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { AvailabilityManager } from "../components/availability-manager";

const DoctorDashboard: React.FC = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<
    "all" | "pending" | "confirmed" | "completed"
  >("all");
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<
    "overview" | "appointments" | "availability"
  >("overview");

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const appointmentsData = await api.getDoctorAppointments();
      setAppointments(appointmentsData);
    } catch (error: any) {
      console.error("Error fetching appointments:", error);
      setError("Failed to load appointments");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (
    appointmentId: string,
    status: "confirmed" | "cancelled" | "completed",
  ) => {
    try {
      if (status === "confirmed") {
        await api.confirmAppointment(appointmentId);
      } else if (status === "cancelled") {
        await api.cancelAppointment(appointmentId, "Cancelled by doctor");
      } else if (status === "completed") {
        await api.completeAppointment(appointmentId, "");
      }

      // Refresh appointments
      await fetchAppointments();
    } catch (error) {
      alert("Failed to update appointment status. Please try again.");
    }
  };

  const filteredAppointments = appointments.filter(
    (apt) => filter === "all" || apt.status === filter,
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "confirmed":
        return <Check className="h-4 w-4" />;
      case "pending":
        return <AlertCircle className="h-4 w-4" />;
      case "cancelled":
        return <X className="h-4 w-4" />;
      case "completed":
        return <Check className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const appointmentCounts = {
    all: appointments.length,
    pending: appointments.filter((apt) => apt.status === "pending").length,
    confirmed: appointments.filter((apt) => apt.status === "confirmed").length,
    completed: appointments.filter((apt) => apt.status === "completed").length,
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Doctor Dashboard
        </h1>
        <p className="text-gray-600">
          Welcome back! Manage your appointments and availability.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex space-x-1">
          {[
            { id: "overview", label: "Overview", icon: Calendar },
            { id: "appointments", label: "Appointments", icon: User },
            { id: "availability", label: "Availability", icon: Clock },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === tab.id
                  ? "bg-green-600 text-white"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              }`}
            >
              <tab.icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Stats Cards - keep existing stats cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Total Appointments
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {appointmentCounts.all}
                  </p>
                </div>
                <Calendar className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {appointmentCounts.pending}
                  </p>
                </div>
                <AlertCircle className="h-8 w-8 text-yellow-600" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Confirmed</p>
                  <p className="text-2xl font-bold text-green-600">
                    {appointmentCounts.confirmed}
                  </p>
                </div>
                <Check className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-green-600">
                    {appointmentCounts.completed}
                  </p>
                </div>
                <Check className="h-8 w-8 text-green-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "appointments" && (
        <div className="space-y-6">
          {/* Filters - keep existing filters */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex space-x-2">
              {(["all", "pending", "confirmed", "completed"] as const).map(
                (status) => (
                  <button
                    key={status}
                    onClick={() => setFilter(status)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      filter === status
                        ? "bg-green-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                    {status !== "all" && (
                      <span className="ml-2 bg-white bg-opacity-20 px-2 py-1 rounded-full text-xs">
                        {appointmentCounts[status]}
                      </span>
                    )}
                  </button>
                ),
              )}
            </div>
          </div>

          {/* Appointments List - keep existing appointments list */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {filter === "all"
                ? "All Appointments"
                : `${filter.charAt(0).toUpperCase() + filter.slice(1)} Appointments`}
            </h2>
            {filteredAppointments.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No appointments found.
              </p>
            ) : (
              <div className="space-y-4">
                {filteredAppointments.map((appointment) => (
                  <div
                    key={appointment.id}
                    className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4">
                        <User className="h-12 w-12 text-gray-400 bg-gray-100 rounded-full p-2" />

                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">
                            {appointment.patient_name || "Patient"}
                          </h3>

                          <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                            <span className="flex items-center">
                              <Calendar className="h-4 w-4 mr-1" />
                              {formatDate(appointment.appointment_date)}
                            </span>
                            <span className="flex items-center">
                              <Clock className="h-4 w-4 mr-1" />
                              {formatTime(appointment.appointment_time)}
                            </span>
                          </div>

                          <p className="mt-2 text-sm text-gray-700">
                            <strong>Reason:</strong>{" "}
                            {appointment.reason_for_visit}
                          </p>

                          {appointment.notes && (
                            <p className="mt-2 text-sm text-gray-700 bg-gray-50 p-2 rounded">
                              <strong>Notes:</strong> {appointment.notes}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <span
                          className={`flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}
                        >
                          {getStatusIcon(appointment.status)}
                          <span>
                            {appointment.status.charAt(0).toUpperCase() +
                              appointment.status.slice(1)}
                          </span>
                        </span>

                        {appointment.status === "pending" && (
                          <div className="flex space-x-2">
                            <button
                              onClick={() =>
                                handleStatusUpdate(appointment.id, "confirmed")
                              }
                              className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm"
                            >
                              Accept
                            </button>
                            <button
                              onClick={() =>
                                handleStatusUpdate(appointment.id, "cancelled")
                              }
                              className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm"
                            >
                              Decline
                            </button>
                          </div>
                        )}

                        {appointment.status === "confirmed" && (
                          <button
                            onClick={() =>
                              handleStatusUpdate(appointment.id, "completed")
                            }
                            className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm"
                          >
                            Mark Complete
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "availability" && <AvailabilityManager />}
    </div>
  );
};

export default DoctorDashboard;

