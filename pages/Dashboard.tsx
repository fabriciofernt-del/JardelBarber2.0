
import React, { useState, useEffect, useMemo } from 'react';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { 
  Users, 
  DollarSign, 
  Calendar, 
  TrendingUp, 
  RefreshCcw,
  Zap,
  Clock,
  Lightbulb
} from 'lucide-react';
import { getAppointments, getServices, getProfessionals, getRevenue } from '../constants';
import { Appointment, Service, Professional, RevenueEntry } from '../types';

const StatCard: React.FC<{
  title: string;
  value: string;
  trend: string;
  icon: React.ElementType;
  colorClass: string;
  valueColorClass?: string;
}> = ({ title, value, trend, icon: Icon, colorClass, valueColorClass = "text-neutral-950" }) => (
  <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-lg transition-all duration-300">
    <div className="flex justify-between items-start mb-4">
      <div className={`p-3 rounded-xl ${colorClass}`}>
        <Icon size={20} />
      </div>
      <span className="text-emerald-500 text-[8px] font-black uppercase tracking-widest flex items-center gap-1 bg-emerald-50 px-2 py-1 rounded-lg">
        {trend}
      </span>
    </div>
    <h3 className="text-slate-400 text-[8px] font-black uppercase tracking-[0.2em] mb-1">{title}</h3>
    <p className={`text-2xl font-black tracking-tighter italic uppercase ${valueColorClass}`}>{value}</p>
  </div>
);

