import { User, Doctor, Patient, Admin, Appointment, TimeSlot, RegisterData } from '../types';

// Mock data
const mockUsers: User[] = [
  {
    id: '1',
    email: 'patient@demo.com',
    name: 'John Patient',
    role: 'patient',
    phone: '+1-555-0123',
    isActive: true,
    createdAt: '2024-01-15T10:00:00Z',
    avatar: 'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop'
  },
  {
    id: '2',
    email: 'doctor@demo.com',
    name: 'Dr. Sarah Wilson',
    role: 'doctor',
    phone: '+1-555-0124',
    isActive: true,
    createdAt: '2024-01-10T10:00:00Z',
    avatar: 'https://images.pexels.com/photos/5214707/pexels-photo-5214707.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop'
  } as Doctor,
  {
    id: '3',
    email: 'admin@demo.com',
    name: 'Admin User',
    role: 'admin',
    isActive: true,
    createdAt: '2024-01-01T10:00:00Z',
    avatar: 'https://images.pexels.com/photos/2182970/pexels-photo-2182970.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop'
  } as Admin,
  {
    id: '4',
    email: 'dr.brown@demo.com',
    name: 'Dr. Michael Brown',
    role: 'doctor',
    phone: '+1-555-0125',
    isActive: true,
    createdAt: '2024-01-12T10:00:00Z',
    avatar: 'https://images.pexels.com/photos/5327580/pexels-photo-5327580.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop'
  } as Doctor,
  {
    id: '5',
    email: 'patient2@demo.com',
    name: 'Emily Johnson',
    role: 'patient',
    phone: '+1-555-0126',
    isActive: true,
    createdAt: '2024-01-20T10:00:00Z',
    avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop'
  }
];

const mockDoctors: Doctor[] = [
  {
    ...mockUsers[1],
    specialty: 'Cognitive Behavioral Therapy',
    bio: 'Experienced therapist specializing in anxiety and depression treatment with over 8 years of practice.',
    experience: 8,
    rating: 4.9,
    consultationFee: 120,
    availability: [
      { id: '1', date: '2024-12-20', startTime: '09:00', endTime: '10:00', isAvailable: true },
      { id: '2', date: '2024-12-20', startTime: '10:00', endTime: '11:00', isAvailable: false },
      { id: '3', date: '2024-12-21', startTime: '14:00', endTime: '15:00', isAvailable: true },
    ]
  } as Doctor,
  {
    ...mockUsers[3],
    specialty: 'Family Therapy',
    bio: 'Specializing in family dynamics and relationship counseling with a focus on communication and conflict resolution.',
    experience: 12,
    rating: 4.7,
    consultationFee: 150,
    availability: [
      { id: '4', date: '2024-12-20', startTime: '11:00', endTime: '12:00', isAvailable: true },
      { id: '5', date: '2024-12-21', startTime: '09:00', endTime: '10:00', isAvailable: true },
      { id: '6', date: '2024-12-22', startTime: '15:00', endTime: '16:00', isAvailable: true },
    ]
  } as Doctor
];

const mockAppointments: Appointment[] = [
  {
    id: '1',
    patientId: '1',
    doctorId: '2',
    date: '2024-12-20',
    startTime: '10:00',
    endTime: '11:00',
    status: 'pending',
    createdAt: '2024-12-18T10:00:00Z',
    notes: 'First session for anxiety management'
  },
  {
    id: '2',
    patientId: '5',
    doctorId: '4',
    date: '2024-12-21',
    startTime: '09:00',
    endTime: '10:00',
    status: 'confirmed',
    createdAt: '2024-12-17T14:00:00Z',
    notes: 'Follow-up family counseling session'
  }
];

class MockApiService {
  private delay(ms: number = 500) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async login(email: string, password: string): Promise<User | null> {
    await this.delay();
    const user = mockUsers.find(u => u.email === email);
    return user || null;
  }

  async register(userData: RegisterData): Promise<User> {
    await this.delay();
    const newUser: User = {
      id: Date.now().toString(),
      email: userData.email,
      name: userData.name,
      role: userData.role,
      phone: userData.phone,
      isActive: true,
      createdAt: new Date().toISOString()
    };
    mockUsers.push(newUser);
    return newUser;
  }

  async getDoctors(): Promise<Doctor[]> {
    await this.delay();
    return mockDoctors;
  }

  async getDoctorById(id: string): Promise<Doctor | null> {
    await this.delay();
    return mockDoctors.find(d => d.id === id) || null;
  }

  async getAppointments(): Promise<Appointment[]> {
    await this.delay();
    return mockAppointments.map(apt => ({
      ...apt,
      patient: mockUsers.find(u => u.id === apt.patientId) as Patient,
      doctor: mockDoctors.find(d => d.id === apt.doctorId)
    }));
  }

  async getAppointmentsByUserId(userId: string): Promise<Appointment[]> {
    await this.delay();
    const appointments = mockAppointments.filter(
      apt => apt.patientId === userId || apt.doctorId === userId
    );
    return appointments.map(apt => ({
      ...apt,
      patient: mockUsers.find(u => u.id === apt.patientId) as Patient,
      doctor: mockDoctors.find(d => d.id === apt.doctorId)
    }));
  }

  async bookAppointment(appointment: Omit<Appointment, 'id' | 'createdAt' | 'status'>): Promise<Appointment> {
    await this.delay();
    const newAppointment: Appointment = {
      ...appointment,
      id: Date.now().toString(),
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    mockAppointments.push(newAppointment);
    return newAppointment;
  }

  async updateAppointmentStatus(appointmentId: string, status: Appointment['status']): Promise<boolean> {
    await this.delay();
    const appointmentIndex = mockAppointments.findIndex(apt => apt.id === appointmentId);
    if (appointmentIndex !== -1) {
      mockAppointments[appointmentIndex].status = status;
      return true;
    }
    return false;
  }

  async getAllUsers(): Promise<User[]> {
    await this.delay();
    return mockUsers;
  }

  async toggleUserStatus(userId: string): Promise<boolean> {
    await this.delay();
    const userIndex = mockUsers.findIndex(u => u.id === userId);
    if (userIndex !== -1) {
      mockUsers[userIndex].isActive = !mockUsers[userIndex].isActive;
      return true;
    }
    return false;
  }
}

export const mockApi = new MockApiService();