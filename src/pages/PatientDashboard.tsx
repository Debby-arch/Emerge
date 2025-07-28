import React, { useState, useEffect } from 'react';
import { Search, Filter, Calendar, Clock, Star, DollarSign, User } from 'lucide-react';
import { Doctor, Appointment } from '../types';
import { mockApi } from '../services/mockApi';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';

const PatientDashboard: React.FC = () => {
  const { user } = useAuth();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [bookingDoctor, setBookingDoctor] = useState<Doctor | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [doctorsData, appointmentsData] = await Promise.all([
          mockApi.getDoctors(),
          mockApi.getAppointmentsByUserId(user!.id)
        ]);
        setDoctors(doctorsData);
        setAppointments(appointmentsData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const filteredDoctors = doctors.filter(doctor => {
    const matchesSearch = doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doctor.specialty.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSpecialty = !selectedSpecialty || doctor.specialty === selectedSpecialty;
    const matchesDate = !selectedDate || doctor.availability.some(slot => 
      slot.date === selectedDate && slot.isAvailable
    );
    
    return matchesSearch && matchesSpecialty && matchesDate;
  });

  const specialties = [...new Set(doctors.map(doctor => doctor.specialty))];

  const handleBookAppointment = async (doctor: Doctor, slot: any) => {
    try {
      await mockApi.bookAppointment({
        patientId: user!.id,
        doctorId: doctor.id,
        date: slot.date,
        startTime: slot.startTime,
        endTime: slot.endTime,
        notes: ''
      });
      
      // Refresh appointments
      const updatedAppointments = await mockApi.getAppointmentsByUserId(user!.id);
      setAppointments(updatedAppointments);
      setBookingDoctor(null);
      
      alert('Appointment booked successfully!');
    } catch (error) {
      alert('Failed to book appointment. Please try again.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
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
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Patient Dashboard</h1>
        <p className="text-gray-600">Welcome back, {user?.name}! Find and book appointments with qualified therapists.</p>
      </div>

      {/* My Appointments */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">My Appointments</h2>
        {appointments.length === 0 ? (
          <p className="text-gray-500">No appointments scheduled yet.</p>
        ) : (
          <div className="grid gap-4">
            {appointments.map((appointment) => (
              <div key={appointment.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {appointment.doctor?.avatar && (
                      <img
                        src={appointment.doctor.avatar}
                        alt={appointment.doctor.name}
                        className="h-12 w-12 rounded-full object-cover"
                      />
                    )}
                    <div>
                      <h3 className="font-semibold text-gray-900">{appointment.doctor?.name}</h3>
                      <p className="text-sm text-gray-600">{appointment.doctor?.specialty}</p>
                      <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
                        <span className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {format(new Date(appointment.date), 'MMM dd, yyyy')}
                        </span>
                        <span className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          {appointment.startTime} - {appointment.endTime}
                        </span>
                      </div>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                    {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Find a Therapist</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
          
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
          
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedSpecialty('');
              setSelectedDate('');
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
          <div key={doctor.id} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start space-x-4">
              {doctor.avatar ? (
                <img
                  src={doctor.avatar}
                  alt={doctor.name}
                  className="h-16 w-16 rounded-full object-cover"
                />
              ) : (
                <User className="h-16 w-16 text-gray-400 bg-gray-100 rounded-full p-3" />
              )}
              
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">{doctor.name}</h3>
                    <p className="text-green-600 font-medium">{doctor.specialty}</p>
                    <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                      <span className="flex items-center">
                        <Star className="h-4 w-4 text-yellow-400 mr-1" />
                        {doctor.rating}
                      </span>
                      <span>{doctor.experience} years experience</span>
                      <span className="flex items-center">
                        <DollarSign className="h-4 w-4 mr-1" />
                        ${doctor.consultationFee}/session
                      </span>
                    </div>
                    <p className="mt-3 text-gray-700">{doctor.bio}</p>
                  </div>
                  
                  <button
                    onClick={() => setBookingDoctor(doctor)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Book Appointment
                  </button>
                </div>
                
                {/* Available Time Slots */}
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Available Time Slots:</h4>
                  <div className="flex flex-wrap gap-2">
                    {doctor.availability
                      .filter(slot => slot.isAvailable && (!selectedDate || slot.date === selectedDate))
                      .map((slot) => (
                        <span
                          key={slot.id}
                          className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs"
                        >
                          {format(new Date(slot.date), 'MMM dd')} at {slot.startTime}
                        </span>
                      ))}
                    {doctor.availability.filter(slot => slot.isAvailable && (!selectedDate || slot.date === selectedDate)).length === 0 && (
                      <span className="text-sm text-gray-500">No available slots</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Booking Modal */}
      {bookingDoctor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Book Appointment with {bookingDoctor.name}
            </h3>
            
            <div className="space-y-3 mb-6">
              {bookingDoctor.availability
                .filter(slot => slot.isAvailable)
                .map((slot) => (
                  <button
                    key={slot.id}
                    onClick={() => handleBookAppointment(bookingDoctor, slot)}
                    className="w-full p-3 text-left border border-gray-200 rounded-lg hover:bg-green-50 hover:border-green-300 transition-colors"
                  >
                    <div className="font-medium">
                      {format(new Date(slot.date), 'EEEE, MMM dd, yyyy')}
                    </div>
                    <div className="text-sm text-gray-600">
                      {slot.startTime} - {slot.endTime}
                    </div>
                  </button>
                ))}
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setBookingDoctor(null)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
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