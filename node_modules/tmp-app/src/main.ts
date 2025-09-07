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
	const corsOptions = {
		origin: (origin, callback) => {
			// Allow requests with no origin (like mobile apps or curl requests)
			if (!origin) return callback(null, true);
			
			// Define allowed origins based on environment
			const allowedOrigins = [
				'http://localhost:3000', // Local frontend
				'http://localhost:3001', // Local backend (for testing)
				process.env.FRONTEND_URL, // Production frontend URL
				process.env.NEXT_PUBLIC_SITE_URL, // Alternative frontend URL
			].filter(Boolean); // Remove undefined values
			
			// In development, allow all localhost origins
			if (process.env.NODE_ENV !== 'production') {
				if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
					return callback(null, true);
				}
			}
			
			// Check if origin is allowed
			if (allowedOrigins.includes(origin)) {
				return callback(null, true);
			}
			
			// Log the rejected origin for debugging
			console.log('CORS blocked origin:', origin);
			callback(new Error('Not allowed by CORS'));
		},
		credentials: true,
		methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
		allowedHeaders: [
			'Origin',
			'X-Requested-With',
			'Content-Type',
			'Accept',
			'Authorization',
			'Cache-Control',
			'Pragma',
		],
		exposedHeaders: ['Authorization'],
		optionsSuccessStatus: 200, // Some legacy browsers choke on 204
	};
	
	app.enableCors(corsOptions);
	app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
	const port = process.env.PORT || 3001;
	await app.listen(port as number);
	// eslint-disable-next-line no-console
	console.log(`API listening on http://localhost:${port}`);
	console.log('CORS configured for origins:', corsOptions.origin);
}
bootstrap();
