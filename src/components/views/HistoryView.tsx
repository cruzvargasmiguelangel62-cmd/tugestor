import React, { useState } from 'react';
import { Settings, Trash2, Copy, Search, X, FileText } from 'lucide-react';
import { Quote, ViewState } from '../../types';
import { Screen } from '../Shared';
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
    <Screen className="py-0 sm:py-4 md:py-6 lg:py-8">
       {/* Header - Con padding solo en móvil */}
       <div className="mb-4 sm:mb-6 lg:mb-8 px-4 sm:px-0 pt-5 sm:pt-0">
         <div className="flex justify-between items-center mb-4">
           <h1 className="font-bold text-xl sm:text-2xl lg:text-3xl text-slate-800">Historial de Cotizaciones</h1>
           <div className="bg-slate-900 text-white px-3 py-1.5 rounded-full text-xs sm:text-sm font-bold">
             {filteredQuotes.length}
           </div>
         </div>
         {/* Search Bar - Responsive */}
         <div className="relative">
            <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
               className="w-full bg-white border-2 border-slate-200 rounded-xl py-3 sm:py-3.5 pl-12 pr-12 text-sm sm:text-base outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all shadow-sm"
               placeholder="Buscar por cliente, folio o fecha..."
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')} 
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={20} />
              </button>
            )}
         </div>
       </div>

       {/* Quotes Grid - Responsive - Sin padding en móvil para aprovechar todo el espacio */}
       <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-0 sm:gap-4 lg:gap-6 px-0 sm:px-0 pb-4">
          {filteredQuotes.map(q => (
             <div 
               key={q.id} 
               className="bg-white p-4 sm:p-5 lg:p-6 rounded-none sm:rounded-xl lg:rounded-2xl border-x-0 sm:border-x border-t border-b sm:border border-slate-200 shadow-sm hover:shadow-md cursor-pointer active:scale-[0.98] lg:active:scale-[0.99] transition-all relative overflow-hidden group"
               onClick={() => { setActiveQuote(q); setView('preview'); }}
             >
                {/* Status Indicator Stripe */}
                <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${q.status === 'pagada' ? 'bg-green-500' : 'bg-orange-400'}`}></div>
                
                <div className="flex justify-between items-start mb-3 pl-3">
                   <div className="min-w-0 pr-2 flex-1">
                     <div className="font-bold text-base sm:text-lg text-slate-800 truncate mb-1">{q.title || q.client}</div>
                     {q.title && <div className="text-xs sm:text-sm text-slate-500 truncate">{q.client}</div>}
                   </div>
                   <div className="text-right shrink-0 ml-2">
                     <div className="font-bold text-base sm:text-lg text-slate-900 whitespace-nowrap mb-1">{money(q.total)}</div>
                     <span className={`text-[10px] sm:text-xs font-bold uppercase px-2 py-1 rounded-full ${q.status === 'pagada' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                        {q.status}
                     </span>
                   </div>
                </div>
                
                <div className="flex justify-between items-center pt-3 border-t border-slate-100 pl-3">
                   <div className="text-xs text-slate-500">#{q.folio} • {formatDate(q.date)}</div>
                   <div className="flex gap-2">
                      {onDuplicate && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); onDuplicate(q); }} 
                          className="p-2 bg-blue-50 rounded-lg text-blue-600 hover:bg-blue-100 transition-colors"
                          title="Duplicar"
                        >
                          <Copy size={16}/>
                        </button>
                      )}
                      <button 
                        onClick={(e) => { e.stopPropagation(); setActiveQuote(q); setView('editor'); }} 
                        className="p-2 bg-slate-100 rounded-lg text-slate-600 hover:bg-slate-200 transition-colors"
                        title="Editar"
                      >
                        <Settings size={16}/>
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDelete(q.id); }} 
                        className="p-2 bg-red-50 rounded-lg text-red-500 hover:bg-red-100 transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 size={16}/>
                      </button>
                   </div>
                </div>
             </div>
          ))}
       </div>

       {/* Empty States */}
       {quotes.length === 0 && searchTerm === '' && (
         <div className="text-center py-12 lg:py-16 bg-white sm:rounded-xl border border-slate-200 mt-6 mx-4 sm:mx-0">
           <FileText size={48} className="mx-auto mb-3 text-slate-300"/>
           <div className="text-slate-400 text-sm mb-1">Sin historial aún</div>
           <div className="text-xs text-slate-300">Crea tu primera cotización para comenzar</div>
         </div>
       )}
       {quotes.length > 0 && filteredQuotes.length === 0 && (
         <div className="text-center py-12 lg:py-16 bg-white rounded-none sm:rounded-xl border-x-0 sm:border-x border-t border-b sm:border border-slate-200 mt-6 mx-0 sm:mx-0">
           <Search size={48} className="mx-auto mb-3 text-slate-300"/>
           <div className="text-slate-400 text-sm mb-1">No se encontraron resultados</div>
           <div className="text-xs text-slate-300">Intenta con otros términos de búsqueda</div>
         </div>
       )}
       <div className="h-24 lg:hidden"></div>
      
    </Screen>
  );
};

export default HistoryView;