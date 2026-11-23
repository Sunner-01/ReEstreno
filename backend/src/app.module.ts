import 'reflect-metadata';
import { Module } from '@nestjs/common';
import { ApiController } from './presentation/api.controller';
import { AuthGuard } from './presentation/auth.guard';
import { Supabase } from './infrastructure/supabase';
import { MarketRepository } from './domain/market.repository';
import { SupabaseMarketRepository } from './infrastructure/supabase-market.repository';
import { MarketService } from './application/market.service';
@Module({
  controllers: [ApiController],
  providers: [
    Supabase,
    AuthGuard,
    MarketService,
    { provide: MarketRepository, useClass: SupabaseMarketRepository },
  ],
})
export class AppModule {}
