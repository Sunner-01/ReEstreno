import { Inject, Injectable, BadRequestException } from '@nestjs/common';
import { MarketRepository, Listing, Filters } from '../domain/market.repository';
import { ListingInput } from '../domain/listing';
import { Supabase } from './supabase';
export function checked<T>(result: { data: T; error: { message: string } | null }): T {
  if (result.error) throw new BadRequestException(result.error.message);
  return result.data;
}
@Injectable()
export class SupabaseMarketRepository extends MarketRepository {
  constructor(@Inject(Supabase) private readonly db: Supabase) {
    super();
  }
  async catalog(filters: Filters, token?: string) {
    let query = this.db
      .client(token)
      .from('listings')
      .select('*, seller:profiles!seller_id(name,city,avatar_url)')
      .eq('hidden', false);
    if (filters.seller) query = query.eq('seller_id', filters.seller);
    else query = query.eq('status', 'available');
    if (filters.q) query = query.ilike('title', `%${filters.q.replace(/[%_]/g, '')}%`);
    if (filters.category) query = query.eq('category', filters.category);
    if (filters.city) query = query.eq('city', filters.city);
    if (filters.condition) query = query.eq('condition', filters.condition);
    if (filters.max && Number.isFinite(Number(filters.max)))
      query = query.lte('price', Number(filters.max));
    return checked(
      await query
        .order(filters.sort === 'price' ? 'price' : 'created_at', {
          ascending: filters.sort === 'price',
        })
        .limit(100),
    ) as Listing[];
  }
  async find(id: string, token?: string) {
    return checked(
      await this.db
        .client(token)
        .from('listings')
        .select('*, seller:profiles!seller_id(name,city,avatar_url)')
        .eq('id', id)
        .maybeSingle(),
    ) as Listing | null;
  }
  async create(input: ListingInput, seller_id: string, token: string) {
    return checked(
      await this.db
        .client(token)
        .from('listings')
        .insert({ ...input, seller_id })
        .select()
        .single(),
    ) as Listing;
  }
  async update(id: string, input: ListingInput, token: string) {
    return checked(
      await this.db.client(token).from('listings').update(input).eq('id', id).select().single(),
    ) as Listing;
  }
  async remove(id: string, token: string) {
    checked(await this.db.client(token).from('listings').delete().eq('id', id));
  }
}
