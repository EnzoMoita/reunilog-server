import { app } from './app';
import { env } from './env';
import fastifyCors from '@fastify/cors';


app.register(fastifyCors, { 
  origin: ['http://localhost:3000', 'https://etcrun-frontend.vercel.app'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  preflightContinue: true,
});

app.listen({ port: env.PORT, host: '0.0.0.0' }, (err, address) => {
  if (err) {
    console.error('Error starting server:', err);
    process.exit(1);
  } else {
    console.log(`HTTP Server running on ${address}`);
  }
});
