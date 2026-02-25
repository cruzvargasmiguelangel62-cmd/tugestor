import React, { useState, useEffect, useRef } from 'react';
import { X, Search, Calculator, DollarSign, Briefcase, Truck, Percent, ChevronDown, PenTool, Eraser, FileText, Link, Share2, Loader2, MessageCircle, Smartphone } from 'lucide-react';
import { Template, CatalogItem, Quote, QuoteItem } from '../types';
import { TEMPLATES_DB } from '../constants';
import { generateId, money } from '../utils';

interface TemplatesModalProps {
  onClose: () => void;
  activeQuote: Quote;
  setActiveQuote: (quote: Quote) => void;
}

export const TemplatesModal: React.FC<TemplatesModalProps> = ({ onClose, activeQuote, setActiveQuote }) => {
  const [templateFilter, setTemplateFilter] = useState('Todos');
  const [searchTerm, setSearchTerm] = useState('');

  const categories = ['Todos', ...new Set(TEMPLATES_DB.map(t => t.category))];
  const filteredTemplates = TEMPLATES_DB.filter(t => {
     const matchCat = templateFilter === 'Todos' || t.category === templateFilter;
     const matchSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase());
     return matchCat && matchSearch;
  });

  return (
    <div className="fixed inset-0 bg-white z-[60] flex flex-col animate-in slide-in-from-bottom duration-200">
       <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
          <h2 className="font-bold text-lg">Plantillas Maestras</h2>
          <button onClick={onClose} className="p-2 bg-slate-100 rounded-full"><X size={20}/></button>
       </div>
       
       <div className="px-4 py-2 border-b border-slate-100 bg-slate-50">
         <div className="flex items-center bg-white rounded-lg px-3 border border-slate-200 mb-3">
           <Search size={16} className="text-slate-400"/>
           <input className="w-full p-2 text-sm outline-none" placeholder="Buscar..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
         </div>
         <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
           {categories.map(cat => (
             <button key={cat} onClick={() => setTemplateFilter(cat)} className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${templateFilter === cat ? 'bg-slate-900 text-white' : 'bg-white text-slate-500 border border-slate-200'}`}>{cat}</button>
           ))}
         </div>
       </div>

       <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50 no-scrollbar">
          {filteredTemplates.map(item => (
            <button key={item.id} 
              onClick={() => {
                 const newItems: QuoteItem[] = item.items.map(x => ({...x, id: generateId(), unit: 'pza'}));
                 setActiveQuote({...activeQuote, items: newItems});
                 onClose();
              }}
              className="w-full text-left bg-white p-4 rounded-xl border border-slate-200 shadow-sm active:scale-[0.98] transition-transform"
            >
               <div className="flex justify-between items-start mb-1">
                  <div className="font-bold text-slate-800 text-sm">{item.name}</div>
                  <span className="text-[10px] font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-500 uppercase">{item.category}</span>
               </div>
               <div className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                  {item.items.map(i => i.desc).join(', ')}
               </div>
               <div className="mt-3 pt-2 border-t border-slate-100 flex justify-between items-center">
                  <span className="text-[10px] text-slate-400 font-bold">{item.items.length} items</span>
                  <span className="font-bold text-slate-900 text-sm">{money(item.items.reduce((a,b)=>a+(b.price*b.qty),0))}</span>
               </div>
            </button>
          ))}
          {filteredTemplates.length === 0 && <div className="text-center py-10 text-slate-400 text-sm">No hay plantillas</div>}
       </div>
    </div>
  );
};

interface CatalogModalProps {
  onClose: () => void;
  catalog: CatalogItem[];
  activeQuote: Quote;
  setActiveQuote: (quote: Quote) => void;
}

export const CatalogModal: React.FC<CatalogModalProps> = ({ onClose, catalog, activeQuote, setActiveQuote }) => {
  return (
    <div className="fixed inset-0 bg-white z-[60] flex flex-col animate-in slide-in-from-bottom duration-200">
      <div className="p-4 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
         <h2 className="font-bold text-lg">Mi Catálogo</h2>
         <button onClick={onClose} className="p-2 bg-slate-100 rounded-full"><X size={20}/></button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50 no-scrollbar">
         {catalog.map(item => (
           <button key={item.id} 
             onClick={() => {
                const newItem: QuoteItem = { id: generateId(), qty: 1, unit: item.unit || 'pza', desc: item.desc, price: item.price };
                setActiveQuote({...activeQuote, items: [...activeQuote.items, newItem]});
                onClose();
             }}
             className="w-full text-left bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex justify-between items-center active:bg-slate-50"
           >
              <div className="font-medium text-slate-800">{item.desc}</div>
              <div className="text-right">
                  <div className="font-bold text-slate-600 font-mono bg-slate-100 px-2 py-1 rounded inline-block">{money(item.price)}</div>
                  <div className="text-[9px] text-slate-400 font-bold uppercase mt-1 text-center">{item.unit || 'pza'}</div>
              </div>
           </button>
         ))}
      </div>
    </div>
  );
};

interface PriceCalculatorModalProps {
  onClose: () => void;
  onApply: (price: number) => void;
  initialPrice?: number;
}

export const PriceCalculatorModal: React.FC<PriceCalculatorModalProps> = ({ onClose, onApply, initialPrice = 0 }) => {
  const [materials, setMaterials] = useState('');
  const [labor, setLabor] = useState('');
  const [others, setOthers] = useState('');
  const [margin, setMargin] = useState('30'); // Default 30% margin
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const mat = parseFloat(materials) || 0;
    const lab = parseFloat(labor) || 0;
    const oth = parseFloat(others) || 0;
    const mrg = parseFloat(margin) || 0;

    const cost = mat + lab + oth;
    const price = cost * (1 + (mrg / 100));
    setTotal(price);
  }, [materials, labor, others, margin]);

  const CalcInput = ({ icon: Icon, label, value, onChange, autoFocus = false }: any) => (
    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 flex items-center gap-3 active:border-indigo-200 transition-colors">
      <div className="bg-white p-2 rounded-xl text-slate-400 shadow-sm">
        <Icon size={20} />
      </div>
      <div className="flex-1">
        <label className="text-[10px] font-bold text-slate-400 uppercase block leading-none mb-1">{label}</label>
        <input 
          type="number" 
          inputMode="decimal"
          className="w-full bg-transparent text-lg font-bold text-slate-800 outline-none placeholder-slate-300"
          placeholder="0" 
          value={value} 
          onChange={onChange}
          autoFocus={autoFocus}
        />
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[70] flex justify-center items-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-t-[2rem] shadow-2xl animate-in slide-in-from-bottom duration-300 max-h-[90vh] flex flex-col">
        <div className="pt-3 pb-2 px-6 bg-white rounded-t-[2rem] flex flex-col items-center sticky top-0 z-10 border-b border-slate-50">
          <div className="w-12 h-1.5 bg-slate-200 rounded-full mb-4 opacity-50"></div>
          <div className="w-full flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="bg-indigo-600 p-1.5 rounded-lg text-white">
                <Calculator size={18} />
              </div>
              <h2 className="font-bold text-lg text-slate-800">Calculadora</h2>
            </div>
            <button onClick={onClose} className="p-2 bg-slate-50 text-slate-400 rounded-full active:bg-slate-100"><X size={20}/></button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="space-y-3">
            <CalcInput icon={DollarSign} label="Costo Materiales" value={materials} onChange={(e: any) => setMaterials(e.target.value)} autoFocus />
            <CalcInput icon={Briefcase} label="Mano de Obra" value={labor} onChange={(e: any) => setLabor(e.target.value)} />
            <CalcInput icon={Truck} label="Gastos / Traslados" value={others} onChange={(e: any) => setOthers(e.target.value)} />
          </div>

          <div className="pt-2 border-t border-slate-50">
             <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1"><Percent size={12}/> Margen (%)</label>
             </div>
             
             <div className="flex items-center gap-3 mb-3">
                <div className="flex-1 relative">
                   <input 
                      type="number" 
                      inputMode="decimal"
                      value={margin}
                      onChange={(e) => setMargin(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 pl-4 text-xl font-bold text-slate-900 outline-none focus:border-indigo-500 transition-all"
                      placeholder="0"
                   />
                   <span className="absolute right-4 top-3.5 text-slate-400 font-bold">%</span>
                </div>
             </div>

            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
              {[5, 10, 15, 20, 25, 30, 40, 50, 100].map(m => (
                <button key={m} onClick={() => setMargin(m.toString())} 
                  className={`px-3 py-2 rounded-lg text-xs font-bold border transition-all shrink-0 ${margin === m.toString() ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-500 border-slate-200'}`}>
                  {m}%
                </button>
              ))}
            </div>
          </div>
          <div className="h-4"></div>
        </div>

        <div className="p-6 bg-white border-t border-slate-100 pb-[env(safe-area-inset-bottom)]">
          <div className="flex justify-between items-end mb-4 px-2">
             <div className="text-xs font-bold text-slate-400 uppercase mb-1">Precio Final Sugerido</div>
             <div className="text-4xl font-black text-slate-900 tracking-tight">{money(total)}</div>
          </div>
          <button 
            onClick={() => onApply(Math.ceil(total))} 
            className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold text-lg active:scale-[0.98] transition-transform shadow-xl shadow-indigo-200 flex justify-center items-center gap-2"
          >
            Aplicar Precio
          </button>
        </div>
      </div>
    </div>
  );
};

