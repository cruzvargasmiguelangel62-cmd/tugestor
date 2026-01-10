import { Template, CatalogItem } from './types';

export const TEMPLATES_DB: Template[] = [
  // --- PLOMERÍA ---
  {
    id: 'plo_1', category: 'Plomería', name: 'Instalación de Baño Completo',
    items: [ { qty: 1, desc: 'Instalación de Taza (WC) y cuello de cera', price: 650 }, { qty: 1, desc: 'Instalación de Lavabo y Mezcladora', price: 550 }, { qty: 1, desc: 'Conexión de desagües y pruebas', price: 300 }, { qty: 1, desc: 'Insumos (Silicón, Cintas, Coflex)', price: 450 } ]
  },
  {
    id: 'plo_2', category: 'Plomería', name: 'Instalación de Tinaco',
    items: [ { qty: 1, desc: 'Subida de Tinaco a Azotea', price: 500 }, { qty: 1, desc: 'Conexión Hidráulica (Jarros de aire)', price: 800 }, { qty: 1, desc: 'Base de Tinaco (Mano de obra)', price: 600 }, { qty: 1, desc: 'Material (Tubería Plus, Conexiones)', price: 1200 } ]
  },
  {
    id: 'plo_3', category: 'Plomería', name: 'Reparación de Fuga de Agua',
    items: [ { qty: 1, desc: 'Detección y Rompimiento de muro', price: 400 }, { qty: 1, desc: 'Reparación de Tubería dañada', price: 350 }, { qty: 1, desc: 'Resane de albañilería básico', price: 300 }, { qty: 1, desc: 'Materiales (Tubo, coples, cemento)', price: 250 } ]
  },
  {
    id: 'plo_4', category: 'Plomería', name: 'Mantenimiento de Boiler',
    items: [ { qty: 1, desc: 'Drenado de tanque (Sarro)', price: 350 }, { qty: 1, desc: 'Cambio de Ánodo de sacrificio', price: 200 }, { qty: 1, desc: 'Revisión de termostato y piloto', price: 250 }, { qty: 1, desc: 'Refacción (Ánodo)', price: 180 } ]
  },
  {
    id: 'plo_5', category: 'Plomería', name: 'Destape de Drenaje',
    items: [ { qty: 1, desc: 'Sondeo de tubería (hasta 10m)', price: 800 }, { qty: 1, desc: 'Limpieza de registro', price: 300 }, { qty: 1, desc: 'Químicos desincrustantes', price: 250 } ]
  },

  // --- ELECTRICIDAD ---
  {
    id: 'ele_1', category: 'Electricidad', name: 'Instalación Eléctrica Cuarto',
    items: [ { qty: 3, desc: 'Ranurado para bajadas', price: 450 }, { qty: 3, desc: 'Colocación de Chalupas y Manguera', price: 300 }, { qty: 1, desc: 'Cableado (Línea, Neutro, Tierra)', price: 800 }, { qty: 3, desc: 'Instalación de Contactos/Apagadores', price: 250 } ]
  },
  {
    id: 'ele_2', category: 'Electricidad', name: 'Cambio Centro de Carga',
    items: [ { qty: 1, desc: 'Desmontaje de caja antigua', price: 300 }, { qty: 1, desc: 'Instalación de Centro de Carga nuevo', price: 600 }, { qty: 4, desc: 'Conexión de Pastillas Termomagnéticas', price: 400 }, { qty: 1, desc: 'Identificación de Circuitos', price: 200 } ]
  },
  {
    id: 'ele_3', category: 'Electricidad', name: 'Instalación Ventilador Techo',
    items: [ { qty: 1, desc: 'Armado de Ventilador', price: 250 }, { qty: 1, desc: 'Fijación a losa (Taquete expansivo)', price: 300 }, { qty: 1, desc: 'Conexión eléctrica y balanceo', price: 250 } ]
  },
  {
    id: 'ele_4', category: 'Electricidad', name: 'Acometida (Bajada de Luz)',
    items: [ { qty: 1, desc: 'Instalación de Base Medidor', price: 400 }, { qty: 1, desc: 'Colocación de Tubo Conduit y Mufa', price: 500 }, { qty: 1, desc: 'Cableado calibre 8 (Fase/Neutro)', price: 300 }, { qty: 1, desc: 'Varilla de Tierra física', price: 250 } ]
  },
  {
    id: 'ele_5', category: 'Electricidad', name: 'Cambio de Accesorios (Pack 10)',
    items: [ { qty: 10, desc: 'Cambio de Contactos/Apagadores viejos', price: 800 }, { qty: 1, desc: 'Revisión de polaridad', price: 0 }, { qty: 1, desc: 'Material (Placas y mecanismos)', price: 1200 } ]
  },

  // --- ALBAÑILERÍA ---
  {
    id: 'alb_1', category: 'Albañilería', name: 'Muro de Block (m2)',
    items: [ { qty: 10, desc: 'Levantado de Muro Block (m2)', price: 180 }, { qty: 1, desc: 'Castillos de refuerzo (ml)', price: 250 }, { qty: 1, desc: 'Material (Block, Cemento, Arena)', price: 1500 } ]
  },
  {
    id: 'alb_2', category: 'Albañilería', name: 'Piso Cerámico (Colocación)',
    items: [ { qty: 20, desc: 'Colocación de Loseta (m2)', price: 150 }, { qty: 20, desc: 'Zoclo (ml)', price: 40 }, { qty: 1, desc: 'Lechadeado y Limpieza', price: 500 }, { qty: 10, desc: 'Bultos de Pegazulejo', price: 180 } ]
  },
  {
    id: 'alb_3', category: 'Albañilería', name: 'Losa de Concreto',
    items: [ { qty: 1, desc: 'Cimbrado de madera (m2)', price: 200 }, { qty: 1, desc: 'Armado de varilla (kg)', price: 25 }, { qty: 1, desc: 'Colado de Concreto (m2)', price: 250 }, { qty: 1, desc: 'Descimbrado', price: 80 } ]
  },
  {
    id: 'alb_4', category: 'Albañilería', name: 'Barra de Cocina',
    items: [ { qty: 1, desc: 'Muretes de carga', price: 800 }, { qty: 1, desc: 'Losa de concreto armado', price: 1200 }, { qty: 1, desc: 'Forrado de azulejo/porcelanato', price: 1500 }, { qty: 1, desc: 'Materiales', price: 1800 } ]
  },
  {
    id: 'alb_5', category: 'Albañilería', name: 'Repellado de Muros',
    items: [ { qty: 15, desc: 'Zarpeo y Afine (m2)', price: 140 }, { qty: 1, desc: 'Plomeo de paredes', price: 0 }, { qty: 1, desc: 'Material (Mortero/Arena)', price: 800 } ]
  },

  // --- MECÁNICA ---
  {
    id: 'mec_1', category: 'Mecánica', name: 'Afinación Mayor (4 Cil)',
    items: [ { qty: 1, desc: 'Aceite Sintético y Filtro', price: 1200 }, { qty: 4, desc: 'Bujías Iridium', price: 600 }, { qty: 1, desc: 'Limpieza Inyectores/Cuerpo Acel.', price: 800 }, { qty: 1, desc: 'Mano de Obra', price: 700 } ]
  },
  {
    id: 'mec_2', category: 'Mecánica', name: 'Cambio de Frenos (Delanteros)',
    items: [ { qty: 1, desc: 'Juego de Balatas Cerámicas', price: 850 }, { qty: 2, desc: 'Rectificado de Discos', price: 300 }, { qty: 1, desc: 'Mano de Obra', price: 400 } ]
  },
  {
    id: 'mec_3', category: 'Mecánica', name: 'Kit de Distribución',
    items: [ { qty: 1, desc: 'Banda de Tiempo', price: 600 }, { qty: 1, desc: 'Polea Tensora', price: 450 }, { qty: 1, desc: 'Bomba de Agua', price: 550 }, { qty: 1, desc: 'Mano de Obra (4 horas)', price: 1200 } ]
  },
  {
    id: 'mec_4', category: 'Mecánica', name: 'Cambio de Amortiguadores',
    items: [ { qty: 2, desc: 'Amortiguadores Delanteros (Par)', price: 2200 }, { qty: 2, desc: 'Bases de Amortiguador', price: 600 }, { qty: 1, desc: 'Mano de Obra', price: 800 }, { qty: 1, desc: 'Alineación', price: 300 } ]
  },
  {
    id: 'mec_5', category: 'Mecánica', name: 'Cambio de Clutch',
    items: [ { qty: 1, desc: 'Kit de Clutch (Disco, Plato, Collarín)', price: 2500 }, { qty: 1, desc: 'Rectificado de Volante Motriz', price: 350 }, { qty: 1, desc: 'Mano de Obra (Bajada de caja)', price: 1500 } ]
  },

  // --- TECNOLOGÍA ---
  {
    id: 'tec_1', category: 'Tecnología', name: 'Instalación CCTV (4 Cámaras)',
    items: [ { qty: 1, desc: 'Kit DVR + 4 Cámaras 1080p', price: 3500 }, { qty: 1, desc: 'Disco Duro 1TB', price: 1100 }, { qty: 1, desc: 'Instalación y Cableado', price: 1500 }, { qty: 1, desc: 'Configuración App Móvil', price: 0 } ]
  },
  {
    id: 'tec_2', category: 'Tecnología', name: 'Mantenimiento Laptop',
    items: [ { qty: 1, desc: 'Limpieza interna de ventiladores', price: 250 }, { qty: 1, desc: 'Cambio de pasta térmica', price: 150 }, { qty: 1, desc: 'Limpieza externa y pantalla', price: 100 } ]
  },
  {
    id: 'tec_3', category: 'Tecnología', name: 'Formateo PC',
    items: [ { qty: 1, desc: 'Respaldo de Información', price: 200 }, { qty: 1, desc: 'Instalación Sistema Operativo', price: 400 }, { qty: 1, desc: 'Paquetería Office y Antivirus', price: 200 } ]
  },
  {
    id: 'tec_4', category: 'Tecnología', name: 'Instalación Red WiFi',
    items: [ { qty: 1, desc: 'Router Rompemuros / Access Point', price: 1200 }, { qty: 20, desc: 'Cableado UTP Exterior (mts)', price: 300 }, { qty: 1, desc: 'Configuración de Red y Claves', price: 500 } ]
  },
  {
    id: 'tec_5', category: 'Tecnología', name: 'Cambio Display Celular',
    items: [ { qty: 1, desc: 'Refacción Pantalla Original/OLED', price: 1800 }, { qty: 1, desc: 'Mano de Obra', price: 500 }, { qty: 1, desc: 'Mica de Hidrogel de regalo', price: 0 } ]
  },

  // --- LIMPIEZA ---
  {
    id: 'lim_1', category: 'Limpieza', name: 'Lavado de Sala (3 pzs)',
    items: [ { qty: 1, desc: 'Lavado Sillón Grande', price: 350 }, { qty: 1, desc: 'Lavado Sillón Mediano', price: 250 }, { qty: 1, desc: 'Lavado Sillón Chico', price: 150 }, { qty: 1, desc: 'Desinfección', price: 100 } ]
  },
  {
    id: 'lim_2', category: 'Limpieza', name: 'Limpieza de Cisterna',
    items: [ { qty: 1, desc: 'Drenado de agua sucia', price: 200 }, { qty: 1, desc: 'Lavado de paredes a presión', price: 600 }, { qty: 1, desc: 'Desinfección con Cloro/Sales', price: 150 } ]
  },
  {
    id: 'lim_3', category: 'Limpieza', name: 'Lavado de Vestiduras Auto',
    items: [ { qty: 2, desc: 'Asientos Delanteros', price: 300 }, { qty: 1, desc: 'Banca Trasera', price: 250 }, { qty: 1, desc: 'Alfombra y Tapetes', price: 200 }, { qty: 1, desc: 'Cielo y Puertas', price: 150 } ]
  },
  {
    id: 'lim_4', category: 'Limpieza', name: 'Fumigación Casa',
    items: [ { qty: 1, desc: 'Aspersión en interiores', price: 400 }, { qty: 1, desc: 'Nebulización en jardín/patio', price: 300 }, { qty: 1, desc: 'Gel para cocina (Cucarachas)', price: 150 } ]
  },
  {
    id: 'lim_5', category: 'Limpieza', name: 'Limpieza Final de Obra',
    items: [ { qty: 1, desc: 'Retiro de polvo fino y manchas', price: 1200 }, { qty: 1, desc: 'Limpieza de vidrios y canceles', price: 800 }, { qty: 1, desc: 'Lavado de pisos a máquina', price: 1500 } ]
  }
];

export const DEFAULT_CATALOG: CatalogItem[] = [
  { id: '1', category: 'General', desc: "Mano de Obra (Hora)", unit: 'hr', price: 200 },
  { id: '2', category: 'General', desc: "Visita Diagnóstico", unit: 'srv', price: 350 }
];