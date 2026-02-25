import React, { useState } from 'react';
import { Trash2, X, PenTool, Check, Plus, Book } from 'lucide-react';
import { CatalogItem, ViewState } from '../../types';
import { Screen } from '../Shared';
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
    if (confirm('¿Borrar del catálogo?')) {
      try {
        await db.catalog.delete(id);
        if (editingId === id) cancelEdit();
      } catch (err) {
        console.error("Error deleting from catalog", err);
      }
    }
  };

  return (
    <Screen className="py-0 sm:py-4 md:py-6 lg:py-8">
      {/* Header - Premium Look */}
      <div className="mb-10 lg:mb-14 px-4 md:px-0 pt-2 sm:pt-0 flex flex-col md:flex-row md:justify-between md:items-end gap-6">
        <div>
          <h1 className="font-extrabold text-3xl lg:text-4xl text-slate-900 tracking-tight">Catálogo</h1>
          <p className="text-slate-500 text-sm mt-1.5 font-medium italic">Gestiona tus productos y servicios frecuentes</p>
        </div>
        <div className="bg-slate-900 text-white px-5 py-2.5 rounded-2xl text-sm font-bold shadow-xl shadow-slate-900/20 self-start md:self-auto uppercase tracking-wider">
          {catalog.length} Items registrados
        </div>
      </div>

      {/* Two Column Layout - Responsive - Sin padding en móvil */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 sm:gap-6 lg:gap-8 px-0 sm:px-0">
        {/* Left Column - Form */}
        <div className="lg:col-span-1">
          <div className={`p-4 sm:p-6 rounded-none sm:rounded-xl lg:rounded-2xl shadow-lg transition-colors sticky top-[80px] sm:top-6 ${editingId ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-white'}`}>
            <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-3">
              <div className="text-xs sm:text-sm font-bold opacity-90 uppercase flex items-center gap-2">
                {editingId ? <><PenTool size={16} /> Editando Item</> : <><Plus size={16} /> Nuevo Item</>}
              </div>
              {editingId && (
                <button onClick={cancelEdit} className="bg-white/20 p-2 rounded-full hover:bg-white/30 transition-colors">
                  <X size={16} />
                </button>
              )}
            </div>

            <div className="space-y-4 mb-4">
              <div>
                <label className="text-xs uppercase font-bold opacity-80 ml-1 mb-2 block">Descripción</label>
                <input
                  className="w-full bg-white/10 border border-white/20 rounded-xl p-3 sm:p-3.5 text-sm text-white placeholder-white/40 outline-none focus:bg-white/20 focus:border-white/40 transition-colors"
                  placeholder="Ej. Instalación de..."
                  value={newItemDesc}
                  onChange={e => setNewItemDesc(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="text-xs uppercase font-bold opacity-80 ml-1 mb-2 block">Unidad</label>
                  <input
                    className="w-full bg-white/10 border border-white/20 rounded-xl p-3 text-center text-sm text-white placeholder-white/40 outline-none focus:bg-white/20 focus:border-white/40 transition-colors"
                    placeholder="pza"
                    value={newItemUnit}
                    onChange={e => setNewItemUnit(e.target.value)}
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-xs uppercase font-bold opacity-80 ml-1 mb-2 block">Precio</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50 text-sm">$</span>
                    <input
                      className="w-full bg-white/10 border border-white/20 rounded-xl p-3 pl-8 text-sm text-white placeholder-white/40 outline-none focus:bg-white/20 focus:border-white/40 transition-colors"
                      type="number"
                      placeholder="0.00"
                      value={newItemPrice}
                      onChange={e => setNewItemPrice(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={handleSave}
              className="w-full bg-white text-slate-900 py-3.5 rounded-xl text-sm font-bold active:scale-95 transition-transform flex items-center justify-center gap-2 shadow-lg hover:bg-slate-100"
            >
              {editingId ? <><Check size={18} /> Actualizar</> : <><Plus size={18} /> Guardar</>}
            </button>
          </div>
        </div>

        {/* Right Column - List */}
        <div className="lg:col-span-2">
          <div className="space-y-3 sm:space-y-4">
            {catalog.map(item => (
              <div
                key={item.id}
                onClick={() => startEdit(item)}
                className={`bg-white p-4 sm:p-5 rounded-xl lg:rounded-2xl shadow-sm border flex justify-between items-center cursor-pointer transition-all active:scale-[0.99] lg:hover:shadow-md ${editingId === item.id
                  ? 'border-indigo-500 ring-2 ring-indigo-100 bg-indigo-50'
                  : 'border-slate-200 hover:border-slate-300'
                  }`}
              >
                <div className="flex-1 min-w-0 pr-4">
                  <div className="font-medium text-base sm:text-lg text-slate-800 truncate mb-1">{item.desc}</div>
                  <div className="text-xs text-slate-500 font-bold uppercase">{item.unit || 'pza'}</div>
                </div>
                <div className="flex items-center gap-3 sm:gap-4 shrink-0">
                  <span className="font-bold text-lg sm:text-xl text-slate-900">{money(item.price)}</span>
                  <button
                    onClick={(e) => deleteFromCatalog(e, item.id)}
                    className="text-slate-400 hover:text-red-500 p-2 hover:bg-red-50 rounded-lg transition-colors"
                    title="Eliminar"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
            {catalog.length === 0 && (
              <div className="text-center py-12 lg:py-16 bg-white rounded-none sm:rounded-xl border-x-0 sm:border-x border-t border-b sm:border border-slate-200">
                <Book size={48} className="mx-auto mb-3 text-slate-300" />
                <div className="text-slate-400 text-sm mb-1">El catálogo está vacío</div>
                <div className="text-xs text-slate-300">Agrega productos para facilitar tus cotizaciones</div>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="h-24 lg:hidden"></div>

    </Screen>
  );
};

export default CatalogView;