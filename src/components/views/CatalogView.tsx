import React, { useState } from 'react';
import { Trash2, X, PenTool, Check, Plus } from 'lucide-react';
import { CatalogItem, ViewState } from '../../types';
import { Screen, NavBar } from '../Shared';
import { money, generateId } from '../../utils';
import { db } from '../../db';

interface CatalogViewProps {
  view: ViewState;
  setView: (view: ViewState) => void;
  catalog: CatalogItem[];
  setCatalog: (catalog: CatalogItem[]) => void;
}

const CatalogView: React.FC<CatalogViewProps> = ({ view, setView, catalog }) => {
  const [newItemDesc, setNewItemDesc] = useState('');
  const [newItemUnit, setNewItemUnit] = useState('pza');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleSave = async () => {
    if (!newItemDesc || !newItemPrice) return;
    
    try {
      if (editingId) {
        // Update existing
        await db.catalog.update(editingId, {
          desc: newItemDesc,
          unit: newItemUnit,
          price: parseFloat(newItemPrice)
        });
        setEditingId(null);
      } else {
        // Create new
        await db.catalog.add({ 
          id: generateId(), 
          category: 'General', 
          desc: newItemDesc, 
          unit: newItemUnit,
          price: parseFloat(newItemPrice) 
        });
      }
      // Reset form
      setNewItemDesc('');
      setNewItemUnit('pza');
      setNewItemPrice('');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e) {
      console.error("Error saving to catalog", e);
    }
  };

  const startEdit = (item: CatalogItem) => {
    setEditingId(item.id);
    setNewItemDesc(item.desc);
    setNewItemUnit(item.unit || 'pza');
    setNewItemPrice(item.price.toString());
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setNewItemDesc('');
    setNewItemUnit('pza');
    setNewItemPrice('');
  };

  const deleteFromCatalog = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // Prevent triggering edit mode
    if(confirm('¿Borrar del catálogo?')) {
      try {
        await db.catalog.delete(id);
        if (editingId === id) cancelEdit();
      } catch (err) {
        console.error("Error deleting from catalog", err);
      }
    }
  };

  return (
    <Screen>
       <div className="sticky top-0 bg-white z-20 px-5 py-4 border-b border-slate-100 flex justify-between items-center">
         <h1 className="font-bold text-xl">Catálogo</h1>
         <div className="text-xs font-bold bg-slate-100 px-2 py-1 rounded">{catalog.length}</div>
       </div>
       <div className="p-5 space-y-4">
          {/* Input Form */}
          <div className={`p-5 rounded-2xl shadow-lg transition-colors ${editingId ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-white'}`}>
             <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-2">
               <div className="text-xs font-bold opacity-80 uppercase flex items-center gap-2">
                 {editingId ? <><PenTool size={14}/> Editando Item</> : <><Plus size={14}/> Nuevo Item</>}
               </div>
               {editingId && (
                 <button onClick={cancelEdit} className="bg-white/20 p-1.5 rounded-full hover:bg-white/30 transition-colors">
                   <X size={14} />
                 </button>
               )}
             </div>
             
             <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="col-span-3">
                    <label className="text-[10px] uppercase font-bold opacity-60 ml-1 mb-1 block">Descripción</label>
                    <input className="w-full bg-white/10 border border-white/20 rounded-xl p-3 text-sm text-white placeholder-white/40 outline-none focus:bg-white/20 transition-colors" 
                       placeholder="Ej. Instalación de..." value={newItemDesc} onChange={e => setNewItemDesc(e.target.value)}/>
                </div>
                <div className="col-span-1">
                    <label className="text-[10px] uppercase font-bold opacity-60 ml-1 mb-1 block">Unidad</label>
                    <input className="w-full bg-white/10 border border-white/20 rounded-xl p-3 text-center text-sm text-white placeholder-white/40 outline-none focus:bg-white/20 transition-colors" 
                       placeholder="pza" value={newItemUnit} onChange={e => setNewItemUnit(e.target.value)}/>
                </div>
                <div className="col-span-2">
                    <label className="text-[10px] uppercase font-bold opacity-60 ml-1 mb-1 block">Precio</label>
                    <div className="relative">
                        <span className="absolute left-3 top-3 text-white/40 text-sm">$</span>
                        <input className="w-full bg-white/10 border border-white/20 rounded-xl p-3 pl-6 text-sm text-white placeholder-white/40 outline-none focus:bg-white/20 transition-colors" 
                           type="number" placeholder="0.00" value={newItemPrice} onChange={e => setNewItemPrice(e.target.value)}/>
                    </div>
                </div>
             </div>

             <button onClick={handleSave} className="w-full bg-white text-slate-900 py-3.5 rounded-xl text-sm font-bold active:scale-95 transition-transform flex items-center justify-center gap-2 shadow-lg">
               {editingId ? <><Check size={18}/> Actualizar Catálogo</> : <><Plus size={18}/> Guardar en Catálogo</>}
             </button>
          </div>

          {/* List */}
          <div className="space-y-3">
            {catalog.map(item => (
               <div 
                 key={item.id} 
                 onClick={() => startEdit(item)}
                 className={`bg-white p-4 rounded-xl shadow-sm border flex justify-between items-center cursor-pointer transition-all active:scale-[0.99] ${editingId === item.id ? 'border-indigo-500 ring-2 ring-indigo-100 bg-indigo-50' : 'border-slate-100 hover:border-slate-300'}`}
               >
                  <div className="flex-1 min-w-0 pr-4">
                     <div className="font-medium text-slate-800 truncate">{item.desc}</div>
                     <div className="text-[10px] text-slate-400 font-bold uppercase">{item.unit || 'pza'}</div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                     <span className="font-bold text-slate-600">{money(item.price)}</span>
                     <button onClick={(e) => deleteFromCatalog(e, item.id)} className="text-slate-300 hover:text-red-400 p-2 -mr-2"><Trash2 size={18}/></button>
                  </div>
               </div>
            ))}
            {catalog.length === 0 && (
              <div className="text-center py-8 text-slate-400 text-sm">El catálogo está vacío.</div>
            )}
            <div className="h-20"></div>
          </div>
       </div>
       <NavBar view={view} setView={setView} />
    </Screen>
  );
};

export default CatalogView;