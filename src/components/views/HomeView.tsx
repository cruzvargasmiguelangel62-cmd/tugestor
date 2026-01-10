import React from 'react';
import { User, TrendingUp, FileText } from 'lucide-react';
import { Quote, Profile, ViewState } from '../../types';
import { Screen, NavBar } from '../Shared';
import { money, formatDate } from '../../utils';

interface HomeViewProps {
  view: ViewState;
  setView: (view: ViewState) => void;
  profile: Profile;
  quotes: Quote[];
  setActiveQuote: (quote: Quote) => void;
}

const HomeView: React.FC<HomeViewProps> = ({ view, setView, profile, quotes, setActiveQuote }) => {
  
  // Logic for Chart
  const getLast6Months = () => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      months.push(d);
    }
    return months;
  };

  const chartData = getLast6Months().map(date => {
    const key = date.toISOString().slice(0, 7); // YYYY-MM
    const total = quotes
      .filter(q => q.status === 'pagada' && q.date.startsWith(key))
      .reduce((acc, q) => acc + q.total, 0);
    return { label: date.toLocaleDateString('es-MX', { month: 'short' }).replace('.', ''), total };
  });

  const maxVal = Math.max(...chartData.map(d => d.total)) || 1;

  return (
    <Screen className="pb-4 sm:py-4 md:py-6 lg:py-8">
      {/* Header Card - Responsive - Compacto en móvil con espacio suficiente para no tapar logo */}
      <div className="bg-slate-900 pt-10 px-4 pb-6 sm:pt-6 sm:p-6 md:p-8 lg:p-10 sm:pb-12 md:pb-16 lg:pb-20 sm:rounded-2xl lg:rounded-3xl shadow-xl relative overflow-visible mb-3 sm:mb-6 lg:mb-8 mt-6 sm:mt-0">
        {/* Header con Logo y Nombre - Compacto y completo con logo vertical visible */}
        <div className="flex items-start gap-3 sm:gap-4 md:gap-6 relative z-10 mb-4 sm:mb-6 lg:mb-8 mt-2 sm:mt-0">
          <div className="w-12 h-16 sm:w-14 sm:h-20 md:w-20 md:h-28 lg:w-24 lg:h-32 bg-white/10 rounded-lg sm:rounded-xl lg:rounded-2xl flex items-center justify-center border border-white/10 overflow-hidden shrink-0 flex-shrink-0">
             {profile.logo ? (
               <img src={profile.logo} className="w-auto h-full max-w-full max-h-full object-contain p-1 sm:p-1.5 md:p-2" alt="Logo" />
             ) : (
               <User className="text-white/50 w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 shrink-0"/>
             )}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="font-bold text-base sm:text-xl md:text-2xl lg:text-3xl text-white leading-tight break-words">{profile.name}</h1>
            <p className="text-[10px] sm:text-xs md:text-sm lg:text-base text-slate-400 break-words mt-0.5 line-clamp-2">{profile.slogan || 'Bienvenido'}</p>
          </div>
        </div>

        {/* REVENUE CHART - Compacto en móvil */}
        <div className="relative z-10">
           <div className="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3 lg:mb-4">
             <TrendingUp size={14} className="text-green-400 sm:w-4 sm:h-4 md:w-5 md:h-5 lg:w-6 lg:h-6 shrink-0"/>
             <span className="text-[10px] sm:text-xs md:text-sm font-bold text-slate-400 uppercase tracking-wider">Ingresos (6 Meses)</span>
           </div>
           <div className="flex items-end justify-between gap-1 sm:gap-2 md:gap-3 h-20 sm:h-28 md:h-32 lg:h-40">
              {chartData.map((d, i) => (
                <div key={i} className="flex flex-col items-center flex-1 group">
                   <div className="w-full bg-slate-800 rounded-t-md lg:rounded-t-lg relative flex items-end justify-center group-hover:bg-slate-700 transition-colors overflow-hidden h-full">
                      <div 
                        className="w-full bg-gradient-to-t from-blue-600 to-blue-400 opacity-90 rounded-t-md lg:rounded-t-lg transition-all duration-300" 
                        style={{ height: `${(d.total / maxVal) * 100}%` }}
                      ></div>
                   </div>
                   <span className="text-[9px] sm:text-[10px] md:text-xs text-slate-500 mt-1 sm:mt-2 uppercase font-bold">{d.label}</span>
                </div>
              ))}
           </div>
        </div>
      </div>
      
      {/* Recent Quotes Section - Responsive Grid */}
      <div className="space-y-3 sm:space-y-4 lg:space-y-6 px-4 sm:px-0 mt-4 sm:mt-0">
        <h2 className="font-bold text-base sm:text-lg lg:text-xl text-slate-800 flex items-center gap-2">
          <FileText size={18} className="text-slate-500"/>
          Cotizaciones Recientes
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 pb-4">
          {quotes.slice(0, 8).map(q => (
            <div 
              key={q.id} 
              onClick={() => { setActiveQuote(q); setView('preview'); }} 
              className="bg-white p-4 sm:p-5 lg:p-6 rounded-xl lg:rounded-2xl shadow-sm hover:shadow-md border border-slate-100 hover:border-slate-300 flex flex-col justify-between cursor-pointer transition-all active:scale-[0.98] lg:active:scale-[0.99] group"
            >
              <div className="min-w-0 mb-3">
                <div className="font-bold text-slate-800 text-sm sm:text-base truncate mb-1 group-hover:text-slate-900">{q.client}</div>
                <div className="text-xs text-slate-400 mb-2">#{q.folio} • {formatDate(q.date)}</div>
                {q.title && (
                  <div className="text-xs text-slate-500 truncate mb-2">{q.title}</div>
                )}
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${q.status === 'pagada' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                  {q.status}
                </span>
                <div className="font-bold text-slate-900 text-sm sm:text-base lg:text-lg">{money(q.total)}</div>
              </div>
            </div>
          ))}
        </div>
        {quotes.length === 0 && (
          <div className="text-center text-slate-400 text-sm py-12 lg:py-16 bg-white sm:rounded-xl border border-slate-100 mx-4 sm:mx-0">
            <FileText size={48} className="mx-auto mb-3 text-slate-300"/>
            <p>No hay cotizaciones aún</p>
            <p className="text-xs mt-1">Crea tu primera cotización para comenzar</p>
          </div>
        )}
      </div>
      
    </Screen>
  );
};

export default HomeView;