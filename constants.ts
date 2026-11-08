
import { supabase } from './supabaseClient';
import { Tenant, TenantSettings, Professional, Service, Appointment, RevenueEntry } from './types';

export const TENANT_ID = 1;

// --- INITIAL STATE PLACEHOLDERS (For UI initialization before fetch) ---

export const DEFAULT_TENANT: Tenant = {
  id: 1,
  name: 'Carregando...',
  slug: 'loading',
  status: 'ativo',
  created_at: new Date().toISOString(),
  logo_url: '',
  header_bg_url: ''
};

export const DEFAULT_SETTINGS: TenantSettings = {
  id: 1,
  tenant_id: 1,
  work_start: '09:00',
  work_end: '20:00',
  slot_step_min: 30,
  buffer_min: 15,
  timezone: 'America/Sao_Paulo',
  location_address: '',
  location_city: '',
  location_state: '',
  social_instagram: '',
  social_facebook: '',
  whatsapp_number: '',
  pix_copy_paste: '',
  pix_qr_url: ''
};

// --- API FUNCTIONS ---

export const getTenant = async (): Promise<Tenant> => {
  // Alterado de .single() para .maybeSingle() para evitar erro 406/JSON se vazio
  const { data, error } = await supabase
    .from('tenants')
    .select('*')
    .eq('id', TENANT_ID)
    .maybeSingle();
  
  if (error) {
    console.warn('Warning fetching tenant (using default):', error.message);
    return DEFAULT_TENANT;
  }
  
  return data || DEFAULT_TENANT;
};

export const updateTenant = async (updates: Partial<Tenant>) => {
  const { error } = await supabase.from('tenants').update(updates).eq('id', TENANT_ID);
  if (error) console.warn('Error updating tenant:', error.message);
  return { error };
};

export const getSettings = async (): Promise<TenantSettings> => {
  // Alterado de .single() para .maybeSingle()
  const { data, error } = await supabase
    .from('tenant_settings')
    .select('*')
    .eq('tenant_id', TENANT_ID)
    .maybeSingle();

  if (error || !data) {
    console.warn('Settings not found or error, returning defaults:', error?.message);
    return DEFAULT_SETTINGS;
  }
  return data;
};

export const updateSettings = async (updates: Partial<TenantSettings>) => {
  // Check if settings exist first using maybeSingle
  const { data } = await supabase
    .from('tenant_settings')
    .select('id')
    .eq('tenant_id', TENANT_ID)
    .maybeSingle();
  
  if (data) {
    const { error } = await supabase.from('tenant_settings').update(updates).eq('tenant_id', TENANT_ID);
    return { error };
  } else {
    const { error } = await supabase.from('tenant_settings').insert([{ ...updates, tenant_id: TENANT_ID }]);
    return { error };
  }
};

export const getServices = async (): Promise<Service[]> => {
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('tenant_id', TENANT_ID)
    .order('name');
  
  if (error) {
    console.warn('Warning fetching services:', error.message);
    return [];
  }
  return data || [];
};

export const createService = async (service: Partial<Service>) => {
  const { error } = await supabase.from('services').insert([{ ...service, tenant_id: TENANT_ID }]);
  return { error };
};

export const updateService = async (id: number, updates: Partial<Service>) => {
  const { error } = await supabase.from('services').update(updates).eq('id', id);
  return { error };
};

export const deleteService = async (id: number) => {
  const { error } = await supabase.from('services').delete().eq('id', id);
  return { error };
};

export const getProfessionals = async (): Promise<Professional[]> => {
  const { data, error } = await supabase
    .from('professionals')
    .select('*')
    .eq('tenant_id', TENANT_ID)
    .order('name');

  if (error) {
    console.warn('Warning fetching professionals:', error.message);
    return [];
  }
  return data || [];
};

export const createProfessional = async (pro: Partial<Professional>) => {
  const { error } = await supabase.from('professionals').insert([{ ...pro, tenant_id: TENANT_ID }]);
  return { error };
};

export const updateProfessional = async (id: number, updates: Partial<Professional>) => {
  const { error } = await supabase.from('professionals').update(updates).eq('id', id);
  return { error };
};

export const deleteProfessional = async (id: number) => {
  const { error } = await supabase.from('professionals').delete().eq('id', id);
  return { error };
};

export const getAppointments = async (): Promise<Appointment[]> => {
  const { data, error } = await supabase
    .from('appointments')
    .select('*')
    .eq('tenant_id', TENANT_ID)
    .order('start_time', { ascending: false });

  if (error) {
    console.warn('Warning fetching appointments:', error.message);
    return [];
  }
  return data || [];
};

export const createAppointment = async (appt: Partial<Appointment>) => {
  try {
    const response = await fetch('/api/criar-agendamento', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ...appt, tenant_id: TENANT_ID }),
    });
    
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const result = await response.json();
      if (response.ok) {
        return { error: null, data: result.data };
      }
      console.warn('API /api/criar-agendamento error, falling back to direct Supabase insert:', result);
    }
  } catch (err: any) {
    console.warn('Could not reach /api/criar-agendamento, falling back to direct Supabase insert:', err);
  }

  // Fallback to direct Supabase insert
  try {
    const { data, error } = await supabase
      .from('appointments')
      .insert([{ ...appt, tenant_id: TENANT_ID }])
      .select()
      .single();

    if (error) {
      console.error('Erro direto Supabase:', error);
      return { error: new Error(error.message || 'Erro ao criar agendamento') };
    }

    return { error: null, data };
  } catch (directErr: any) {
    console.error('Erro ao salvar agendamento:', directErr);
    return { error: directErr };
  }
};

