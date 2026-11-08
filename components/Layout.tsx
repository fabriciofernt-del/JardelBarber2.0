import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Clock, 
  Users, 
  Settings, 
  ChevronRight,
  LogOut,
  Sparkles,
  Briefcase,
  Scissors,
  DollarSign,
  Share2,
  Menu,
  X
} from 'lucide-react';
import { getTenant, DEFAULT_TENANT } from '../constants';
import { Tenant } from '../types';
import { supabase } from '../supabaseClient';
import { ImageFallback } from './ImageFallback';

const SidebarItem: React.FC<{
  to: string;
  icon: React.ElementType;
  label: string;
  active: boolean;
  onClick?: () => void;
}> = ({ to, icon: Icon, label, active, onClick }) => (
  <Link
    to={to}
    onClick={onClick}
    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
      active 
        ? 'bg-amber-500 text-neutral-950 shadow-lg shadow-amber-500/20 font-bold' 
        : 'text-neutral-400 hover:text-amber-400 hover:bg-neutral-900'
    }`}
  >
    <Icon size={20} className={active ? 'text-neutral-950' : 'text-amber-500/70'} />
    <span className="text-sm uppercase tracking-widest font-black">{label}</span>
    {active && <ChevronRight size={16} className="ml-auto" />}
  </Link>
);

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [tenant, setTenant] = useState<Tenant>(DEFAULT_TENANT);

  useEffect(() => {
    getTenant().then(setTenant);
  }, []);

  const handleLogout = async () => {
    await (supabase.auth as any).signOut();
    localStorage.removeItem('jb_admin_session');
    navigate('/login');
  };

  const closeSidebar = () => setIsSidebarOpen(false);

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans overflow-x-hidden">
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-neutral-950/60 backdrop-blur-sm z-[60] lg:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-[70] w-72 bg-neutral-950 flex flex-col border-r border-neutral-900 shadow-2xl transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:w-64
      `}>
        <div className="p-8">
          <div className="flex items-center justify-between mb-12">
            <div className="flex items-center gap-3">
              <div className="bg-amber-500 p-2.5 rounded-2xl shadow-lg shadow-amber-500/20 rotate-3">
                <Scissors className="text-neutral-950" size={24} />
              </div>
              <div>
                <h1 className="text-xl font-black text-white tracking-tighter uppercase italic">Scheduly</h1>
                <p className="text-[8px] font-black text-amber-500 uppercase tracking-[0.3em]">Premium Engine</p>
              </div>
            </div>
            <button onClick={closeSidebar} className="lg:hidden text-neutral-500 hover:text-white">
              <X size={24} />
            </button>
          </div>

          <nav className="space-y-2">
            <SidebarItem to="/admin" icon={LayoutDashboard} label="Dashboard" active={location.pathname === '/admin'} onClick={closeSidebar} />
            <SidebarItem to="/appointments" icon={Clock} label="Agenda" active={location.pathname === '/appointments'} onClick={closeSidebar} />
            <SidebarItem to="/professionals" icon={Users} label="Equipe" active={location.pathname === '/professionals'} onClick={closeSidebar} />
            <SidebarItem to="/services" icon={Briefcase} label="Serviços" active={location.pathname === '/services'} onClick={closeSidebar} />
            <SidebarItem to="/revenue" icon={DollarSign} label="Faturamento" active={location.pathname === '/revenue'} onClick={closeSidebar} />
            <SidebarItem to="/social" icon={Share2} label="Conexões" active={location.pathname === '/social'} onClick={closeSidebar} />
            <SidebarItem to="/settings" icon={Settings} label="Ajustes" active={location.pathname === '/settings'} onClick={closeSidebar} />
          </nav>
        </div>

        <div className="mt-auto p-6 space-y-4">
          <Link 
            to={`/booking/${tenant.slug}`} 
            className="flex items-center justify-center gap-2 px-4 py-4 bg-amber-500/5 text-amber-500 rounded-2xl border border-amber-500/20 shadow-lg"
          >
            <Sparkles size={18} />
            <span className="text-xs font-black uppercase tracking-widest italic">Página Pública</span>
          </Link>
          <div className="pt-6 border-t border-neutral-900">
            <div className="flex items-center gap-3 px-2 mb-6 text-left">
              <div className="w-10 h-10 rounded-xl border-2 border-neutral-800 overflow-hidden bg-neutral-900 shrink-0">
                <ImageFallback src={tenant.logo_url || undefined} alt="Logo" className="w-full h-full object-cover" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-black text-white truncate italic uppercase tracking-tighter">Admin Master</span>
                <span className="text-[8px] text-amber-500/60 uppercase tracking-widest font-black truncate">{tenant.name}</span>
              </div>
            </div>
            <button 
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 text-neutral-500 hover:text-rose-500 transition-all font-black text-[9px] uppercase tracking-[0.2em]"
            >
              <LogOut size={16} />
              <span>Sair do Painel</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <header className="lg:hidden flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200 sticky top-0 z-50">
          <div className="flex items-center gap-2">
            <div className="bg-neutral-950 p-1.5 rounded-lg shadow-sm">
              <Scissors className="text-amber-500" size={16} />
            </div>
            <span className="font-black italic uppercase tracking-tighter text-neutral-950 text-sm">Scheduly</span>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 bg-slate-100 text-neutral-950 rounded-lg active:scale-95 transition-all"
          >
            <Menu size={20} />
          </button>
        </header>

        <main className="flex-1 lg:ml-64 p-4 md:p-8 lg:p-10 transition-all duration-300">
          <header className="hidden lg:flex justify-between items-center mb-10">
            <div className="flex items-center gap-6">
              <ImageFallback 
                src={tenant.logo_url || undefined} 
                alt={`${tenant.name} logo`} 
                className="w-20 h-20 rounded-full object-cover border-2 border-white shadow-xl" 
              />
              <div>
                <h2 className="text-2xl font-black text-neutral-950 tracking-tighter uppercase italic leading-none">
                  Bem-vindo, <span className="text-amber-500">Jardel</span>!
                </h2>
                <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-1">Gestão inteligente ativa</p>
              </div>
            </div>
          </header>

          <div className="relative">
             {children}
          </div>
        </main>
      </div>
    </div>
  );
};