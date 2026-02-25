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
    if (confirm('¿Borrar esta cotización permanentemente?')) {
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
      <div className="mb-10 lg:mb-14 px-4 md:px-0 pt-2 sm:pt-0">
        <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-6 mb-10">
          <div>
            <h1 className="font-extrabold text-3xl lg:text-4xl text-slate-900 tracking-tight">Historial</h1>
            <p className="text-slate-500 text-sm mt-1.5 font-medium italic">Gestiona y consulta tus cotizaciones pasadas</p>
          </div>
          <div className="flex items-center gap-3 self-start md:self-auto">
            <div className="bg-slate-900 text-white px-5 py-2.5 rounded-2xl text-sm font-bold shadow-xl shadow-slate-900/20">
              {filteredQuotes.length} {filteredQuotes.length === 1 ? 'cotización' : 'cotizaciones'}
            </div>
          </div>
        </div>
        {/* Search Bar - Premium Design */}
        <div className="relative group">
          <Search size={22} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
          <input
            className="w-full bg-white border border-slate-200 rounded-2xl py-5 pl-16 pr-16 text-lg outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 transition-all shadow-sm hover:border-slate-300"
            placeholder="Busca por cliente, folio o fecha..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500 transition-colors p-1"
            >
              <X size={22} />
            </button>
          )}
        </div>
      </div>

      {/* Quotes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 md:px-0 pb-10">
        {filteredQuotes.map(q => (
          <div
            key={q.id}
            className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 cursor-pointer transition-all relative overflow-hidden group"
            onClick={() => { setActiveQuote(q); setView('preview'); }}
          >
            {/* Status Indicator Stripe */}
            <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${q.status === 'pagada' ? 'bg-green-500' : 'bg-orange-400'}`}></div>

            <div className="flex justify-between items-start mb-4 pl-2">
              <div className="min-w-0 pr-2 flex-1">
                <div className="font-bold text-lg text-slate-800 truncate mb-1 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{q.title || q.client}</div>
                {q.title && <div className="text-xs font-bold text-slate-400 truncate uppercase">{q.client}</div>}
              </div>
              <div className="text-right shrink-0 ml-2">
                <div className="font-extrabold text-lg text-slate-900 whitespace-nowrap mb-1">{money(q.total)}</div>
                <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-lg ${q.status === 'pagada' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                  {q.status}
                </span>
              </div>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-slate-50 pl-2">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">#{q.folio} • {formatDate(q.date)}</div>
              <div className="flex gap-2">
                {onDuplicate && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onDuplicate(q); }}
                    className="p-2.5 bg-indigo-50 rounded-xl text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all"
                    title="Duplicar"
                  >
                    <Copy size={16} />
                  </button>
                )}
                <button
                  onClick={(e) => { e.stopPropagation(); setActiveQuote(q); setView('editor'); }}
                  className="p-2.5 bg-slate-50 rounded-xl text-slate-600 hover:bg-slate-900 hover:text-white transition-all"
                  title="Editar"
                >
                  <Settings size={16} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(q.id); }}
                  className="p-2.5 bg-red-50 rounded-xl text-red-500 hover:bg-red-600 hover:text-white transition-all"
                  title="Eliminar"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty States */}
      {quotes.length === 0 && searchTerm === '' && (
        <div className="text-center py-12 lg:py-16 bg-white sm:rounded-xl border border-slate-200 mt-6 mx-4 sm:mx-0">
          <FileText size={48} className="mx-auto mb-3 text-slate-300" />
          <div className="text-slate-400 text-sm mb-1">Sin historial aún</div>
          <div className="text-xs text-slate-300">Crea tu primera cotización para comenzar</div>
        </div>
      )}
      {quotes.length > 0 && filteredQuotes.length === 0 && (
        <div className="text-center py-12 lg:py-16 bg-white rounded-none sm:rounded-xl border-x-0 sm:border-x border-t border-b sm:border border-slate-200 mt-6 mx-0 sm:mx-0">
          <Search size={48} className="mx-auto mb-3 text-slate-300" />
          <div className="text-slate-400 text-sm mb-1">No se encontraron resultados</div>
          <div className="text-xs text-slate-300">Intenta con otros términos de búsqueda</div>
        </div>
      )}
      <div className="h-24 lg:hidden"></div>

    </Screen>
  );
};

export default HistoryView;