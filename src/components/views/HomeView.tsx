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
      <div className="bg-slate-900 pt-10 px-6 pb-8 sm:pt-8 sm:p-8 md:p-10 lg:p-12 sm:rounded-3xl shadow-2xl relative overflow-hidden mb-6 sm:mb-8 lg:mb-10 mt-6 md:mt-0 ring-1 ring-white/10">
        {/* Background Decoration */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-[100px] -mr-32 -mt-32 rounded-full"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-500/10 blur-[60px] -ml-16 -mb-16 rounded-full"></div>

        {/* Header con Logo y Nombre */}
        <div className="flex items-center gap-4 sm:gap-6 md:gap-8 relative z-10 mb-8 sm:mb-10 lg:mb-12">
          <div className="w-16 h-20 sm:w-20 sm:h-28 md:w-24 md:h-32 lg:w-28 lg:h-36 bg-gradient-to-br from-white/20 to-white/5 rounded-2xl flex items-center justify-center border border-white/20 overflow-hidden shadow-2xl backdrop-blur-sm shrink-0">
            {profile.logo ? (
              <img src={profile.logo} className="w-auto h-full max-w-full max-h-full object-contain p-2" alt="Logo" />
            ) : (
              <User className="text-white/30 w-10 h-10 md:w-16 md:h-16" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="font-extrabold text-xl sm:text-2xl md:text-3xl lg:text-4xl text-white leading-tight tracking-tight">{profile.name}</h1>
            <p className="text-xs sm:text-sm md:text-base text-slate-400 mt-1 max-w-lg font-medium">{profile.slogan || 'Gestión Profesional de Cotizaciones'}</p>
          </div>
        </div>

        {/* REVENUE CHART */}
        <div className="relative z-10 bg-white/5 p-4 sm:p-6 rounded-2xl border border-white/5 backdrop-blur-md">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-green-500/20 rounded-lg">
                <TrendingUp size={16} className="text-green-400" />
              </div>
              <span className="text-xs md:text-sm font-bold text-slate-300 uppercase tracking-widest">Ingresos Mensuales</span>
            </div>
            <div className="text-[10px] md:text-xs text-slate-500 font-bold bg-white/5 px-2 py-1 rounded-md">Últimos 6 meses</div>
          </div>
          <div className="flex items-end justify-between gap-2 sm:gap-4 md:gap-6 h-24 sm:h-32 md:h-40 lg:h-48 px-2">
            {chartData.map((d, i) => (
              <div key={i} className="flex flex-col items-center flex-1 group relative">
                {/* Tooltip on hover */}
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-white text-slate-900 text-[10px] font-bold px-2 py-1 rounded shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 whitespace-nowrap">
                  {money(d.total)}
                </div>

                <div className="w-full bg-slate-800/50 rounded-t-xl relative flex items-end justify-center group-hover:bg-slate-800 transition-all duration-300 overflow-hidden h-full">
                  <div
                    className="w-full bg-gradient-to-t from-blue-600 via-blue-500 to-indigo-400 rounded-t-xl transition-all duration-700 ease-out shadow-[0_0_20px_rgba(59,130,246,0.3)]"
                    style={{ height: `${(d.total / maxVal) * 100}%` }}
                  >
                    <div className="w-full h-full bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  </div>
                </div>
                <span className="text-[9px] sm:text-[10px] md:text-xs text-slate-400 mt-3 uppercase font-bold tracking-tighter sm:tracking-normal">{d.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Quotes Section - Responsive Grid */}
      <div className="space-y-3 sm:space-y-4 lg:space-y-6 px-4 sm:px-0 mt-4 sm:mt-0">
        <h2 className="font-bold text-base sm:text-lg lg:text-xl text-slate-800 flex items-center gap-2">
          <FileText size={18} className="text-slate-500" />
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
            <FileText size={48} className="mx-auto mb-3 text-slate-300" />
            <p>No hay cotizaciones aún</p>
            <p className="text-xs mt-1">Crea tu primera cotización para comenzar</p>
          </div>
        )}
      </div>

    </Screen>
  );
};

export default HomeView;