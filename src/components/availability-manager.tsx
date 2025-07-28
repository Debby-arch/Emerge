"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { api, type DoctorAvailability } from "../services/api";
import {
  Calendar,
  Clock,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

interface TimeSlot {
  id?: string;
  date: string;
  start_time: string;
  end_time: string;
  is_available: boolean;
}

export const AvailabilityManager: React.FC = () => {
  // Removed doctorId prop
  const [availability, setAvailability] = useState<DoctorAvailability[]>([]);
  const [newSlot, setNewSlot] = useState<TimeSlot>({
    date: "",
    start_time: "",
    end_time: "",
    is_available: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selectedWeek, setSelectedWeek] = useState(0); // 0 = this week, 1 = next week, etc.

  useEffect(() => {
    loadAvailability();
  }, []);

  const loadAvailability = async () => {
    try {
      setLoading(true);
      // Call the new API endpoint for the current doctor's availability
      const availabilityData = await api.getDoctorAvailability();
      setAvailability(availabilityData);
    } catch (err) {
      setError("Failed to load availability. Please try again.");
      console.error("Error loading availability:", err);
    } finally {
      setLoading(false);
    }
  };

  const generateTimeOptions = () => {
    const times = [];
    for (let hour = 8; hour <= 18; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}:00`; // Add seconds for backend
        const displayTime = new Date(
          `2000-01-01T${timeString}`,
        ).toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        });
        times.push({ value: timeString, label: displayTime });
      }
    }
    return times;
  };

  const getWeekDates = (weekOffset = 0) => {
    const today = new Date();
    const currentDay = today.getDay();
    const monday = new Date(today);
    monday.setDate(
      today.getDate() -
        currentDay +
        (currentDay === 0 ? -6 : 1) +
        weekOffset * 7,
    ); // Adjust for Sunday (day 0)

    const weekDates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      weekDates.push({
        date: date.toISOString().split("T")[0],
        dayName: date.toLocaleDateString("en-US", { weekday: "long" }),
        dayNumber: date.getDate(),
        isToday: date.toDateString() === today.toDateString(),
        isPast:
          date < new Date(new Date().setHours(0, 0, 0, 0)) &&
          date.toDateString() !== today.toDateString(), // Check if date is strictly in the past
      });
    }
    return weekDates;
  };

  const addTimeSlot = async () => {
    if (!newSlot.date || !newSlot.start_time || !newSlot.end_time) {
      setError("Please fill in all fields");
      return;
    }

    if (newSlot.start_time >= newSlot.end_time) {
      setError("End time must be after start time");
      return;
    }

    try {
      setSaving(true);
      setError("");

      // Check for overlapping slots locally before sending to API
      const overlapping = availability.some(
        (slot) =>
          slot.date === newSlot.date &&
          slot.is_available &&
          ((newSlot.start_time >= slot.start_time &&
            newSlot.start_time < slot.end_time) ||
            (newSlot.end_time > slot.start_time &&
              newSlot.end_time <= slot.end_time) ||
            (newSlot.start_time <= slot.start_time &&
              newSlot.end_time >= slot.end_time)),
      );

      if (overlapping) {
        setError("This time slot overlaps with an existing availability");
        return;
      }

      const response = await api.createAvailability({
        date: newSlot.date,
        start_time: newSlot.start_time,
        end_time: newSlot.end_time,
        is_available: true,
      });

      // Add the newly created slot to the local state
      setAvailability((prev) => [
        ...prev,
        {
          id: response.id, // Use the ID from the backend
          doctor: "current", // Placeholder, actual doctor ID is managed by backend
          date: newSlot.date,
          start_time: newSlot.start_time,
          end_time: newSlot.end_time,
          is_available: true,
          created_at: new Date().toISOString(),
        },
      ]);
      setNewSlot({
        date: "",
        start_time: "",
        end_time: "",
        is_available: true,
      });
      setSuccess("Time slot added successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to add time slot. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const removeTimeSlot = async (slotId: string) => {
    try {
      await api.deleteAvailability(slotId);
      setAvailability(availability.filter((slot) => slot.id !== slotId));
      setSuccess("Time slot removed successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to remove time slot. Please try again.");
    }
  };

  const toggleSlotAvailability = async (slot: DoctorAvailability) => {
    try {
      const updatedStatus = !slot.is_available;
      await api.updateAvailability(slot.id, { is_available: updatedStatus });
      setAvailability(
        availability.map((s) =>
          s.id === slot.id ? { ...s, is_available: updatedStatus } : s,
        ),
      );
      setSuccess("Availability updated successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(
        err.message || "Failed to update availability. Please try again.",
      );
    }
  };

  const handleQuickAction = async (
    actionType: "setWeekdayHours" | "clearFuture" | "takeWeekOff",
  ) => {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      if (actionType === "setWeekdayHours") {
        const today = new Date();
        const newSlots: {
          date: string;
          start_time: string;
          end_time: string;
          is_available: boolean;
        }[] = [];
        for (let i = 1; i <= 5; i++) {
          const date = new Date(today);
          date.setDate(today.getDate() + i);
          if (date.getDay() >= 1 && date.getDay() <= 5) {
            // Weekdays only
            newSlots.push({
              date: date.toISOString().split("T")[0],
              start_time: "09:00:00",
              end_time: "17:00:00",
              is_available: true,
            });
          }
        }
        if (newSlots.length > 0) {
          await api.createMultipleAvailability(newSlots);
          setSuccess("Added weekday availability (9 AM - 5 PM)!");
        } else {
          setSuccess("No weekdays to add availability for in the next 5 days.");
        }
      } else if (actionType === "clearFuture") {
        const today = new Date().toISOString().split("T")[0];
        const futureSlots = availability.filter((slot) => slot.date >= today);
        for (const slot of futureSlots) {
          await api.deleteAvailability(slot.id);
        }
        setSuccess("Cleared all future availability!");
      } else if (actionType === "takeWeekOff") {
        const nextWeekStart = getWeekDates(1)[0].date; // Monday of next week
        const nextWeekEnd = getWeekDates(1)[6].date; // Sunday of next week
        const slotsToDisable = availability.filter(
          (slot) =>
            slot.date >= nextWeekStart &&
            slot.date <= nextWeekEnd &&
            slot.is_available,
        );
        for (const slot of slotsToDisable) {
          await api.updateAvailability(slot.id, { is_available: false });
        }
        setSuccess("Disabled availability for the next week!");
      }
      await loadAvailability(); // Reload all availability after quick action
    } catch (err: any) {
      setError(
        err.message || "Failed to perform quick action. Please try again.",
      );
    } finally {
      setSaving(false);
      setTimeout(() => setSuccess(""), 3000);
    }
  };

  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
    });
  };

  const weekDates = getWeekDates(selectedWeek);
  const timeOptions = generateTimeOptions();

  // Group availability by date
  const availabilityByDate = availability.reduce(
    (acc, slot) => {
      if (!acc[slot.date]) {
        acc[slot.date] = [];
      }
      acc[slot.date].push(slot);
      return acc;
    },
    {} as Record<string, DoctorAvailability[]>,
  );

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          <span className="ml-2 text-gray-600">Loading availability...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center space-x-2 mb-2">
          <Calendar className="h-5 w-5 text-green-600" />
          <h2 className="text-xl font-bold text-gray-900">
            Manage Your Availability
          </h2>
        </div>
        <p className="text-gray-600">
          Set your available time slots for patient appointments
        </p>
      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="h-4 w-4 text-red-600 mr-2" />
            <span className="text-red-700">{error}</span>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
            <span className="text-green-700">{success}</span>
          </div>
        </div>
      )}

      {/* Add New Time Slot */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Plus className="h-5 w-5 text-green-600" />
          <h3 className="text-lg font-semibold text-gray-900">
            Add New Time Slot
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label
              htmlFor="date"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Date
            </label>
            <input
              id="date"
              type="date"
              value={newSlot.date}
              onChange={(e) => setNewSlot({ ...newSlot, date: e.target.value })}
              min={new Date().toISOString().split("T")[0]}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>

          <div>
            <label
              htmlFor="start_time"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Start Time
            </label>
            <select
              id="start_time"
              value={newSlot.start_time}
              onChange={(e) =>
                setNewSlot({ ...newSlot, start_time: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              <option value="">Select start time</option>
              {timeOptions.map((time) => (
                <option key={time.value} value={time.value}>
                  {time.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="end_time"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              End Time
            </label>
            <select
              id="end_time"
              value={newSlot.end_time}
              onChange={(e) =>
                setNewSlot({ ...newSlot, end_time: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              <option value="">Select end time</option>
              {timeOptions.map((time) => (
                <option
                  key={time.value}
                  value={time.value}
                  disabled={time.value <= newSlot.start_time}
                >
                  {time.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={addTimeSlot}
              disabled={saving}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Slot
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Week Navigation */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => setSelectedWeek(Math.max(0, selectedWeek - 1))}
            disabled={selectedWeek === 0}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Previous Week
          </button>
          <h3 className="text-lg font-semibold text-gray-900">
            {selectedWeek === 0
              ? "This Week"
              : selectedWeek === 1
                ? "Next Week"
                : `Week ${selectedWeek + 1}`}
          </h3>
          <button
            onClick={() => setSelectedWeek(selectedWeek + 1)}
            disabled={selectedWeek >= 4} // Limit to 5 weeks ahead for demo
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next Week
          </button>
        </div>

        {/* Weekly Calendar View */}
        <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
          {weekDates.map((day) => (
            <div key={day.date} className={`${day.isPast ? "opacity-50" : ""}`}>
              <div className="text-center mb-3">
                <div
                  className={`font-medium ${day.isToday ? "text-green-600" : "text-gray-900"}`}
                >
                  {day.dayName}
                </div>
                <div
                  className={`text-sm ${day.isToday ? "text-green-600" : "text-gray-500"}`}
                >
                  {day.dayNumber}
                </div>
              </div>

              <div className="min-h-[200px] p-3 border border-gray-200 rounded-lg bg-gray-50">
                {availabilityByDate[day.date]?.length > 0 ? (
                  <div className="space-y-2">
                    {availabilityByDate[day.date]
                      .sort((a, b) => a.start_time.localeCompare(b.start_time))
                      .map((slot) => (
                        <div
                          key={slot.id}
                          className={`p-2 rounded-md text-xs border ${
                            slot.is_available
                              ? "bg-green-100 border-green-200 text-green-800"
                              : "bg-gray-100 border-gray-200 text-gray-600"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium">
                              {formatTime(slot.start_time)} -{" "}
                              {formatTime(slot.end_time)}
                            </span>
                            <div className="flex space-x-1">
                              <button
                                onClick={() => toggleSlotAvailability(slot)}
                                className={`p-1 rounded hover:bg-opacity-20 ${
                                  slot.is_available
                                    ? "text-green-600 hover:bg-green-600"
                                    : "text-gray-600 hover:bg-gray-600"
                                }`}
                                title={
                                  slot.is_available
                                    ? "Disable slot"
                                    : "Enable slot"
                                }
                              >
                                <Clock className="h-3 w-3" />
                              </button>
                              <button
                                onClick={() => removeTimeSlot(slot.id)}
                                className="p-1 rounded text-red-600 hover:bg-red-600 hover:bg-opacity-20"
                                title="Remove slot"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                          <span
                            className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                              slot.is_available
                                ? "bg-green-200 text-green-800"
                                : "bg-gray-200 text-gray-600"
                            }`}
                          >
                            {slot.is_available ? "Available" : "Disabled"}
                          </span>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-center text-gray-400 text-xs mt-16">
                    No availability set
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => handleQuickAction("setWeekdayHours")}
            disabled={saving}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-700 mr-2"></div>
                Setting...
              </>
            ) : (
              "Set Weekday Hours (9-5)"
            )}
          </button>

          <button
            onClick={() => handleQuickAction("clearFuture")}
            disabled={saving}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-700 mr-2"></div>
                Clearing...
              </>
            ) : (
              "Clear Future Availability"
            )}
          </button>

          <button
            onClick={() => handleQuickAction("takeWeekOff")}
            disabled={saving}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-700 mr-2"></div>
                Disabling...
              </>
            ) : (
              "Take Week Off"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
