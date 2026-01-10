import React from 'react';
import { User, TrendingUp } from 'lucide-react';
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
    <Screen>
      <div className="bg-slate-900 p-6 pt-10 pb-16 rounded-b-[2rem] shadow-lg relative overflow-hidden">
        <div className="flex items-center gap-4 relative z-10 mb-6">
          <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center border border-white/10 overflow-hidden shrink-0">
             {profile.logo ? <img src={profile.logo} className="w-full h-full object-cover" alt="Logo" /> : <User className="text-white/50"/>}
          </div>
          <div className="min-w-0">
            <h1 className="font-bold text-xl text-white leading-tight truncate">{profile.name}</h1>
            <p className="text-xs text-slate-400 truncate">{profile.slogan || 'Bienvenido'}</p>
          </div>
        </div>

        {/* REVENUE CHART */}
        <div className="relative z-10 mb-2">
           <div className="flex items-center gap-2 mb-2">
             <TrendingUp size={14} className="text-green-400"/>
             <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ingresos (6 Meses)</span>
           </div>
           <div className="flex items-end justify-between h-24 gap-2 px-1">
              {chartData.map((d, i) => (
                <div key={i} className="flex flex-col items-center flex-1 group">
                   <div className="w-full bg-slate-800 rounded-t-sm relative flex items-end justify-center group-hover:bg-slate-700 transition-colors overflow-hidden" style={{ height: '100%' }}>
                      <div 
                        className="w-full bg-blue-500 opacity-80" 
                        style={{ height: `${(d.total / maxVal) * 100}%` }}
                      ></div>
                   </div>
                   <span className="text-[9px] text-slate-500 mt-1 uppercase font-bold">{d.label}</span>
                </div>
              ))}
           </div>
        </div>
      </div>
      
      <div className="px-5 -mt-8 relative z-20">
        <h2 className="font-bold text-sm text-slate-800 mb-3 ml-1">Recientes</h2>
        <div className="space-y-3 pb-4">
          {quotes.slice(0, 5).map(q => (
            <div key={q.id} onClick={() => { setActiveQuote(q); setView('preview'); }} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex justify-between items-center active:bg-slate-50 cursor-pointer">
              <div className="min-w-0">
                <div className="font-bold text-slate-800 truncate">{q.client}</div>
                <div className="text-xs text-slate-400">#{q.folio} • {formatDate(q.date)}</div>
              </div>
              <div className="text-right shrink-0 ml-2">
                <div className="font-bold text-slate-800 text-sm">{money(q.total)}</div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${q.status === 'pagada' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                  {q.status}
                </span>
              </div>
            </div>
          ))}
          {quotes.length === 0 && <div className="text-center text-slate-400 text-xs py-8">Sin movimientos</div>}
        </div>
      </div>
      <NavBar view={view} setView={setView} />
    </Screen>
  );
};

export default HomeView;