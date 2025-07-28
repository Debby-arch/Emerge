"use client";

import type React from "react";
import { useState, useEffect } from "react";
import {
  Search,
  Calendar,
  Clock,
  DollarSign,
  User,
  Loader2,
} from "lucide-react";
import type { Doctor, Appointment, DoctorAvailability } from "../services/api";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";

const PatientDashboard: React.FC = () => {
  const { user } = useAuth();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState("");
  const [loading, setLoading] = useState(true);
  const [bookingDoctor, setBookingDoctor] = useState<Doctor | null>(null);
  const [doctorAvailability, setDoctorAvailability] = useState<
    DoctorAvailability[]
  >([]);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [reasonForVisit, setReasonForVisit] = useState("");
  const [selectedDate, setSelectedDate] = useState<string | null>(null); // New state for selected date
  const [selectedSlot, setSelectedSlot] = useState<DoctorAvailability | null>(
    null,
  );
  const [bookingError, setBookingError] = useState("");
  const [bookingSuccess, setBookingSuccess] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [doctorsData, appointmentsData] = await Promise.all([
        api.getDoctors(),
        api.getPatientAppointments(),
      ]);
      setDoctors(doctorsData);
      setAppointments(appointmentsData);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctorAvailability = async (doctorId: string) => {
    try {
      const availability = await api.getDoctorAvailability(doctorId);
      // Filter for available slots and future dates only for patient view
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Normalize to start of day for comparison
      const filteredAvailability = availability.filter(
        (slot) => slot.is_available && new Date(slot.date) >= today,
      );
      setDoctorAvailability(filteredAvailability);
    } catch (error) {
      console.error("Error fetching doctor availability:", error);
    }
  };

  const filteredDoctors = doctors.filter((doctor) => {
    const matchesSearch =
      `${doctor.user.first_name} ${doctor.user.last_name}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      doctor.specialization.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSpecialty =
      !selectedSpecialty || doctor.specialization === selectedSpecialty;

    return matchesSearch && matchesSpecialty;
  });

  const specialties = [
    ...new Set(doctors.map((doctor) => doctor.specialization)),
  ];

  const handleBookAppointment = async () => {
    setBookingError("");
    setBookingSuccess("");

    if (!bookingDoctor || !selectedSlot || !reasonForVisit.trim()) {
      setBookingError(
        "Please select a time slot and provide a reason for visit.",
      );
      return;
    }

    try {
      setBookingLoading(true);
      await api.createAppointment({
        doctor: bookingDoctor.id,
        appointment_date: selectedSlot.date,
        appointment_time: selectedSlot.start_time,
        reason_for_visit: reasonForVisit,
      });

      // Refresh appointments
      const updatedAppointments = await api.getPatientAppointments();
      setAppointments(updatedAppointments);
      setBookingSuccess("Appointment booked successfully!");
      // Reset modal state after successful booking
      setTimeout(() => {
        setBookingDoctor(null);
        setReasonForVisit("");
        setSelectedDate(null); // Reset selected date
        setSelectedSlot(null);
        setBookingSuccess("");
      }, 2000);
    } catch (error: any) {
      setBookingError(
        error.message || "Failed to book appointment. Please try again.",
      );
      console.error("Error booking appointment:", error);
    } finally {
      setBookingLoading(false);
    }
  };

  const openBookingModal = async (doctor: Doctor) => {
    setBookingDoctor(doctor);
    setReasonForVisit("");
    setSelectedDate(null); // Reset selected date on modal open
    setSelectedSlot(null);
    setBookingError("");
    setBookingSuccess("");
    await fetchDoctorAvailability(doctor.id);
  };

  const closeBookingModal = () => {
    setBookingDoctor(null);
    setReasonForVisit("");
    setSelectedDate(null);
    setSelectedSlot(null);
    setBookingError("");
    setBookingSuccess("");
  };

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    setSelectedSlot(null); // Clear selected slot when date changes
  };

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

  // Group availability by date for display
  const availabilityByDate = doctorAvailability.reduce(
    (acc, slot) => {
      if (!acc[slot.date]) {
        acc[slot.date] = [];
      }
      acc[slot.date].push(slot);
      return acc;
    },
    {} as Record<string, DoctorAvailability[]>,
  );

  const sortedDates = Object.keys(availabilityByDate).sort();

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
          Patient Dashboard
        </h1>
        <p className="text-gray-600">
          Welcome back! Find and book appointments with qualified therapists.
        </p>
      </div>

      {/* My Appointments */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          My Appointments
        </h2>
        {appointments.length === 0 ? (
          <p className="text-gray-500">No appointments scheduled yet.</p>
        ) : (
          <div className="grid gap-4">
            {appointments.map((appointment) => (
              <div
                key={appointment.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <User className="h-12 w-12 text-gray-400 bg-gray-100 rounded-full p-2" />
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {appointment.doctor_name || "Doctor"}
                      </h3>
                      <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
                        <span className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {formatDate(appointment.appointment_date)}
                        </span>
                        <span className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          {formatTime(appointment.appointment_time)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        <strong>Reason:</strong> {appointment.reason_for_visit}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}
                  >
                    {appointment.status.charAt(0).toUpperCase() +
                      appointment.status.slice(1)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Find a Therapist
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or specialty..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          <select
            value={selectedSpecialty}
            onChange={(e) => setSelectedSpecialty(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="">All Specialties</option>
            {specialties.map((specialty) => (
              <option key={specialty} value={specialty}>
                {specialty}
              </option>
            ))}
          </select>

          <button
            onClick={() => {
              setSearchTerm("");
              setSelectedSpecialty("");
            }}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Available Doctors */}
      <div className="grid gap-6">
        {filteredDoctors.map((doctor) => (
          <div
            key={doctor.id}
            className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start space-x-4">
              <User className="h-16 w-16 text-gray-400 bg-gray-100 rounded-full p-3" />

              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      Dr. {doctor.user.first_name} {doctor.user.last_name}
                    </h3>
                    <p className="text-green-600 font-medium">
                      {doctor.specialization}
                    </p>
                    <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                      <span>{doctor.years_of_experience} years experience</span>
                      <span className="flex items-center">
                        <DollarSign className="h-4 w-4 mr-1" />$
                        {doctor.consultation_fee}/session
                      </span>
                    </div>
                    <p className="mt-3 text-gray-700">
                      {doctor.bio || "No bio available"}
                    </p>
                  </div>

                  <button
                    onClick={() => openBookingModal(doctor)}
                    disabled={!doctor.is_accepting_patients}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {doctor.is_accepting_patients
                      ? "Book Appointment"
                      : "Not Available"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Booking Modal */}
      {bookingDoctor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6 max-h-96 overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Book Appointment with Dr. {bookingDoctor.user.first_name}{" "}
              {bookingDoctor.user.last_name}
            </h3>

            {bookingError && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm mb-4">
                {bookingError}
              </div>
            )}
            {bookingSuccess && (
              <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-md text-sm mb-4">
                {bookingSuccess}
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for Visit *
              </label>
              <textarea
                value={reasonForVisit}
                onChange={(e) => setReasonForVisit(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                rows={3}
                placeholder="Please describe the reason for your visit..."
                required
              />
            </div>

            <div className="space-y-3 mb-6">
              <h4 className="font-medium text-gray-900">Available Dates:</h4>
              {sortedDates.length === 0 ? (
                <p className="text-gray-500">No available dates</p>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {sortedDates.map((date) => (
                    <button
                      key={date}
                      onClick={() => handleDateSelect(date)}
                      className={`w-full p-3 text-left border rounded-lg transition-colors ${
                        selectedDate === date
                          ? "border-green-500 bg-green-50 ring-2 ring-green-500"
                          : "border-gray-200 hover:bg-green-50 hover:border-green-300"
                      }`}
                    >
                      <div className="font-medium">{formatDate(date)}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {selectedDate && (
              <div className="space-y-3 mb-6">
                <h4 className="font-medium text-gray-900">
                  Available Time Slots for {formatDate(selectedDate)}:
                </h4>
                {availabilityByDate[selectedDate]?.length > 0 ? (
                  <div className="grid grid-cols-3 gap-2">
                    {availabilityByDate[selectedDate]
                      .sort((a, b) => a.start_time.localeCompare(b.start_time)) // Sort times
                      .map((slot) => (
                        <button
                          key={slot.id}
                          onClick={() => setSelectedSlot(slot)}
                          className={`w-full p-3 text-left border rounded-lg transition-colors ${
                            selectedSlot?.id === slot.id
                              ? "border-green-500 bg-green-50 ring-2 ring-green-500"
                              : "border-gray-200 hover:bg-green-50 hover:border-green-300"
                          }`}
                        >
                          <div className="text-sm text-gray-600">
                            {formatTime(slot.start_time)} -{" "}
                            {formatTime(slot.end_time)}
                          </div>
                        </button>
                      ))}
                  </div>
                ) : (
                  <p className="text-gray-500">
                    No available time slots for this date.
                  </p>
                )}
              </div>
            )}

            <div className="flex space-x-3">
              <button
                onClick={handleBookAppointment}
                disabled={
                  bookingLoading || !selectedSlot || !reasonForVisit.trim()
                }
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {bookingLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Booking...
                  </>
                ) : (
                  "Book Appointment"
                )}
              </button>
              <button
                onClick={closeBookingModal}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={bookingLoading}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientDashboard;

