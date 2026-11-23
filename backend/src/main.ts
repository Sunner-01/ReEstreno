import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ArgumentsHost, Catch, ExceptionFilter, HttpException } from '@nestjs/common';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { DomainError } from './domain/listing';
@Catch()
class ApiErrors implements ExceptionFilter {
  catch(error: unknown, host: ArgumentsHost) {
    const status =
      error instanceof DomainError ? 400 : error instanceof HttpException ? error.getStatus() : 500;
    const message =
      error instanceof DomainError || error instanceof HttpException
        ? error.message
        : 'No pudimos completar la operación. Inténtalo de nuevo.';
    host.switchToHttp().getResponse().status(status).json({ message });
  }
}
export async function createApp() {
  const app = await NestFactory.create(AppModule, { logger: ['error', 'warn'] });
  app.use(helmet());
  app.useGlobalFilters(new ApiErrors());
  app.enableCors({
    origin: [process.env.WEB_URL || 'http://localhost:4310', 'http://127.0.0.1:4310'],
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  });
  return app;
}
if (require.main === module)
  createApp().then((app) => app.listen(Number(process.env.PORT || 4311), '0.0.0.0'));
