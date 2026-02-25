
export interface QuoteItem {
  id: string;
  qty: number | string;
  unit: string;
  desc: string;
  price: number | string;
}

export type QuoteStatus = 'pendiente' | 'pagada';

export interface Quote {
  id: string;
  folio: string;
  date: string;
  title?: string;
  client: string;
  phone: string;
  items: QuoteItem[];
  status: QuoteStatus;
  total: number;
  taxRate?: number;
  discountRate?: number;
  signature?: string; // Base64 signature image
}

export interface Profile {
  id?: string;
  name: string;
  slogan: string;
  phone: string;
  city?: string;
  color: string;
  logo: string | null;
  nextFolio: number;
  terms: string;
}

export interface CatalogItem {
  id: string;
  category: string;
  desc: string;
  unit: string;
  price: number;
}

export interface TemplateItem {
  qty: number;
  desc: string;
  price: number;
}

export interface Template {
  id: string;
  category: string;
  name: string;
  items: TemplateItem[];
}

export type ViewState = 'home' | 'editor' | 'editor_new' | 'catalog' | 'history' | 'settings' | 'preview';