interface SignatureModalProps {
  onClose: () => void;
  onSave: (signatureData: string) => void;
}

export const SignatureModal: React.FC<SignatureModalProps> = ({ onClose, onSave }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
      }
    }
  }, []);

  const getPos = (e: any) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    if (e.touches && e.touches[0]) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const startDrawing = (e: any) => {
    e.preventDefault(); // Prevent scroll on touch
    setIsDrawing(true);
    const ctx = canvasRef.current?.getContext('2d');
    const { x, y } = getPos(e);
    ctx?.beginPath();
    ctx?.moveTo(x, y);
  };

  const draw = (e: any) => {
    if (!isDrawing) return;
    e.preventDefault();
    const ctx = canvasRef.current?.getContext('2d');
    const { x, y } = getPos(e);
    ctx?.lineTo(x, y);
    ctx?.stroke();
    setHasSignature(true);
  };

  const endDrawing = () => {
    setIsDrawing(false);
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setHasSignature(false);
    }
  };

  const save = () => {
    if (canvasRef.current && hasSignature) {
      const data = canvasRef.current.toDataURL('image/png');
      onSave(data);
      onClose();
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex justify-center items-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-[90%] max-w-md rounded-2xl shadow-2xl p-4 animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-bold text-lg text-slate-800 flex items-center gap-2">
            <PenTool size={20} className="text-indigo-600"/> Firma del Cliente
          </h2>
          <button onClick={onClose} className="p-2 bg-slate-50 rounded-full"><X size={20}/></button>
        </div>
        
        <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl relative overflow-hidden h-64 touch-none">
          <canvas 
            ref={canvasRef}
            className="w-full h-full cursor-crosshair active:cursor-crosshair"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={endDrawing}
            onMouseLeave={endDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={endDrawing}
          />
          {!hasSignature && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
              <span className="text-2xl font-bold uppercase text-slate-400 transform -rotate-12">Firmar Aquí</span>
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-4">
           <button onClick={clear} className="p-3 bg-red-50 text-red-500 rounded-xl font-bold text-xs flex flex-col items-center justify-center gap-1 active:bg-red-100 transition-colors">
              <Eraser size={18}/> Borrar
           </button>
           <button onClick={save} className="flex-1 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-200 active:scale-95 transition-transform">
              Guardar Firma
           </button>
        </div>
      </div>
    </div>
  );
};

interface ShareOptionsModalProps {
  onClose: () => void;
  onShareFile: () => Promise<void>;
  onShareLink: () => Promise<void>;
}

export const ShareOptionsModal: React.FC<ShareOptionsModalProps> = ({ onClose, onShareFile, onShareLink }) => {
  const [loading, setLoading] = useState<string | null>(null);

  const handleAction = async (type: string, action: () => Promise<void>) => {
    setLoading(type);
    try {
      await action();
      if (type === 'link') onClose();
      else setLoading(null); // Keep loading state off if native share canceled
    } catch (e) {
      console.error(e);
      setLoading(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex justify-center items-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-t-[2rem] shadow-2xl animate-in slide-in-from-bottom duration-300 flex flex-col p-6 pb-[env(safe-area-inset-bottom)]">
        <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6 opacity-50"></div>
        
        <h2 className="text-xl font-black text-slate-900 mb-2 text-center uppercase tracking-tight">Compartir Cotización</h2>
        <p className="text-slate-500 text-sm text-center mb-8 px-4 leading-relaxed">
          Selecciona cómo quieres enviar el archivo.
        </p>

        <div className="space-y-4">
           {/* Option 1: Direct File (Native Share) */}
           <button 
             disabled={!!loading}
             onClick={() => handleAction('file', onShareFile)}
             className="w-full bg-green-50 hover:bg-green-100 border border-green-200 rounded-2xl p-5 flex items-center gap-4 transition-all active:scale-[0.98] ring-offset-2 focus:ring-2 focus:ring-green-400"
           >
              <div className="bg-green-500 text-white p-3 rounded-xl shrink-0 shadow-lg shadow-green-200">
                <Smartphone size={28} />
              </div>
              <div className="text-left flex-1">
                 <div className="font-black text-green-900 text-base">WhatsApp / Adjuntar</div>
                 <div className="text-[11px] text-green-700 font-medium">Recomendado. Usa la función nativa de tu celular.</div>
              </div>
              {loading === 'file' ? <Loader2 size={24} className="animate-spin text-green-600" /> : <Share2 size={24} className="text-green-600" />}
           </button>

           {/* Option 2: Temporary Link */}
           <button 
             disabled={!!loading}
             onClick={() => handleAction('link', onShareLink)}
             className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl p-5 flex items-center gap-4 transition-all active:scale-[0.98]"
           >
              <div className="bg-slate-200 text-slate-500 p-3 rounded-xl shrink-0">
                <Link size={28} />
              </div>
              <div className="text-left flex-1">
                 <div className="font-bold text-slate-800">Enviar como Enlace</div>
                 <div className="text-[11px] text-slate-500 font-medium">Sube el PDF a la nube temporal y genera un link.</div>
              </div>
              {loading === 'link' ? <Loader2 size={20} className="animate-spin text-indigo-400" /> : <MessageCircle size={20} className="text-slate-300" />}
           </button>
        </div>

        <button onClick={onClose} className="mt-8 py-4 text-slate-400 font-bold text-sm uppercase tracking-widest hover:text-slate-600 active:scale-95 transition-all w-full text-center">
          Cancelar
        </button>
      </div>
    </div>
  );
};
