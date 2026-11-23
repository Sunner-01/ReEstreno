import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { MarketRepository, Filters } from '../domain/market.repository';
import { assertOwner, ListingInput, validateListing } from '../domain/listing';
@Injectable()
export class MarketService {
  constructor(@Inject(MarketRepository) private readonly repository: MarketRepository) {}
  catalog(filters: Filters, token?: string) {
    return this.repository.catalog(filters, token);
  }
  async find(id: string, token?: string) {
    const listing = await this.repository.find(id, token);
    if (!listing) throw new NotFoundException('Esta publicación ya no está disponible.');
    return listing;
  }
  create(input: ListingInput, userId: string, token: string) {
    return this.repository.create(validateListing(input), userId, token);
  }
  async update(id: string, input: ListingInput, userId: string, token: string) {
    const listing = await this.find(id, token);
    assertOwner(listing.seller_id, userId);
    return this.repository.update(id, validateListing(input), token);
  }
  async remove(id: string, userId: string, token: string) {
    const listing = await this.find(id, token);
    assertOwner(listing.seller_id, userId);
    return this.repository.remove(id, token);
  }
}
