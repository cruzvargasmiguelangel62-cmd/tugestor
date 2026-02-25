import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './db';
import { Profile, CatalogItem, Quote, ViewState, QuoteStatus } from './types';
import { Home, Book, Plus, FileText, User } from 'lucide-react';
import { generateId, calculateSubtotal } from './utils';
import { DEFAULT_PROFILE } from './constants';

// Views
import HomeView from './components/views/HomeView';
import EditorView from './components/views/EditorView';
import CatalogView from './components/views/CatalogView';
import HistoryView from './components/views/HistoryView';
import PreviewView from './components/views/PreviewView';
import SettingsView from './components/views/SettingsView';
import { TopNav, NavBar } from './components/Shared';

// Tipado para el evento de instalación PWA
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const App = () => {
  const [view, setView] = useState<ViewState>('home');
  const installPromptRef = useRef<BeforeInstallPromptEvent | null>(null);
  const [installAvailable, setInstallAvailable] = useState(false);
  const [activeQuote, setActiveQuote] = useState<Quote | null>(null);

  // --- DATABASE QUERIES (REACTIVE) ---

  // Optimizacion: useLiveQuery con dependencias vacías correctas
  const quotes = useLiveQuery(() => db.quotes.toArray().then(rows => rows.reverse()), []) ?? [];
  const catalog = useLiveQuery(() => db.catalog.toArray(), []) ?? [];

  const profile = useLiveQuery(async () => {
    const p = await db.profile.get('main');
    return p || DEFAULT_PROFILE;
  }, []) ?? DEFAULT_PROFILE;

  // --- DERIVED STATE (MEMOIZED) ---

  // Mejora: Solo recalcular clientes si cambian las cotizaciones
  const uniqueClients = useMemo(() => {
    return Array.from(new Set(quotes.map(q => q.client))).sort();
  }, [quotes]);

  // --- EFFECTS ---

  // 1. PWA Install Prompt
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevenir el banner automático del navegador
      e.preventDefault();
      // Guardar el evento para usarlo cuando el usuario quiera instalar
      installPromptRef.current = e as BeforeInstallPromptEvent;
      setInstallAvailable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Limpiar el listener al desmontar
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // 2. Notificaciones de Cotizaciones Pendientes
  useEffect(() => {
    const checkPendingQuotes = async () => {
      if (!('Notification' in window) || Notification.permission !== 'granted') return;

      const lastNotifyDate = localStorage.getItem('last_notification_date');
      const today = new Date().toDateString();

      // Evitar spam de notificaciones (solo 1 vez al día)
      if (lastNotifyDate === today) return;

      const now = new Date();
      const oldQuotes = quotes.filter(q => {
        if (q.status !== 'pendiente') return false;
        const qDate = new Date(q.date);
        const diffTime = Math.abs(now.getTime() - qDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays >= 7;
      });

      if (oldQuotes.length > 0) {
        const title = "⚠️ Cotizaciones Pendientes";
        const body = `Tienes ${oldQuotes.length} cotizaciones pendientes con más de una semana. ¡Dales seguimiento!`;
        const icon = 'https://cdn-icons-png.flaticon.com/512/3524/3524636.png';

        if ('serviceWorker' in navigator) {
          const registration = await navigator.serviceWorker.ready;
          // Uso de 'showNotification' para móviles/PWA
          registration.showNotification(title, {
            body,
            icon,
            vibrate: [200, 100, 200],
            tag: 'pending-quotes' // Tag evita notificaciones duplicadas en la barra
          } as any);
        } else {
          new Notification(title, { body, icon });
        }

        localStorage.setItem('last_notification_date', today);
      }
    };

    // Pequeño delay para asegurar que la DB cargó antes de verificar
    const timer = setTimeout(() => {
      if (quotes.length > 0) checkPendingQuotes();
    }, 2000);

    return () => clearTimeout(timer);
  }, [quotes]);

  // 3. Inicializar nueva cotización (Routing lógico)
  useEffect(() => {
    if (view === 'editor_new') {
      const newQuote: Quote = {
        id: generateId(),
        folio: String(profile.nextFolio).padStart(4, '0'),
        date: new Date().toISOString(),
        title: '',
        client: '',
        phone: '',
        items: [{ id: generateId(), qty: 1, unit: 'pza', desc: '', price: '' }],
        status: 'pendiente',
        total: 0,
        taxRate: 0,
        discountRate: 0
      };
      setActiveQuote(newQuote);
      setView('editor');
    }
  }, [view, profile.nextFolio]);

  // --- HANDLERS ---

  const handleInstallClick = useCallback(async () => {
    const promptEvent = installPromptRef.current;
    if (!promptEvent) {
      console.warn('No hay prompt de instalación disponible');
      return;
    }

    try {
      // Mostrar el prompt de instalación
      await promptEvent.prompt();

      // Esperar la respuesta del usuario
      const choiceResult = await promptEvent.userChoice;

      if (choiceResult.outcome === 'accepted') {
        console.log('Usuario aceptó la instalación');
        installPromptRef.current = null;
        setInstallAvailable(false);
      } else {
        console.log('Usuario rechazó la instalación');
      }
    } catch (error) {
      console.error('Error al mostrar el prompt de instalación:', error);
      installPromptRef.current = null;
      setInstallAvailable(false);
    }
  }, []);

  const saveQuote = async () => {
    if (!activeQuote) return;
    if (!activeQuote.client.trim()) {
      alert("Por favor ingresa el nombre del Cliente");
      return;
    }

    // Cálculos seguros convirtiendo a Number para evitar errores de strings
    const subtotal = calculateSubtotal(activeQuote.items);
    const discountAmount = subtotal * ((Number(activeQuote.discountRate) || 0) / 100);
    const subtotalLessDiscount = subtotal - discountAmount;
    const taxAmount = subtotalLessDiscount * ((Number(activeQuote.taxRate) || 0) / 100);
    const total = subtotalLessDiscount + taxAmount;

    const finalQuote: Quote = { ...activeQuote, total };

    try {
      const exists = await db.quotes.get(finalQuote.id);

      await db.quotes.put(finalQuote);

      // Solo incrementar folio si es una cotización nueva
      if (!exists) {
        await db.profile.update('main', { nextFolio: profile.nextFolio + 1 });
      }

      setView('history');
    } catch (error) {
      console.error("Failed to save quote", error);
      alert("Error al guardar: " + (error instanceof Error ? error.message : "Error desconocido"));
    }
  };

  const toggleQuoteStatus = async (quote: Quote) => {
    const newStatus: QuoteStatus = quote.status === 'pendiente' ? 'pagada' : 'pendiente';
    const updatedQuote = { ...quote, status: newStatus };

    try {
      await db.quotes.put(updatedQuote);
      // Actualizar estado local para reflejar cambio inmediato en UI
      if (activeQuote && activeQuote.id === quote.id) {
        setActiveQuote(updatedQuote);
      }
    } catch (e) {
      console.error("Error toggling status", e);
    }
  };

  const duplicateQuote = async (quote: Quote) => {
    const newQuote: Quote = {
      ...quote,
      id: generateId(),
      folio: String(profile.nextFolio).padStart(4, '0'),
      date: new Date().toISOString(),
      status: 'pendiente',
      client: `${quote.client} (Copia)`,
      title: quote.title ? `${quote.title} (Copia)` : '',
      items: quote.items.map(item => ({ ...item, id: generateId() }))
    };
    setActiveQuote(newQuote);
    setView('editor');
  };

  // --- RENDER ---

  // Renderizado limpio usando switch
  const renderContent = () => {
    switch (view) {
      case 'home':
        return (
          <HomeView
            view={view}
            setView={setView}
            profile={profile}
            quotes={quotes}
            setActiveQuote={setActiveQuote}
          />
        );
      case 'editor':
        return activeQuote ? (
          <EditorView
            view={view}
            setView={setView}
            quotes={quotes}
            activeQuote={activeQuote}
            setActiveQuote={setActiveQuote}
            saveQuote={saveQuote}
            catalog={catalog}
            clientSuggestions={uniqueClients}
          />
        ) : null;
      case 'catalog':
        return (
          <CatalogView
            view={view}
            setView={setView}
            catalog={catalog}
            setCatalog={() => { }}
          />
        );
      case 'history':
        return (
          <HistoryView
            view={view}
            setView={setView}
            quotes={quotes}
            setQuotes={() => { }}
            setActiveQuote={setActiveQuote}
            onDuplicate={duplicateQuote}
          />
        );
      case 'preview':
        return activeQuote ? (
          <PreviewView
            setView={setView}
            activeQuote={activeQuote}
            profile={profile}
            onToggleStatus={() => toggleQuoteStatus(activeQuote)}
          />
        ) : null;
      case 'settings':
        return (
          <SettingsView
            view={view}
            setView={setView}
            profile={profile}
            setProfile={() => { }}
            installAvailable={installAvailable}
            onInstall={handleInstallClick}
          />
        );
      case 'editor_new':
        return <div className="flex h-screen items-center justify-center">Creando cotización...</div>;
      default:
        return <div className="h-screen flex items-center justify-center text-slate-400">Cargando...</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col md:flex-row">
      {/* Desktop Sidebar - Visible desde tablets (md) */}
      <aside className="hidden md:flex md:flex-col md:w-64 xl:w-72 md:h-screen md:sticky md:top-0 bg-white border-r border-slate-200 shadow-sm transition-all duration-300">
        <div className="p-6 border-b border-slate-200">
          <h1 className="text-xl font-bold text-slate-900 truncate">{profile.name || 'Mi Negocio'}</h1>
          <p className="text-xs text-slate-500 mt-1 truncate">{profile.slogan || 'Cotizador Profesional'}</p>
        </div>

        <nav className="flex-1 flex flex-col gap-1 p-4 overflow-y-auto">
          <button
            onClick={() => setView('home')}
            className={`flex items-center gap-3 p-3 rounded-xl text-left transition-all ${view === 'home'
              ? 'bg-slate-900 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
          >
            <Home size={20} />
            <span className="font-medium">Inicio</span>
          </button>
          <button
            onClick={() => setView('catalog')}
            className={`flex items-center gap-3 p-3 rounded-xl text-left transition-all ${view === 'catalog'
              ? 'bg-slate-900 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
          >
            <Book size={20} />
            <span className="font-medium">Catálogo</span>
          </button>
          <button
            onClick={() => setView('history')}
            className={`flex items-center gap-3 p-3 rounded-xl text-left transition-all ${view === 'history'
              ? 'bg-slate-900 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
          >
            <FileText size={20} />
            <span className="font-medium">Historial</span>
          </button>
          <button
            onClick={() => setView('settings')}
            className={`flex items-center gap-3 p-3 rounded-xl text-left transition-all ${view === 'settings'
              ? 'bg-slate-900 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
          >
            <User size={20} />
            <span className="font-medium">Perfil</span>
          </button>
        </nav>

        <div className="p-4 border-t border-slate-200">
          <button
            onClick={() => setView('editor_new')}
            className="w-full bg-slate-900 text-white py-3 px-4 rounded-xl flex items-center justify-center gap-2 font-medium shadow-lg hover:bg-slate-800 transition-colors active:scale-95"
          >
            <Plus size={18} strokeWidth={2.5} />
            Nueva cotización
          </button>
        </div>
      </aside>

      {/* Mobile Header - Oculto desde tablets (md) */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-slate-200 shadow-sm safe-top">
        <div className="px-3 sm:px-4 md:px-6 pt-3 pb-2.5 sm:pt-4 sm:pb-3 md:pt-5 md:pb-3 flex items-center justify-between">
          <div className="min-w-0 flex-1 pr-2">
            <h1 className="text-base sm:text-lg font-bold text-slate-900 truncate leading-tight">{profile.name || 'Mi Negocio'}</h1>
            <p className="text-[10px] sm:text-xs text-slate-500 truncate leading-tight mt-0.5">{profile.slogan || 'Cotizador Profesional'}</p>
          </div>
          <button
            onClick={() => setView('editor_new')}
            className="bg-slate-900 text-white w-9 h-9 sm:w-10 sm:h-10 rounded-full shadow-md flex items-center justify-center active:scale-95 transition-transform shrink-0"
            aria-label="Nueva Cotización"
          >
            <Plus size={18} strokeWidth={2.5} className="sm:w-5 sm:h-5" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 md:ml-0 overflow-hidden">
        {renderContent()}
      </div>

      {/* Mobile Navigation Bar - Visible solo en pantallas pequeñas */}
      <NavBar view={view} setView={setView} />
    </div>
  );
};

export default App;
