import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Si en el futuro decides mover estilos globales aquí en lugar del HTML
// import './index.css'; 

const rootElement = document.getElementById('root');

// Mejora de seguridad: Manejo visual de errores si falla el montaje
if (!rootElement) {
  const errorMessage = "Error crítico: No se pudo encontrar el elemento raíz (#root) para montar la aplicación.";
  
  // Escribimos directamente en el body para que el error sea visible en pantalla y no solo en consola
  document.body.innerHTML = `
    <div style="display: flex; justify-content: center; align-items: center; height: 100vh; color: #ef4444; font-family: system-ui, sans-serif; text-align: center; padding: 20px;">
      <div>
        <h1 style="font-size: 1.5rem; font-weight: bold; margin-bottom: 0.5rem;">Error de Carga</h1>
        <p>${errorMessage}</p>
      </div>
    </div>
  `;
  
  throw new Error(errorMessage);
}

// Creación del root con aserción de tipo explícita (Buenas prácticas TS)
const root = ReactDOM.createRoot(rootElement as HTMLElement);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
