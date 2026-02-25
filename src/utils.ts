export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

export const money = (val: number | string | undefined): string => {
  const num = Number(val) || 0;
  return new Intl.NumberFormat('es-MX', { 
    style: 'currency', 
    currency: 'MXN', 
    minimumFractionDigits: 0 
  }).format(num);
};

export const formatDate = (dateStr?: string): string => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('es-MX', { 
    day: 'numeric', 
    month: 'short', 
    year: 'numeric' 
  });
};

export const calculateSubtotal = (items: Array<{ price: number | string; qty: number | string }>): number => {
  return items.reduce((sum, item) => sum + (Number(item.price || 0) * Number(item.qty || 0)), 0);
};