export const updateAppointment = async (id: number, updates: Partial<Appointment>) => {
  const { error } = await supabase.from('appointments').update(updates).eq('id', id);
  return { error };
};

export const deleteAppointment = async (id: number) => {
  const { error } = await supabase.from('appointments').delete().eq('id', id);
  return { error };
};

export const createMonthlyPackageAppointments = async (packageData: {
  user_name: string;
  user_phone: string;
  user_email?: string;
  service_id: number;
  service_name: string;
  professional_id: number;
  professional_name: string;
  appointments: { start_time: string; end_time: string }[];
}) => {
  try {
    const records = packageData.appointments.map(appt => ({
      tenant_id: TENANT_ID,
      user_name: packageData.user_name,
      user_phone: packageData.user_phone,
      user_email: packageData.user_email || null,
      service_id: packageData.service_id,
      professional_id: packageData.professional_id,
      start_time: appt.start_time,
      end_time: appt.end_time,
      status: 'pendente'
    }));

    const { data, error } = await supabase
      .from('appointments')
      .insert(records)
      .select();

    if (error) {
      console.error('Erro ao criar pacote mensal:', error);
      return { error };
    }

    return { error: null, data };
  } catch (err: any) {
    console.error('Erro ao criar pacote mensal:', err);
    return { error: err };
  }
};

// Revenue (Handles tables with or without tenant_id column, plus offline/RLS fallback)
export const getRevenue = async (): Promise<RevenueEntry[]> => {
  try {
    const localStr = typeof window !== 'undefined' ? localStorage.getItem('jb_revenue_entries') : null;
    const localEntries: RevenueEntry[] = localStr ? JSON.parse(localStr) : [];

    // Query revenue without tenant_id filter if the column is not in the schema cache
    const { data, error } = await supabase
      .from('revenue')
      .select('*')
      .order('date', { ascending: false });
      
    if (error) {
      console.warn('Revenue fetch from Supabase warning (using local fallback if available):', error.message);
      return localEntries;
    }

    if (data) {
      const combined = [...data];
      localEntries.forEach(le => {
        if (!combined.some(c => c.id === le.id)) {
          combined.push(le);
        }
      });
      return combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }

    return localEntries;
  } catch (err: any) {
    console.warn('Error fetching revenue:', err?.message || err);
    try {
      const localStr = typeof window !== 'undefined' ? localStorage.getItem('jb_revenue_entries') : null;
      return localStr ? JSON.parse(localStr) : [];
    } catch {
      return [];
    }
  }
};

export const createRevenue = async (entry: Partial<RevenueEntry>) => {
  // Exclude tenant_id since current database schema of 'revenue' does not have tenant_id column
  const { tenant_id, ...entryWithoutTenant } = entry as any;

  // 1. Attempt insert without tenant_id
  let { data, error } = await supabase
    .from('revenue')
    .insert([entryWithoutTenant])
    .select();

  // 2. If the database schema actually requires tenant_id (if updated in future)
  if (error && (error.code === '23502' || error.message?.includes('tenant_id'))) {
    const retry = await supabase
      .from('revenue')
      .insert([{ ...entryWithoutTenant, tenant_id: TENANT_ID }])
      .select();
    if (!retry.error) {
      error = null;
      data = retry.data;
    }
  }

  // If Supabase insert succeeded
  if (!error && data && data[0]) {
    const createdRow = data[0];
    try {
      const localStr = localStorage.getItem('jb_revenue_entries');
      const list: RevenueEntry[] = localStr ? JSON.parse(localStr) : [];
      list.unshift(createdRow);
      localStorage.setItem('jb_revenue_entries', JSON.stringify(list));
    } catch {}
    return { error: null, data: createdRow };
  }

  // 3. Fallback gracefully if Supabase returns RLS or network error
  if (error) {
    console.warn('Supabase revenue insert failed, saving to local fallback storage:', error.message);
    const fallbackEntry: RevenueEntry = {
      id: Date.now(),
      date: entry.date || new Date().toISOString(),
      description: entry.description || '',
      category: entry.category || 'servico',
      amount: entry.amount || 0,
      payment_method: entry.payment_method || 'dinheiro'
    };
    try {
      const localStr = localStorage.getItem('jb_revenue_entries');
      const list: RevenueEntry[] = localStr ? JSON.parse(localStr) : [];
      list.unshift(fallbackEntry);
      localStorage.setItem('jb_revenue_entries', JSON.stringify(list));
      return { error: null, data: fallbackEntry };
    } catch (localErr: any) {
      return { error };
    }
  }

  return { error: null };
};

export const deleteRevenue = async (id: number) => {
  try {
    const localStr = localStorage.getItem('jb_revenue_entries');
    if (localStr) {
      const list: RevenueEntry[] = JSON.parse(localStr);
      const filtered = list.filter(e => e.id !== id);
      localStorage.setItem('jb_revenue_entries', JSON.stringify(filtered));
    }
  } catch {}

  const { error } = await supabase.from('revenue').delete().eq('id', id);
  if (error) {
    console.warn('Could not delete from Supabase revenue (might be local-only):', error.message);
  }
  return { error: null };
};

// Backwards compatibility exports (empty arrays/objects to prevent immediate crashes before refactor)
export const CURRENT_TENANT = DEFAULT_TENANT; 
export const SETTINGS = DEFAULT_SETTINGS;
export const SERVICES: Service[] = [];
export const PROFESSIONALS: Professional[] = [];
export const MOCK_APPOINTMENTS: Appointment[] = [];
export const MOCK_REVENUE: RevenueEntry[] = [];