export const Dashboard: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [revenueEntries, setRevenueEntries] = useState<RevenueEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartReady, setChartReady] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [appts, servs, pros, revs] = await Promise.all([
        getAppointments(),
        getServices(),
        getProfessionals(),
        getRevenue().catch(() => [])
      ]);
      setAppointments(appts || []);
      setServices(servs || []);
      setProfessionals(pros || []);
      setRevenueEntries(revs || []);
    } catch (e) {
      console.error('Error in Dashboard fetch:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const timer = setTimeout(() => setChartReady(true), 300);
    return () => clearTimeout(timer);
  }, []);

  const stats = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const currentMonthAppts = appointments.filter(appt => {
      if (appt.status === 'cancelado') return false;
      const apptDate = new Date(appt.start_time);
      return apptDate.getMonth() === currentMonth && apptDate.getFullYear() === currentYear;
    }).length;

    const apptRevenue = appointments.reduce((sum, appt) => {
      if (appt.status === 'cancelado') return sum;
      
      const apptDate = new Date(appt.start_time);
      if (apptDate.getMonth() === currentMonth && apptDate.getFullYear() === currentYear) {
        const service = services.find(s => s.id === appt.service_id);
        return sum + (service?.price || 0);
      }
      return sum;
    }, 0);

    const manualRevenue = revenueEntries.reduce((sum, entry) => {
      const entryDate = new Date(entry.date);
      if (entryDate.getMonth() === currentMonth && entryDate.getFullYear() === currentYear) {
        return sum + entry.amount;
      }
      return sum;
    }, 0);

    const monthlyRevenue = apptRevenue + manualRevenue;

    const totalApptsForOccupancy = appointments.length;
    const uniqueClients = new Set(appointments.map(a => a.user_name)).size;
    const maxCapacity = (professionals.length || 1) * 10 * 7; 
    const occupancyRate = maxCapacity > 0 ? Math.min(Math.round((totalApptsForOccupancy / maxCapacity) * 100), 100) : 0;
    return { currentMonthAppts, monthlyRevenue, uniqueClients, occupancyRate };
  }, [appointments, services, professionals]);

  const chartData = useMemo(() => {
    const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];
    const dailyData = days.map(name => ({ name, revenue: 0 }));
    
    appointments.forEach(appt => {
      if (appt.status === 'cancelado') return;
      const date = new Date(appt.start_time);
      const service = services.find(s => s.id === appt.service_id);
      if (dailyData[date.getDay()]) {
        dailyData[date.getDay()].revenue += (service?.price || 0);
      }
    });
    // Rotate to start from Monday or simply show Sun-Sat. Let's keep Sun-Sat for simplicity or rotate based on today?
    // User mock data was shifted. Let's just return Sun-Sat.
    return dailyData;
  }, [appointments, services]);

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-10">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <StatCard title="Agendamentos do Mês" value={stats.currentMonthAppts.toString()} trend="Mês Atual" icon={Calendar} colorClass="bg-neutral-950 text-amber-500" valueColorClass="text-amber-600" />
        <StatCard title="Faturamento do Mês" value={`R$ ${stats.monthlyRevenue.toFixed(0)}`} trend="Mês Atual" icon={DollarSign} colorClass="bg-amber-500 text-neutral-950" />
        <StatCard title="Clientes Únicos" value={stats.uniqueClients.toString()} trend="Base" icon={Users} colorClass="bg-neutral-900 text-amber-400" />
        <StatCard title="Ocupação" value={`${stats.occupancyRate}%`} trend="Fluxo" icon={TrendingUp} colorClass="bg-amber-100 text-amber-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
            <h3 className="text-sm font-black text-neutral-950 uppercase italic tracking-tighter mb-6">Fluxo Financeiro Semanal</h3>
            <div className="h-[200px] md:h-[300px] w-full">
              {chartReady && (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorGold" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="5 5" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 9, fontWeight: 800}} dy={10} />
                    <YAxis hide />
                    <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                    <Area type="monotone" dataKey="revenue" stroke="#f59e0b" strokeWidth={3} fillOpacity={1} fill="url(#colorGold)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
            <h3 className="text-sm font-black text-neutral-950 uppercase italic tracking-tighter mb-6">Próximos Clientes</h3>
            <div className="space-y-3">
              {appointments.slice(0, 3).map((appt) => (
                <div key={appt.id} className="flex items-center justify-between p-4 rounded-2xl border border-slate-50 bg-slate-50/30">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-neutral-950 flex items-center justify-center text-amber-500 font-black italic shadow-sm">
                      {appt.user_name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-black text-neutral-950 text-xs tracking-tight italic uppercase">{appt.user_name}</h4>
                      <p className="text-[8px] text-slate-500 font-black uppercase tracking-widest">
                        {services.find(s => s.id === appt.service_id)?.name || 'Serviço'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] font-black text-amber-600">
                    <Clock size={12} className="text-amber-500" />
                    {new Date(appt.start_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))}
              {appointments.length === 0 && (
                <p className="text-center text-xs text-slate-400 py-4">Sem agendamentos recentes.</p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-neutral-950 text-white p-8 rounded-[2.5rem] border border-neutral-900 shadow-2xl flex flex-col gap-6">
          <div className="flex items-center gap-4">
            <div className="bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/30">
              <Lightbulb className="text-amber-500" size={24} />
            </div>
            <h3 className="text-sm font-black uppercase italic tracking-tighter">Insights</h3>
          </div>
          <div className="p-5 rounded-2xl bg-neutral-900/50 border border-neutral-800">
            <Zap size={16} className="text-amber-500 mb-2" />
            <h4 className="font-black text-[10px] mb-1 text-white uppercase italic tracking-wide">Performance</h4>
            <p className="text-neutral-400 text-[10px] leading-relaxed">
              Você tem {appointments.length} agendamentos registrados. Mantenha sua agenda atualizada para obter métricas precisas.
            </p>
          </div>
          <button onClick={loadData} className="w-full bg-amber-500 text-neutral-950 font-black py-4 rounded-xl transition-all shadow-lg shadow-amber-500/10 flex items-center justify-center gap-2 uppercase text-[10px] italic hover:bg-amber-400">
            <RefreshCcw size={14} /> Atualizar Painel
          </button>
        </div>
      </div>
    </div>
  );
};
