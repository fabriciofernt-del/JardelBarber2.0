
import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    let mounted = true;

    const checkSession = async () => {
      try {
        // Tenta pegar a sessão real do Supabase
        const { data: { session: currentSession } } = await (supabase.auth as any).getSession();
        
        // Verifica se existe uma sessão de "Demo" no localStorage
        const demoSession = localStorage.getItem('jb_admin_session');

        if (mounted) {
          setSession(currentSession || (demoSession ? { user: { email: 'demo@jardelbarber.com' } } : null));
          setLoading(false);
        }
      } catch (err) {
        console.warn("Erro ao verificar sessão Supabase, tentando local...");
        const demoSession = localStorage.getItem('jb_admin_session');
        if (mounted) {
          setSession(demoSession ? { user: { email: 'demo@jardelbarber.com' } } : null);
          setLoading(false);
        }
      }
    };

    checkSession();

    const { data: { subscription } } = (supabase.auth as any).onAuthStateChange((_event: any, newSession: any) => {
      if (mounted) {
        setSession(newSession || (localStorage.getItem('jb_admin_session') ? { user: { email: 'demo@jardelbarber.com' } } : null));
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center gap-6">
        <div className="w-16 h-16 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin"></div>
        <div className="text-center">
          <p className="text-amber-500 text-[10px] font-black uppercase tracking-[0.4em] animate-pulse">Sincronizando</p>
          <p className="text-neutral-600 text-[8px] font-bold uppercase mt-2">Aguarde um momento...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
