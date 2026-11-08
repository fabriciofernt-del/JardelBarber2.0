
import React, { useState, useEffect } from 'react';
import { Users, Plus, UserPlus, Trash2, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';
import { getProfessionals, createProfessional, updateProfessional, deleteProfessional } from '../constants';
import { Professional } from '../types';
import { CURRENT_TENANT } from '../constants';
import { ImageFallback } from '../components/ImageFallback';

export const Professionals: React.FC = () => {
  const [staff, setStaff] = useState<Professional[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newSpecialty, setNewSpecialty] = useState('');
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    const data = await getProfessionals();
    setStaff(data);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newSpecialty) return;
    
    const { error } = await createProfessional({
      name: newName,
      specialty: newSpecialty,
      active: true
    });

    if (!error) {
      loadData();
      setNewName(''); 
      setNewSpecialty(''); 
      setShowAddModal(false);
    }
  };

  const toggleStatus = async (id: number, currentStatus: boolean) => {
    await updateProfessional(id, { active: !currentStatus });
    loadData();
  };

  const removeStaff = async (id: number) => {
    if (confirm('Deseja realmente remover este profissional?')) {
      await deleteProfessional(id);
      loadData();
    }
  };

  if (loading) return <div className="p-10 text-center text-slate-400">Carregando equipe...</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black text-neutral-950 uppercase italic tracking-tighter">Mestres da Tesoura</h2>
          <p className="text-slate-500 text-sm font-bold uppercase tracking-widest mt-2">Sua elite de profissionais especialistas.</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-neutral-950 text-amber-500 px-8 py-4 rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.2em] hover:bg-amber-500 hover:text-neutral-950 transition-all shadow-xl shadow-amber-500/10 flex items-center gap-3 border-2 border-amber-500/20 active:scale-95 italic"
        >
          <UserPlus size={18} /> Novo Profissional
        </button>
      </div>

      <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-12">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-neutral-950 text-amber-500 rounded-2xl flex items-center justify-center shadow-lg shadow-neutral-950/10">
            <Users size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Equipe Total</p>
            <p className="font-black text-neutral-950 text-xl tracking-tight uppercase italic">{staff.length} Membros</p>
          </div>
        </div>
        <div className="w-px h-10 bg-slate-100"></div>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-500 text-neutral-950 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/20">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Em Operação</p>
            <p className="font-black text-neutral-950 text-xl tracking-tight uppercase italic">{staff.filter(p => p.active).length} Ativos</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {staff.map((pro) => (
          <div key={pro.id} className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 group relative overflow-hidden">
            <div className="flex items-start justify-between mb-8">
              <div className="relative">
                <div className={`w-24 h-24 rounded-[2.5rem] flex items-center justify-center text-3xl font-black italic ring-8 ring-offset-4 transition-all duration-500 overflow-hidden ${pro.active ? 'bg-neutral-950 text-amber-500 ring-amber-500/5 ring-offset-white group-hover:rotate-6' : 'bg-slate-100 text-slate-400 ring-slate-50'}`}>
                  <ImageFallback 
                    src={pro.avatar_url || undefined} 
                    alt={pro.name} 
                    className="w-full h-full object-cover" 
                  />
                </div>
                <div className={`absolute -bottom-1 -right-1 w-8 h-8 rounded-full border-4 border-white flex items-center justify-center shadow-lg ${pro.active ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                  {pro.active ? <CheckCircle2 size={16} className="text-white" /> : <XCircle size={16} className="text-white" />}
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => toggleStatus(pro.id, pro.active)} className="p-3 bg-slate-50 text-slate-400 hover:text-amber-500 hover:bg-neutral-950 rounded-2xl transition-all shadow-sm" title={pro.active ? "Bloquear" : "Liberar"}>
                  <RefreshCw size={18} />
                </button>
                <button onClick={() => removeStaff(pro.id)} className="p-3 bg-slate-50 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-2xl transition-all shadow-sm">
                  <Trash2 size={18} />
                </button>
              </div>
            </div>

            <div>
              <h3 className="text-2xl font-black text-neutral-950 mb-1.5 uppercase italic tracking-tighter group-hover:text-amber-500 transition-colors">{pro.name}</h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-8">{pro.specialty}</p>
            </div>

            <div className="pt-6 border-t border-slate-50 flex items-center justify-between">
              <span className={`text-[9px] font-black uppercase tracking-widest px-4 py-1.5 rounded-xl border-2 transition-all ${pro.active ? 'bg-amber-500/10 text-amber-600 border-amber-500/10' : 'bg-slate-50 text-slate-500 border-slate-100'}`}>
                {pro.active ? 'ALTA DISPONIBILIDADE' : 'INDISPONÍVEL'}
              </span>
              <button className="text-[10px] font-black text-neutral-950 hover:text-amber-600 flex items-center gap-2 transition-all uppercase tracking-widest bg-slate-50 px-3 py-1.5 rounded-xl group/btn">
                <span>GESTÃO</span>
                <Plus size={14} className="group-hover/btn:rotate-90 transition-transform" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-neutral-950/40 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl p-12 animate-in zoom-in-95 duration-300 border border-slate-100">
            <h3 className="text-3xl font-black text-neutral-950 mb-2 uppercase italic tracking-tighter">Novo Mestre</h3>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-10">Cadastre um novo especialista na equipe {CURRENT_TENANT?.name || ''}.</p>
            
            <form onSubmit={handleAddStaff} className="space-y-8">
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome Artístico</label>
                <input 
                  type="text" value={newName} onChange={(e) => setNewName(e.target.value)}
                  className="w-full p-5 rounded-2xl border border-slate-200 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 outline-none transition-all font-black text-neutral-950 uppercase italic tracking-tight" 
                  placeholder="EX: JARDEL BARBER" required
                />
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Especialidade Principal</label>
                <input 
                  type="text" value={newSpecialty} onChange={(e) => setNewSpecialty(e.target.value)}
                  className="w-full p-5 rounded-2xl border border-slate-200 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 outline-none transition-all font-black text-neutral-950 uppercase italic tracking-tight" 
                  placeholder="EX: VISAGISMO E BARBA" required
                />
              </div>
              
              <div className="flex gap-6 pt-6">
                <button 
                  type="button" onClick={() => setShowAddModal(false)}
                  className="flex-1 py-5 text-slate-500 font-black uppercase tracking-[0.2em] hover:bg-slate-50 rounded-2xl transition-all text-[10px]"
                >
                  Descartar
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-5 bg-neutral-950 text-amber-500 font-black rounded-2xl hover:bg-amber-500 hover:text-neutral-950 transition-all shadow-2xl shadow-amber-500/10 border-2 border-amber-500/20 uppercase tracking-[0.2em] text-[10px] italic"
                >
                  Adicionar Elite
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
