import { FastifyRequest } from 'fastify';
import { MultipartFile } from '@fastify/multipart';

declare module 'fastify' {
  interface FastifyRequest {
    user?: {
      id: string;
    };
    file?: {
      fieldname: string;
      originalname: string;
      encoding: string;
      mimetype: string;
      destination: string;
      file: string;
      filename: string;
      path: string;
      size: number;
    };
  }
}
