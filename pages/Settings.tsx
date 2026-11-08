
import React, { useState, useEffect, useRef } from 'react';
import { 
  Camera, 
  Save, 
  MapPin, 
  ImageIcon, 
  CheckCircle2, 
  Scissors, 
  Upload, 
  Image as LucideImage,
  Smartphone,
  Copy,
  QrCode,
  AlertCircle
} from 'lucide-react';
import { getTenant, getSettings, updateTenant, updateSettings, DEFAULT_TENANT, DEFAULT_SETTINGS } from '../constants';
import { ImageFallback } from '../components/ImageFallback';

export const Settings: React.FC = () => {
  const [tenantName, setTenantName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [headerBgUrl, setHeaderBgUrl] = useState('');
  const [instagram, setInstagram] = useState('');
  const [facebook, setFacebook] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pixCopyPaste, setPixCopyPaste] = useState('');
  const [pixQrUrl, setPixQrUrl] = useState('');
  
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const logoInputRef = useRef<HTMLInputElement>(null);
  const headerInputRef = useRef<HTMLInputElement>(null);
  const pixQrInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [t, s] = await Promise.all([getTenant(), getSettings()]);
        setTenantName(t.name);
        setLogoUrl(t.logo_url || '');
        setHeaderBgUrl(t.header_bg_url || '');
        
        setAddress(s.location_address || '');
        setCity(s.location_city || '');
        setState(s.location_state || '');
        setInstagram(s.social_instagram || '');
        setFacebook(s.social_facebook || '');
        setWhatsapp(s.whatsapp_number || '');
        setPixCopyPaste(s.pix_copy_paste || '');
        setPixQrUrl(s.pix_qr_url || '');
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    
    try {
      await updateTenant({
        name: tenantName,
        logo_url: logoUrl,
        header_bg_url: headerBgUrl
      });

      await updateSettings({
        location_address: address,
        location_city: city,
        location_state: state,
        social_instagram: instagram,
        social_facebook: facebook,
        whatsapp_number: whatsapp,
        pix_copy_paste: pixCopyPaste,
        pix_qr_url: pixQrUrl
      });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      
      // Force reload to update Layout context if needed, or we could use Context API
      // window.location.reload(); 
    } catch (error) {
      console.error(error);
      alert('Erro ao salvar');
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'header' | 'pixqr') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        if (type === 'logo') setLogoUrl(base64);
        else if (type === 'header') setHeaderBgUrl(base64);
        else if (type === 'pixqr') setPixQrUrl(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  if (loading) return <div className="p-10 text-center text-slate-400">Carregando configurações...</div>;

  return (
    <div className="max-w-4xl space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        {/* Header Preview / Cover Photo */}
        <div className="h-64 bg-neutral-950 relative overflow-hidden group/header">
          {headerBgUrl ? (
            <ImageFallback 
              src={headerBgUrl} 
              alt="Background Preview" 
              className="w-full h-full object-cover opacity-60 group-hover/header:scale-105 transition-transform duration-700" 
            />
          ) : (
            <div className="w-full h-full bg-neutral-900 flex flex-col items-center justify-center gap-2">
               <LucideImage size={48} className="text-neutral-800" />
               <span className="text-[10px] font-black text-neutral-800 uppercase tracking-widest">Sem Imagem de Capa</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 to-transparent"></div>
          
          <div className="absolute top-8 right-8 flex gap-3 z-20">
            <button 
              onClick={() => headerInputRef.current?.click()}
              className="px-6 py-4 bg-white text-neutral-950 rounded-2xl hover:bg-amber-500 transition-all shadow-2xl flex items-center gap-3 text-[11px] font-black uppercase tracking-widest italic group/btn"
            >
              <Upload size={18} className="group-hover/btn:scale-110 transition-transform" /> UPAR FOTO DE CAPA
            </button>
            <input type="file" ref={headerInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'header')} />
          </div>

          <div className="absolute -bottom-14 left-12">
            <div className="relative group/logo">
              <div className="w-40 h-40 rounded-[2.5rem] bg-neutral-950 p-2 shadow-[0_25px_60px_-10px_rgba(0,0,0,0.6)] border-4 border-white overflow-hidden flex items-center justify-center">
                {logoUrl ? (
                  <ImageFallback 
                    src={logoUrl} 
                    alt="Logo Preview" 
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <span className="text-3xl font-black text-amber-500 italic">JB</span>
                )}
              </div>
              <button 
                onClick={() => logoInputRef.current?.click()}
                className="absolute inset-0 bg-neutral-950/70 rounded-[2.5rem] opacity-0 group-hover/logo:opacity-100 transition-opacity flex flex-col items-center justify-center text-white gap-2 border-4 border-amber-500/50"
              >
                <Camera size={32} />
                <span className="text-[10px] font-black uppercase tracking-widest italic">TROCAR PERFIL</span>
              </button>
              <input type="file" ref={logoInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'logo')} />
            </div>
          </div>
        </div>
        
        <div className="pt-24 p-12 space-y-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* Visual Identity Section */}
            <div className="space-y-8">
              <div className="flex items-center gap-4">
                <div className="bg-amber-500 text-neutral-950 p-3 rounded-2xl shadow-lg shadow-amber-500/20">
                  <Scissors size={24} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-neutral-950 uppercase italic tracking-tighter">Identidade Visual</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Customize a marca da sua barbearia</p>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 ml-1">Nome da Barbearia</label>
                  <input 
                    type="text" 
                    value={tenantName}
                    onChange={(e) => setTenantName(e.target.value)}
                    className="w-full p-5 rounded-2xl border-2 border-slate-100 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/5 outline-none transition-all font-black text-neutral-950 italic uppercase tracking-tight text-lg" 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 ml-1">URL da Logo</label>
                  <div className="relative">
                    <ImageIcon className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                    <input 
                      type="text" 
                      value={logoUrl}
                      onChange={(e) => setLogoUrl(e.target.value)}
                      placeholder="URL da imagem (upload acima também funciona)"
                      className="w-full pl-14 pr-5 py-5 rounded-2xl border-2 border-slate-100 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/5 outline-none transition-all font-bold text-xs" 
                    />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Location Section */}
            <div className="space-y-8">
              <div className="flex items-center gap-4">
                <div className="bg-amber-500 text-neutral-950 p-3 rounded-2xl shadow-lg shadow-amber-500/20">
                  <MapPin size={24} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-neutral-950 uppercase italic tracking-tighter">Localização</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Endereço da unidade física</p>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 ml-1">Endereço Completo</label>
                  <input 
                    type="text" 
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Rua, Número, Bairro"
                    className="w-full p-5 rounded-2xl border-2 border-slate-100 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/5 outline-none transition-all font-black text-neutral-900 text-sm" 
                  />
                </div>
                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 ml-1">Cidade</label>
                    <input 
                      type="text" 
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full p-5 rounded-2xl border-2 border-slate-100 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/5 outline-none transition-all font-black text-sm" 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 ml-1">UF</label>
                    <input 
                      type="text" 
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      className="w-full p-5 rounded-2xl border-2 border-slate-100 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/5 outline-none transition-all font-black text-sm" 
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Settings Section */}
          <div className="pt-12 border-t border-slate-100 space-y-8">
            <div className="flex items-center gap-4">
              <div className="bg-amber-500 text-neutral-950 p-3 rounded-2xl shadow-lg shadow-amber-500/20">
                <Smartphone size={24} />
              </div>
              <div>
                <h3 className="text-2xl font-black text-neutral-950 uppercase italic tracking-tighter">Pagamentos PIX</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Configure o recebimento instantâneo</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 ml-1">Código PIX Copia e Cola</label>
                  <div className="relative group">
                    <Copy className="absolute left-5 top-5 text-slate-300 group-focus-within:text-amber-500" size={20} />
                    <textarea 
                      value={pixCopyPaste}
                      onChange={(e) => setPixCopyPaste(e.target.value)}
                      placeholder="Cole aqui o código do seu PIX Copia e Cola"
                      className="w-full pl-14 pr-5 py-5 rounded-2xl border-2 border-slate-100 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/5 outline-none transition-all font-mono text-[10px] bg-slate-50/50 min-h-[120px]" 
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 ml-1">QR Code do PIX (Imagem)</label>
                  <div className="flex items-start gap-4">
                    <div 
                      onClick={() => pixQrInputRef.current?.click()}
                      className="w-32 h-32 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-300 hover:border-amber-500 transition-all cursor-pointer bg-slate-50 relative overflow-hidden group"
                    >
                      {pixQrUrl ? (
                        <ImageFallback src={pixQrUrl} className="w-full h-full object-contain" alt="PIX QR" />
                      ) : (
                        <QrCode size={24} />
                      )}
                      <div className="absolute inset-0 bg-neutral-950/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                         <Upload size={16} className="text-white" />
                      </div>
                    </div>
                    <div className="flex-1 space-y-2">
                       <input 
                         type="text" 
                         value={pixQrUrl}
                         onChange={(e) => setPixQrUrl(e.target.value)}
                         placeholder="URL da imagem do QR Code"
                         className="w-full p-4 rounded-xl border border-slate-200 text-xs font-bold"
                       />
                       <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-relaxed">
                         <AlertCircle size={10} className="inline mr-1" /> Upe a imagem do seu QR Code gerado no banco para que o cliente escaneie diretamente.
                       </p>
                    </div>
                    <input type="file" ref={pixQrInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'pixqr')} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-12 border-t border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {saveSuccess && (
                <div className="flex items-center gap-2 text-emerald-500 font-black uppercase text-[10px] tracking-widest animate-in fade-in slide-in-from-left-4">
                  <CheckCircle2 size={16} /> Ajustes Salvos com Sucesso!
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
              {isSaving ? 'SINCROIZANDO...' : 'SALVAR ALTERAÇÕES'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
