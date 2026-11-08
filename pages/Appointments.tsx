
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Search, 
  Filter, 
  XCircle, 
  Phone,
  Scissors,
  RefreshCw,
  Trash2
} from 'lucide-react';
import { getAppointments, updateAppointment, deleteAppointment, getServices, getProfessionals } from '../constants';
import { Appointment, Service, Professional } from '../types';

export const Appointments: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('todos');
  const [loading, setLoading] = useState(true);

  // Load data from Supabase
  const loadData = async () => {
    setLoading(true);
    try {
      const [appts, servs, pros] = await Promise.all([
        getAppointments(),
        getServices(),
        getProfessionals()
      ]);
      setAppointments(appts);
      setServices(servs);
      setProfessionals(pros);
    } catch (error) {
      console.error("Failed to load data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredAppointments = useMemo(() => {
    return appointments.filter(appt => {
      const matchesSearch = appt.user_name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === 'todos' || appt.status === filterStatus;
      return matchesSearch && matchesStatus;
    }); // Appointments are already sorted by backend
  }, [appointments, searchTerm, filterStatus]);

  const handleUpdateStatus = async (id: number, newStatus: any) => {
    const { error } = await updateAppointment(id, { status: newStatus });
    if (!error) {
      setAppointments(appointments.map(a => a.id === id ? { ...a, status: newStatus } : a));
    } else {
      alert("Erro ao atualizar status");
    }
  };

  const handleRemoveAppointment = async (id: number) => {
    if (confirm('Deseja realmente excluir este agendamento?')) {
      const { error } = await deleteAppointment(id);
      if (!error) {
        setAppointments(appointments.filter(a => a.id !== id));
      } else {
        alert("Erro ao excluir agendamento");
      }
    }
  };

  const formatDate = (dateStr: string) => {
    // Espera algo como "2026-02-19T13:00:00"
    const [datePart] = dateStr.split('T'); // "2026-02-19"
    const [year, month, day] = datePart.split('-');
    return `${day}/${month}/${year}`; // 19/02/2026
  };

  const formatTime = (dateStr: string) => {
    const [, timePart = ''] = dateStr.split('T'); // "13:00:00"
    const [hh = '00', mm = '00'] = timePart.split(':');
    return `${hh}:${mm}`; // 13:00
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'confirmado': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'pendente': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'cancelado': return 'bg-rose-50 text-rose-600 border-rose-100';
      default: return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };

  if (loading) {
    return <div className="p-10 text-center text-slate-400">Carregando agenda...</div>;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-neutral-950 tracking-tighter uppercase italic">Agenda de Atendimentos</h2>
          <p className="text-slate-500 text-sm font-bold uppercase tracking-widest mt-2">Gestão de horários e fluxo de clientes em tempo real.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-amber-500 transition-colors" size={20} />
            <input 
              type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar cliente..."
              className="pl-12 pr-6 py-3.5 rounded-2xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 transition-all w-72 shadow-sm font-medium"
            />
          </div>
          <div className="relative group">
            <select 
              value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
              className="pl-6 pr-12 py-3.5 rounded-2xl border border-slate-200 bg-white text-[10px] font-black uppercase tracking-widest text-neutral-600 focus:outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 appearance-none cursor-pointer transition-all shadow-sm"
            >
              <option value="todos">Todos Status</option>
              <option value="confirmado">Confirmados</option>
              <option value="pendente">Pendentes</option>
              <option value="cancelado">Cancelados</option>
            </select>
            <Filter className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-focus-within:text-amber-500" size={18} />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-neutral-950 border-b border-neutral-900">
                <th className="px-10 py-6 text-[10px] font-black text-amber-500 uppercase tracking-[0.2em]">Cliente</th>
                <th className="px-6 py-6 text-[10px] font-black text-amber-500 uppercase tracking-[0.2em]">Serviço</th>
                <th className="px-6 py-6 text-[10px] font-black text-amber-500 uppercase tracking-[0.2em]">Data / Hora</th>
                <th className="px-6 py-6 text-[10px] font-black text-amber-500 uppercase tracking-[0.2em]">Ações Rápidas</th>
                <th className="px-6 py-6 text-[10px] font-black text-amber-500 uppercase tracking-[0.2em]">Status</th>
                <th className="px-10 py-6 text-[10px] font-black text-amber-500 uppercase tracking-[0.2em] text-right">Gestão</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredAppointments.length > 0 ? (
                filteredAppointments.map((appt) => {
                  const service = services.find(s => s.id === appt.service_id);
                  const professional = professionals.find(p => p.id === appt.professional_id);
                  return (
                    <tr key={appt.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-10 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-neutral-950 flex items-center justify-center text-amber-500 font-black text-base shadow-lg shadow-neutral-950/10 group-hover:scale-105 transition-transform">
                            {appt.user_name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-base font-black text-neutral-950 tracking-tight italic uppercase">{appt.user_name}</p>
                            <p className="text-[10px] text-slate-400 font-bold tracking-widest uppercase">{appt.user_phone || 'SEM CONTATO'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-6">
                        <div className="flex items-center gap-2.5">
                          <Scissors size={14} className="text-amber-500" />
                          <span className="text-sm font-bold text-slate-600 uppercase italic tracking-tight">{service?.name || 'Desconhecido'}</span>
                        </div>
                        <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mt-1">Mestre: {professional?.name || '---'}</p>
                      </td>
                      <td className="px-6 py-6">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2 text-sm font-black text-neutral-950">
                            <CalendarIcon size={14} className="text-amber-500" />
                            {formatDate(appt.start_time)}
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-slate-500 font-black uppercase tracking-widest">
                            <Clock size={12} className="text-slate-400" />
                            {formatTime(appt.start_time)}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-6">
                        <div className="flex items-center gap-2">
                          {appt.status === 'pendente' && (
                            <button 
                              onClick={() => handleUpdateStatus(appt.id, 'confirmado')}
                              className="px-4 py-2 bg-emerald-500 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/10"
                            >
                              Confirmar
                            </button>
                          )}
                          <button 
                            onClick={() => window.open(`https://wa.me/${appt.user_phone?.replace(/\D/g, '')}`, '_blank')}
                            className="p-2 bg-slate-100 text-slate-600 rounded-xl hover:bg-emerald-50 hover:text-emerald-600 transition-all"
                            title="Chamar no WhatsApp"
                          >
                             <Phone size={16} />
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-6">
                        <span className={`px-4 py-1.5 rounded-full border text-[9px] font-black uppercase tracking-widest inline-block ${getStatusStyle(appt.status)}`}>
                          {appt.status}
                        </span>
                      </td>
                      <td className="px-10 py-6 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                          {appt.status !== 'cancelado' && (
                            <button onClick={() => handleUpdateStatus(appt.id, 'cancelado')} className="p-2.5 text-rose-500 hover:bg-rose-50 rounded-xl transition-all shadow-sm" title="Cancelar Reserva">
                              <XCircle size={20} />
                            </button>
                          )}
                          <button onClick={() => handleRemoveAppointment(appt.id)} className="p-2.5 text-slate-300 hover:text-neutral-950 hover:bg-white rounded-xl transition-all shadow-sm" title="Excluir Definitivo">
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-10 py-32 text-center">
                    <div className="flex flex-col items-center gap-6">
                      <div className="w-24 h-24 bg-slate-50 rounded-[2rem] flex items-center justify-center border border-slate-100">
                         <CalendarIcon size={48} className="text-slate-200" />
                      </div>
                      <div>
                        <p className="text-neutral-950 font-black uppercase italic text-xl tracking-tighter">Nenhum Agendamento</p>
                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] mt-1">Os agendamentos da página pública aparecerão aqui.</p>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        <div className="px-10 py-6 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
          <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest italic">Sistema de Agenda Viva - {filteredAppointments.length} Registros</p>
          <div className="flex items-center gap-3">
            <button onClick={() => loadData()} className="w-10 h-10 flex items-center justify-center rounded-xl border border-slate-200 text-slate-400 hover:bg-white transition-all shadow-sm">
              <RefreshCw size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
