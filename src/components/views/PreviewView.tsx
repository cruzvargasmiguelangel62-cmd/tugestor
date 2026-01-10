import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, Printer, Share2, Download, Loader2, CheckCircle2, Circle, MessageCircle } from 'lucide-react';
import { Quote, Profile, ViewState } from '../../types';
import { Screen } from '../Shared';
import { money, formatDate, calculateSubtotal } from '../../utils';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { ShareOptionsModal } from '../Modals';

interface PreviewViewProps {
  setView: (view: ViewState) => void;
  activeQuote: Quote;
  profile: Profile;
  onToggleStatus: () => void;
}

const PreviewView: React.FC<PreviewViewProps> = ({ setView, activeQuote, profile, onToggleStatus }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState<number>(0.8);
  const [containerMaxWidth, setContainerMaxWidth] = useState<number | null>(null);

  useEffect(() => {
    const updateScale = () => {
      const container = containerRef.current;
      const available = container ? container.clientWidth - 48 : window.innerWidth - 48;

      if (available < 816) {
        const newScale = Math.max(0.35, Math.min(1, available / 816));
        setScale(newScale);
        setContainerMaxWidth(816);
      } else {
        // On larger screens don't scale up the print visual — let it grow to a max width
        setScale(1);
        setContainerMaxWidth(Math.min(1200, available));
      }
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  const getCanvas = async () => {
    const element = document.getElementById('print-area');
    if (!element) return null;

    // Esperar a que las imágenes estén cargadas (especialmente el logo)
    await new Promise(resolve => setTimeout(resolve, 200));

    const canvas = await html2canvas(element, {
      scale: 3, // Mayor calidad para retina displays
      useCORS: true,
      allowTaint: true,
      width: 816, 
      windowWidth: 816,
      backgroundColor: '#ffffff'
    });
    
    return canvas;
  };

  const generatePDFBlob = async (): Promise<Blob | null> => {
    const canvas = await getCanvas();
    if (!canvas) return null;

    const imgData = canvas.toDataURL('image/jpeg', 0.9);
    const pdf = new jsPDF('p', 'pt', 'letter');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgProps = pdf.getImageProperties(imgData);
    const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;

    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, imgHeight);
    heightLeft -= pdfHeight;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, imgHeight);
      heightLeft -= pdfHeight;
    }

    return pdf.output('blob');
  };

  const getCleanPhone = () => {
    let phone = activeQuote.phone.replace(/\D/g, '');
    if (phone.length === 10) phone = '52' + phone;
    return phone;
  };

  const handleQuickWhatsApp = () => {
    const phone = getCleanPhone();
    const msg = `Hola ${activeQuote.client},\n\nLe comparto los detalles de su cotización #${activeQuote.folio}:\n\nTotal: ${money(activeQuote.total)}\nFecha: ${formatDate(activeQuote.date)}\n\nQuedo atento a sus comentarios.`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const onShareFileAction = async () => {
    setIsGenerating(true);
    try {
      const pdfBlob = await generatePDFBlob();
      if (!pdfBlob) throw new Error("Error generando PDF");

      const fileName = `Cotizacion_${activeQuote.folio}.pdf`;
      const file = new File([pdfBlob], fileName, { type: 'application/pdf' });

      // Intento 1: Web Share API (solo en móviles modernos con soporte)
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: `Cotización #${activeQuote.folio}`,
            text: `Hola ${activeQuote.client}, adjunto tu cotización.`
          });
          setShowShareModal(false);
          return; // Éxito, salimos
        } catch (shareError) {
          // Si el usuario cancela, intentamos fallback
          if ((shareError as Error).name !== 'AbortError') {
            console.log("Share API fallida, descargando...");
          }
        }
      }

      // Intento 2: Fallback - Descarga Directa (PC o Safari)
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      alert("El PDF se ha descargado. Ahora puedes adjuntarlo en WhatsApp o enviarlo por email.");
      setShowShareModal(false);
    } catch (e) {
      console.error(e);
      alert("Error al generar el documento. Intenta descargarlo desde el botón PDF.");
    } finally {
      setIsGenerating(false);
    }
  };

  const onShareLinkAction = async () => {
    setIsGenerating(true);
    try {
      const pdfBlob = await generatePDFBlob();
      if (!pdfBlob) return;

      const cleanClient = activeQuote.client.replace(/[^a-z0-9]/gi, '_').substring(0, 15);
      const fileName = `Cotizacion_${cleanClient}_${activeQuote.folio}.pdf`;
      const file = new File([pdfBlob], fileName, { type: 'application/pdf' });

      const formData = new FormData();
      formData.append('file', file);

      // Using tmpfiles.org or similar free host
      const uploadResponse = await fetch('https://tmpfiles.org/api/v1/upload', {
        method: 'POST',
        body: formData
      });
      
      const result = await uploadResponse.json();
      
      if (result.status === 'success' && result.data.url) {
         // Convert to direct download link
         const directDownloadUrl = result.data.url.replace('tmpfiles.org/', 'tmpfiles.org/dl/');
         const phone = getCleanPhone();
         const msg = `Hola ${activeQuote.client},\n\nLe comparto su cotización #${activeQuote.folio}.\n\nDescargar PDF aquí:\n${directDownloadUrl}`;
         
         window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
         setShowShareModal(false);
      } else {
         throw new Error("Upload failed");
      }
    } catch (error) {
       console.error("Link share error", error);
       alert("No se pudo generar el enlace. Intenta con la opción 'Adjuntar Archivo'.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadPDF = async () => {
    setIsGenerating(true);
    try {
      const blob = await generatePDFBlob();
      if (!blob) return;
      
      const cleanClient = activeQuote.client.replace(/[^a-z0-9]/gi, '_').substring(0, 15);
      const fileName = `Cotizacion_${cleanClient}_${activeQuote.folio}.pdf`;
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('PDF Generation failed:', error);
      alert('Error al generar el PDF.');
    } finally {
      setIsGenerating(false);
    }
  };

  const isPaid = activeQuote.status === 'pagada';

  return (
    <Screen className="bg-slate-200">
      <div className="bg-white px-3 py-3 shadow-sm flex justify-between items-center sticky top-0 z-20 no-print">
         <button onClick={() => setView('history')} className="flex items-center gap-1 text-sm font-bold text-slate-600 mr-2">
            <ChevronLeft size={24}/> 
            <span className="hidden sm:inline">Volver</span>
         </button>
         
         <div className="flex gap-2 items-center overflow-x-auto no-scrollbar">
            <button 
              onClick={onToggleStatus}
              className={`flex shrink-0 items-center gap-1 px-3 py-2 rounded-full text-[10px] font-bold transition-all ${isPaid ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}
            >
              {isPaid ? <CheckCircle2 size={14} /> : <Circle size={14} />}
              {isPaid ? 'PAGADA' : 'PENDIENTE'}
            </button>

            <div className="w-px h-6 bg-slate-100 mx-1 shrink-0"></div>

            <button 
              onClick={handleQuickWhatsApp} 
              className="bg-green-600 text-white p-2 rounded-full shadow-sm active:scale-95 transition-transform shrink-0"
              title="WhatsApp Rápido (Texto)"
            >
              <MessageCircle size={20} />
            </button>

            <button 
              onClick={() => setShowShareModal(true)} 
              disabled={isGenerating}
              className="bg-indigo-600 text-white px-3 py-2 rounded-full shadow-md shadow-indigo-200 active:scale-95 transition-all flex items-center gap-2 font-bold text-xs whitespace-nowrap shrink-0" 
              title="Compartir PDF"
            >
              {isGenerating ? <Loader2 size={16} className="animate-spin"/> : <><Share2 size={16}/> PDF</>}
            </button>
         </div>
      </div>

      <div className="flex justify-center p-4 overflow-auto no-print" ref={containerRef}>
        <div
          className="bg-white shadow-xl relative"
          style={{
           width: '100%',
           maxWidth: containerMaxWidth || 816,
           minHeight: 1056,
           transform: scale < 1 ? `scale(${scale})` : undefined,
           transformOrigin: 'top center'
          }}
        >
          <PrintContent activeQuote={activeQuote} profile={profile} />
        </div>
      </div>

      {/* Off-screen print area: visible a html2canvas pero no al usuario */}
      <div 
        id="print-area" 
        className="fixed top-0 left-[-9999px] z-[-1] bg-white text-slate-900" 
        style={{ width: '816px', minHeight: '1056px' }}
      >
         <PrintContent activeQuote={activeQuote} profile={profile} />
      </div>

      {showShareModal && (
        <ShareOptionsModal 
          onClose={() => setShowShareModal(false)}
          onShareFile={onShareFileAction}
          onShareLink={onShareLinkAction}
        />
      )}
    </Screen>
  );
};

const PrintContent: React.FC<{activeQuote: Quote, profile: Profile}> = ({activeQuote, profile}) => {
  const brandColor = profile.color || '#1e293b';

  const subtotal = calculateSubtotal(activeQuote.items);
  const discountRate = activeQuote.discountRate || 0;
  const discountAmount = subtotal * (discountRate / 100);
  const subtotalAfterDiscount = subtotal - discountAmount;
  const taxRate = activeQuote.taxRate || 0;
  const taxAmount = subtotalAfterDiscount * (taxRate / 100);
  const finalTotal = subtotalAfterDiscount + taxAmount;

  return (
    <div className="w-full h-full p-12 flex flex-col font-sans relative box-border">
      
      <div className="flex justify-between items-start mb-6 border-b-2 pb-6" style={{ borderColor: brandColor }}>
         <div className="w-1/2 pr-4">
            {profile.logo && (
              <img src={profile.logo} className="h-20 object-contain mb-4" alt="Logo" />
            )}
            <h1 className="font-bold text-3xl uppercase tracking-tight text-slate-900 mb-1">
              {profile.name}
            </h1>
            <p className="text-slate-500 font-medium text-sm mb-3">{profile.slogan}</p>
            
            <div className="text-slate-500 text-xs leading-relaxed">
               {profile.city && <p>{profile.city}</p>}
               <p>{profile.phone}</p>
            </div>
         </div>

         <div className="w-1/2 flex flex-col items-end text-right">
            <div className="text-4xl font-black uppercase tracking-wider mb-2" style={{ color: brandColor }}>
               Cotización
            </div>
            <div className="space-y-1 text-sm">
               <div className="flex items-center gap-4 justify-end">
                  <span className="font-bold text-slate-400 uppercase text-xs">Folio</span>
                  <span className="font-mono font-bold text-xl text-slate-800">#{activeQuote.folio}</span>
               </div>
               <div className="flex items-center gap-4 justify-end">
                  <span className="font-bold text-slate-400 uppercase text-xs">Fecha</span>
                  <span className="font-medium text-slate-800">{formatDate(activeQuote.date)}</span>
               </div>
               <div className="flex items-center gap-4 justify-end">
                   <span className="font-bold text-slate-400 uppercase text-xs">Estado</span>
                   <span className={`font-bold px-2 py-0.5 rounded text-xs uppercase ${activeQuote.status === 'pagada' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                     {activeQuote.status}
                   </span>
               </div>
            </div>
         </div>
      </div>

      <div className="mb-8 mt-4 border-b border-slate-100 pb-6">
         <div className="text-3xl font-black text-slate-900 uppercase tracking-tight leading-tight mb-8 text-center">
            {activeQuote.title || 'Presupuesto de Servicios'}
         </div>
         <div className="flex flex-col gap-1 text-left">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Atención A</span>
            <span className="text-lg font-bold text-slate-800">{activeQuote.client}</span>
         </div>
      </div>

      <div className="flex-1 mb-8">
        <table className="w-full border-collapse table-fixed">
            <thead>
              <tr style={{ backgroundColor: brandColor }} className="text-white">
                <th className="w-[8%] py-3 px-2 text-center text-xs font-bold uppercase tracking-wider rounded-tl-lg">Cant</th>
                <th className="w-[10%] py-3 px-2 text-center text-xs font-bold uppercase tracking-wider">Unid</th>
                <th className="w-[47%] py-3 px-4 text-left text-xs font-bold uppercase tracking-wider">Descripción</th>
                <th className="w-[17%] py-3 px-4 text-right text-xs font-bold uppercase tracking-wider">Precio</th>
                <th className="w-[18%] py-3 px-4 text-right text-xs font-bold uppercase tracking-wider rounded-tr-lg">Importe</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {activeQuote.items.map((item, i) => (
                <tr key={i} className={`border-b border-slate-100 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}>
                  <td className="py-4 px-2 text-center font-bold text-slate-500">{item.qty}</td>
                  <td className="py-4 px-2 text-center text-xs font-bold text-slate-400 uppercase">{item.unit || '-'}</td>
                  <td className="py-4 px-4 text-slate-800 font-medium">{item.desc}</td>
                  <td className="py-4 px-4 text-right text-slate-600 font-mono">{money(item.price)}</td>
                  <td className="py-4 px-4 text-right font-bold text-slate-800 font-mono">{money(Number(item.price) * Number(item.qty))}</td>
                </tr>
              ))}
            </tbody>
        </table>
      </div>

      <div className="flex justify-between items-start mt-auto pt-6 border-t border-slate-200">
         <div className="w-[60%] pr-12">
             {profile.terms ? (
               <div className="text-slate-500">
                  <h4 className="text-xs font-bold uppercase mb-2 text-slate-400">Términos y Condiciones</h4>
                  <p className="text-[10px] leading-relaxed text-justify whitespace-pre-wrap">
                     {profile.terms}
                  </p>
               </div>
             ) : (
                <div className="text-[10px] text-slate-300 italic">Sin términos adicionales.</div>
             )}
         </div>

         <div className="w-[40%]">
            {(discountRate > 0 || taxRate > 0) && (
              <div className="flex justify-between items-center py-1 text-slate-500">
                <span className="text-sm font-medium">Subtotal</span>
                <span className="text-base font-bold text-slate-700">{money(subtotal)}</span>
              </div>
            )}
            
            {discountRate > 0 && (
               <div className="flex justify-between items-center py-1 text-orange-600">
                  <span className="text-sm font-medium">Descuento ({discountRate}%)</span>
                  <span className="text-base font-bold">-{money(discountAmount)}</span>
               </div>
            )}

            {taxRate > 0 && (
              <div className="flex justify-between items-center py-1 text-slate-500 border-b border-slate-200 mb-2 pb-2">
                 <span className="text-sm font-medium">Impuestos ({taxRate}%)</span>
                 <span className="text-base font-bold text-slate-700">{money(taxAmount)}</span>
              </div>
            )}
            
            <div className="flex justify-between items-center py-3">
               <span className="text-lg font-black uppercase text-slate-900">Total</span>
               <span className="text-2xl font-black tracking-tight" style={{ color: brandColor }}>{money(finalTotal)}</span>
            </div>
         </div>
      </div>

      <div className="mt-16 pt-8 flex justify-center">
         <div className="w-1/2 text-center">
            {activeQuote.signature ? (
              <div className="flex flex-col items-center">
                 <img src={activeQuote.signature} alt="Firma" className="h-16 mb-1 object-contain" />
                 <div className="h-px bg-slate-300 w-full mb-2"></div>
                 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Firma de Conformidad</span>
              </div>
            ) : (
              <div>
                <div className="h-px bg-slate-300 w-full mb-2"></div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Firma de Conformidad</span>
              </div>
            )}
         </div>
      </div>
      
      <div className="absolute bottom-4 right-12 text-[8px] text-slate-300 uppercase font-bold tracking-widest">
         Powered by TuGestor
      </div>
    </div>
  );
};

export default PreviewView;