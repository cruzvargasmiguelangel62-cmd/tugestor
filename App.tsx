import React, { useState, useEffect } from 'react';
import { Profile, CatalogItem, Quote, ViewState } from './types';
import { DEFAULT_CATALOG } from './constants';
import { generateId } from './utils';

// Views
import HomeView from './components/views/HomeView';
import EditorView from './components/views/EditorView';
import CatalogView from './components/views/CatalogView';
import HistoryView from './components/views/HistoryView';
import PreviewView from './components/views/PreviewView';
import SettingsView from './components/views/SettingsView';

const App = () => {
  const [view, setView] = useState<ViewState>('home'); 
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  
  const loadState = <T,>(key: string, fallback: T): T => {
    try { 
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : fallback; 
    } catch { 
      return fallback; 
    }
  };

  const [profile, setProfile] = useState<Profile>(() => loadState('tugestor_profile_v6', {
    name: 'Mi Negocio', slogan: 'Servicios Generales', phone: '', color: '#1e293b', logo: null, nextFolio: 1, terms: ''
  }));
  const [catalog, setCatalog] = useState<CatalogItem[]>(() => loadState('tugestor_catalog_v6', DEFAULT_CATALOG));
  const [quotes, setQuotes] = useState<Quote[]>(() => loadState('tugestor_quotes_v6', []));
  const [activeQuote, setActiveQuote] = useState<Quote | null>(null);

  useEffect(() => { localStorage.setItem('tugestor_profile_v6', JSON.stringify(profile)); }, [profile]);
  useEffect(() => { localStorage.setItem('tugestor_catalog_v6', JSON.stringify(catalog)); }, [catalog]);
  useEffect(() => { localStorage.setItem('tugestor_quotes_v6', JSON.stringify(quotes)); }, [quotes]);

  // Capture PWA install prompt
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  // Check for expired/stale pending quotes
  useEffect(() => {
    const checkPendingQuotes = async () => {
      if (!('Notification' in window) || Notification.permission !== 'granted') return;

      const lastNotifyDate = localStorage.getItem('last_notification_date');
      const today = new Date().toDateString();
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

        if ('serviceWorker' in navigator) {
           const registration = await navigator.serviceWorker.ready;
           registration.showNotification(title, {
             body: body,
             icon: 'https://cdn-icons-png.flaticon.com/512/3524/3524636.png',
             vibrate: [200, 100, 200]
           } as any);
        } else {
           new Notification(title, { body });
        }
        
        localStorage.setItem('last_notification_date', today);
      }
    };

    const timer = setTimeout(() => {
      checkPendingQuotes();
    }, 2000);

    return () => clearTimeout(timer);
  }, [quotes]);

  const handleInstallClick = () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    installPrompt.userChoice.then((choiceResult: any) => {
      if (choiceResult.outcome === 'accepted') {
        setInstallPrompt(null);
      }
    });
  };

  const initNewQuote = () => {
    setActiveQuote({
      id: generateId(),
      folio: String(profile.nextFolio).padStart(4, '0'),
      date: new Date().toISOString(),
      title: '',
      client: '', 
      phone: '',
      items: [{ id: generateId(), qty: 1, desc: '', price: '' }],
      status: 'pendiente', 
      total: 0,
      taxRate: 0,
      discountRate: 0
    });
    setView('editor');
  };

  useEffect(() => { 
    if (view === 'editor_new') {
      initNewQuote();
    }
  }, [view]);

  const saveQuote = () => {
    if (!activeQuote) return;
    if (!activeQuote.client.trim()) return alert("Falta Cliente");
    
    // Calculate total including tax and discount
    const subtotal = activeQuote.items.reduce((s, i) => s + (Number(i.price) * Number(i.qty)), 0);
    const discountAmount = subtotal * ((activeQuote.discountRate || 0) / 100);
    const subtotalLessDiscount = subtotal - discountAmount;
    const taxAmount = subtotalLessDiscount * ((activeQuote.taxRate || 0) / 100);
    const total = subtotalLessDiscount + taxAmount;

    const final: Quote = { ...activeQuote, total };
    
    const exists = quotes.findIndex(q => q.id === final.id);
    if (exists >= 0) {
      const updated = [...quotes]; 
      updated[exists] = final; 
      setQuotes(updated);
    } else {
      setQuotes([final, ...quotes]);
      setProfile(p => ({ ...p, nextFolio: p.nextFolio + 1 }));
    }
    setView('history');
  };

  const duplicateQuote = (quote: Quote) => {
    const newQuote: Quote = {
      ...quote,
      id: generateId(),
      folio: String(profile.nextFolio).padStart(4, '0'),
      date: new Date().toISOString(),
      status: 'pendiente',
      client: `${quote.client} (Copia)`,
      title: quote.title ? `${quote.title} (Copia)` : '',
      items: quote.items.map(item => ({...item, id: generateId()})) // Clone items with new IDs
    };
    setActiveQuote(newQuote);
    setView('editor');
  };

  // View Routing
  if (view === 'home') return <HomeView view={view} setView={setView} profile={profile} quotes={quotes} setActiveQuote={setActiveQuote} />;
  
  if (view === 'editor' && activeQuote) return <EditorView view={view} setView={setView} quotes={quotes} activeQuote={activeQuote} setActiveQuote={setActiveQuote} saveQuote={saveQuote} catalog={catalog} />;
  
  if (view === 'catalog') return <CatalogView view={view} setView={setView} catalog={catalog} setCatalog={setCatalog} />;
  
  if (view === 'history') return <HistoryView view={view} setView={setView} quotes={quotes} setQuotes={setQuotes} setActiveQuote={setActiveQuote} onDuplicate={duplicateQuote} />;
  
  if (view === 'preview' && activeQuote) return <PreviewView setView={setView} activeQuote={activeQuote} profile={profile} />;
  
  if (view === 'settings') return <SettingsView view={view} setView={setView} profile={profile} setProfile={setProfile} installPrompt={installPrompt} onInstall={handleInstallClick} />;

  return <div className="h-screen flex items-center justify-center text-slate-400">Cargando...</div>;
};

export default App;