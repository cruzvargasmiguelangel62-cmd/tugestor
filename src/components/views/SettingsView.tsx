import React, { useState, useEffect, useRef } from 'react';
import { Download, Bell, BellOff, Check, Upload, Cloud, FileJson, AlertTriangle } from 'lucide-react';
import { Profile, ViewState } from '../../types';
import { Screen, NavBar, Input } from '../Shared';
import { db } from '../../db';

interface SettingsViewProps {
  view: ViewState;
  setView: (view: ViewState) => void;
  profile: Profile;
  setProfile: (profile: Profile) => void; 
  installPrompt?: any;
  onInstall?: () => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ view, setView, profile, installPrompt, onInstall }) => {
  const [notificationStatus, setNotificationStatus] = useState<NotificationPermission>('default');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if ('Notification' in window) {
      setNotificationStatus(Notification.permission);
    }
  }, []);

  const updateProfile = async (changes: Partial<Profile>) => {
     try {
       await db.profile.update('main', changes);
     } catch (e) {
       console.error("Error updating profile", e);
     }
  };

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      alert("Tu navegador no soporta notificaciones.");
      return;
    }
    
    if (notificationStatus === 'denied') {
      alert("Las notificaciones están bloqueadas. Por favor habilítalas en la configuración de tu navegador.");
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setNotificationStatus(permission);
      if (permission === 'granted') {
        if ('serviceWorker' in navigator) {
           navigator.serviceWorker.ready.then(registration => {
             registration.showNotification("Notificaciones Activas", {
               body: "Te avisaremos semanalmente sobre cotizaciones pendientes de cobro.",
               icon: 'https://cdn-icons-png.flaticon.com/512/3524/3524636.png'
             });
           });
        } else {
           new Notification("Notificaciones Activas", {
             body: "Te avisaremos semanalmente sobre cotizaciones pendientes de cobro.",
           });
        }
      }
    } catch (e) {
      console.error(e);
      setNotificationStatus('denied'); 
    }
  };

  const handleLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2000000) { 
         alert("Imagen muy pesada (max 2MB)");
         return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
          if (typeof reader.result === 'string') {
              updateProfile({ logo: reader.result });
          }
      };
      reader.readAsDataURL(file);
    }
  };

  // --- BACKUP LOGIC ---

  const handleExportBackup = async () => {
    try {
      const backup = {
        profile: await db.profile.toArray(),
        catalog: await db.catalog.toArray(),
        quotes: await db.quotes.toArray(),
        timestamp: new Date().toISOString(),
        version: 1
      };
      
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `TuGestor_Backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      alert('Error al crear copia de seguridad');
      console.error(e);
    }
  };

  const handleImportClick = () => {
    if (confirm('⚠️ IMPORTANTE:\n\nAl importar un respaldo, se REEMPLAZARÁN todos los datos actuales (cotizaciones, clientes, catálogo).\n\n¿Deseas continuar?')) {
      fileInputRef.current?.click();
    }
  };

  const processImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        
        if (!json.profile || !json.quotes) {
          throw new Error("Archivo inválido");
        }

        await (db as any).transaction('rw', db.profile, db.catalog, db.quotes, async () => {
          await db.profile.clear();
          await db.catalog.clear();
          await db.quotes.clear();

          await db.profile.bulkAdd(json.profile);
          await db.catalog.bulkAdd(json.catalog);
          await db.quotes.bulkAdd(json.quotes);
        });

        alert("✅ Respaldo restaurado con éxito. La aplicación se reiniciará.");
        window.location.reload();

      } catch (err) {
        alert("❌ Error: El archivo de respaldo está dañado o no es válido.");
        console.error(err);
      }
    };
    reader.readAsText(file);
  };

  const colors = ['#000000', '#1e293b', '#2563eb', '#dc2626', '#16a34a', '#d97706'];

  const handleInstallClick = () => {
    if (installPrompt && onInstall) {
      onInstall();
    } else {
      alert("Para instalar la App:\n\n1. 🤖 Android: Abre el menú del navegador (⋮) y selecciona 'Instalar aplicación' o 'Agregar a la pantalla de inicio'.\n\n2. 🍎 iOS (iPhone): Toca el botón Compartir (cuadrado con flecha) y selecciona 'Agregar al inicio'.\n\n3. 💻 PC: Busca el icono (+) en la barra de direcciones.");
    }
  };

  return (
    <Screen>
       <div className="sticky top-0 bg-white z-20 px-5 py-4 border-b border-slate-100 flex justify-between items-center">
         <h1 className="font-bold text-xl">Perfil y Ajustes</h1>
         <button onClick={async () => { if(confirm('¿Reiniciar toda la aplicación? Se borrarán todos los datos.')) { await (db as any).delete(); window.location.reload(); }}} className="text-red-400 text-xs font-bold">Reset Fabrica</button>
       </div>
       <div className="p-5 space-y-5">
          
          <button 
            onClick={handleInstallClick}
            className="w-full bg-slate-900 text-white p-4 rounded-2xl flex items-center justify-center gap-3 shadow-lg shadow-slate-300 active:scale-95 transition-all"
          >
            <div className="bg-white/20 p-2 rounded-xl">
              <Download size={24} />
            </div>
            <div className="text-left">
              <div className="font-bold text-sm">Instalar Aplicación</div>
              <div className="text-[10px] opacity-80">
                {installPrompt ? 'Toca para instalar ahora' : 'Ver instrucciones de instalación'}
              </div>
            </div>
          </button>

          {/* Backup Section */}
          <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm">
             <div className="flex items-center gap-2 mb-3">
                <Cloud size={18} className="text-indigo-600"/>
                <span className="font-bold text-sm text-slate-700">Copia de Seguridad</span>
             </div>
             <div className="grid grid-cols-2 gap-3">
                <button onClick={handleExportBackup} className="bg-slate-50 border border-slate-200 p-3 rounded-xl flex flex-col items-center gap-2 active:bg-slate-100">
                   <FileJson size={20} className="text-slate-500"/>
                   <span className="text-xs font-bold text-slate-600">Exportar Datos</span>
                </button>
                <button onClick={handleImportClick} className="bg-slate-50 border border-slate-200 p-3 rounded-xl flex flex-col items-center gap-2 active:bg-slate-100">
                   <Upload size={20} className="text-slate-500"/>
                   <span className="text-xs font-bold text-slate-600">Importar Datos</span>
                </button>
                {/* Hidden File Input */}
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={processImportFile} 
                  accept="application/json" 
                  className="hidden" 
                />
             </div>
             <div className="mt-2 flex items-start gap-2 bg-yellow-50 p-2 rounded-lg">
                <AlertTriangle size={14} className="text-yellow-600 shrink-0 mt-0.5"/>
                <p className="text-[10px] text-yellow-700 leading-tight">
                  Tus datos se guardan solo en este dispositivo. Exporta una copia frecuentemente para evitar pérdidas.
                </p>
             </div>
          </div>

          {/* Notification Settings */}
          <div 
             onClick={notificationStatus !== 'granted' ? requestNotificationPermission : undefined}
             className={`bg-white border border-slate-100 p-4 rounded-2xl flex items-center justify-between shadow-sm transition-colors ${notificationStatus !== 'granted' ? 'active:bg-slate-50 cursor-pointer' : ''}`}
          >
             <div className="flex items-center gap-3">
               <div className={`p-2 rounded-xl ${notificationStatus === 'granted' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                 {notificationStatus === 'granted' ? <Bell size={24} /> : <BellOff size={24} />}
               </div>
               <div className="flex-1">
                 <div className="font-bold text-sm text-slate-800">Notificaciones</div>
                 <div className="text-[10px] text-slate-400 leading-tight">
                   {notificationStatus === 'granted' 
                     ? 'Te avisaremos si tienes cotizaciones antiguas sin cobrar.' 
                     : 'Actívalas para recordarte de cobrar cotizaciones pendientes.'}
                 </div>
               </div>
             </div>
             {notificationStatus !== 'granted' && (
               <button 
                 onClick={(e) => { e.stopPropagation(); requestNotificationPermission(); }}
                 className="bg-slate-900 text-white px-3 py-1.5 rounded-lg text-xs font-bold ml-2 shrink-0"
               >
                 Activar
               </button>
             )}
             {notificationStatus === 'granted' && (
                <div className="bg-green-100 text-green-700 p-1 rounded-full ml-2 shrink-0"><Check size={16} /></div>
             )}
          </div>

          <div className="flex flex-col items-center pt-2">
             <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center overflow-hidden border-2 border-dashed border-slate-200 relative">
                {profile.logo ? <img src={profile.logo} className="w-full h-full object-cover" alt="Logo" /> : <span className="text-xs text-slate-300">Logo</span>}
                <input type="file" accept="image/*" onChange={handleLogo} className="absolute inset-0 opacity-0 cursor-pointer" />
             </div>
             <div className="text-xs text-slate-400 mt-2">Toca para subir logo</div>
          </div>
          
          <Input label="Nombre del Negocio" value={profile.name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateProfile({ name: e.target.value})} />
          <Input label="Eslogan o Giro" value={profile.slogan} onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateProfile({ slogan: e.target.value})} />
          <div className="flex gap-4">
            <Input className="flex-1" label="Teléfono" value={profile.phone} onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateProfile({ phone: e.target.value})} />
            <Input className="flex-1" label="Ciudad" placeholder="Ej. CDMX" value={profile.city || ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateProfile({ city: e.target.value})} />
          </div>
          
          <div>
             <label className="text-xs font-bold text-slate-400 uppercase ml-1">Términos y Condiciones (Pie de página)</label>
             <textarea className="w-full bg-white border border-slate-200 rounded-xl p-3 h-24 text-sm mt-1 outline-none focus:border-indigo-400 no-scrollbar resize-none" 
               value={profile.terms} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => updateProfile({ terms: e.target.value})} />
          </div>
          <div>
             <label className="text-xs font-bold text-slate-400 uppercase ml-1 mb-2 block">Color de Marca</label>
             <div className="flex gap-3 overflow-x-auto py-2 no-scrollbar">
               {colors.map(c => (
                 <button key={c} onClick={() => updateProfile({ color: c})} style={{backgroundColor: c}}
                   className={`w-10 h-10 rounded-full shrink-0 ${profile.color === c ? 'ring-4 ring-slate-200 scale-110' : 'hover:scale-105'} transition-all`} 
                   title={c === '#000000' ? 'Negro (Sin Color)' : ''}
                 />
               ))}
             </div>
          </div>
          <div className="h-10"></div>
       </div>
       <NavBar view={view} setView={setView} />
    </Screen>
  );
};

export default SettingsView;