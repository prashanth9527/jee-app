import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

// Disable SSL certificate verification in development
if (process.env.NODE_ENV !== 'production') {
	process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

async function bootstrap() {
	const app = await NestFactory.create(AppModule);
	app.enableCors({ origin: '*', credentials: true });
	app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
	const port = process.env.PORT || 3001;
	await app.listen(port as number);
	// eslint-disable-next-line no-console
	console.log(`API listening on http://localhost:${port}`);
}
bootstrap();
