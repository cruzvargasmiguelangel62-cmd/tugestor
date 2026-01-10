import React, { useState } from 'react';
import { ChevronLeft, LayoutTemplate, Book, Trash2, Plus, Check, Calculator, Percent, ChevronDown, ChevronUp, Calendar, PenTool } from 'lucide-react';
import { Quote, ViewState, CatalogItem } from '../../types';
import { Screen, Input } from '../Shared';
import { TemplatesModal, CatalogModal, PriceCalculatorModal, SignatureModal } from '../Modals';
import { money, generateId, calculateSubtotal } from '../../utils';

interface EditorViewProps {
  view: ViewState;
  setView: (view: ViewState) => void;
  quotes: Quote[];
  activeQuote: Quote;
  setActiveQuote: (quote: Quote) => void;
  saveQuote: () => void;
  catalog: CatalogItem[];
  clientSuggestions?: string[];
}

const EditorView: React.FC<EditorViewProps> = ({ view, setView, quotes, activeQuote, setActiveQuote, saveQuote, catalog, clientSuggestions = [] }) => {
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);
  const [showCatalogModal, setShowCatalogModal] = useState(false);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [calculatingItem, setCalculatingItem] = useState<string | null>(null);
  
  const hasAdjustments = (activeQuote.discountRate || 0) > 0 || (activeQuote.taxRate || 0) > 0;
  const [showAdjustments, setShowAdjustments] = useState(hasAdjustments);
  
  const [errors, setErrors] = useState<{client?: string, phone?: string}>({});

  const isEditing = quotes.some(q => q.id === activeQuote.id);

  // Live calculation
  const subtotal = calculateSubtotal(activeQuote.items);
  const discountAmount = subtotal * ((activeQuote.discountRate || 0) / 100);
  const subtotalAfterDiscount = subtotal - discountAmount;
  const taxAmount = subtotalAfterDiscount * ((activeQuote.taxRate || 0) / 100);
  const finalTotal = subtotalAfterDiscount + taxAmount;

  const handleSave = () => {
    const newErrors: {client?: string, phone?: string} = {};
    let isValid = true;

    if (!activeQuote.client.trim()) {
      newErrors.client = 'El nombre del cliente es obligatorio';
      isValid = false;
    }

    const phoneClean = activeQuote.phone.replace(/\D/g, '');
    if (!activeQuote.phone.trim()) {
      newErrors.phone = 'El teléfono es obligatorio';
      isValid = false;
    } else if (phoneClean.length < 10) {
      newErrors.phone = 'Ingresa un número válido (mínimo 10 dígitos)';
      isValid = false;
    }

    setErrors(newErrors);

    if (isValid) {
      saveQuote();
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (/^[\d\s\-()+]*$/.test(val)) {
        setActiveQuote({...activeQuote, phone: val});
        if (errors.phone) setErrors(prev => ({...prev, phone: undefined}));
    }
  };

  const applyCalculation = (price: number) => {
    if (calculatingItem) {
      const updatedItems = activeQuote.items.map(i => 
        i.id === calculatingItem ? { ...i, price: price } : i
      );
      setActiveQuote({ ...activeQuote, items: updatedItems });
      setCalculatingItem(null);
    }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dateVal = e.target.value;
    if (!dateVal) return;
    const newDate = new Date(`${dateVal}T12:00:00`);
    setActiveQuote({...activeQuote, date: newDate.toISOString()});
  };

  const units = ['pza', 'm²', 'ml', 'kg', 'lt', 'srv', 'lote', 'caja', 'paq'];

  return (
    <Screen className="bg-white py-0 sm:py-4 md:py-6 lg:py-8">
      <datalist id="client-suggestions">
        {clientSuggestions.map((client, idx) => (
          <option key={idx} value={client} />
        ))}
      </datalist>

      {/* Header - Responsive - Sin padding lateral en móvil */}
      <div className="sticky top-0 lg:relative bg-white z-30 px-4 sm:px-6 lg:px-0 py-3 lg:py-0 mb-4 lg:mb-6 border-b lg:border-b-0 border-slate-100 flex justify-between items-center lg:block">
        <div className="flex items-center justify-between w-full lg:w-auto lg:mb-6">
          <button onClick={() => setView('home')} className="p-2 -ml-2 lg:hidden hover:bg-slate-100 rounded-lg transition-colors">
            <ChevronLeft size={24}/>
          </button>
          <h1 className="font-bold text-lg sm:text-xl lg:text-2xl text-slate-800">
            {isEditing ? 'Editar Cotización' : 'Nueva Cotización'}
          </h1>
          <div className="flex gap-2">
             <button onClick={() => setShowTemplatesModal(true)} className="bg-orange-50 text-orange-600 p-2 rounded-xl hover:bg-orange-100 transition-colors" title="Plantillas">
               <LayoutTemplate size={20}/>
             </button>
             <button onClick={() => setShowCatalogModal(true)} className="bg-indigo-50 text-indigo-600 p-2 rounded-xl hover:bg-indigo-100 transition-colors" title="Catálogo">
               <Book size={20}/>
             </button>
          </div>
        </div>
      </div>
      
      {/* Main Content - Responsive Grid Layout - Con padding solo en móvil */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 px-4 sm:px-0">
        {/* Left Column - Form Fields */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          <section className="bg-white p-4 sm:p-6 rounded-xl lg:rounded-2xl border border-slate-200 shadow-sm">
            <div className="text-xs sm:text-sm font-bold text-slate-400 uppercase mb-4">Datos Generales</div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              <div className="sm:col-span-2">
                <Input 
                  className="mb-0"
                  label="Título (Opcional)"
                  placeholder="Ej. Baño" 
                  value={activeQuote.title || ''} 
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setActiveQuote({...activeQuote, title: e.target.value})}
                />
              </div>
              <div>
                 <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5 ml-1">Fecha</label>
                 <div className="relative">
                    <input 
                      type="date"
                      className="w-full bg-white border border-slate-200 rounded-xl p-3.5 text-sm outline-none focus:ring-2 focus:border-indigo-400 transition-all shadow-sm"
                      value={activeQuote.date.split('T')[0]}
                      onChange={handleDateChange}
                    />
                 </div>
              </div>
            </div>
            
            <Input 
              label="Nombre del Cliente"
              placeholder="Ej. Juan Pérez" 
              value={activeQuote.client} 
              list="client-suggestions"
              autoComplete="off"
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setActiveQuote({...activeQuote, client: e.target.value});
                if (errors.client) setErrors(prev => ({...prev, client: undefined}));
              }}
              error={errors.client}
            />
            
            <Input 
              label="Teléfono"
              type="tel" 
              placeholder="55 1234 5678" 
              value={activeQuote.phone} 
              onChange={handlePhoneChange} 
              error={errors.phone}
              inputMode="numeric"
            />
          </section>
          <section className="bg-white p-4 sm:p-6 rounded-xl lg:rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-center mb-4">
               <div className="text-xs sm:text-sm font-bold text-slate-400 uppercase">Conceptos</div>
               <span className="text-xs bg-slate-100 px-3 py-1 rounded-full text-slate-600 font-medium">{activeQuote.items.length} items</span>
            </div>
            <div className="space-y-3 sm:space-y-4">
            {activeQuote.items.map((item, index) => (
              <div key={item.id} className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                <div className="flex gap-2 mb-2">
                   <div className="w-16 shrink-0">
                      <label className="text-[9px] text-slate-400 font-bold uppercase pl-1">Cant.</label>
                      <input type="number" className="w-full bg-white rounded-lg p-2 text-center text-sm font-bold outline-none border border-slate-100"
                        value={item.qty} 
                        onChange={e => { 
                          const n = [...activeQuote.items]; 
                          n[index].qty = e.target.value; 
                          setActiveQuote({...activeQuote, items: n}); 
                        }} 
                      />
                   </div>
                   <div className="w-20 shrink-0">
                      <label className="text-[9px] text-slate-400 font-bold uppercase pl-1">Unidad</label>
                      <div className="relative">
                        <input 
                          list={`units-${item.id}`}
                          className="w-full bg-white rounded-lg p-2 text-center text-xs font-bold outline-none border border-slate-100"
                          placeholder="pza"
                          value={item.unit || ''}
                          onChange={e => {
                            const n = [...activeQuote.items];
                            n[index].unit = e.target.value;
                            setActiveQuote({...activeQuote, items: n});
                          }}
                        />
                        <datalist id={`units-${item.id}`}>
                           {units.map(u => <option key={u} value={u} />)}
                        </datalist>
                      </div>
                   </div>
                   <div className="flex-1 min-w-0">
                      <label className="text-[9px] text-slate-400 font-bold uppercase pl-1">Descripción</label>
                      <input className="w-full bg-white rounded-lg p-2 text-sm outline-none border border-slate-100"
                        placeholder="..." 
                        value={item.desc} 
                        onChange={e => { 
                          const n = [...activeQuote.items]; 
                          n[index].desc = e.target.value; 
                          setActiveQuote({...activeQuote, items: n}); 
                        }} 
                      />
                   </div>
                </div>
                <div className="flex gap-2 items-end">
                   <div className="flex-1">
                      <label className="text-[9px] text-slate-400 font-bold uppercase pl-1">Precio Unit.</label>
                      <div className="flex gap-2 items-center">
                        <div className="relative flex-1">
                          <span className="absolute left-3 top-2 text-slate-400 text-xs">$</span>
                          <input type="number" className="w-full bg-white rounded-lg p-2 pl-6 text-sm font-bold outline-none border border-slate-100"
                            placeholder="0" 
                            value={item.price} 
                            onChange={e => { 
                              const n = [...activeQuote.items]; 
                              n[index].price = e.target.value; 
                              setActiveQuote({...activeQuote, items: n}); 
                            }} 
                          />
                        </div>
                        <button 
                          onClick={() => setCalculatingItem(item.id)}
                          className="p-2 bg-indigo-50 text-indigo-600 rounded-lg active:scale-95 transition-transform"
                          title="Calcular Precio"
                        >
                          <Calculator size={20}/>
                        </button>
                      </div>
                   </div>
                   <button onClick={() => { if(activeQuote.items.length > 1) setActiveQuote({...activeQuote, items: activeQuote.items.filter(i => i.id !== item.id)}) }} className="p-2.5 bg-white rounded-lg text-slate-400 border border-slate-100"><Trash2 size={20}/></button>
                </div>
              </div>
            ))}
          </div>
            <button 
              onClick={() => setActiveQuote({...activeQuote, items: [...activeQuote.items, { id: generateId(), qty: 1, unit: 'pza', desc: '', price: '' }]})}
              className="w-full mt-4 py-3 rounded-xl border-2 border-dashed border-slate-300 text-slate-500 font-bold text-sm flex items-center justify-center gap-2 hover:bg-slate-50 hover:border-slate-400 transition-colors active:scale-95"
            >
              <Plus size={18} /> Agregar Concepto
            </button>
          </section>

          {/* Taxes and Discounts */}
          <section className="bg-white rounded-xl lg:rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
           <button 
             onClick={() => setShowAdjustments(!showAdjustments)}
             className={`w-full p-4 flex justify-between items-center text-left transition-colors ${showAdjustments ? 'bg-slate-50 border-b border-slate-100' : 'bg-white'}`}
           >
              <span className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2">
                <Percent size={14}/> Impuestos y Descuentos
              </span>
              {showAdjustments ? <ChevronUp size={16} className="text-slate-400"/> : <ChevronDown size={16} className="text-slate-400"/>}
           </button>
           
           {showAdjustments && (
             <div className="bg-slate-50 p-4 animate-in slide-in-from-top-2 duration-200">
                <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Descuento (%)</label>
                      <div className="relative">
                        <input 
                          type="number" 
                          className="w-full bg-white rounded-lg p-2 pr-6 text-sm outline-none border border-slate-200 focus:border-indigo-300" 
                          placeholder="0"
                          value={activeQuote.discountRate || ''}
                          onChange={e => setActiveQuote({...activeQuote, discountRate: parseFloat(e.target.value) || 0})}
                        />
                        <span className="absolute right-2 top-2 text-slate-400"><Percent size={14}/></span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Impuesto / IVA (%)</label>
                      <div className="relative">
                        <input 
                          type="number" 
                          className="w-full bg-white rounded-lg p-2 pr-6 text-sm outline-none border border-slate-200 focus:border-indigo-300" 
                          placeholder="0"
                          value={activeQuote.taxRate || ''}
                          onChange={e => setActiveQuote({...activeQuote, taxRate: parseFloat(e.target.value) || 0})}
                        />
                        <span className="absolute right-2 top-2 text-slate-400"><Percent size={14}/></span>
                      </div>
                    </div>
                </div>
                <div className="flex gap-2 mt-3">
                   <button 
                     onClick={() => setActiveQuote({...activeQuote, taxRate: 16})}
                     className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-indigo-600 active:bg-indigo-50"
                   >
                     Aplicar IVA (16%)
                   </button>
                   <button 
                     onClick={() => setActiveQuote({...activeQuote, taxRate: 0, discountRate: 0})}
                     className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-slate-400 active:bg-red-50 active:text-red-500 ml-auto"
                   >
                     Limpiar
                   </button>
                </div>
             </div>
           )}
        </section>

          {/* Signature Section */}
          <section className="bg-white rounded-xl lg:rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6">
           <div className="flex justify-between items-center mb-3">
             <div className="text-xs font-bold text-slate-400 uppercase">Firma del Cliente</div>
             {activeQuote.signature && (
               <button onClick={() => setActiveQuote({...activeQuote, signature: undefined})} className="text-red-500 text-[10px] font-bold">Eliminar</button>
             )}
           </div>
           
           {activeQuote.signature ? (
             <div onClick={() => setShowSignatureModal(true)} className="w-full h-24 border border-slate-200 rounded-xl flex items-center justify-center cursor-pointer bg-slate-50">
               <img src={activeQuote.signature} alt="Firma" className="max-h-full max-w-full" />
             </div>
           ) : (
             <button 
               onClick={() => setShowSignatureModal(true)}
               className="w-full h-16 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center gap-2 text-slate-400 font-bold text-sm active:bg-slate-50 transition-colors"
             >
               <PenTool size={18} /> Toca para firmar
             </button>
           )}
        </section>

        </div>

        {/* Right Column - Summary & Actions (Desktop) */}
        <div className="lg:col-span-1">
          <div className="lg:sticky lg:top-6 space-y-6">
            {/* Summary Card */}
            <div className="bg-white p-4 sm:p-6 rounded-xl lg:rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="text-xs sm:text-sm font-bold text-slate-400 uppercase mb-4">Resumen</h3>
              
              <div className="space-y-3 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Subtotal</span>
                  <span className="font-medium text-slate-800">{money(subtotal)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-sm text-orange-600">
                    <span>Descuento ({activeQuote.discountRate}%)</span>
                    <span className="font-medium">-{money(discountAmount)}</span>
                  </div>
                )}
                {taxAmount > 0 && (
                  <div className="flex justify-between text-sm text-slate-600">
                    <span>Impuestos ({activeQuote.taxRate}%)</span>
                    <span className="font-medium">{money(taxAmount)}</span>
                  </div>
                )}
                <div className="border-t border-slate-200 pt-3 flex justify-between">
                  <span className="text-base font-bold text-slate-800">Total</span>
                  <span className="text-xl font-bold text-slate-900">{money(finalTotal)}</span>
                </div>
              </div>

              {/* Save Button - Desktop */}
              <button 
                onClick={handleSave} 
                className="w-full bg-slate-900 text-white py-3 px-4 rounded-xl font-bold text-sm sm:text-base flex justify-center items-center gap-2 hover:bg-slate-800 transition-colors active:scale-95 shadow-lg"
              >
                <Check size={20} /> Guardar Cotización
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile save action (visible solo en pantallas pequeñas) */}
      <div className="fixed bottom-0 left-0 right-0 lg:hidden bg-white border-t border-slate-200 p-4 safe-bottom z-40 shadow-2xl">
         <div className="flex justify-between items-center mb-3">
            <span className="text-xs font-bold text-slate-400 uppercase">Total Final</span>
            <span className="text-xl sm:text-2xl font-bold text-slate-900">{money(finalTotal)}</span>
         </div>
         <button 
           onClick={handleSave} 
           className="w-full bg-slate-900 text-white py-3.5 rounded-xl font-bold text-base flex justify-center items-center gap-2 active:scale-95 transition-transform shadow-lg"
         >
           <Check size={20} /> Guardar
         </button>
      </div>

      {/* Spacer for mobile bottom bar */}
      <div className="h-24 lg:hidden"></div>

      {showTemplatesModal && (
        <TemplatesModal 
          onClose={() => setShowTemplatesModal(false)}
          activeQuote={activeQuote}
          setActiveQuote={setActiveQuote}
        />
      )}

      {showCatalogModal && (
        <CatalogModal 
          onClose={() => setShowCatalogModal(false)}
          catalog={catalog}
          activeQuote={activeQuote}
          setActiveQuote={setActiveQuote}
        />
      )}

      {calculatingItem && (
        <PriceCalculatorModal 
          onClose={() => setCalculatingItem(null)}
          onApply={applyCalculation}
          initialPrice={Number(activeQuote.items.find(i => i.id === calculatingItem)?.price || 0)}
        />
      )}

      {showSignatureModal && (
        <SignatureModal 
          onClose={() => setShowSignatureModal(false)}
          onSave={(sig: string) => setActiveQuote({...activeQuote, signature: sig})}
        />
      )}
    </Screen>
  );
};

export default EditorView;