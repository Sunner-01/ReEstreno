export const categories = ['Tecnología', 'Hogar', 'Moda', 'Deportes', 'Música', 'Libros', 'Otros'];
export const cities = [
  'La Paz',
  'Cochabamba',
  'Santa Cruz',
  'Sucre',
  'Oruro',
  'Potosí',
  'Tarija',
  'Trinidad',
  'Cobija',
];
export const conditions = ['Como nuevo', 'Buen estado', 'Con detalles'];
export type Profile = {
  id: string;
  name: string;
  city: string;
  bio: string;
  avatar_url: string | null;
  whatsapp?: string;
  created_at: string;
  moderator?: boolean;
};
export type Listing = {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  condition: string;
  city: string;
  images: string[];
  status: string;
  seller_id: string;
  created_at: string;
  seller?: { name: string; city: string; avatar_url: string | null };
};
export type Review = {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
  buyer: { name: string };
};
export type Trade = {
  id: string;
  status: string;
  buyer_id: string;
  seller_id: string;
  listing: { title: string; images: string[]; price: number };
  buyer: { name: string };
  seller: { name: string };
  reviews: { id: string } | null;
};
export const money = (value: number) =>
  `Bs ${new Intl.NumberFormat('es-BO', { maximumFractionDigits: 2 }).format(value)}`;
export const statusLabel: Record<string, string> = {
  available: 'Disponible',
  reserved: 'Entrega por confirmar',
  sold: 'Vendido',
  interested: 'Contacto iniciado',
  pending: 'Confirma la entrega',
  completed: 'Compra confirmada',
  cancelled: 'No concretada',
};
