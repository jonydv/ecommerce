import { INestApplication, ValidationPipe } from '@nestjs/common';
import { requestId } from './common/request-id.middleware.js';
import { AllExceptionsFilter } from './common/all-exceptions.filter.js';
import cookieParser from 'cookie-parser';

export function configureApp(app: INestApplication): INestApplication {
  app.use(cookieParser());
  app.use(requestId);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new AllExceptionsFilter());
  return app;
}
