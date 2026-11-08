
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  ChevronRight, 
  ChevronLeft,
  CheckCircle2, 
  Phone,
  Scissors,
  Smartphone,
  LayoutDashboard,
  Copy,
  CalendarDays,
  Lock,
  Search,
  XCircle,
  User,
  AlertCircle,
  Sparkles,
  Crown,
  MessageCircle,
  Check,
  Mail
} from 'lucide-react';
import { 
  getTenant, 
  getSettings, 
  getServices, 
  getProfessionals, 
  createAppointment,
  createMonthlyPackageAppointments,
  getAppointments,
  updateAppointment,
  DEFAULT_TENANT,
  DEFAULT_SETTINGS
} from '../constants';
import { useNavigate, useParams } from 'react-router-dom';
import { Tenant, TenantSettings, Service, Professional, Appointment } from '../types';
import { supabase } from '../supabaseClient';
import { ImageFallback } from '../components/ImageFallback';

type BookingStep = 'service' | 'professional' | 'date' | 'details' | 'payment' | 'success' | 'my-appointments';

export const PublicBooking: React.FC = () => {
  const navigate = useNavigate();
  const { slug } = useParams();
  
  const [tenant, setTenant] = useState<Tenant>(DEFAULT_TENANT);
  const [tenantSettings, setTenantSettings] = useState<TenantSettings>(DEFAULT_SETTINGS);
  
  const [availableServices, setAvailableServices] = useState<Service[]>([]);
  const [availableProfessionals, setAvailableProfessionals] = useState<Professional[]>([]);
  const [dayAppointments, setDayAppointments] = useState<Appointment[]>([]);

  const [step, setStep] = useState<BookingStep>('service');
  const [selectedServiceId, setSelectedServiceId] = useState<number | null>(null);
  const [selectedProfessionalId, setSelectedProfessionalId] = useState<number | null>(null);
  const getNextAvailableDate = () => {
    const d = new Date();
    while (d.getDay() === 0 || d.getDay() === 1) {
      d.setDate(d.getDate() + 1);
    }
    return d.toISOString().split('T')[0];
  };

  const getNextAvailableDateFrom = (baseDateStr: string, addDays: number = 7) => {
    try {
      const [y, m, d] = baseDateStr.split('-').map(Number);
      const dt = new Date(y, m - 1, d);
      dt.setDate(dt.getDate() + addDays);
      while (dt.getDay() === 0 || dt.getDay() === 1) {
        dt.setDate(dt.getDate() + 1);
      }
      return dt.toISOString().split('T')[0];
    } catch {
      return getNextAvailableDate();
    }
  };

  const [selectedDate, setSelectedDate] = useState<string>(getNextAvailableDate());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  
  // Controle de 4 horários para Pacotes Mensais
  const [packageSlots, setPackageSlots] = useState<Array<{ date: string; time: string }>>([
    { date: getNextAvailableDate(), time: '' },
    { date: '', time: '' },
    { date: '', time: '' },
    { date: '', time: '' },
  ]);
  const [activeSlotIndex, setActiveSlotIndex] = useState<number>(0);

  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  
  const [searchPhone, setSearchPhone] = useState('');
  const [searchResults, setSearchResults] = useState<Appointment[]>([]);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const savedPhone = localStorage.getItem('jb_client_phone');
    if (savedPhone) {
      setClientPhone(savedPhone);
      setSearchPhone(savedPhone);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    // Safety fallback: guaranteed to stop loading spinner within 2 seconds
    const safetyTimer = setTimeout(() => {
      if (mounted) {
        setLoading(false);
      }
    }, 2000);

    const fetchData = async () => {
      try {
        const [t, s, servs, pros] = await Promise.all([
          getTenant().catch(() => DEFAULT_TENANT),
          getSettings().catch(() => DEFAULT_SETTINGS),
          getServices().catch(() => []),
          getProfessionals().catch(() => [])
        ]);
        
        if (mounted) {
          if (t) setTenant(t);
          if (s) setTenantSettings(s);
          if (servs) setAvailableServices(servs);
          if (pros) setAvailableProfessionals(pros);
        }

        try {
          const sessionPromise = (supabase.auth as any).getSession();
          const timeoutAuth = new Promise(r => setTimeout(() => r(null), 1000));
          const res: any = await Promise.race([sessionPromise, timeoutAuth]);
          if (mounted && res?.data) {
            setIsAdmin(!!res.data.session || !!localStorage.getItem('jb_admin_session'));
          } else if (mounted) {
            setIsAdmin(!!localStorage.getItem('jb_admin_session'));
          }
        } catch (e) {
          if (mounted) setIsAdmin(!!localStorage.getItem('jb_admin_session'));
        }
      } catch (err) {
        console.error('fetchData error:', err);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      mounted = false;
      clearTimeout(safetyTimer);
    };
  }, []);

  useEffect(() => {
    const loadDayAppointments = async () => {
      if (!selectedDate || !selectedProfessionalId) {
        setDayAppointments([]);
        return;
      }

      const all = await getAppointments();
      const filtered = all.filter(appt => {
        const [datePart] = appt.start_time.split('T');
        const sameDate = datePart === selectedDate;
        const samePro = appt.professional_id === selectedProfessionalId;
        const activeStatus = appt.status === 'pendente' || appt.status === 'confirmado';
        return sameDate && samePro && activeStatus;
      });

      setDayAppointments(filtered);
    };

    loadDayAppointments();
  }, [selectedDate, selectedProfessionalId]);

  const selectedService = useMemo(() => availableServices.find(s => s.id === selectedServiceId), [availableServices, selectedServiceId]);

  const isMonthlyPackage = (name?: string) => {
    if (!name) return false;
    const n = name.toLowerCase();
    return n.includes('4 cortes') || n.includes('pacote mensal');
  };

  const package4Cortes = useMemo(() => {
    return availableServices.find(s => s.name.toLowerCase().includes('4 cortes') && !s.name.toLowerCase().includes('barba')) || {
      id: 8,
      tenant_id: 1,
      name: 'Pacote Mensal - 4 Cortes',
      duration_min: 40,
      price: 100.00,
      active: true,
      image_url: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&q=80&w=600'
    };
  }, [availableServices]);

  const package4CortesBarba = useMemo(() => {
    return availableServices.find(s => s.name.toLowerCase().includes('4 cortes') && s.name.toLowerCase().includes('barba')) || {
      id: 9,
      tenant_id: 1,
      name: 'Pacote Mensal - 4 Cortes + Barba',
      duration_min: 55,
      price: 150.00,
      active: true,
      image_url: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&q=80&w=600'
    };
  }, [availableServices]);

  const initializePackageSlots = () => {
    const d1 = getNextAvailableDate();
    const d2 = getNextAvailableDateFrom(d1, 7);
    const d3 = getNextAvailableDateFrom(d2, 7);
    const d4 = getNextAvailableDateFrom(d3, 7);
    setPackageSlots([
      { date: d1, time: '' },
      { date: d2, time: '' },
      { date: d3, time: '' },
      { date: d4, time: '' }
    ]);
    setActiveSlotIndex(0);
    setSelectedDate(d1);
    setSelectedTime(null);
  };

  const regularServices = useMemo(() => {
    const list = availableServices.filter(s => !isMonthlyPackage(s.name));
    return list.length > 0 ? list : availableServices;
  }, [availableServices]);

  const handleOpenWhatsAppPackage = (packageName: string, price: number) => {
    const rawPhone = tenantSettings.whatsapp_number ? tenantSettings.whatsapp_number.replace(/\D/g, '') : '';
    const message = `Olá Jardel! Gostaria de assinar o ${packageName} (R$ ${price.toFixed(2)}) da barbearia.`;
    const url = rawPhone 
      ? `https://wa.me/${rawPhone}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const availableSlots = useMemo(() => {
    const slots: string[] = [];
    if (!tenantSettings.work_start || !selectedService || !selectedProfessionalId) return slots;

    // Check if selected date is Sunday (0) or Monday (1)
    const selectedDateObj = new Date(selectedDate + 'T12:00:00');
    const dayOfWeek = selectedDateObj.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 1) {
      return slots; // Return empty slots for closed days
    }

    const [startHour, startMin] = tenantSettings.work_start.split(':').map(Number);
    const [endHour, endMin] = tenantSettings.work_end.split(':').map(Number);
    const stepMin = tenantSettings.slot_step_min;

    const now = new Date();
    const isToday = selectedDate === now.toISOString().split('T')[0];

    // Converter agendamentos do dia em intervalos de minutos desde 00:00
    // Ex.: 13:00 => 13 * 60 + 0 = 780
    const busyIntervals = dayAppointments
      .map(appt => {
        // start_time e end_time no formato "YYYY-MM-DDTHH:MM:SS"
        const startTimePart = appt.start_time.split('T')[1]?.slice(0, 5); // "HH:MM"
        const endTimePart = appt.end_time.split('T')[1]?.slice(0, 5);

        if (!startTimePart || !endTimePart) return null;

        const [sh, sm] = startTimePart.split(':').map(Number);
        const [eh, em] = endTimePart.split(':').map(Number);

        const start = sh * 60 + sm;
        const end = eh * 60 + em;

        return { start, end };
      })
      .filter(Boolean) as { start: number; end: number }[];

    let currentMins = startHour * 60 + startMin;
    const endMinsLimit = endHour * 60 + endMin;

    while (currentMins < endMinsLimit) {
      const slotStart = currentMins;
      const slotEnd = currentMins + selectedService.duration_min;

      // Verifica conflito com qualquer agendamento existente
      const isBusy = busyIntervals.some(interval => {
        // conflito se [slotStart, slotEnd) intersectar [interval.start, interval.end)
        return slotStart < interval.end && slotEnd > interval.start;
      });

      // Verifica se o horário já passou, quando o dia é hoje
      let isPast = false;
      if (isToday) {
        const nowMins = now.getHours() * 60 + now.getMinutes();
        if (slotStart <= nowMins) isPast = true;
      }

      if (!isBusy && !isPast) {
        const h = Math.floor(currentMins / 60)
          .toString()
          .padStart(2, '0');
        const m = (currentMins % 60).toString().padStart(2, '0');
        slots.push(`${h}:${m}`);
      }

      currentMins += stepMin;
    }

    return slots;
  }, [selectedDate, tenantSettings, selectedService, selectedProfessionalId, dayAppointments]);

  const handleCreateAppointment = async () => {
    if (!selectedService || !selectedProfessionalId) return;

    const professional = availableProfessionals.find(p => p.id === selectedProfessionalId);

    // Fluxo para Pacote Mensal (4 Atendimentos)
    if (isMonthlyPackage(selectedService.name)) {
      const filledSlots = packageSlots.filter(s => s.date && s.time);
      if (filledSlots.length < 4) {
        alert('Por favor, selecione os 4 horários do pacote mensal antes de confirmar.');
        setStep('date');
        return;
      }

      setSubmitting(true);
      try {
        const appointmentList = filledSlots.map(s => {
          const [h, m] = s.time.split(':').map(Number);
          const startLocal = new Date(s.date);
          startLocal.setHours(h, m, 0, 0);
          const endLocal = new Date(startLocal.getTime() + selectedService.duration_min * 60000);

          const start_time = `${s.date}T${s.time}:00`;
          const end_time = `${s.date}T${String(endLocal.getHours()).padStart(2, '0')}:${String(
            endLocal.getMinutes()
          ).padStart(2, '0')}:00`;

          return { start_time, end_time };
        });

        const { error } = await createMonthlyPackageAppointments({
          user_name: clientName,
          user_phone: clientPhone,
          user_email: clientEmail || undefined,
          service_id: selectedService.id,
          service_name: selectedService.name,
          professional_id: selectedProfessionalId,
          professional_name: professional?.name || 'Jardel',
          appointments: appointmentList
        });

        if (error) {
          console.error(error);
          alert('Erro ao agendar pacote mensal: ' + (error.message || 'Tente novamente.'));
        } else {
          localStorage.setItem('jb_client_phone', clientPhone);
          setStep('success');
        }
      } catch (err: any) {
        console.error(err);
        alert('Erro inesperado ao realizar agendamento.');
      } finally {
        setSubmitting(false);
      }
      return;
    }

    // Fluxo para Serviço Avulso (1 Atendimento)
    if (!selectedTime) return;

    setSubmitting(true);
    try {
      const [h, m] = selectedTime.split(':').map(Number);
      const startLocal = new Date(selectedDate);
      startLocal.setHours(h, m, 0, 0);
      const endLocal = new Date(startLocal.getTime() + selectedService.duration_min * 60000);

      const start_time = `${selectedDate}T${selectedTime}:00`;
      const end_time = `${selectedDate}T${String(endLocal.getHours()).padStart(2, '0')}:${String(
        endLocal.getMinutes()
      ).padStart(2, '0')}:00`;

      const appointmentData = {
        user_name: clientName,
        user_phone: clientPhone,
        user_email: clientEmail || undefined,
        service_id: selectedServiceId!,
        service_name: selectedService.name,
        professional_id: selectedProfessionalId!,
        professional_name: professional?.name || 'Jardel',
        start_time,
        end_time,
        status: 'pendente' as const,
      };

      const { error } = await createAppointment(appointmentData);
      if (error) {
        alert('Erro ao agendar. Tente novamente.');
        console.error(error);
      } else {
        localStorage.setItem('jb_client_phone', clientPhone);
        setStep('success');
      }
    } catch (error) {
      console.error(error);
      alert('Erro inesperado.');
    } finally {
      setSubmitting(false);
    }
  };

  const cleanPhoneString = (ph: string) => ph.replace(/\D/g, '');

  const handleSearchByPhone = async (phoneToSearch?: string) => {
    const query = phoneToSearch !== undefined ? phoneToSearch : searchPhone;
    const cleanedQuery = cleanPhoneString(query);

    if (!cleanedQuery || cleanedQuery.length < 8) {
      alert('Por favor, digite um número de WhatsApp válido com DDD para buscar seus agendamentos.');
      return;
    }

    setSearching(true);
    setHasSearched(true);
    try {
      const all = await getAppointments();
      const filtered = all.filter(appt => {
        if (!appt.user_phone) return false;
        const apptClean = cleanPhoneString(appt.user_phone);
        if (!apptClean) return false;

        // Exact match
        if (apptClean === cleanedQuery) return true;

        // Compare last 8 digits if both numbers are at least 8 digits long
        if (apptClean.length >= 8 && cleanedQuery.length >= 8) {
          return apptClean.slice(-8) === cleanedQuery.slice(-8);
        }

        return false;
      });

      setSearchResults(filtered);
      localStorage.setItem('jb_client_phone', query);
    } catch (err) {
      console.error('Erro ao buscar agendamentos:', err);
    } finally {
      setSearching(false);
    }
  };

  const handleConfirmAppointment = async (apptId: number) => {
    setActionLoadingId(apptId);
    try {
      const { error } = await updateAppointment(apptId, { status: 'confirmado' });
      if (error) {
        alert('Erro ao confirmar agendamento. Tente novamente.');
      } else {
        setSearchResults(prev =>
          prev.map(a => (a.id === apptId ? { ...a, status: 'confirmado' } : a))
        );
        setActionFeedback('Agendamento confirmado com sucesso! O barbeiro já pode ver no sistema.');
        setTimeout(() => setActionFeedback(null), 4000);
      }
    } catch (err) {
      console.error(err);
      alert('Erro inesperado ao confirmar.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCancelAppointment = async (apptId: number) => {
    if (!window.confirm('Tem certeza que deseja desmarcar este agendamento?')) return;

    setActionLoadingId(apptId);
    try {
      const { error } = await updateAppointment(apptId, { status: 'cancelado' });
      if (error) {
        alert('Erro ao cancelar agendamento. Tente novamente.');
      } else {
        setSearchResults(prev =>
          prev.map(a => (a.id === apptId ? { ...a, status: 'cancelado' } : a))
        );
        setActionFeedback('Agendamento desmarcado com sucesso!');
        setTimeout(() => setActionFeedback(null), 4000);
      }
    } catch (err) {
      console.error(err);
      alert('Erro inesperado ao cancelar.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const formatApptDate = (dateTimeStr: string) => {
    if (!dateTimeStr) return '';
    const [datePart, timePart] = dateTimeStr.split('T');
    if (!datePart) return dateTimeStr;
    const [year, month, day] = datePart.split('-');
    const timeFormatted = timePart ? timePart.slice(0, 5) : '';
    
    const dateObj = new Date(Number(year), Number(month) - 1, Number(day));
    const weekDay = dateObj.toLocaleDateString('pt-BR', { weekday: 'short' });
    
    return `${day}/${month}/${year} (${weekDay}) às ${timeFormatted}`;
  };

  const formatSelectedDateLong = (dateStr: string) => {
    if (!dateStr) return '';

    const [year, month, day] = dateStr.split('-'); // "YYYY-MM-DD"

    // Criar o Date usando ano, mês (0-based) e dia separadamente
    const date = new Date(Number(year), Number(month) - 1, Number(day));

    return date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col items-center pb-20 font-sans">
      
      {/* HEADER PREMIUM REFORMULADO */}
      <div className="relative w-full h-[45vh] min-h-[400px] flex flex-col items-center justify-center overflow-hidden">
         {/* Background com Overlay */}
         <div className="absolute inset-0">
           <ImageFallback src={tenant.header_bg_url || 'https://images.unsplash.com/photo-1599351431247-f10b21817021'} className="w-full h-full object-cover opacity-40 blur-sm scale-110" alt="Banner" />
           <div className="absolute inset-0 bg-gradient-to-b from-neutral-950/30 via-neutral-950/50 to-neutral-950"></div>
         </div>
         
         {/* Conteúdo Centralizado */}
         <div className="relative z-10 flex flex-col items-center animate-in zoom-in-90 duration-1000">
           {/* Imagem de Perfil com Borda Dourada */}
           <div className="group relative">
             <div className="absolute -inset-0.5 bg-gradient-to-br from-amber-300 to-amber-600 rounded-full blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
             <div className="relative w-40 h-40 md:w-48 md:h-48 rounded-full p-1.5 bg-neutral-950">
                <ImageFallback 
                  src={tenant.logo_url || 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1'} 
                  alt={tenant.name} 
                  className="w-full h-full object-cover rounded-full border-2 border-neutral-800"
                />
             </div>
           </div>

           {/* Tipografia de Impacto */}
           <div className="text-center mt-6 space-y-2">
             <h1 className="text-4xl md:text-6xl font-black text-white italic uppercase tracking-tighter drop-shadow-2xl">
               {tenant.name}
             </h1>
             <div className="flex items-center justify-center gap-4 text-amber-500/90">
               <div className="h-px w-8 md:w-16 bg-gradient-to-r from-transparent to-amber-500"></div>
               <span className="text-[10px] md:text-xs font-black uppercase tracking-[0.5em]">Elite Experience</span>
               <div className="h-px w-8 md:w-16 bg-gradient-to-l from-transparent to-amber-500"></div>
             </div>
           </div>
         </div>
      </div>

      {/* ÁREA DE CONTEÚDO */}
      <div className="w-full max-w-lg px-6 relative z-20 -mt-10">
        
        {/* TOGGLE NOVO AGENDAMENTO / MEUS AGENDAMENTOS */}
        <div className="flex bg-neutral-900/90 backdrop-blur-xl p-1.5 rounded-2xl border border-neutral-800 shadow-2xl mb-6">
          <button
            onClick={() => {
              if (step === 'my-appointments') setStep('service');
            }}
            className={`flex-1 py-3 px-3 rounded-xl text-[10px] sm:text-[11px] font-black uppercase tracking-wider italic transition-all flex items-center justify-center gap-2 ${
              step !== 'my-appointments'
                ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <CalendarDays size={14} />
            Novo Agendamento
          </button>

          <button
            onClick={() => {
              setStep('my-appointments');
              if (searchPhone) {
                handleSearchByPhone(searchPhone);
              }
            }}
            className={`flex-1 py-3 px-3 rounded-xl text-[10px] sm:text-[11px] font-black uppercase tracking-wider italic transition-all flex items-center justify-center gap-2 ${
              step === 'my-appointments'
                ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Search size={14} />
            Meus Agendamentos
          </button>
        </div>

        {step !== 'success' && step !== 'my-appointments' && (
           <div className="mb-6 flex items-center justify-between">
             {step !== 'service' && (
                <button 
                  onClick={() => setStep(step === 'professional' ? 'service' : step === 'date' ? 'professional' : step === 'details' ? 'date' : 'details')} 
                  className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-amber-500 hover:text-amber-400 transition-colors bg-neutral-900/50 px-4 py-2 rounded-full border border-neutral-800 backdrop-blur-md"
                >
                  <ChevronLeft size={14} /> Voltar
                </button>
             )}
             <span className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500 ml-auto">
               Passo {step === 'service' ? '1' : step === 'professional' ? '2' : step === 'date' ? '3' : step === 'details' ? '4' : '5'} / 5
             </span>
           </div>
        )}

        <div className="space-y-6">
            {step === 'service' && (
              <div className="space-y-6 animate-in slide-in-from-bottom-8 duration-700">
                <div className="flex items-center gap-3 mb-2">
                   <div className="bg-amber-500 p-1.5 rounded-lg shadow-lg shadow-amber-500/20 rotate-3">
                     <Scissors size={18} className="text-neutral-950" />
                   </div>
                   <div>
                     <h2 className="text-xl font-black text-white uppercase italic tracking-tighter">Escolha o seu Estilo</h2>
                     <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Planos mensais e cortes avulsos</p>
                   </div>
                </div>

                {/* DESTAQUE DE PACOTES MENSAIS (4 Cortes R$100 / 4 Cortes + Barba R$150) */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[11px] font-black uppercase tracking-[0.2em] text-amber-500 flex items-center gap-1.5">
                      <Sparkles size={14} className="text-amber-400" /> Pacotes Mensais de Cortes
                    </span>
                    <span className="text-[9px] font-black uppercase tracking-wider bg-amber-500/10 border border-amber-500/20 text-amber-400 px-2.5 py-1 rounded-full">
                      Economize até 50%
                    </span>
                  </div>

                  {/* Card Pacote 1: 4 Cortes (R$ 100) */}
                  <div className="relative overflow-hidden bg-gradient-to-br from-neutral-900/90 via-neutral-900/60 to-neutral-950/90 border border-amber-500/30 rounded-[2rem] p-5 shadow-2xl group hover:border-amber-500/60 transition-all duration-300">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none"></div>

                    <div className="relative z-10 space-y-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1">
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-[9px] font-black uppercase tracking-wider text-amber-400">
                            <Sparkles size={11} /> Mais Popular
                          </div>
                          <h3 className="text-lg font-black text-white uppercase italic tracking-tight group-hover:text-amber-400 transition-colors">
                            {package4Cortes.name}
                          </h3>
                          <p className="text-xs text-neutral-400 font-medium">
                            4 cortes no mês • <span className="text-amber-400 font-bold">R$ 25 por corte</span>
                          </p>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="flex items-baseline justify-end gap-0.5">
                            <span className="text-xs font-black text-amber-500">R$</span>
                            <span className="text-2xl md:text-3xl font-black text-white italic tracking-tighter">100</span>
                            <span className="text-[10px] font-bold text-neutral-400">/mês</span>
                          </div>
                          <span className="text-[9px] font-bold text-neutral-500 line-through">R$ 200 avulso</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-neutral-800/80 text-[11px] text-neutral-300 font-medium">
                        <div className="flex items-center gap-1.5">
                          <Check size={13} className="text-emerald-400 shrink-0" />
                          <span>4 Cortes completos no mês</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Check size={13} className="text-emerald-400 shrink-0" />
                          <span>Válido por 30 dias corridos</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Check size={13} className="text-emerald-400 shrink-0" />
                          <span>Agenda flexível semanal</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Check size={13} className="text-emerald-400 shrink-0" />
                          <span>Economia de R$ 100 no mês</span>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
                        <button
                          onClick={() => {
                            setSelectedServiceId(package4Cortes.id);
                            initializePackageSlots();
                            setStep('professional');
                          }}
                          className="w-full sm:flex-1 py-3.5 px-4 bg-amber-500 hover:bg-amber-400 text-black font-black text-xs uppercase tracking-wider italic rounded-2xl transition-all shadow-lg shadow-amber-500/20 active:scale-95 flex items-center justify-center gap-2"
                        >
                          <Scissors size={15} /> Agendar com este Pacote
                        </button>
                        <button
                          onClick={() => handleOpenWhatsAppPackage('Pacote Mensal de 4 Cortes', 100)}
                          className="w-full sm:w-auto py-3.5 px-4 bg-neutral-950/80 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white font-black text-xs uppercase tracking-wider italic rounded-2xl transition-all flex items-center justify-center gap-2 active:scale-95 shrink-0"
                          title="Tirar dúvidas ou contratar via WhatsApp"
                        >
                          <MessageCircle size={15} className="text-emerald-400" /> Assinar no WhatsApp
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Card Pacote 2: 4 Cortes + Barba (R$ 150) */}
                  <div className="relative overflow-hidden bg-gradient-to-br from-neutral-900/90 via-neutral-900/60 to-neutral-950/90 border border-amber-500/30 rounded-[2rem] p-5 shadow-2xl group hover:border-amber-500/60 transition-all duration-300">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none"></div>

                    <div className="relative z-10 space-y-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1">
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-[9px] font-black uppercase tracking-wider text-amber-400">
                            <Crown size={11} /> Combo VIP Completo
                          </div>
                          <h3 className="text-lg font-black text-white uppercase italic tracking-tight group-hover:text-amber-400 transition-colors">
                            {package4CortesBarba.name}
                          </h3>
                          <p className="text-xs text-neutral-400 font-medium">
                            4 cortes + 4 barbas • <span className="text-amber-400 font-bold">Visual impecável</span>
                          </p>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="flex items-baseline justify-end gap-0.5">
                            <span className="text-xs font-black text-amber-500">R$</span>
                            <span className="text-2xl md:text-3xl font-black text-white italic tracking-tighter">150</span>
                            <span className="text-[10px] font-bold text-neutral-400">/mês</span>
                          </div>
                          <span className="text-[9px] font-bold text-neutral-500 line-through">R$ 300 avulso</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-neutral-800/80 text-[11px] text-neutral-300 font-medium">
                        <div className="flex items-center gap-1.5">
                          <Check size={13} className="text-emerald-400 shrink-0" />
                          <span>4 Cortes + 4 Barbas completas</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Check size={13} className="text-emerald-400 shrink-0" />
                          <span>Válido por 30 dias corridos</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Check size={13} className="text-emerald-400 shrink-0" />
                          <span>Toalha quente & alinhamento fino</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Check size={13} className="text-emerald-400 shrink-0" />
                          <span>Máxima economia no combo</span>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
                        <button
                          onClick={() => {
                            setSelectedServiceId(package4CortesBarba.id);
                            initializePackageSlots();
                            setStep('professional');
                          }}
                          className="w-full sm:flex-1 py-3.5 px-4 bg-amber-500 hover:bg-amber-400 text-black font-black text-xs uppercase tracking-wider italic rounded-2xl transition-all shadow-lg shadow-amber-500/20 active:scale-95 flex items-center justify-center gap-2"
                        >
                          <Crown size={15} /> Agendar com este Pacote
                        </button>
                        <button
                          onClick={() => handleOpenWhatsAppPackage('Pacote Mensal de 4 Cortes + Barba', 150)}
                          className="w-full sm:w-auto py-3.5 px-4 bg-neutral-950/80 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white font-black text-xs uppercase tracking-wider italic rounded-2xl transition-all flex items-center justify-center gap-2 active:scale-95 shrink-0"
                          title="Tirar dúvidas ou contratar via WhatsApp"
                        >
                          <MessageCircle size={15} className="text-emerald-400" /> Assinar no WhatsApp
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* DIVISOR DE SERVIÇOS AVULSOS */}
                <div className="flex items-center gap-3 py-2">
                  <div className="h-px flex-1 bg-neutral-800/80"></div>
                  <span className="text-[10px] font-black uppercase tracking-[0.25em] text-neutral-500">
                    Ou Serviços Avulsos
                  </span>
                  <div className="h-px flex-1 bg-neutral-800/80"></div>
                </div>

                {regularServices.length === 0 && (
                   <p className="text-neutral-500 italic text-center py-4">Nenhum serviço avulso disponível no momento.</p>
                )}

                {regularServices.map(s => (
                  <button 
                    key={s.id} 
                    onClick={() => { setSelectedServiceId(s.id); setStep('professional'); }} 
                    className="w-full group relative overflow-hidden bg-neutral-900/60 backdrop-blur-xl rounded-[2rem] border border-neutral-800 hover:border-amber-500/50 transition-all duration-300 p-4 flex items-center gap-5 text-left hover:bg-neutral-800/80 active:scale-[0.98]"
                  >
                    <div className="w-24 h-24 rounded-2xl overflow-hidden shrink-0 border border-neutral-700 group-hover:border-amber-500/30 transition-colors shadow-2xl relative">
                       {s.image_url ? <ImageFallback src={s.image_url} alt={s.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" /> : <div className="w-full h-full bg-neutral-800" />}
                       <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/60 to-transparent"></div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-black uppercase italic text-white group-hover:text-amber-500 transition-colors truncate">{s.name}</h3>
                        {isMonthlyPackage(s.name) && (
                          <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-[8px] font-black uppercase tracking-wider border border-amber-500/30">
                            Plano Mensal
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="px-3 py-1 rounded-lg bg-amber-500/10 text-amber-500 text-[10px] font-black uppercase tracking-wider border border-amber-500/20">
                          R$ {s.price.toFixed(2)}
                        </span>
                        <div className="flex items-center gap-1 text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
                          <Clock size={12} /> {s.duration_min} min
                        </div>
                      </div>
                    </div>
                    
                    <div className="w-10 h-10 rounded-full bg-neutral-950 border border-neutral-800 flex items-center justify-center text-neutral-600 group-hover:text-amber-500 group-hover:border-amber-500/30 transition-all shadow-xl">
                      <ChevronRight size={18} />
                    </div>
                  </button>
                ))}
              </div>
            )}

            {step === 'professional' && (
               <div className="animate-in slide-in-from-right-8 duration-500">
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">Quem vai te atender?</h2>
                    <p className="text-[10px] text-neutral-500 font-black uppercase tracking-widest mt-2">Selecione o especialista</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {availableProfessionals.map(p => (
                      <button key={p.id} onClick={() => { setSelectedProfessionalId(p.id); setStep('date'); }} className="p-6 bg-neutral-900/60 backdrop-blur-md rounded-[2.5rem] border border-neutral-800 hover:border-amber-500 transition-all text-center group active:scale-95 hover:bg-neutral-800">
                         <div className="w-20 h-20 bg-neutral-950 border-2 border-neutral-800 text-amber-500 rounded-3xl mx-auto mb-4 flex items-center justify-center font-black group-hover:border-amber-500 transition-all shadow-2xl text-3xl italic relative overflow-hidden">
                           <span className="relative z-10">{p.name[0]}</span>
                           <div className="absolute inset-0 bg-amber-500/10 scale-0 group-hover:scale-100 transition-transform rounded-3xl"></div>
                         </div>
                         <p className="font-black uppercase text-sm tracking-tight text-white group-hover:text-amber-500 transition-colors italic">{p.name}</p>
                         <p className="text-[8px] text-neutral-500 font-black uppercase mt-2 tracking-[0.2em]">{p.specialty}</p>
                      </button>
                    ))}
                  </div>
               </div>
            )}

            {step === 'date' && (
              <div className="space-y-6 animate-in slide-in-from-right-8 duration-500">
                {isMonthlyPackage(selectedService?.name) ? (
                  /* ========================================================= */
                  /* FLUXO PACOTE MENSAL: SELEÇÃO DOS 4 HORÁRIOS               */
                  /* ========================================================= */
                  <div className="space-y-6">
                    {/* BANNER DE INFORMAÇÃO */}
                    <div className="bg-gradient-to-br from-amber-500/15 via-neutral-900 to-neutral-950 border border-amber-500/30 p-5 rounded-3xl space-y-2 shadow-2xl relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none"></div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-500 flex items-center gap-1.5">
                          <Crown size={14} className="text-amber-400" /> {selectedService?.name}
                        </span>
                        <span className="text-[9px] font-black uppercase tracking-wider bg-amber-500 text-black px-2.5 py-0.5 rounded-full">
                          4 Cortes no Mês
                        </span>
                      </div>
                      <h3 className="text-base font-black text-white italic uppercase tracking-tight">
                        Escolha os 4 Horários do seu Pacote
                      </h3>
                      <p className="text-xs text-neutral-400 leading-relaxed">
                        Selecione a data e horário para cada um dos seus 4 cortes no mês. Você pode marcar um a cada semana (+7 dias) ou nas datas que preferir.
                      </p>
                    </div>

                    {/* STEPS DOS 4 HORÁRIOS */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {packageSlots.map((slot, idx) => {
                        const isActive = activeSlotIndex === idx;
                        const isFilled = Boolean(slot.date && slot.time);

                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setActiveSlotIndex(idx);
                              if (slot.date) {
                                setSelectedDate(slot.date);
                              }
                            }}
                            className={`p-3.5 rounded-2xl border text-left transition-all relative overflow-hidden flex flex-col justify-between min-h-[95px] ${
                              isActive
                                ? 'bg-amber-500/15 border-amber-500 ring-2 ring-amber-500/40 shadow-lg shadow-amber-500/10 scale-[1.02]'
                                : isFilled
                                ? 'bg-neutral-900/90 border-emerald-500/40 hover:border-emerald-500'
                                : 'bg-neutral-900/60 border-neutral-800 hover:border-neutral-700'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-1">
                              <span className={`text-[10px] font-black uppercase tracking-wider ${isActive ? 'text-amber-400' : isFilled ? 'text-emerald-400' : 'text-neutral-500'}`}>
                                {idx + 1}º Corte
                              </span>
                              {isFilled ? (
                                <span className="w-4 h-4 rounded-full bg-emerald-500 text-black flex items-center justify-center text-[10px] font-black">
                                  ✓
                                </span>
                              ) : (
                                <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-amber-500 animate-pulse' : 'bg-neutral-700'}`}></span>
                              )}
                            </div>

                            <div className="mt-2">
                              {isFilled ? (
                                <>
                                  <p className="text-xs font-black text-white italic truncate">
                                    {formatApptDate(`${slot.date}T${slot.time}:00`).split('(')[0].trim()}
                                  </p>
                                  <p className="text-[11px] font-bold text-amber-400">
                                    às {slot.time}
                                  </p>
                                </>
                              ) : (
                                <p className="text-[10px] font-bold text-neutral-500 italic">
                                  {isActive ? '👉 Escolha abaixo' : 'Não definido'}
                                </p>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {/* SELEÇÃO DO DIA E HORÁRIO ATIVO */}
                    <div className="bg-neutral-900/90 border border-neutral-800 p-5 rounded-3xl space-y-5 shadow-xl">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-800 pb-3">
                        <div>
                          <span className="text-[9px] font-black uppercase tracking-widest text-amber-500">
                            Etapa Atual
                          </span>
                          <h4 className="text-base font-black text-white uppercase italic">
                            Definindo {activeSlotIndex + 1}º Corte
                          </h4>
                        </div>
                        
                        {activeSlotIndex > 0 && packageSlots[activeSlotIndex - 1]?.date && (
                          <button
                            type="button"
                            onClick={() => {
                              const prevDate = packageSlots[activeSlotIndex - 1].date;
                              const newDate = getNextAvailableDateFrom(prevDate, 7);
                              setSelectedDate(newDate);
                              const updated = [...packageSlots];
                              updated[activeSlotIndex].date = newDate;
                              setPackageSlots(updated);
                            }}
                            className="self-start sm:self-auto text-[10px] font-black uppercase tracking-wider bg-neutral-950 border border-neutral-700 hover:border-amber-500/50 text-neutral-300 hover:text-amber-400 px-3 py-1.5 rounded-full transition-all flex items-center gap-1.5"
                            title="Sugerir 7 dias após o corte anterior"
                          >
                            <CalendarDays size={13} className="text-amber-500" /> +7 dias do corte anterior
                          </button>
                        )}
                      </div>

                      {/* Input do Dia */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-wider text-neutral-400 px-1">
                          Data do {activeSlotIndex + 1}º Atendimento:
                        </label>
                        <div className="relative overflow-hidden rounded-2xl bg-neutral-950 border border-amber-500/30 p-2">
                          <input 
                            type="date" 
                            min={new Date().toISOString().split('T')[0]}
                            className="w-full bg-transparent p-4 rounded-xl text-white font-black text-center text-lg outline-none hover:bg-amber-500/5 transition-all cursor-pointer italic appearance-none" 
                            value={selectedDate} 
                            onChange={e => {
                              const newDate = e.target.value;
                              setSelectedDate(newDate);
                              const updated = [...packageSlots];
                              updated[activeSlotIndex].date = newDate;
                              setPackageSlots(updated);
                            }} 
                          />
                        </div>
                      </div>

                      {/* Grade de Vagas */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between px-1">
                          <span className="text-[10px] font-black text-neutral-400 uppercase tracking-wider">
                            Horários para {formatSelectedDateLong(selectedDate)}
                          </span>
                          <span className="text-[10px] font-black text-amber-500 uppercase">
                            {availableSlots.length} disponíveis
                          </span>
                        </div>

                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 max-h-56 overflow-y-auto pr-1">
                          {availableSlots.length > 0 ? (
                            availableSlots.map(t => {
                              const isSelectedForThisSlot = packageSlots[activeSlotIndex]?.time === t && packageSlots[activeSlotIndex]?.date === selectedDate;
                              const isUsedInOtherSlot = packageSlots.some((s, i) => i !== activeSlotIndex && s.date === selectedDate && s.time === t);

                              return (
                                <button 
                                  key={t}
                                  type="button"
                                  disabled={isUsedInOtherSlot}
                                  onClick={() => {
                                    const updated = [...packageSlots];
                                    updated[activeSlotIndex] = { date: selectedDate, time: t };
                                    setPackageSlots(updated);

                                    // Avança automaticamente para o próximo corte vazio
                                    const nextEmptyIdx = updated.findIndex((s, i) => i > activeSlotIndex && (!s.date || !s.time));
                                    if (nextEmptyIdx !== -1) {
                                      setActiveSlotIndex(nextEmptyIdx);
                                      if (!updated[nextEmptyIdx].date) {
                                        const nextDate = getNextAvailableDateFrom(selectedDate, 7);
                                        updated[nextEmptyIdx].date = nextDate;
                                        setPackageSlots(updated);
                                        setSelectedDate(nextDate);
                                      } else {
                                        setSelectedDate(updated[nextEmptyIdx].date);
                                      }
                                    }
                                  }} 
                                  className={`py-3.5 rounded-xl text-xs font-black transition-all active:scale-95 shadow-md flex items-center justify-center gap-1.5 ${
                                    isSelectedForThisSlot
                                      ? 'bg-amber-500 text-black border-2 border-amber-400 font-black'
                                      : isUsedInOtherSlot
                                      ? 'bg-neutral-950 text-neutral-600 border border-neutral-900 opacity-40 cursor-not-allowed'
                                      : 'bg-neutral-950 border border-neutral-800 text-neutral-200 hover:bg-amber-500/20 hover:text-amber-400 hover:border-amber-500/50'
                                  }`}
                                >
                                  {isSelectedForThisSlot && <Check size={12} />}
                                  <span>{t}</span>
                                </button>
                              );
                            })
                          ) : (
                            <div className="col-span-full py-8 text-center bg-neutral-950/40 rounded-2xl border border-dashed border-neutral-800">
                              <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest italic">
                                {(() => {
                                  const d = new Date(selectedDate + 'T12:00:00');
                                  if (d.getDay() === 0 || d.getDay() === 1) return "Fechado aos Domingos e Segundas";
                                  return "Sem horários livres nesta data. Escolha outro dia acima.";
                                })()}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* RESUMO DOS 4 HORÁRIOS ANTES DE AVANÇAR */}
                    <div className="bg-neutral-900/60 border border-neutral-800 p-4 rounded-3xl space-y-2.5">
                      <span className="text-[9px] font-black uppercase tracking-widest text-neutral-400 block px-1">
                        Resumo dos 4 Cortes do Pacote
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        {packageSlots.map((s, i) => (
                          <div key={i} className={`p-2.5 rounded-xl border flex items-center justify-between ${s.time ? 'bg-neutral-950 border-emerald-500/30 text-white' : 'bg-neutral-950/40 border-neutral-800/60 text-neutral-600'}`}>
                            <span className="font-bold text-[11px]">{i + 1}º Corte:</span>
                            {s.time ? (
                              <span className="text-amber-400 font-black">
                                {formatApptDate(`${s.date}T${s.time}:00`).split('(')[0].trim()} às {s.time}
                              </span>
                            ) : (
                              <span className="italic text-[10px]">Aguardando seleção...</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* BOTÃO PARA AVANÇAR */}
                    {(() => {
                      const filledCount = packageSlots.filter(s => s.date && s.time).length;
                      const allFilled = filledCount === 4;

                      return (
                        <button
                          type="button"
                          disabled={!allFilled}
                          onClick={() => setStep('details')}
                          className={`w-full py-5 rounded-[2.5rem] font-black uppercase italic tracking-widest text-xs transition-all shadow-xl flex items-center justify-center gap-2 ${
                            allFilled
                              ? 'bg-amber-500 hover:bg-amber-400 text-black shadow-amber-500/20 hover:scale-[1.02] active:scale-95'
                              : 'bg-neutral-900 border border-neutral-800 text-neutral-500 cursor-not-allowed opacity-70'
                          }`}
                        >
                          {allFilled ? (
                            <>
                              <CheckCircle2 size={16} />
                              <span>Avançar para Identificação (4 Horários Prontos)</span>
                            </>
                          ) : (
                            <span>Defina os 4 horários para avançar ({filledCount} de 4 prontos)</span>
                          )}
                        </button>
                      );
                    })()}
                  </div>
                ) : (
                  /* ========================================================= */
                  /* FLUXO SERVIÇO AVULSO: SELEÇÃO DE 1 HORÁRIO                */
                  /* ========================================================= */
                  <div className="space-y-8">
                    <div className="relative">
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-5 py-1.5 bg-neutral-950 border border-amber-500/40 rounded-full z-10 shadow-xl">
                        <span className="text-[9px] font-black text-amber-500 uppercase tracking-[0.3em] whitespace-nowrap italic">Escolha o Dia</span>
                      </div>
                      
                      <div className="relative overflow-hidden rounded-[2.5rem] bg-neutral-900 border border-amber-500/20 p-2">
                        <input 
                          type="date" 
                          min={new Date().toISOString().split('T')[0]}
                          className="w-full bg-transparent p-6 rounded-[2rem] text-white font-black text-center text-xl outline-none hover:bg-amber-500/5 transition-all cursor-pointer italic appearance-none" 
                          value={selectedDate} 
                          onChange={e => setSelectedDate(e.target.value)} 
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-5">
                      <div className="flex items-center justify-between px-2">
                        <span className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] italic">Horários Disponíveis</span>
                        <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">{availableSlots.length} Vagas</span>
                      </div>

                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                         {availableSlots.length > 0 ? (
                           availableSlots.map(t => (
                             <button 
                               key={t} 
                               onClick={() => { setSelectedTime(t); setStep('details'); }} 
                               className="py-4 bg-neutral-900 border border-neutral-800 rounded-xl text-xs font-black text-neutral-300 hover:bg-amber-500 hover:text-black hover:border-amber-500 hover:scale-105 transition-all active:scale-95 shadow-lg"
                             >
                               {t}
                             </button>
                           ))
                         ) : (
                           <div className="col-span-full py-12 text-center bg-neutral-900/30 rounded-3xl border border-dashed border-neutral-800">
                             <p className="text-[10px] font-black text-neutral-600 uppercase tracking-widest italic">
                               {(() => {
                                 const d = new Date(selectedDate + 'T12:00:00');
                                 if (d.getDay() === 0 || d.getDay() === 1) return "Fechado aos Domingos e Segundas";
                                 return "Agenda lotada para este dia";
                               })()}
                             </p>
                           </div>
                         )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {step === 'details' && (
              <div className="space-y-6 animate-in slide-in-from-right-8 duration-500">
                {isMonthlyPackage(selectedService?.name) ? (
                  /* CARD DE RESUMO DOS 4 HORÁRIOS DO PACOTE */
                  <div className="bg-gradient-to-br from-neutral-900 to-neutral-950 p-6 sm:p-7 rounded-[2.5rem] border border-amber-500/30 shadow-2xl relative overflow-hidden space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/20 text-black">
                          <Crown size={22} />
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-amber-500 uppercase tracking-[0.2em] italic">Cronograma do Pacote</p>
                          <p className="text-base font-black text-white italic uppercase tracking-tight">4 Cortes Agendados</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setStep('date')}
                        className="text-[9px] font-black uppercase text-amber-400 hover:text-amber-300 bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 rounded-full transition-colors"
                      >
                        Ajustar Horários
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      {packageSlots.map((s, i) => (
                        <div key={i} className="p-3 bg-neutral-950/80 rounded-2xl border border-neutral-800 flex items-center justify-between text-xs">
                          <span className="font-black text-amber-500 text-[11px]">{i + 1}º Corte:</span>
                          <span className="text-white font-bold">
                            {formatApptDate(`${s.date}T${s.time}:00`).split('(')[0].trim()} às {s.time}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  /* CARD DE RESUMO DO SERVIÇO AVULSO */
                  <div className="bg-gradient-to-br from-neutral-900 to-neutral-950 p-8 rounded-[2.5rem] border border-neutral-800 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-5 text-white pointer-events-none">
                       <CalendarDays size={120} />
                    </div>
                    <div className="relative z-10 flex items-center gap-6">
                      <div className="w-16 h-16 rounded-2xl bg-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/20 -rotate-6">
                        <Clock size={28} className="text-black" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-amber-500/60 uppercase tracking-[0.2em] italic mb-1">Confirmando Horário</p>
                        <p className="text-2xl font-black text-white italic uppercase tracking-tighter">
                          {selectedTime}
                        </p>
                        <p className="text-xs font-bold text-neutral-400 uppercase tracking-wide mt-1">
                          {formatSelectedDateLong(selectedDate)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* FORMULÁRIO DE DADOS DO CLIENTE */}
                <div className="space-y-3.5">
                  <div className="relative group">
                    <div className="absolute left-6 top-1/2 -translate-y-1/2 text-neutral-600 group-focus-within:text-amber-500 transition-colors">
                      <Smartphone size={20} />
                    </div>
                    <input 
                      type="text" 
                      placeholder="Seu Nome Completo *" 
                      value={clientName} 
                      onChange={e => setClientName(e.target.value)} 
                      className="w-full bg-neutral-900 border border-neutral-800 p-5 pl-14 rounded-2xl text-white font-bold outline-none focus:border-amber-500 focus:bg-neutral-950 transition-all placeholder:text-neutral-700 italic" 
                    />
                  </div>

                  <div className="relative group">
                    <div className="absolute left-6 top-1/2 -translate-y-1/2 text-neutral-600 group-focus-within:text-amber-500 transition-colors">
                      <Phone size={20} />
                    </div>
                    <input 
                      type="tel" 
                      placeholder="Seu WhatsApp com DDD *" 
                      value={clientPhone} 
                      onChange={e => setClientPhone(e.target.value)} 
                      className="w-full bg-neutral-900 border border-neutral-800 p-5 pl-14 rounded-2xl text-white font-bold outline-none focus:border-amber-500 focus:bg-neutral-950 transition-all placeholder:text-neutral-700 italic" 
                    />
                  </div>

                  <div className="relative group">
                    <div className="absolute left-6 top-1/2 -translate-y-1/2 text-neutral-600 group-focus-within:text-amber-500 transition-colors">
                      <Mail size={20} />
                    </div>
                    <input 
                      type="email" 
                      placeholder="Seu E-mail (opcional - para receber a confirmação)" 
                      value={clientEmail} 
                      onChange={e => setClientEmail(e.target.value)} 
                      className="w-full bg-neutral-900 border border-neutral-800 p-5 pl-14 rounded-2xl text-white font-bold outline-none focus:border-amber-500 focus:bg-neutral-950 transition-all placeholder:text-neutral-700 italic" 
                    />
                  </div>
                </div>

                {selectedService && (
                  <div className="bg-neutral-900/90 border border-neutral-800 p-5 rounded-3xl flex items-center justify-between shadow-xl">
                    <div className="flex items-center gap-3.5">
                      <div className="w-11 h-11 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shrink-0">
                        {isMonthlyPackage(selectedService.name) ? <Crown size={20} /> : <Scissors size={20} />}
                      </div>
                      <div>
                        <span className="text-[9px] font-black uppercase tracking-widest text-amber-500">
                          {isMonthlyPackage(selectedService.name) ? 'Pacote Mensal Selecionado' : 'Serviço Selecionado'}
                        </span>
                        <p className="text-sm font-black text-white uppercase italic tracking-tight">{selectedService.name}</p>
                        {isMonthlyPackage(selectedService.name) && (
                          <p className="text-[10px] text-emerald-400 font-bold mt-0.5">
                            ✨ Todos os 4 agendamentos serão salvos e confirmados por e-mail!
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-base font-black text-amber-500">
                        R$ {selectedService.price.toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}

                <button 
                  onClick={() => setStep('payment')} 
                  disabled={!clientName || !clientPhone}
                  className="w-full py-6 bg-amber-500 text-black font-black rounded-[2.5rem] uppercase italic shadow-[0_20px_40px_-10px_rgba(245,158,11,0.3)] hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:hover:scale-100 transition-all mt-4 tracking-widest text-sm"
                >
                  Ir para Pagamento
                </button>
              </div>
            )}

            {step === 'payment' && (
              <div className="space-y-6 text-center animate-in zoom-in-95 duration-500">
                <div className="bg-neutral-900/90 border border-neutral-800 p-5 rounded-3xl text-left flex items-center justify-between shadow-xl">
                  <div>
                    <span className="text-[9px] font-black uppercase tracking-widest text-neutral-400">Total do Agendamento</span>
                    <p className="text-sm font-black text-white uppercase italic">{selectedService?.name}</p>
                    {selectedService && isMonthlyPackage(selectedService.name) && (
                      <p className="text-[10px] text-amber-400 font-bold">4 Sessões inclusas • Válido por 30 dias corridos</p>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black text-amber-500 italic">
                      R$ {selectedService ? selectedService.price.toFixed(2) : '0,00'}
                    </span>
                  </div>
                </div>

                {/* RESUMO DOS HORÁRIOS QUE SERÃO SALVOS */}
                {selectedService && isMonthlyPackage(selectedService.name) && (
                  <div className="bg-neutral-900/60 border border-neutral-800 p-4 rounded-3xl text-left space-y-2">
                    <span className="text-[9px] font-black uppercase tracking-widest text-amber-500 block">
                      Cronograma dos 4 Horários a Serem Salvos:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {packageSlots.map((s, idx) => (
                        <div key={idx} className="p-2.5 bg-neutral-950 rounded-xl border border-neutral-800/80 flex items-center justify-between">
                          <span className="font-bold text-neutral-400">{idx + 1}º Corte:</span>
                          <span className="text-white font-bold">{formatApptDate(`${s.date}T${s.time}:00`).split('(')[0].trim()} às {s.time}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="bg-neutral-900 p-10 rounded-[3rem] border border-neutral-800 flex flex-col items-center relative shadow-2xl">
                   <div className="absolute -top-4 px-8 py-2 bg-amber-500 text-black rounded-full shadow-lg shadow-amber-500/20">
                     <span className="text-[11px] font-black uppercase tracking-widest italic">Pagamento Instantâneo</span>
                   </div>
                   
                   <div className="bg-white p-4 rounded-3xl mb-8 mt-4 shadow-xl">
                      <ImageFallback src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(tenantSettings.pix_copy_paste || '')}`} alt="QR Code PIX" className="w-48 h-48 rounded-xl" />
                   </div>
                   
                   <button 
                    onClick={() => { navigator.clipboard.writeText(tenantSettings.pix_copy_paste || ''); alert('PIX Copiado!'); }} 
                    className="flex items-center gap-3 text-[10px] font-black uppercase bg-neutral-950 border border-neutral-800 px-8 py-4 rounded-2xl hover:text-amber-500 hover:border-amber-500/50 transition-all shadow-lg text-neutral-400 group active:scale-95 w-full justify-center"
                   >
                     <Copy size={16} className="group-hover:scale-110 transition-transform"/> Copiar Código PIX
                   </button>
                </div>

                {/* AVISO IMPORTANTE SOBRE AGENDAMENTO E PAGAMENTO */}
                <div className="bg-amber-500/5 border border-amber-500/20 rounded-[2rem] p-6 text-left space-y-2 backdrop-blur-md">
                  <p className="text-amber-500 text-[10px] font-black uppercase tracking-[0.2em] italic">
                    ⚠️ Aviso Importante
                  </p>
                  <p className="text-xs font-bold text-neutral-300 leading-relaxed uppercase">
                    O pagamento antecipado é <span className="text-amber-500 font-black">opcional</span>! Você pode realizar o pagamento diretamente <span className="text-white font-black">na hora do atendimento</span> na barbearia.
                  </p>
                  <div className="h-px bg-neutral-800/80 my-2"></div>
                  <p className="text-[10px] font-black text-amber-400 leading-normal uppercase tracking-wider">
                    ATENÇÃO: Você <span className="text-white underline font-black">DEVE</span> clicar no botão <span className="text-white font-black">"CONFIRMAR AGENDAMENTO"</span> abaixo para salvar o(s) horário(s) e disparar o e-mail de confirmação!
                  </p>
                </div>
                
                <button 
                  onClick={handleCreateAppointment} 
                  disabled={submitting} 
                  className="w-full py-7 bg-amber-500 text-black font-black rounded-[3rem] uppercase tracking-[0.2em] italic shadow-[0_20px_40px_-10px_rgba(245,158,11,0.3)] hover:bg-amber-400 transition-all active:scale-95 active:shadow-none text-sm"
                >
                  {submitting 
                    ? (isMonthlyPackage(selectedService?.name) ? 'SALVANDO 4 HORÁRIOS & ENVIANDO E-MAIL...' : 'SALVANDO HORÁRIO & ENVIANDO E-MAIL...') 
                    : 'CONFIRMAR AGENDAMENTO'}
                </button>
              </div>
            )}

            {step === 'success' && (
              <div className="text-center py-12 space-y-8 animate-in zoom-in-95 duration-700">
                <div className="relative mx-auto w-32 h-32">
                  <div className="absolute inset-0 bg-emerald-500/30 blur-3xl rounded-full animate-pulse"></div>
                  <div className="relative w-32 h-32 bg-emerald-500 text-neutral-950 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-2xl rotate-3 border-4 border-neutral-900">
                    <CheckCircle2 size={64} />
                  </div>
                </div>
                <div>
                  <h3 className="text-4xl font-black uppercase italic text-white tracking-tighter leading-none mb-4">
                    {selectedService && isMonthlyPackage(selectedService.name) ? 'Pacote Confirmado!' : 'Agendado com Sucesso!'}
                  </h3>
                  <p className="text-neutral-400 text-xs font-bold uppercase tracking-widest max-w-sm mx-auto leading-relaxed">
                    {selectedService && isMonthlyPackage(selectedService.name) ? (
                      <>
                        Seus <span className="text-amber-400 font-black">4 cortes</span> foram agendados e salvos no sistema. <br />
                        O e-mail de confirmação com todas as datas foi enviado via Resend!
                      </>
                    ) : (
                      <>
                        Seu horário foi reservado no sistema e o e-mail de confirmação foi disparado via Resend! <br /> Te esperamos na barbearia.
                      </>
                    )}
                  </p>
                </div>

                {/* Resumo visual no Sucesso para Pacote Mensal */}
                {selectedService && isMonthlyPackage(selectedService.name) && (
                  <div className="bg-neutral-900/80 border border-neutral-800 p-5 rounded-3xl text-left space-y-3 max-w-md mx-auto">
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-500 block text-center">
                      📋 Cronograma dos seus 4 Cortes:
                    </span>
                    <div className="space-y-2">
                      {packageSlots.map((s, i) => (
                        <div key={i} className="p-3 bg-neutral-950 rounded-2xl border border-neutral-800 flex items-center justify-between text-xs">
                          <span className="font-black text-amber-400">{i + 1}º Atendimento:</span>
                          <span className="text-white font-bold">
                            {formatApptDate(`${s.date}T${s.time}:00`).split('(')[0].trim()} às {s.time}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <button 
                  onClick={() => window.location.reload()} 
                  className="w-full py-6 bg-neutral-900 rounded-[2rem] font-black uppercase italic border border-neutral-800 hover:bg-neutral-800 transition-all tracking-widest shadow-xl text-xs text-neutral-300"
                >
                  Fazer Outro Agendamento
                </button>
              </div>
            )}

            {step === 'my-appointments' && (
              <div className="space-y-6 animate-in slide-in-from-bottom-6 duration-500">
                <div className="bg-neutral-900/80 backdrop-blur-xl p-6 sm:p-8 rounded-[2.5rem] border border-neutral-800 shadow-2xl space-y-6">
                  <div className="text-center space-y-2">
                    <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-center mx-auto text-amber-500 mb-2">
                      <Search size={22} />
                    </div>
                    <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">
                      Consultar Agendamento
                    </h2>
                    <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest max-w-xs mx-auto">
                      Informe seu WhatsApp para ver ou desmarcar seus horários
                    </p>
                  </div>

                  <form onSubmit={(e) => { e.preventDefault(); handleSearchByPhone(); }} className="space-y-3">
                    <div className="relative group">
                      <div className="absolute left-5 top-1/2 -translate-y-1/2 text-neutral-500 group-focus-within:text-amber-500 transition-colors">
                        <Phone size={18} />
                      </div>
                      <input
                        type="tel"
                        placeholder="Seu WhatsApp (ex: 11999999999)"
                        value={searchPhone}
                        onChange={(e) => setSearchPhone(e.target.value)}
                        className="w-full bg-neutral-950 border border-neutral-800 p-5 pl-12 rounded-2xl text-white font-bold outline-none focus:border-amber-500 transition-all placeholder:text-neutral-600 text-sm italic"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={searching || !searchPhone.trim()}
                      className="w-full py-4 bg-amber-500 text-black font-black rounded-2xl uppercase italic tracking-widest text-xs hover:bg-amber-400 active:scale-95 disabled:opacity-50 transition-all shadow-lg shadow-amber-500/10 flex items-center justify-center gap-2"
                    >
                      {searching ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                          <span>Buscando...</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Search size={16} />
                          <span>Buscar Agendamentos</span>
                        </div>
                      )}
                    </button>
                  </form>
                </div>

                {actionFeedback && (
                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-400 text-xs font-black uppercase tracking-wider text-center flex items-center justify-center gap-2 animate-in fade-in">
                    <CheckCircle2 size={16} />
                    <span>{actionFeedback}</span>
                  </div>
                )}

                {/* LISTA DE AGENDAMENTOS DO CLIENTE */}
                {hasSearched && (
                  <div className="space-y-4">
                    {searchResults.length === 0 ? (
                      <div className="text-center py-10 bg-neutral-900/40 rounded-3xl border border-dashed border-neutral-800 space-y-2 p-6">
                        <p className="text-neutral-400 font-bold text-xs uppercase tracking-wider">
                          Nenhum agendamento encontrado
                        </p>
                        <p className="text-[10px] text-neutral-600 font-medium leading-relaxed">
                          Não encontramos marcações com este número. Verifique se digitou o DDD corretamente.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500 px-2">
                          {searchResults.length} {searchResults.length === 1 ? 'Marcação Encontrada' : 'Marcações Encontradas'}
                        </p>

                        {searchResults.map((appt) => {
                          const service = availableServices.find(s => s.id === appt.service_id);
                          const pro = availableProfessionals.find(p => p.id === appt.professional_id);
                          const isPast = new Date(appt.start_time) < new Date();

                          return (
                            <div
                              key={appt.id}
                              className={`p-5 rounded-3xl border transition-all space-y-4 ${
                                appt.status === 'cancelado'
                                  ? 'bg-neutral-900/30 border-neutral-800/50'
                                  : 'bg-neutral-900/90 border-neutral-800 hover:border-amber-500/30 shadow-xl'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <h4 className="text-base font-black uppercase italic text-white">
                                    {service ? service.name : 'Atendimento Barber'}
                                  </h4>
                                  <p className="text-xs font-bold text-neutral-400 mt-1 flex items-center gap-1.5">
                                    <User size={13} className="text-amber-500" />
                                    <span>Profissional: {pro ? pro.name : 'Atendente'}</span>
                                  </p>
                                </div>

                                <span
                                  key={appt.status}
                                  className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border shrink-0 ${
                                    appt.status === 'confirmado'
                                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                      : appt.status === 'pendente'
                                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                      : appt.status === 'concluido'
                                      ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                      : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                  }`}
                                >
                                  {appt.status === 'confirmado' ? 'Confirmado' : appt.status === 'pendente' ? 'Pendente' : appt.status === 'concluido' ? 'Concluído' : 'Cancelado'}
                                </span>
                              </div>

                              <div className="flex items-center gap-2 text-xs font-bold text-amber-400 bg-neutral-950/80 p-3.5 rounded-2xl border border-neutral-800">
                                <CalendarIcon size={15} className="shrink-0 text-amber-500" />
                                <span>{formatApptDate(appt.start_time)}</span>
                              </div>

                              {service && (
                                <div className="flex items-center justify-between text-[11px] font-bold text-neutral-400 px-1">
                                  <span>Valor: <strong className="text-white">R$ {service.price.toFixed(2)}</strong></span>
                                  <span>Cliente: <strong className="text-white">{appt.user_name}</strong></span>
                                </div>
                              )}

                              {/* BOTOES DE ACAO VINCULADOS AO SISTEMA DO JARDEL */}
                              {appt.status !== 'concluido' && (
                                <div className="pt-2 flex flex-col sm:flex-row gap-2">
                                  {appt.status !== 'confirmado' ? (
                                    <button
                                      onClick={() => handleConfirmAppointment(appt.id)}
                                      disabled={actionLoadingId === appt.id}
                                      className="flex-1 py-3 px-4 bg-emerald-500 hover:bg-emerald-400 text-black font-black text-[11px] uppercase tracking-wider italic rounded-2xl transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                                    >
                                      {actionLoadingId === appt.id ? (
                                        <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                                      ) : (
                                        <div className="flex items-center justify-center gap-2">
                                          <CheckCircle2 size={16} />
                                          <span>{appt.status === 'cancelado' ? 'Reativar / Confirmar' : 'Confirmar Presença'}</span>
                                        </div>
                                      )}
                                    </button>
                                  ) : (
                                    <div className="flex-1 py-3 px-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-black text-[11px] uppercase tracking-wider italic rounded-2xl flex items-center justify-center gap-2">
                                      <CheckCircle2 size={16} />
                                      <span>Presença Confirmada</span>
                                    </div>
                                  )}

                                  {appt.status !== 'cancelado' && (
                                    <button
                                      onClick={() => handleCancelAppointment(appt.id)}
                                      disabled={actionLoadingId === appt.id}
                                      className="flex-1 py-3 px-4 bg-rose-500/10 hover:bg-rose-500 border border-rose-500/30 text-rose-400 hover:text-white font-black text-[11px] uppercase tracking-wider italic rounded-2xl transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                                    >
                                      {actionLoadingId === appt.id ? (
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                      ) : (
                                        <div className="flex items-center justify-center gap-2">
                                          <XCircle size={16} />
                                          <span>Desmarcar / Cancelar</span>
                                        </div>
                                      )}
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
        </div>

        <div className="mt-20 text-center pb-12 border-t border-neutral-900/50 pt-10">
           {isAdmin ? (
             <button onClick={() => navigate('/admin')} className="text-amber-500 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:opacity-80 transition-opacity bg-amber-500/5 px-8 py-4 rounded-full border border-amber-500/20 italic mx-auto"><LayoutDashboard size={14}/> Voltar ao Admin</button>
           ) : (
             <button onClick={() => navigate('/login')} className="text-neutral-700 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:text-neutral-500 transition-colors italic tracking-[0.3em] mx-auto"><Lock size={12}/> Acesso Corporativo</button>
           )}
        </div>
      </div>
    </div>
  );
};
