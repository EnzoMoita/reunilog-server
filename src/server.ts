import fastify from "fastify";
import routes from "./routes";
import fastifyMultipart from '@fastify/multipart';
import fastifyCors from '@fastify/cors';
import { env } from './env';
import path from 'path';
import fs from 'fs';

const app = fastify();

async function initializeApp() {
  // Register plugins
  await app.register(fastifyMultipart, {
    limits: {
      fieldSize: 50 * 1024 * 1024, // 50MB limit
      fileSize: 50 * 1024 * 1024,  // 50MB limit for files
      files: 1
    },
  });
  
  const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
await app.register(require('@fastify/static'), {
  root: path.join(process.cwd(), 'uploads'),
  prefix: '/uploads/',
});

  await app.register(fastifyCors, { 
    origin: ['http://localhost:3000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    preflightContinue: true,
  });

  // Register routes
  routes(app);

  // Start server
  try {
    await app.listen({ port: env.PORT, host: '0.0.0.0' });
    console.log(`Server running on ${env.PORT}`);
  } catch (err) {
    console.error('Error starting server:', err);
    process.exit(1);
  }
}

initializeApp().catch(console.error);

export { app };
