import {
  Role,
  AppointmentStatus,
  PaymentMethod,
  PaymentStatus,
  DocumentType,
  BonusType,
} from './enums';

export interface User {
  id: string;
  phone: string;
  name: string;
  role: Role;
  isActive: boolean;
  isAnonymized: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Staff {
  id: string;
  userId: string;
  user?: User;
  specialty: string;
  bio: string | null;
  photoPath: string | null;
  salary: number;
  workSchedule: WorkSchedule | null;
  isActive: boolean;
  telegramChatId: string | null;
}

export interface WorkSchedule {
  mon: DaySchedule | null;
  tue: DaySchedule | null;
  wed: DaySchedule | null;
  thu: DaySchedule | null;
  fri: DaySchedule | null;
  sat: DaySchedule | null;
  sun: DaySchedule | null;
}

export interface DaySchedule {
  start: string; // "09:00"
  end: string;   // "18:00"
}

export interface Client {
  id: string;
  userId: string;
  user?: User;
  birthDate: string | null;
  address: string | null;
  bonusBalance: number;
  notes: string | null;
  allergyNotes: string | null;
}

export interface Appointment {
  id: string;
  clientId: string;
  client?: Client;
  staffId: string;
  staff?: Staff;
  serviceId: string;
  service?: Service;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  notes: string | null;
  reminderSent: boolean;
  cancelReason: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
  payment?: Payment | null;
}

export interface Service {
  id: string;
  name: string;
  description: string | null;
  price: number;
  duration: number;
  category: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface MedRecord {
  id: string;
  clientId: string;
  client?: Client;
  staffId: string;
  staff?: Staff;
  date: string;
  diagnosis: string;
  treatment: string;
  teethMap: Record<string, string> | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  documents?: Document[];
}

export interface Document {
  id: string;
  clientId: string | null;
  staffId: string | null;
  medRecordId: string | null;
  type: DocumentType;
  originalName: string;
  storedName: string;
  mimeType: string;
  size: number;
  checksum: string;
  uploadedAt: string;
}

export interface Payment {
  id: string;
  appointmentId: string;
  appointment?: Appointment;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  bonusUsed: number;
  bonusEarned: number;
  processedBy: string;
  receiptNumber: string;
  createdAt: string;
}

export interface BonusTransaction {
  id: string;
  clientId: string;
  client?: Client;
  amount: number;
  type: BonusType;
  reason: string;
  createdAt: string;
}

export interface ClinicSettings {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  bonusPercent: number;
  ownerTelegramId: string | null;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  user?: User;
  action: string;
  entity: string;
  entityId: string | null;
  oldValue: unknown;
  newValue: unknown;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

export interface TimeSlot {
  start: string; // "09:00"
  end: string;   // "10:00"
}

export interface AuthTokens {
  accessToken: string;
  user: Pick<User, 'id' | 'name' | 'role' | 'phone'>;
}

export interface JwtPayload {
  sub: string;
  role: Role;
  jti: string;
  staffId?: string;
}

export interface ApiResponse<T> {
  data: T;
  meta?: {
    timestamp: string;
    total?: number;
    page?: number;
    limit?: number;
  };
}

export interface ApiError {
  statusCode: number;
  error: string;
  message: string;
  timestamp: string;
  path: string;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
}

export interface AnalyticsOverview {
  revenue: number;
  appointmentsTotal: number;
  appointmentsCompleted: number;
  appointmentsCancelled: number;
  newClients: number;
  averageCheck: number;
}

export interface RevenueDataPoint {
  date: string;
  revenue: number;
}

export interface TopServiceData {
  service: string;
  count: number;
  revenue: number;
}
