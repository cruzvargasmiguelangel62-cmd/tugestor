import React, { useState } from 'react';
import { Settings, Trash2, Copy, Search, X } from 'lucide-react';
import { Quote, ViewState } from '../../types';
import { Screen, NavBar } from '../Shared';
import { money, formatDate } from '../../utils';
import { db } from '../../db';

interface HistoryViewProps {
  view: ViewState;
  setView: (view: ViewState) => void;
  quotes: Quote[];
  setQuotes: (quotes: Quote[]) => void;
  setActiveQuote: (quote: Quote) => void;
  onDuplicate?: (quote: Quote) => void;
}

const HistoryView: React.FC<HistoryViewProps> = ({ view, setView, quotes, setActiveQuote, onDuplicate }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const handleDelete = async (id: string) => {
    if(confirm('¿Borrar esta cotización permanentemente?')) {
      try {
        await db.quotes.delete(id);
      } catch (e) {
        console.error("Error deleting quote", e);
      }
    }
  };

  const filteredQuotes = quotes.filter(q => {
     const term = searchTerm.toLowerCase();
     const matchClient = q.client.toLowerCase().includes(term);
     const matchFolio = q.folio.includes(term);
     const matchDate = formatDate(q.date).toLowerCase().includes(term);
     return matchClient || matchFolio || matchDate;
  });

  return (
    <Screen>
       <div className="sticky top-0 bg-white z-20 pt-4 px-5 pb-2 border-b border-slate-100">
         <div className="flex justify-between items-center mb-3">
           <h1 className="font-bold text-xl">Historial</h1>
           <div className="bg-slate-100 px-2 py-1 rounded-lg text-xs font-bold text-slate-500">
             {filteredQuotes.length}
           </div>
         </div>
         {/* Search Bar */}
         <div className="relative mb-2">
            <Search size={18} className="absolute left-3 top-2.5 text-slate-400" />
            <input 
               className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-10 pr-10 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50"
               placeholder="Buscar cliente, folio..."
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="absolute right-3 top-2.5 text-slate-400">
                <X size={18} />
              </button>
            )}
         </div>
       </div>

       <div className="p-5 space-y-3">
          {filteredQuotes.map(q => (
             <div key={q.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm cursor-pointer active:scale-[0.99] transition-transform relative overflow-hidden" onClick={() => { setActiveQuote(q); setView('preview'); }}>
                {/* Status Indicator Stripe */}
                <div className={`absolute left-0 top-0 bottom-0 w-1 ${q.status === 'pagada' ? 'bg-green-400' : 'bg-orange-300'}`}></div>
                
                <div className="flex justify-between items-start mb-2 pl-2">
                   <div className="min-w-0 pr-2">
                     <div className="font-bold text-lg text-slate-800 truncate">{q.title || q.client}</div>
                     {q.title && <div className="text-xs text-slate-400 truncate">{q.client}</div>}
                   </div>
                   <div className="text-right">
                     <div className="font-bold text-slate-800 whitespace-nowrap">{money(q.total)}</div>
                     <div className={`text-[10px] font-bold uppercase tracking-wider mt-1 ${q.status === 'pagada' ? 'text-green-600' : 'text-orange-400'}`}>
                        {q.status}
                     </div>
                   </div>
                </div>
                <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-50 pl-2">
                   <div className="text-xs text-slate-400">#{q.folio} • {formatDate(q.date)}</div>
                   <div className="flex gap-2">
                      {onDuplicate && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); onDuplicate(q); }} 
                          className="p-2 bg-blue-50 rounded-lg text-blue-500 active:bg-blue-100"
                          title="Duplicar"
                        >
                          <Copy size={16}/>
                        </button>
                      )}
                      <button onClick={(e) => { e.stopPropagation(); setActiveQuote(q); setView('editor'); }} className="p-2 bg-slate-100 rounded-lg text-slate-500 active:bg-slate-200"><Settings size={16}/></button>
                      <button onClick={(e) => { e.stopPropagation(); handleDelete(q.id); }} className="p-2 bg-red-50 rounded-lg text-red-400 active:bg-red-100"><Trash2 size={16}/></button>
                   </div>
                </div>
             </div>
          ))}
          {quotes.length === 0 && searchTerm === '' && <div className="text-center py-10 text-slate-400 text-sm">Sin historial aún.</div>}
          {quotes.length > 0 && filteredQuotes.length === 0 && <div className="text-center py-10 text-slate-400 text-sm">No se encontraron resultados.</div>}
       </div>
       <NavBar view={view} setView={setView} />
    </Screen>
  );
};

export default HistoryView;