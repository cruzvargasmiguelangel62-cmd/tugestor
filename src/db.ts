import Dexie, { Table } from 'dexie';
import { Quote, CatalogItem, Profile } from './types';
// Asumimos que moverás el perfil por defecto a constants.ts (ver abajo)
import { DEFAULT_CATALOG, DEFAULT_PROFILE } from './constants'; 

export class TuGestorDB extends Dexie {
  quotes!: Table<Quote>;
  catalog!: Table<CatalogItem>;
  profile!: Table<Profile>;

  constructor() {
    super('TuGestorDB');
    
    // Definición del esquema
    // Nota: 'id' es la clave primaria implícita en todas las tablas
    this.version(1).stores({
      quotes: 'id, folio, date, status, client', 
      catalog: 'id, category, desc',
      profile: 'id' // Usamos 'main' como ID único
    });

    // Seed (Semilla): Datos iniciales si la DB está vacía
    this.on('populate', async () => {
      try {
        // Inserción masiva del catálogo
        await this.catalog.bulkAdd(DEFAULT_CATALOG);
        
        // Inserción del perfil inicial
        await this.profile.add(DEFAULT_PROFILE);
        
        console.log("Base de datos inicializada correctamente.");
      } catch (error) {
        console.error("Error al poblar la base de datos:", error);
      }
    });
  }
}

export const db = new TuGestorDB();
