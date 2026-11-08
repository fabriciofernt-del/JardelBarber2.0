
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Lock, Mail, ShieldCheck, AlertCircle, Scissors, ArrowRight, RefreshCw } from 'lucide-react';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Senha ou e-mail inválido');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Authenticate with Supabase
      const { data, error: authError } = await (supabase.auth as any).signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (authError) {
        throw authError;
      }
      
      // Store a marker that we are logged in, although Supabase client handles persistence
      localStorage.setItem('jb_admin_session', 'true');
      navigate('/admin', { replace: true });
    } catch (err: any) {
      console.error("Erro de login:", err);
      
      if (err.message?.includes('Invalid login credentials')) {
        setError('Senha ou e-mail inválido');
      } else {
        setError(err.message || 'Erro ao conectar. Verifique sua conexão.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-6">
      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-10">
          <div className="bg-amber-500 w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-amber-500/20 rotate-3 border-4 border-neutral-900">
            <Scissors className="text-neutral-950" size={36} />
          </div>
          <h1 className="text-4xl font-black text-white italic uppercase tracking-tighter">Painel Admin</h1>
          <p className="text-[10px] text-amber-500/60 font-black uppercase tracking-[0.3em] mt-2">Acesso Restrito Scheduly</p>
        </div>

        <div className="bg-neutral-900/50 backdrop-blur-2xl p-10 rounded-[3rem] border border-neutral-800 shadow-2xl">
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest ml-1 mb-2 block">E-mail</label>
              <div className="relative">
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-neutral-600" size={20} />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 p-5 pl-14 rounded-2xl text-white font-bold outline-none focus:border-amber-500 transition-all"
                  placeholder="Seu e-mail"
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest ml-1 mb-2 block">Senha</label>
              <div className="relative">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-neutral-600" size={20} />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 p-5 pl-14 rounded-2xl text-white font-bold outline-none focus:border-amber-500 transition-all"
                  placeholder="Sua senha"
                  autoComplete="current-password"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-xl text-rose-500 text-[11px] font-black uppercase tracking-tight flex items-center gap-3 animate-in fade-in zoom-in-95 duration-300">
                <AlertCircle size={18} className="shrink-0" /> {error}
              </div>
            )}

            <button 
              type="submit"
              disabled={loading}
              className="w-full py-6 bg-amber-500 text-neutral-950 font-black rounded-2xl hover:bg-amber-400 transition-all flex items-center justify-center gap-3 uppercase tracking-widest italic disabled:opacity-50 shadow-lg shadow-amber-500/10 active:scale-95"
            >
              {loading ? <RefreshCw className="animate-spin" /> : <ShieldCheck size={20} />}
              {loading ? 'Validando...' : 'Entrar no Painel'}
            </button>
          </form>
        </div>
        
        <button onClick={() => navigate('/')} className="mt-8 w-full text-neutral-600 hover:text-white text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-colors italic">
          Voltar para Agendamentos <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
};
