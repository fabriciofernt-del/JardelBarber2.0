
import React, { useState, useMemo, useEffect } from 'react';
import { 
  DollarSign, 
  Plus, 
  Calendar, 
  TrendingUp, 
  ArrowUpRight, 
  Filter,
  Trash2,
  Package,
  Scissors,
  Coffee,
  Wallet,
  Smartphone,
  CreditCard,
  X,
  FileSpreadsheet,
  HandCoins,
  ChevronLeft,
  ChevronRight,
  Download
} from 'lucide-react';
import { getRevenue, createRevenue, deleteRevenue, getAppointments, getServices } from '../constants';
import { RevenueEntry, Appointment, Service } from '../types';

export const Revenue: React.FC = () => {
  const [entries, setEntries] = useState<RevenueEntry[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [filter, setFilter] = useState<'dia' | 'semana' | 'mes' | 'extrato'>('dia');
  
  // State for custom month filtering (Extrato)
  const now = new Date();
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [viewYear, setViewYear] = useState(now.getFullYear());

  // Form State
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<'servico' | 'produto' | 'outro'>('servico');
  const [method, setMethod] = useState<'dinheiro' | 'pix' | 'cartao'>('dinheiro');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [revData, apptData, servData] = await Promise.all([
        getRevenue().catch(() => []),
        getAppointments().catch(() => []),
        getServices().catch(() => [])
      ]);
      setEntries(revData || []);
      setAppointments(apptData || []);
      setServices(servData || []);
    } catch (e) {
      console.error('Error loading revenue data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const stats = useMemo(() => {
    const todayStr = now.toISOString().split('T')[0];
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Helper to get price of a service
    const getServicePrice = (id: number) => services.find(s => s.id === id)?.price || 0;

    // --- TODAY STATS ---
    const appointmentsToday = appointments
      .filter(appt => appt.start_time.startsWith(todayStr) && appt.status !== 'cancelado')
      .reduce((sum, appt) => sum + getServicePrice(appt.service_id), 0);
    
    const entriesToday = entries
      .filter(e => e.date.startsWith(todayStr))
      .reduce((sum, e) => sum + e.amount, 0);

    const today = appointmentsToday + entriesToday;

    // --- WEEKLY STATS ---
    const weekStart = new Date(now);
    weekStart.setHours(0, 0, 0, 0);
    weekStart.setDate(now.getDate() - now.getDay());
    
    const appointmentsWeekly = appointments
      .filter(appt => new Date(appt.start_time) >= weekStart && appt.status !== 'cancelado')
      .reduce((sum, appt) => sum + getServicePrice(appt.service_id), 0);

    const entriesWeekly = entries
      .filter(e => new Date(e.date) >= weekStart)
      .reduce((sum, e) => sum + e.amount, 0);

    const weekly = appointmentsWeekly + entriesWeekly;

    // --- MONTHLY STATS ---
    const appointmentsMonthly = appointments
      .filter(appt => {
        const d = new Date(appt.start_time);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear && appt.status !== 'cancelado';
      })
      .reduce((sum, appt) => sum + getServicePrice(appt.service_id), 0);

    const entriesMonthly = entries
      .filter(e => {
        const d = new Date(e.date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      })
      .reduce((sum, e) => sum + e.amount, 0);

    const monthly = appointmentsMonthly + entriesMonthly;

    return { today, weekly, monthly };
  }, [entries, appointments, services]);

  const filteredEntries = useMemo(() => {
    if (filter === 'dia') {
      const todayStr = now.toISOString().split('T')[0];
      return entries.filter(e => e.date.startsWith(todayStr));
    }
    if (filter === 'semana') {
      const start = new Date(now);
      start.setHours(0, 0, 0, 0);
      start.setDate(now.getDate() - now.getDay());
      return entries.filter(e => new Date(e.date) >= start);
    }
    if (filter === 'mes') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      return entries.filter(e => new Date(e.date) >= start);
    }
    // EXTRATO - Specific Month/Year
    return entries.filter(e => {
      const d = new Date(e.date);
      return d.getMonth() === viewMonth && d.getFullYear() === viewYear;
    });
  }, [entries, filter, viewMonth, viewYear]);

  const monthNames = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  const changeMonth = (delta: number) => {
    let nextMonth = viewMonth + delta;
    let nextYear = viewYear;
    if (nextMonth < 0) {
      nextMonth = 11;
      nextYear--;
    } else if (nextMonth > 11) {
      nextMonth = 0;
      nextYear++;
    }
    setViewMonth(nextMonth);
    setViewYear(nextYear);
  };

  const handleAddEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const cleanDesc = description.trim();
    if (!cleanDesc) {
      setFormError('Por favor, informe uma descrição.');
      return;
    }

    const normalizedAmount = amount.replace(',', '.').trim();
    const parsedAmount = parseFloat(normalizedAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setFormError('Por favor, informe um valor válido maior que zero.');
      return;
    }

    setIsSubmitting(true);
    try {
      const newEntry = {
        date: new Date().toISOString(),
        description: cleanDesc,
        category,
        amount: parsedAmount,
        payment_method: method
      };

      const { error } = await createRevenue(newEntry);
      if (error) {
        console.error('Error saving entry:', error);
        setFormError(`Erro ao salvar lançamento: ${error.message || 'Tente novamente'}`);
        return;
      }

      await loadData();
      setShowAddModal(false);
      setDescription('');
      setAmount('');
      setFormError(null);
    } catch (err: any) {
      console.error('Error in handleAddEntry:', err);
      setFormError(err.message || 'Erro inesperado ao salvar.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const removeEntry = async (id: number) => {
    if (confirm('Deseja excluir este registro?')) {
      const { error } = await deleteRevenue(id);
      if (error) {
        alert('Erro ao excluir lançamento.');
        return;
      }
      await loadData();
    }
  };

  if (loading && entries.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black text-neutral-950 uppercase italic tracking-tighter">Faturamento & Caixa</h2>
          <p className="text-slate-500 text-sm font-bold uppercase tracking-widest mt-2">Controle financeiro simples e direto.</p>
        </div>
        <button 
          onClick={() => {
            setMethod('dinheiro');
            setShowAddModal(true);
          }}
          className="bg-neutral-950 text-amber-500 px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-amber-500 hover:text-neutral-950 transition-all shadow-xl shadow-amber-500/10 flex items-center gap-3 border-2 border-amber-500/20 active:scale-95 italic"
        >
          <Plus size={18} /> Novo Lançamento
        </button>
      </div>

      {/* Stats Quick View */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm group hover:border-amber-500/30 transition-all cursor-default">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Hoje</p>
          <p className="text-3xl font-black text-neutral-950 italic">R$ {stats.today.toFixed(2)}</p>
          <div className="mt-4 flex items-center gap-2 text-emerald-500 text-[10px] font-black uppercase">
            <TrendingUp size={14} /> Fluxo do dia
          </div>
        </div>
        <div className="bg-neutral-950 p-8 rounded-[2.5rem] shadow-xl border border-neutral-900 relative overflow-hidden group hover:scale-[1.02] transition-all cursor-default">
          <div className="absolute top-0 right-0 p-6 opacity-10 text-amber-500 group-hover:scale-110 transition-transform">
            <DollarSign size={80} />
          </div>
          <p className="text-[10px] font-black text-amber-500/60 uppercase tracking-widest mb-2">Esta Semana</p>
          <p className="text-3xl font-black text-white italic">R$ {stats.weekly.toFixed(2)}</p>
          <div className="mt-4 flex items-center gap-2 text-amber-500 text-[10px] font-black uppercase">
            <ArrowUpRight size={14} /> Meta semanal
          </div>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm group hover:border-blue-500/30 transition-all cursor-default">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Este Mês</p>
          <p className="text-3xl font-black text-neutral-950 italic">R$ {stats.monthly.toFixed(2)}</p>
          <div className="mt-4 flex items-center gap-2 text-blue-500 text-[10px] font-black uppercase">
            <Calendar size={14} /> Acumulado mensal
          </div>
        </div>
      </div>

      {/* Quick Add Section for Manual Payments */}
      <div className="flex justify-center">
        <button 
          onClick={() => {
            setMethod('dinheiro');
            setShowAddModal(true);
          }}
          className="w-full max-w-md py-6 bg-amber-500 text-neutral-950 rounded-[2rem] font-black uppercase tracking-[0.2em] text-xs italic shadow-[0_20px_40px_-10px_rgba(245,158,11,0.3)] hover:bg-amber-400 hover:scale-[1.02] transition-all active:scale-95 flex items-center justify-center gap-4 border-2 border-white/20"
        >
          <HandCoins size={22} /> Adicionar Pagamento Pessoal (Hoje)
        </button>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
             <div className="bg-slate-100 p-2.5 rounded-xl">
               <FileSpreadsheet className="text-slate-400" size={20} />
             </div>
             <div>
               <h3 className="text-lg font-black text-neutral-950 uppercase italic tracking-tighter">Histórico de Entradas</h3>
               {filter === 'extrato' && (
                 <p className="text-[9px] font-black text-amber-500 uppercase tracking-widest mt-1">Exibindo extrato de {monthNames[viewMonth]} / {viewYear}</p>
               )}
             </div>
          </div>
          
          <div className="flex flex-col md:flex-row items-center gap-4">
            {/* Extrato Month Navigator */}
            {filter === 'extrato' && (
              <div className="flex items-center bg-slate-50 border border-slate-100 rounded-2xl p-1 gap-1">
                <button 
                  onClick={() => changeMonth(-1)}
                  className="p-2 text-slate-400 hover:text-neutral-950 hover:bg-white rounded-xl transition-all"
                >
                  <ChevronLeft size={16} />
                </button>
                <div className="px-4 text-[10px] font-black uppercase tracking-widest text-neutral-950 min-w-[120px] text-center">
                  {monthNames[viewMonth]} {viewYear}
                </div>
                <button 
                  onClick={() => changeMonth(1)}
                  className="p-2 text-slate-400 hover:text-neutral-950 hover:bg-white rounded-xl transition-all"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}

            <div className="flex bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
               {(['dia', 'semana', 'mes', 'extrato'] as const).map((t) => (
                 <button 
                   key={t}
                   onClick={() => setFilter(t)}
                   className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                     filter === t ? 'bg-white text-neutral-950 shadow-sm border border-slate-100' : 'text-slate-400 hover:text-slate-600'
                   }`}
                 >
                   {t === 'extrato' ? 'Extrato' : t}
                 </button>
               ))}
            </div>
            
            {filter === 'extrato' && (
              <button className="p-3 bg-neutral-950 text-amber-500 rounded-2xl hover:bg-amber-500 hover:text-neutral-950 transition-all active:scale-95 shadow-lg border border-neutral-900">
                <Download size={18} />
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Data</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Descrição</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Categoria</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Pagamento</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Valor</th>
                <th className="px-8 py-5 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredEntries.length > 0 ? (
                filteredEntries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-slate-50/30 transition-colors group">
                    <td className="px-8 py-5 text-[11px] font-bold text-slate-500">
                      {new Date(entry.date).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-8 py-5">
                      <p className="text-sm font-black text-neutral-950 uppercase italic tracking-tight">{entry.description}</p>
                    </td>
                    <td className="px-8 py-5">
                       <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-2 w-fit ${
                         entry.category === 'servico' ? 'bg-amber-50 text-amber-600' : 
                         entry.category === 'produto' ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-600'
                       }`}>
                         {entry.category === 'servico' ? <Scissors size={10} /> : 
                          entry.category === 'produto' ? <Package size={10} /> : <Coffee size={10} />}
                         {entry.category}
                       </span>
                    </td>
                    <td className="px-8 py-5">
                       <div className="flex items-center gap-2 text-slate-500">
                         {entry.payment_method === 'dinheiro' ? <Wallet size={14} /> : 
                          entry.payment_method === 'pix' ? <Smartphone size={14} /> : <CreditCard size={14} />}
                         <span className="text-[10px] font-bold uppercase tracking-widest">{entry.payment_method}</span>
                       </div>
                    </td>
                    <td className="px-8 py-5">
                       <p className="text-base font-black text-neutral-950 italic">R$ {entry.amount.toFixed(2)}</p>
                    </td>
                    <td className="px-8 py-5 text-right">
                       <button 
                        onClick={() => removeEntry(entry.id)}
                        className="p-2 text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                       >
                         <Trash2 size={16} />
                       </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-8 py-20 text-center">
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em]">Nenhum registro encontrado para este período.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Footer info for Extrato */}
        {filter === 'extrato' && filteredEntries.length > 0 && (
          <div className="px-8 py-6 bg-slate-50/50 border-t border-slate-100 flex justify-between items-center">
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Total de {filteredEntries.length} lançamentos em {monthNames[viewMonth]}</p>
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Saldo do Mês:</span>
              <span className="text-lg font-black text-neutral-950 italic">
                R$ {filteredEntries.reduce((sum, e) => sum + e.amount, 0).toFixed(2)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-neutral-950/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl p-10 animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-black text-neutral-950 uppercase italic tracking-tighter">Novo Lançamento</h3>
              <button onClick={() => setShowAddModal(false)} className="p-2 text-slate-400 hover:text-neutral-950 transition-colors">
                <X size={24} />
              </button>
            </div>

            {formError && (
              <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs font-bold flex items-center gap-3 animate-in fade-in">
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleAddEntry} className="space-y-6">
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Descrição</label>
                <input 
                  type="text" value={description} onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-4 rounded-xl border border-slate-200 focus:border-amber-500 outline-none transition-all font-bold text-sm"
                  placeholder="Ex: Venda de Cera ou Corte Avulso" required
                />
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Valor (R$)</label>
                <input 
                  type="text" 
                  inputMode="decimal"
                  value={amount} 
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full p-4 rounded-xl border border-slate-200 focus:border-amber-500 outline-none transition-all font-black text-lg text-emerald-600"
                  placeholder="Ex: 50,00 ou 50.00" required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Categoria</label>
                  <select 
                    value={category} onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full p-4 rounded-xl border border-slate-200 focus:border-amber-500 outline-none appearance-none font-bold text-xs uppercase"
                  >
                    <option value="servico">Serviço</option>
                    <option value="produto">Produto</option>
                    <option value="outro">Outro</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Pagamento</label>
                  <select 
                    value={method} onChange={(e) => setMethod(e.target.value as any)}
                    className="w-full p-4 rounded-xl border border-slate-200 focus:border-amber-500 outline-none appearance-none font-bold text-xs uppercase"
                  >
                    <option value="dinheiro">Dinheiro</option>
                    <option value="pix">PIX</option>
                    <option value="cartao">Cartão</option>
                  </select>
                </div>
              </div>

              <button 
                type="submit"
                disabled={isSubmitting}
                className="w-full py-5 bg-neutral-950 text-amber-500 font-black rounded-2xl hover:bg-amber-500 hover:text-neutral-950 transition-all shadow-xl uppercase tracking-widest text-[11px] italic disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></span>
                    <span>Salvando...</span>
                  </>
                ) : (
                  <span>Confirmar Lançamento</span>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
