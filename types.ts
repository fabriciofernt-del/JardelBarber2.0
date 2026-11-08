
export type TenantStatus = 'ativo' | 'inativo' | 'suspenso';
export type AppointmentStatus = 'confirmado' | 'cancelado' | 'pendente' | 'concluido';

export interface Tenant {
  id: number;
  name: string;
  slug: string;
  status: TenantStatus;
  created_at: string;
  logo_url?: string;
  header_bg_url?: string;
}

export interface TenantSettings {
  id: number;
  tenant_id: number;
  work_start: string; // "HH:MM"
  work_end: string;
  slot_step_min: number;
  buffer_min: number;
  timezone: string;
  // Social and Location
  location_address: string;
  location_city: string;
  location_state: string;
  social_instagram?: string;
  social_facebook?: string;
  whatsapp_number?: string;
  // Payment
  pix_copy_paste?: string;
  pix_qr_url?: string;
}

export interface Professional {
  id: number;
  tenant_id: number;
  name: string;
  specialty: string;
  active: boolean;
  avatar_url?: string;
}

export interface Service {
  id: number;
  tenant_id: number;
  name: string;
  duration_min: number;
  price: number;
  active: boolean;
  image_url?: string;
}

export interface RevenueEntry {
  id: number;
  tenant_id?: number;
  date: string;
  description: string;
  category: 'servico' | 'produto' | 'outro';
  amount: number;
  payment_method: 'dinheiro' | 'pix' | 'cartao';
}

export interface Appointment {
  id: number;
  tenant_id: number;
  user_name: string;
  user_email?: string;
  user_phone?: string;
  service_id: number;
  professional_id: number;
  start_time: string;
  end_time: string;
  status: AppointmentStatus;
  created_at: string;
  receipt_url?: string;
}

export interface Notification {
  id: number;
  appointment_id: number;
  channel: 'email' | 'whatsapp' | 'sms';
  status: 'pendente' | 'enviado' | 'falha';
  sent_at?: string;
}

// UI State Helpers
export interface DashboardStats {
  totalAppointments: number;
  revenue: number;
  activeProfessionals: number;
  growth: number;
}
