import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { Request, Response, NextFunction } from 'express';
import * as bodyParser from 'body-parser';

// Disable SSL certificate verification in development
if (process.env.NODE_ENV !== 'production') {
	process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

async function bootstrap() {
	const app = await NestFactory.create<NestExpressApplication>(AppModule);

	// Increase the limit for JSON and URL-encoded payloads
	app.use(bodyParser.json({ limit: '1024mb' }));
	app.use(bodyParser.urlencoded({ limit: '1024mb', extended: true }));
	
	// Configure CORS based on environment
	// Enable CORS with proxy support
	app.enableCors({
		origin: function (origin, callback) {
			// Allow requests with no origin (like mobile apps or curl requests)
			if (!origin) return callback(null, true);
			
			const allowedOrigins = [
				'https://rankora.in',
				'https://www.rankora.in',     // production frontend URL
				'http://localhost:3000',  // local development frontend
				'http://localhost:3001',  // local development frontend (alternative port)
				'http://127.0.0.1:3000',  // local development frontend
				'http://127.0.0.1:3001',  // local development frontend (alternative port)
			];
			
			if (allowedOrigins.indexOf(origin) !== -1) {
				callback(null, true);
			} else {
				console.log('CORS: Origin not allowed:', origin);
				callback(new Error('Not allowed by CORS'));
			}
		},
		methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
		credentials: true,            // if you send cookies or auth headers
		allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With', 'app_id', 'app_key', 'x-forwarded-host', 'x-forwarded-proto'],
		exposedHeaders: ['Content-Length', 'X-Foo', 'X-Bar'],
		preflightContinue: false,
		optionsSuccessStatus: 200,
		maxAge: 86400 // 24 hours
	  });
	
	app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
	
	// Add proxy header handling middleware
	app.use((req: Request, res: Response, next: NextFunction) => {
		// Handle proxy headers for proper host resolution
		if (req.headers['x-forwarded-host']) {
			req.headers.host = req.headers['x-forwarded-host'] as string;
		}
		// Note: req.protocol is read-only, but we can access it for logging
		next();
	});

	// Add CORS debugging middleware
	app.use((req: Request, res: Response, next: NextFunction) => {
		console.log('CORS Debug - Origin:', req.headers.origin);
		console.log('CORS Debug - Method:', req.method);
		console.log('CORS Debug - URL:', req.url);
		console.log('CORS Debug - Host:', req.headers.host);
		console.log('CORS Debug - X-Forwarded-Host:', req.headers['x-forwarded-host']);
		console.log('CORS Debug - Protocol:', req.protocol);
		next();
	});
	
	// Static files are now handled by the StaticFilesController
	// This ensures proper authentication and error handling
	
	const port = process.env.PORT || 3001;
	await app.listen(port as number);
	// eslint-disable-next-line no-console
	console.log(`API listening on http://localhost:${port}`);
	console.log('CORS configured for origins:', [
		'https://rankora.in',
		'https://www.rankora.in',
		'http://localhost:3000',
		'http://localhost:3001',
		'http://127.0.0.1:3000',
		'http://127.0.0.1:3001'
	]);
}
bootstrap();
