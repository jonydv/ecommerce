import { INestApplication, ValidationPipe } from "@nestjs/common";
import { requestId } from "./common/request-id.middleware.js";
import { AllExceptionsFilter } from "./common/all-exceptions.filter.js";

export function configureApp(app: INestApplication): INestApplication {
      app.use(requestId);
    app.useGlobalPipes(new ValidationPipe({whitelist: true, transform: true,}));
      app.useGlobalFilters(new AllExceptionsFilter());
    return app;
}