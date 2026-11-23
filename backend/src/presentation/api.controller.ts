import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { MarketService } from '../application/market.service';
import { Supabase } from '../infrastructure/supabase';
import { checked } from '../infrastructure/supabase-market.repository';
import { Filters } from '../domain/market.repository';
import { ListingInput, validateReview, whatsappLink } from '../domain/listing';
import { AuthGuard, AuthRequest } from './auth.guard';
@Controller()
export class ApiController {
  constructor(
    @Inject(MarketService) private readonly market: MarketService,
    @Inject(Supabase) private readonly db: Supabase,
  ) {}
  @Get('health') health() {
    return { status: 'ok', service: 'ReEstreno API' };
  }
  @Get('listings') catalog(@Query() filters: Filters) {
    return this.market.catalog(filters);
  }
  @Get('listings/:id') detail(@Param('id') id: string) {
    return this.market.find(id);
  }
  @Post('listings')
  @UseGuards(AuthGuard)
  create(@Body() body: ListingInput, @Req() req: AuthRequest) {
    return this.market.create(body, req.userId, req.token);
  }
  @Patch('listings/:id')
  @UseGuards(AuthGuard)
  update(@Param('id') id: string, @Body() body: ListingInput, @Req() req: AuthRequest) {
    return this.market.update(id, body, req.userId, req.token);
  }
  @Delete('listings/:id')
  @UseGuards(AuthGuard)
  async remove(@Param('id') id: string, @Req() req: AuthRequest) {
    await this.market.remove(id, req.userId, req.token);
    return { ok: true };
  }
  @Get('profiles/:id') async profile(@Param('id') id: string) {
    return checked(
      await this.db
        .client()
        .from('profiles')
        .select('id,name,city,created_at,bio,avatar_url')
        .eq('id', id)
        .single(),
    );
  }
  @Get('profiles/:id/reviews') async reviews(@Param('id') id: string) {
    return checked(
      await this.db
        .client()
        .from('reviews')
        .select('*, buyer:profiles!buyer_id(name)')
        .eq('seller_id', id)
        .order('created_at', { ascending: false }),
    );
  }
  @Get('me') @UseGuards(AuthGuard) async me(@Req() req: AuthRequest) {
    const client = this.db.client(req.token);
    const profile = checked(
      await client.from('profiles').select('*').eq('id', req.userId).single(),
    );
    const contact = checked(
      await client.from('contacts').select('whatsapp').eq('id', req.userId).maybeSingle(),
    );
    return { ...profile, whatsapp: contact?.whatsapp || '', moderator: req.moderator };
  }
  @Patch('me/avatar') @UseGuards(AuthGuard) async saveAvatar(
    @Body() body: { avatarUrl: string | null },
    @Req() req: AuthRequest,
  ) {
    const expected = `${process.env.SUPABASE_URL}/storage/v1/object/public/profile-avatars/${req.userId}/avatar`;
    const valid = body.avatarUrl === null || (
      typeof body.avatarUrl === 'string' &&
      new RegExp(`^${expected.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\?v=\\d+$`).test(body.avatarUrl)
    );
    if (!valid) throw new BadRequestException('La foto de perfil no es válida.');
    checked(await this.db.client(req.token).from('profiles').update({ avatar_url: body.avatarUrl }).eq('id', req.userId));
    return this.me(req);
  }
  @Patch('me') @UseGuards(AuthGuard) async saveProfile(
    @Body() body: { name: string; city: string; bio: string; whatsapp: string },
    @Req() req: AuthRequest,
  ) {
    if (
      !body.name?.trim() ||
      body.name.length > 60 ||
      !body.city?.trim() ||
      body.city.length > 60 ||
      body.bio?.length > 300 ||
      !/^\d{8,15}$/.test(body.whatsapp)
    )
      throw new BadRequestException(
        'Completa tu nombre, ciudad y WhatsApp con código de país, sin espacios.',
      );
    checked(
      await this.db
        .client(req.token)
        .rpc('save_profile', {
          p_name: body.name.trim(),
          p_city: body.city,
          p_bio: body.bio || '',
          p_whatsapp: body.whatsapp,
        }),
    );
    return this.me(req);
  }
  @Get('me/listings') @UseGuards(AuthGuard) mine(@Req() req: AuthRequest) {
    return this.market.catalog({ seller: req.userId }, req.token);
  }
  @Get('me/favorites') @UseGuards(AuthGuard) async favorites(@Req() req: AuthRequest) {
    return checked(
      await this.db
        .client(req.token)
        .from('favorites')
        .select('listing:listings(*,seller:profiles!seller_id(name,city))')
        .eq('user_id', req.userId),
    );
  }
  @Post('favorites/:id') @UseGuards(AuthGuard) async favorite(
    @Param('id') id: string,
    @Req() req: AuthRequest,
  ) {
    checked(
      await this.db
        .client(req.token)
        .from('favorites')
        .upsert({ listing_id: id, user_id: req.userId }),
    );
    return { ok: true };
  }
  @Delete('favorites/:id') @UseGuards(AuthGuard) async unfavorite(
    @Param('id') id: string,
    @Req() req: AuthRequest,
  ) {
    checked(
      await this.db
        .client(req.token)
        .from('favorites')
        .delete()
        .eq('listing_id', id)
        .eq('user_id', req.userId),
    );
    return { ok: true };
  }
  @Post('listings/:id/contact') @UseGuards(AuthGuard) async contact(
    @Param('id') id: string,
    @Req() req: AuthRequest,
  ) {
    const listing = await this.market.find(id);
    const phone = checked(await this.db.client(req.token).rpc('contact_seller', { p_listing: id }));
    return {
      url: whatsappLink(
        phone,
        listing.title,
        `${process.env.WEB_URL || 'http://localhost:4310'}/objeto/${id}`,
      ),
    };
  }
  @Get('me/trades') @UseGuards(AuthGuard) async trades(@Req() req: AuthRequest) {
    return checked(
      await this.db
        .client(req.token)
        .from('trades')
        .select(
          '*,listing:listings(title,images,price),buyer:profiles!buyer_id(name),seller:profiles!seller_id(name),reviews(id)',
        )
        .order('created_at', { ascending: false }),
    );
  }
  @Post('trades/:id/accept') @UseGuards(AuthGuard) async accept(
    @Param('id') id: string,
    @Req() req: AuthRequest,
  ) {
    checked(await this.db.client(req.token).rpc('accept_trade', { p_trade: id }));
    return { ok: true };
  }
  @Post('trades/:id/confirm') @UseGuards(AuthGuard) async confirm(
    @Param('id') id: string,
    @Req() req: AuthRequest,
  ) {
    checked(await this.db.client(req.token).rpc('confirm_trade', { p_trade: id }));
    return { ok: true };
  }
  @Post('trades/:id/review') @UseGuards(AuthGuard) async review(
    @Param('id') id: string,
    @Body() body: { rating: number; comment: string },
    @Req() req: AuthRequest,
  ) {
    const input = validateReview(body.rating, body.comment);
    const trade = checked(
      await this.db.client(req.token).from('trades').select('seller_id').eq('id', id).single(),
    );
    if (!trade) throw new BadRequestException('No se encontró la compra.');
    return checked(
      await this.db
        .client(req.token)
        .from('reviews')
        .insert({ ...input, trade_id: id, seller_id: trade.seller_id, buyer_id: req.userId })
        .select()
        .single(),
    );
  }
  @Post('listings/:id/report') @UseGuards(AuthGuard) async report(
    @Param('id') id: string,
    @Body() body: { reason: string },
    @Req() req: AuthRequest,
  ) {
    if (!body.reason?.trim() || body.reason.length < 10 || body.reason.length > 500)
      throw new BadRequestException('Describe el motivo con entre 10 y 500 caracteres.');
    checked(
      await this.db
        .client(req.token)
        .from('reports')
        .insert({ listing_id: id, user_id: req.userId, reason: body.reason }),
    );
    return { ok: true };
  }
  @Get('moderation') @UseGuards(AuthGuard) async moderation(@Req() req: AuthRequest) {
    if (!req.moderator) throw new ForbiddenException();
    return checked(
      await this.db
        .client(req.token)
        .from('reports')
        .select('*,listing:listings(title,hidden)')
        .order('created_at', { ascending: false }),
    );
  }
  @Post('moderation/:id/hide') @UseGuards(AuthGuard) async hide(
    @Param('id') id: string,
    @Req() req: AuthRequest,
  ) {
    if (!req.moderator) throw new ForbiddenException();
    checked(await this.db.client(req.token).rpc('hide_listing', { p_listing: id }));
    return { ok: true };
  }
}
