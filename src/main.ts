import { config } from 'dotenv';
config(); // Load .env before anything else

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'error', 'warn', 'debug', 'verbose'],
  });

  // Simple request logging middleware with body logging for errors
  app.use((req: any, res: any, next: any) => {
    const start = Date.now();

    // Capture the original json method to log response body
    const originalJson = res.json.bind(res);
    res.json = (body: any) => {
      res._body = body;
      return originalJson(body);
    };

    res.on('finish', () => {
      const duration = Date.now() - start;
      if (res.statusCode >= 400) {
        console.log(`[HTTP] ${req.method} ${req.url} - ${res.statusCode} (${duration}ms)`);
        if (res._body) {
          console.log(`[HTTP] Response body:`, JSON.stringify(res._body));
        }
        if (req.body && Object.keys(req.body).length > 0) {
          // Log request body keys (not values for security)
          console.log(`[HTTP] Request body keys:`, Object.keys(req.body));
        }
      }
    });
    next();
  });

  // Enable CORS - allow all origins in development
  app.enableCors({
    origin: true, // Allow all origins in dev
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('PrimeCell API')
    .setDescription('PrimeCell Nutrition & Training Platform API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document, {
    customCssUrl: 'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui.min.css',
    customJs: [
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui-bundle.js',
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui-standalone-preset.js',
    ],
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`🚀 PrimeCell API is running on: http://localhost:${port}`);
  console.log(`📚 API Documentation: http://localhost:${port}/api`);
}

bootstrap();
