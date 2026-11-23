import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { Supabase } from '../infrastructure/supabase';
export type AuthRequest = Request & { userId: string; token: string; moderator: boolean };
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(@Inject(Supabase) private readonly db: Supabase) {}
  async canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest<AuthRequest>();
    const token = req.headers.authorization?.replace(/^Bearer /, '');
    if (!token) throw new UnauthorizedException('Inicia sesión para continuar.');
    const { data, error } = await this.db.client().auth.getUser(token);
    if (error || !data.user)
      throw new UnauthorizedException('Tu sesión expiró. Vuelve a ingresar.');
    req.userId = data.user.id;
    req.token = token;
    req.moderator = data.user.app_metadata?.role === 'moderator';
    return true;
  }
}
