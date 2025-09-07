import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

// Disable SSL certificate verification in development
if (process.env.NODE_ENV !== 'production') {
	process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

async function bootstrap() {
	const app = await NestFactory.create(AppModule);
	
	// Configure CORS based on environment
	// Enable CORS
	app.enableCors({
		origin: 'https://rankora.in', // frontend URL
		methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
		credentials: true,            // if you send cookies or auth headers
	  });
	
	app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
	const port = process.env.PORT || 3001;
	await app.listen(port as number);
	// eslint-disable-next-line no-console
	console.log(`API listening on http://localhost:${port}`);
	console.log('CORS configured for origins:', 'https://rankora.in');
}
bootstrap();
