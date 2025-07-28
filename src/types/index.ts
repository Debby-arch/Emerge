export interface User {
  id: string;
  email: string;
  name: string;
  role: 'patient' | 'doctor' | 'admin';
  phone?: string;
  avatar?: string;
  isActive: boolean;
  createdAt: string;
}

export interface Doctor extends User {
  role: 'doctor';
  specialty: string;
  bio: string;
  experience: number;
  rating: number;
  availability: TimeSlot[];
  consultationFee: number;
}

export interface Patient extends User {
  role: 'patient';
  dateOfBirth?: string;
  medicalHistory?: string;
}

export interface Admin extends User {
  role: 'admin';
}

export interface TimeSlot {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  date: string;
  startTime: string;
  endTime: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  notes?: string;
  createdAt: string;
  patient?: Patient;
  doctor?: Doctor;
}

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  register: (userData: RegisterData) => Promise<boolean>;
  isLoading: boolean;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  role: 'patient' | 'doctor';
  phone?: string;
  specialty?: string;
  bio?: string;
  experience?: number;
  consultationFee?: number;
}