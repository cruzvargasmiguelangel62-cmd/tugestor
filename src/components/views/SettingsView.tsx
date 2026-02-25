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
  installAvailable?: boolean;
  onInstall?: () => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ view, setView, profile, installAvailable, onInstall }) => {
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
    if (installAvailable && onInstall) {
      onInstall();
    } else {
      alert("Para instalar la App:\n\n1. 🤖 Android: Abre el menú del navegador (⋮) y selecciona 'Instalar aplicación' o 'Agregar a la pantalla de inicio'.\n\n2. 🍎 iOS (iPhone): Toca el botón Compartir (cuadrado con flecha) y selecciona 'Agregar al inicio'.\n\n3. 💻 PC: Busca el icono (+) en la barra de direcciones.");
    }
  };

  return (
    <Screen className="py-0 sm:py-4 md:py-6 lg:py-8">
      {/* Header - Premium Look */}
      <div className="mb-10 lg:mb-14 px-4 md:px-0 pt-6 sm:pt-0 flex flex-col md:flex-row md:justify-between md:items-end gap-6">
        <div>
          <h1 className="font-extrabold text-3xl lg:text-4xl text-slate-900 tracking-tight">Perfil y Ajustes</h1>
          <p className="text-slate-500 text-sm mt-1.5 font-medium italic">Personaliza tu identidad y gestiona tus datos</p>
        </div>
        <button
          onClick={async () => {
            if (confirm('¿Reiniciar toda la aplicación? Se borrarán todos los datos por completo.')) {
              await (db as any).delete();
              window.location.reload();
            }
          }}
          className="bg-red-50 text-red-600 px-5 py-2.5 rounded-2xl text-sm font-bold border border-red-100 hover:bg-red-600 hover:text-white transition-all self-start md:self-auto uppercase tracking-wider"
        >
          Reset de Fábrica
        </button>
      </div>
      <div className="space-y-4 sm:space-y-6 lg:grid lg:grid-cols-2 lg:gap-6 lg:space-y-0 px-4 sm:px-0">

        <div className="lg:col-span-2">
          <button
            onClick={handleInstallClick}
            className="w-full bg-slate-900 text-white p-4 sm:p-5 lg:p-6 rounded-xl lg:rounded-2xl flex items-center justify-center gap-4 shadow-lg hover:bg-slate-800 active:scale-95 transition-all"
          >
            <div className="bg-white/20 p-3 rounded-xl">
              <Download size={24} className="sm:w-6 sm:h-6" />
            </div>
            <div className="text-left flex-1">
              <div className="font-bold text-sm sm:text-base lg:text-lg">Instalar Aplicación</div>
              <div className="text-xs sm:text-sm opacity-80">
                {installAvailable ? 'Toca para instalar ahora' : 'Ver instrucciones de instalación'}
              </div>
            </div>
          </button>
        </div>

        {/* Backup Section */}
        <div className="bg-white border border-slate-200 p-4 sm:p-5 lg:p-6 rounded-xl lg:rounded-2xl shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Cloud size={20} className="text-indigo-600 sm:w-5 sm:h-5" />
            <span className="font-bold text-sm sm:text-base text-slate-700">Copia de Seguridad</span>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4">
            <button
              onClick={handleExportBackup}
              className="bg-slate-50 border border-slate-200 p-3 sm:p-4 rounded-xl flex flex-col items-center gap-2 hover:bg-slate-100 hover:border-slate-300 transition-colors active:scale-95"
            >
              <FileJson size={24} className="text-slate-500 sm:w-6 sm:h-6" />
              <span className="text-xs sm:text-sm font-bold text-slate-600">Exportar</span>
            </button>
            <button
              onClick={handleImportClick}
              className="bg-slate-50 border border-slate-200 p-3 sm:p-4 rounded-xl flex flex-col items-center gap-2 hover:bg-slate-100 hover:border-slate-300 transition-colors active:scale-95"
            >
              <Upload size={24} className="text-slate-500 sm:w-6 sm:h-6" />
              <span className="text-xs sm:text-sm font-bold text-slate-600">Importar</span>
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
          <div className="flex items-start gap-2 bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
            <AlertTriangle size={16} className="text-yellow-600 shrink-0 mt-0.5" />
            <p className="text-xs sm:text-sm text-yellow-700 leading-relaxed">
              Tus datos se guardan solo en este dispositivo. Exporta una copia frecuentemente para evitar pérdidas.
            </p>
          </div>
        </div>

        {/* Notification Settings */}
        <div
          onClick={notificationStatus !== 'granted' ? requestNotificationPermission : undefined}
          className={`bg-white border border-slate-200 p-4 sm:p-5 lg:p-6 rounded-xl lg:rounded-2xl flex items-center justify-between shadow-sm transition-colors ${notificationStatus !== 'granted' ? 'hover:bg-slate-50 cursor-pointer active:bg-slate-100' : ''
            }`}
        >
          <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
            <div className={`p-2 sm:p-3 rounded-xl shrink-0 ${notificationStatus === 'granted' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
              {notificationStatus === 'granted' ? <Bell size={24} className="sm:w-6 sm:h-6" /> : <BellOff size={24} className="sm:w-6 sm:h-6" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-sm sm:text-base text-slate-800 mb-1">Notificaciones</div>
              <div className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                {notificationStatus === 'granted'
                  ? 'Te avisaremos si tienes cotizaciones antiguas sin cobrar.'
                  : 'Actívalas para recordarte de cobrar cotizaciones pendientes.'}
              </div>
            </div>
          </div>
          {notificationStatus !== 'granted' && (
            <button
              onClick={(e) => { e.stopPropagation(); requestNotificationPermission(); }}
              className="bg-slate-900 text-white px-4 py-2 rounded-lg text-xs sm:text-sm font-bold ml-2 shrink-0 hover:bg-slate-800 transition-colors"
            >
              Activar
            </button>
          )}
          {notificationStatus === 'granted' && (
            <div className="bg-green-100 text-green-700 p-2 rounded-full ml-2 shrink-0">
              <Check size={18} className="sm:w-5 sm:h-5" />
            </div>
          )}
        </div>

        {/* Profile Form */}
        <div className="bg-white border border-slate-200 p-4 sm:p-5 lg:p-6 rounded-xl lg:rounded-2xl shadow-sm lg:col-span-2">
          <h2 className="font-bold text-base sm:text-lg text-slate-800 mb-4 sm:mb-6">Información del Negocio</h2>

          <div className="flex flex-col items-center pt-2 mb-6">
            <div className="w-24 h-24 sm:w-28 sm:h-28 lg:w-32 lg:h-32 bg-slate-50 rounded-full flex items-center justify-center overflow-hidden border-2 border-dashed border-slate-300 relative hover:border-slate-400 transition-colors cursor-pointer">
              {profile.logo ? (
                <img src={profile.logo} className="w-full h-full object-cover" alt="Logo" />
              ) : (
                <span className="text-xs sm:text-sm text-slate-400">Logo</span>
              )}
              <input type="file" accept="image/*" onChange={handleLogo} className="absolute inset-0 opacity-0 cursor-pointer" />
            </div>
            <div className="text-xs sm:text-sm text-slate-500 mt-3">Toca para subir logo</div>
          </div>

          <div className="space-y-4 sm:space-y-5">
            <Input
              label="Nombre del Negocio"
              value={profile.name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateProfile({ name: e.target.value })}
            />
            <Input
              label="Eslogan o Giro"
              value={profile.slogan || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateProfile({ slogan: e.target.value })}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Teléfono"
                value={profile.phone}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateProfile({ phone: e.target.value })}
              />
              <Input
                label="Ciudad"
                placeholder="Ej. CDMX"
                value={profile.city || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateProfile({ city: e.target.value })}
              />
            </div>

            <div>
              <label className="text-xs sm:text-sm font-bold text-slate-400 uppercase ml-1 mb-2 block">Términos y Condiciones (Pie de página)</label>
              <textarea
                className="w-full bg-white border-2 border-slate-200 rounded-xl p-3 sm:p-4 h-32 sm:h-36 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 transition-all resize-none"
                value={profile.terms || ''}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => updateProfile({ terms: e.target.value })}
                placeholder="Ingresa los términos y condiciones que aparecerán en tus cotizaciones..."
              />
            </div>

            <div>
              <label className="text-xs sm:text-sm font-bold text-slate-400 uppercase ml-1 mb-3 block">Color de Marca</label>
              <div className="flex gap-3 sm:gap-4 overflow-x-auto py-2 no-scrollbar">
                {colors.map(c => (
                  <button
                    key={c}
                    onClick={() => updateProfile({ color: c })}
                    style={{ backgroundColor: c }}
                    className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full shrink-0 transition-all ${profile.color === c
                        ? 'ring-4 ring-slate-300 scale-110 shadow-lg'
                        : 'hover:scale-105 hover:shadow-md'
                      }`}
                    title={c === '#000000' ? 'Negro (Sin Color)' : ''}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="h-20 lg:hidden"></div>
      </div>

    </Screen>
  );
};

export default SettingsView;