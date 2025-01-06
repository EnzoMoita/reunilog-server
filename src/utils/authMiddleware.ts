import { FastifyRequest, FastifyReply } from 'fastify';
import { verifyToken } from './jwt';

export async function authMiddleware(request: FastifyRequest, reply: FastifyReply) {
  try {
    const authorization = request.headers.authorization;

    if (!authorization) {
      return reply.status(401).send({ message: 'No token provided.' });
    }

    const token = authorization.split(' ')[1];
    const { valid, decoded } = verifyToken(token);

    if (!valid || !decoded) {
      return reply.status(401).send({ message: 'Invalid token.' });
    }

    (request as any).user = { id: decoded.userId };

  } catch (error) {
    return reply.status(401).send({ message: 'Unauthorized.' });
  }
}
