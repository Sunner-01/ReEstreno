import { ListingInput } from './listing';
export interface Listing extends ListingInput {
  id: string;
  seller_id: string;
  status: string;
  created_at: string;
  seller?: { name: string; city: string };
}
export interface Filters {
  q?: string;
  category?: string;
  city?: string;
  condition?: string;
  max?: string;
  sort?: string;
  seller?: string;
}
export abstract class MarketRepository {
  abstract catalog(filters: Filters, token?: string): Promise<Listing[]>;
  abstract find(id: string, token?: string): Promise<Listing | null>;
  abstract create(input: ListingInput, userId: string, token: string): Promise<Listing>;
  abstract update(id: string, input: ListingInput, token: string): Promise<Listing>;
  abstract remove(id: string, token: string): Promise<void>;
}
