import React, { useState, useRef, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Trash2, 
  Edit3, 
  Clock, 
  Scissors,
  X,
  Camera,
  Image as ImageIcon,
  Upload,
  DollarSign
} from 'lucide-react';
import { getServices, createService, updateService, deleteService } from '../constants';
import { Service } from '../types';
import { ImageFallback } from '../components/ImageFallback';

export const Services: React.FC = () => {
  const [servicesList, setServicesList] = useState<Service[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);

  const [name, setName] = useState('');
  const [duration, setDuration] = useState('30');
  const [price, setPrice] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(true);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadServices = async () => {
    setLoading(true);
    const data = await getServices();
    setServicesList(data);
    setLoading(false);
  };

  useEffect(() => {
    loadServices();
  }, []);

  const filteredServices = servicesList.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenModal = (service?: Service) => {
    if (service) {
      setEditingService(service);
      setName(service.name);
      setDuration(service.duration_min.toString());
      setPrice(service.price.toString());
      setImageUrl(service.image_url || '');
    } else {
      setEditingService(null);
      setName('');
      setDuration('30');
      setPrice('');
      setImageUrl('');
    }
    setShowModal(true);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !price) return;
    
    if (editingService) {
      const { error } = await updateService(editingService.id, {
        name,
        duration_min: parseInt(duration),
        price: parseFloat(price),
        image_url: imageUrl
      });
      if (!error) loadServices();
    } else {
      const { error } = await createService({
        name,
        duration_min: parseInt(duration),
        price: parseFloat(price),
        active: true,
        image_url: imageUrl
      });
      if (!error) loadServices();
    }
    setShowModal(false);
  };

  const toggleStatus = async (id: number, currentStatus: boolean) => {
    await updateService(id, { active: !currentStatus });
    loadServices();
  };

  const removeService = async (id: number) => {
    if (confirm('Deseja realmente remover este serviço?')) {
      await deleteService(id);
      loadServices();
    }
  };

  if (loading) return <div className="p-10 text-center text-slate-400">Carregando catálogo...</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-neutral-950 flex items-center gap-3 uppercase italic tracking-tighter">
            <div className="bg-neutral-950 p-2.5 rounded-xl">
               <Scissors className="text-amber-500" size={24} /> 
            </div>
            Catálogo de Estilos
          </h2>
          <p className="text-slate-500 text-sm font-bold uppercase tracking-widest mt-2 ml-14">Defina o cardápio de serviços da sua unidade.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-neutral-950 text-amber-500 px-8 py-4 rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.2em] hover:bg-amber-500 hover:text-neutral-950 transition-all shadow-xl shadow-amber-500/10 flex items-center gap-3 border-2 border-amber-500/20 active:scale-95 italic"
        >
          <Plus size={18} /> Novo Serviço
        </button>
      </div>

      <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col md:flex-row items-center gap-6">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="Pesquisar por nome do serviço..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-14 pr-6 py-4 rounded-2xl border border-slate-100 bg-slate-50 text-sm focus:outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 transition-all font-medium"
          />
        </div>
        <div className="flex items-center gap-10 px-6">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/20"></span>
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{servicesList.filter(s => s.active).length} Disponíveis</span>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-300"></span>
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{servicesList.filter(s => !s.active).length} Ocultos</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredServices.map((service) => (
          <div key={service.id} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 overflow-hidden group">
            <div className="aspect-[4/3] bg-neutral-950 relative overflow-hidden">
              <ImageFallback 
                src={service.image_url || undefined} 
                alt={service.name} 
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 opacity-90 group-hover:opacity-100" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-transparent to-transparent opacity-60"></div>
              <div className="absolute top-6 right-6 flex gap-3 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                <button onClick={() => handleOpenModal(service)} className="p-3 bg-white text-neutral-950 rounded-2xl hover:bg-amber-500 transition-all shadow-2xl">
                  <Edit3 size={18} />
                </button>
                <button onClick={() => removeService(service.id)} className="p-3 bg-white text-rose-600 rounded-2xl hover:bg-rose-50 transition-all shadow-2xl">
                  <Trash2 size={18} />
                </button>
              </div>
              <div className="absolute bottom-6 left-6">
                <h3 className="text-xl font-black text-white uppercase italic tracking-tighter group-hover:text-amber-400 transition-colors">{service.name}</h3>
              </div>
            </div>
            
            <div className="p-8 space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <Clock size={16} className="text-amber-500" /> {service.duration_min} MIN
                  </div>
                  <div className="w-1 h-1 bg-slate-200 rounded-full"></div>
                  <div className="flex items-center gap-2 text-[10px] font-black text-neutral-950 uppercase tracking-widest bg-amber-500/10 px-3 py-1 rounded-lg border border-amber-500/20">
                    R$ {service.price.toFixed(2)}
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-50 flex items-center justify-between">
                <button 
                  onClick={() => toggleStatus(service.id, service.active)}
                  className={`text-[10px] font-black uppercase tracking-[0.2em] transition-all px-4 py-2 rounded-xl ${
                    service.active ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'
                  }`}
                >
                  {service.active ? 'EXIBINDO' : 'OCULTO'}
                </button>
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-tighter">REF #{service.id}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-neutral-950/40 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-lg rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-100">
            <div className="bg-neutral-950 p-10 text-white relative">
              <div className="absolute top-0 right-0 p-10 opacity-10 text-amber-500 pointer-events-none">
                 <Scissors size={100} />
              </div>
              <button onClick={() => setShowModal(false)} className="absolute top-8 right-8 p-2.5 bg-neutral-900 hover:bg-neutral-800 rounded-2xl transition-all text-amber-500 border border-neutral-800">
                <X size={20} />
              </button>
              <h3 className="text-3xl font-black mb-1 uppercase italic tracking-tighter">{editingService ? 'Editar' : 'Novo'} Serviço</h3>
              <p className="text-amber-500/60 text-[10px] font-black uppercase tracking-[0.3em]">Gestão de Catálogo Premium</p>
            </div>
            
            <form onSubmit={handleSave} className="p-10 space-y-8">
              <div className="space-y-6">
                <div className="flex flex-col items-center gap-4 mb-4">
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-40 h-40 rounded-[2.5rem] bg-neutral-50 border-4 border-dashed border-slate-100 flex flex-col items-center justify-center text-slate-300 relative overflow-hidden group shadow-inner cursor-pointer hover:border-amber-500/50 transition-all"
                  >
                    <ImageFallback 
                      src={imageUrl || undefined} 
                      className="w-full h-full object-cover" 
                      alt="Preview" 
                    />
                    <div className="absolute inset-0 bg-neutral-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white gap-2">
                       <Upload size={24} />
                       <span className="text-[10px] font-black uppercase tracking-widest">Upar Foto</span>
                    </div>
                  </div>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*" 
                    onChange={handleFileUpload} 
                  />
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Toque para fazer upload direto</p>
                </div>

                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome do Atendimento</label>
                  <input 
                    type="text" value={name} onChange={(e) => setName(e.target.value)}
                    className="w-full p-5 rounded-2xl border border-slate-200 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 outline-none transition-all font-black text-neutral-950 uppercase italic tracking-tight" 
                    placeholder="EX: CORTE MASTER" required
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">URL da Imagem de Capa (Opcional se upado)</label>
                  <div className="relative">
                    <ImageIcon className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input 
                      type="text" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)}
                      className="w-full pl-14 pr-6 py-5 rounded-2xl border border-slate-200 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 outline-none transition-all font-bold text-sm" 
                      placeholder="https://images.unsplash.com/..."
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Duração (Minutos)</label>
                    <div className="relative">
                      <Clock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                      <input 
                        type="number" value={duration} onChange={(e) => setDuration(e.target.value)}
                        className="w-full pl-14 pr-6 py-5 rounded-2xl border border-slate-200 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 outline-none transition-all font-black text-neutral-950" 
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Preço (BRL)</label>
                    <div className="relative">
                      <DollarSign className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                      <input 
                        type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)}
                        className="w-full pl-14 pr-6 py-5 rounded-2xl border border-slate-200 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 outline-none transition-all font-black text-emerald-600" 
                        placeholder="0.00" required
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-6 pt-6">
                <button 
                  type="button" onClick={() => setShowModal(false)}
                  className="flex-1 py-5 text-slate-500 font-black uppercase tracking-[0.2em] hover:bg-slate-50 rounded-2xl transition-all text-[10px]"
                >
                  Descartar
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-5 bg-neutral-950 text-amber-500 font-black rounded-2xl hover:bg-amber-500 hover:text-neutral-950 transition-all shadow-2xl shadow-amber-500/10 border-2 border-amber-500/20 uppercase tracking-[0.2em] text-[10px] italic"
                >
                  Confirmar Estilo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};