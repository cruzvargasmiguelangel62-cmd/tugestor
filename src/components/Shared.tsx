import React, { forwardRef, memo } from 'react';
import { Home, Book, Plus, FileText, User } from 'lucide-react';
import { ViewState } from '../types';

// --- SCREEN WRAPPER ---
// Mejora: 'pt-[env...]' evita que el contenido choque con la barra de estado/notch
export const Screen: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = "" }) => (
  <main className={`min-h-[100dvh] bg-gray-50 text-slate-800 font-sans pb-28 pt-[env(safe-area-inset-top)] w-full overflow-x-hidden selection:bg-indigo-100 selection:text-indigo-900 ${className}`}>
    {children}
  </main>
);

// --- NAVIGATION BUTTON ---
interface NavBtnProps {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}

const NavBtn: React.FC<NavBtnProps> = memo(({ icon, label, active, onClick }) => (
  <button 
    onClick={onClick} 
    aria-current={active ? 'page' : undefined}
    className={`group flex flex-col items-center justify-center w-16 py-1 gap-1 transition-all duration-200 active:scale-95 ${
      active ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600'
    }`}
  >
    <div className={`transition-transform duration-200 ${active ? 'scale-110 drop-shadow-sm' : ''}`}>
      {icon}
    </div>
    <span className={`text-[10px] leading-none font-medium transition-colors ${active ? 'font-bold' : ''}`}>
      {label}
    </span>
  </button>
));

NavBtn.displayName = 'NavBtn';

// --- NAVIGATION BAR ---
interface NavBarProps {
  view: ViewState;
  setView: (view: ViewState) => void;
}

// Mejora: Alineación 'items-center' para mejor simetría vertical
export const NavBar: React.FC<NavBarProps> = ({ view, setView }) => (
  <nav className="fixed bottom-0 left-0 w-full bg-white/90 backdrop-blur-md border-t border-slate-200/60 px-2 py-2 flex justify-around items-center z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] pb-[env(safe-area-inset-bottom)]">
    <NavBtn icon={<Home size={22} />} label="Inicio" active={view === 'home'} onClick={() => setView('home')} />
    <NavBtn icon={<Book size={22} />} label="Catálogo" active={view === 'catalog'} onClick={() => setView('catalog')} />
    
    {/* Botón Flotante Central (FAB) */}
    <div className="relative -top-8 group">
      <button 
        onClick={() => setView('editor_new')}
        aria-label="Nueva Cotización"
        className="bg-slate-900 text-white w-14 h-14 rounded-full shadow-xl shadow-slate-900/30 flex items-center justify-center active:scale-90 transition-all duration-300 border-4 border-gray-50 group-hover:-translate-y-1"
      >
        <Plus size={28} strokeWidth={2.5} />
      </button>
    </div>
    
    <NavBtn icon={<FileText size={22} />} label="Historial" active={view === 'history'} onClick={() => setView('history')} />
    <NavBtn icon={<User size={22} />} label="Perfil" active={view === 'settings'} onClick={() => setView('settings')} />
  </nav>
);

// --- INPUT FIELD ---
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  containerClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, containerClassName, ...props }, ref) => (
    <div className={`mb-4 w-full ${containerClassName || ''}`}>
      {label && (
        <label htmlFor={props.id} className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1 tracking-wide">
          {label}
        </label>
      )}
      <div className="relative">
        <input 
          ref={ref}
          className={`
            w-full bg-white border rounded-xl p-3.5 text-base outline-none transition-all shadow-sm appearance-none
            placeholder:text-slate-300
            disabled:bg-slate-50 disabled:text-slate-400
            ${error 
              ? 'border-red-400 focus:ring-4 focus:ring-red-100 text-red-900' 
              : 'border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 text-slate-800'
            }
            ${className || ''}
          `}
          {...props}
        />
      </div>
      {error && (
        <p role="alert" className="text-red-500 text-xs mt-1.5 ml-1 font-medium animate-pulse">
          {error}
        </p>
      )}
    </div>
  )
);

Input.displayName = 'Input';