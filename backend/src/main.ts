import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { Request, Response, NextFunction } from 'express';

// Disable SSL certificate verification in development
if (process.env.NODE_ENV !== 'production') {
	process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

async function bootstrap() {
	const app = await NestFactory.create<NestExpressApplication>(AppModule);
	
	// Configure CORS based on environment
	// Enable CORS
	app.enableCors({
		origin: [
			'https://rankora.in',
			'https://www.rankora.in',     // production frontend URL
			'http://localhost:3000',  // local development frontend
			'http://localhost:3001',  // local development frontend (alternative port)
			'http://127.0.0.1:3000',  // local development frontend
			'http://127.0.0.1:3001',  // local development frontend (alternative port)
		],
		methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
		credentials: true,            // if you send cookies or auth headers
		allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
		exposedHeaders: ['Content-Length', 'X-Foo', 'X-Bar'],
		preflightContinue: false,
		optionsSuccessStatus: 200
	  });
	
	app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
	
	// Add CORS debugging middleware
	app.use((req: Request, res: Response, next: NextFunction) => {
		console.log('CORS Debug - Origin:', req.headers.origin);
		console.log('CORS Debug - Method:', req.method);
		console.log('CORS Debug - URL:', req.url);
		console.log('CORS Debug - Headers:', req.headers);
		next();
	});
	
	// Serve PDF files
	app.useStaticAssets(join(__dirname, '..', 'content'), {
		prefix: '/static/pdf/',
	});
	
	// Serve LaTeX files
	app.useStaticAssets(join(__dirname, '..', 'content', 'latex'), {
		prefix: '/static/latex/',
	});
	
	// Serve processed JSON files
	app.useStaticAssets(join(__dirname, '..', 'content', 'Processed'), {
		prefix: '/static/processed/',
	});
	
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
