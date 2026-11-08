
import React, { useState } from 'react';
import { 
  Instagram, 
  Facebook, 
  Phone, 
  Save, 
  CheckCircle2, 
  ExternalLink,
  Share2,
  AlertCircle,
  Smartphone
} from 'lucide-react';
import { SETTINGS } from '../constants';

export const SocialLinks: React.FC = () => {
  const [instagram, setInstagram] = useState(SETTINGS.social_instagram || '');
  const [facebook, setFacebook] = useState(SETTINGS.social_facebook || '');
  const [whatsapp, setWhatsapp] = useState(SETTINGS.whatsapp_number || '');
  
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    
    const updatedSettings = {
      ...SETTINGS,
      social_instagram: instagram,
      social_facebook: facebook,
      whatsapp_number: whatsapp
    };

    setTimeout(() => {
      localStorage.setItem('jb_settings_data', JSON.stringify(updatedSettings));
      setIsSaving(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }, 1000);
  };

  const testLink = (url: string) => {
    if (!url) return;
    if (url.startsWith('http')) {
      window.open(url, '_blank');
    } else if (url.match(/^\d+$/)) {
      window.open(`https://wa.me/${url}`, '_blank');
    }
  };

  return (
    <div className="max-w-4xl space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex justify-between items-center mb-2">
        <div>
          <h2 className="text-3xl font-black text-neutral-950 uppercase italic tracking-tighter">Conexões Sociais</h2>
          <p className="text-slate-500 text-sm font-bold uppercase tracking-widest mt-2">Gerencie como seus clientes encontram você online.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm space-y-10">
          <div className="flex items-center gap-4 border-b border-slate-50 pb-8">
             <div className="bg-amber-500 text-neutral-950 p-3 rounded-2xl shadow-lg shadow-amber-500/20">
                <Share2 size={24} />
             </div>
             <div>
                <h3 className="text-xl font-black text-neutral-950 uppercase italic tracking-tighter">Links de Redirecionamento</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Estes links aparecerão no rodapé da sua página pública</p>
             </div>
          </div>

          <div className="space-y-8">
            {/* Instagram */}
            <div className="group">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1 group-focus-within:text-amber-500 transition-colors">Perfil do Instagram</label>
              <div className="flex gap-4">
                <div className="relative flex-1">
                  <div className="absolute left-5 top-1/2 -translate-y-1/2 p-2 bg-gradient-to-tr from-purple-500 to-pink-500 rounded-lg text-white">
                    <Instagram size={18} />
                  </div>
                  <input 
                    type="text" 
                    value={instagram}
                    onChange={(e) => setInstagram(e.target.value)}
                    placeholder="https://instagram.com/seu_perfil"
                    className="w-full pl-16 pr-6 py-5 rounded-2xl border-2 border-slate-100 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/5 outline-none transition-all font-bold text-sm bg-slate-50/50" 
                  />
                </div>
                <button 
                  onClick={() => testLink(instagram)}
                  disabled={!instagram}
                  className="px-6 rounded-2xl border-2 border-slate-100 hover:border-amber-500 text-slate-400 hover:text-amber-500 transition-all disabled:opacity-30"
                >
                  <ExternalLink size={20} />
                </button>
              </div>
            </div>

            {/* Facebook */}
            <div className="group">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1 group-focus-within:text-amber-500 transition-colors">Página do Facebook</label>
              <div className="flex gap-4">
                <div className="relative flex-1">
                  <div className="absolute left-5 top-1/2 -translate-y-1/2 p-2 bg-blue-600 rounded-lg text-white">
                    <Facebook size={18} />
                  </div>
                  <input 
                    type="text" 
                    value={facebook}
                    onChange={(e) => setFacebook(e.target.value)}
                    placeholder="https://facebook.com/sua_pagina"
                    className="w-full pl-16 pr-6 py-5 rounded-2xl border-2 border-slate-100 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/5 outline-none transition-all font-bold text-sm bg-slate-50/50" 
                  />
                </div>
                <button 
                  onClick={() => testLink(facebook)}
                  disabled={!facebook}
                  className="px-6 rounded-2xl border-2 border-slate-100 hover:border-amber-500 text-slate-400 hover:text-amber-500 transition-all disabled:opacity-30"
                >
                  <ExternalLink size={20} />
                </button>
              </div>
            </div>

            {/* WhatsApp */}
            <div className="group">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1 group-focus-within:text-amber-500 transition-colors">WhatsApp Business</label>
              <div className="flex gap-4">
                <div className="relative flex-1">
                  <div className="absolute left-5 top-1/2 -translate-y-1/2 p-2 bg-emerald-500 rounded-lg text-white">
                    <Phone size={18} />
                  </div>
                  <input 
                    type="text" 
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="DDI + DDD + Número (ex: 5585999999999)"
                    className="w-full pl-16 pr-6 py-5 rounded-2xl border-2 border-slate-100 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/5 outline-none transition-all font-bold text-sm bg-slate-50/50" 
                  />
                </div>
                <button 
                  onClick={() => testLink(whatsapp)}
                  disabled={!whatsapp}
                  className="px-6 rounded-2xl border-2 border-slate-100 hover:border-amber-500 text-slate-400 hover:text-amber-500 transition-all disabled:opacity-30"
                >
                  <Smartphone size={20} />
                </button>
              </div>
            </div>
          </div>

          <div className="pt-10 border-t border-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {saveSuccess && (
                <div className="flex items-center gap-2 text-emerald-500 font-black uppercase text-[10px] tracking-widest animate-in fade-in slide-in-from-left-4">
                  <CheckCircle2 size={16} /> Canais Sociais Atualizados!
                </div>
              )}
            </div>
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className="bg-neutral-950 text-amber-500 px-12 py-6 rounded-[2rem] font-black hover:bg-amber-500 hover:text-neutral-950 transition-all shadow-2xl shadow-amber-500/10 flex items-center gap-3 uppercase tracking-[0.2em] text-xs italic border-2 border-amber-500/20 active:scale-95 disabled:opacity-50"
            >
              {isSaving ? (
                <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Save size={20} />
              )}
              {isSaving ? 'SINCROIZANDO...' : 'PUBLICAR NAS CONEXÕES'}
            </button>
          </div>
        </div>

        <div className="bg-neutral-950 p-10 rounded-[3rem] border border-neutral-900 shadow-2xl relative overflow-hidden flex items-center gap-8">
           <div className="absolute top-0 right-0 p-8 opacity-5 text-white pointer-events-none">
              <Share2 size={120} />
           </div>
           <div className="w-20 h-20 bg-amber-500 rounded-3xl flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/20 rotate-6">
              <AlertCircle size={32} className="text-neutral-950" />
           </div>
           <div>
              <h4 className="text-white font-black uppercase italic text-lg tracking-tight mb-2">Comportamento Seguro</h4>
              <p className="text-neutral-500 text-xs leading-relaxed font-medium">
                Seus clientes não perderão o progresso do agendamento ao clicar nas redes sociais. Os links estão configurados para abrir em <b>novas abas</b>, mantendo sua barbearia sempre no foco principal deles.
              </p>
           </div>
        </div>
      </div>
    </div>
  );
};
