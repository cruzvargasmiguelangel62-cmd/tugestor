import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './db';
import { Profile, CatalogItem, Quote, ViewState, QuoteStatus } from './types';
import { generateId, calculateSubtotal } from './utils';
import { DEFAULT_PROFILE } from './constants';

// Views
import HomeView from './components/views/HomeView';
import EditorView from './components/views/EditorView';
import CatalogView from './components/views/CatalogView';
import HistoryView from './components/views/HistoryView';
import PreviewView from './components/views/PreviewView';
import SettingsView from './components/views/SettingsView';

// Tipado para el evento de instalación PWA
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const App = () => {
  const [view, setView] = useState<ViewState>('home'); 
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
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
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
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

  const handleInstallClick = useCallback(() => {
    if (!installPrompt) return;
    installPrompt.prompt();
    installPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === 'accepted') {
        setInstallPrompt(null);
      }
    });
  }, [installPrompt]);

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
      items: quote.items.map(item => ({...item, id: generateId()}))
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
            setCatalog={() => {}} 
          />
        );
      case 'history':
        return (
          <HistoryView 
            view={view} 
            setView={setView} 
            quotes={quotes} 
            setQuotes={() => {}} 
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
            setProfile={() => {}} 
            installPrompt={installPrompt} 
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
    <>
      {renderContent()}
    </>
  );
};

export default App;
