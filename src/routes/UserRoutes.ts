import { FastifyInstance } from "fastify";
import { UserController } from "../controllers/UserController";
import { authMiddleware } from "../utils/authMiddleware";

export async function UserRoutes(app: FastifyInstance) {
  app.get("/user", { preHandler: [authMiddleware] }, UserController.getUser);
  app.patch("/user", { preHandler: [authMiddleware] }, UserController.updateUser);
}
