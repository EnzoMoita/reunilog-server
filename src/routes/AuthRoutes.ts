import { FastifyInstance } from "fastify";
import { UserController } from "../controllers/UserController";

export async function AuthRoutes(app: FastifyInstance) {
  app.post("/register", UserController.register);
  app.post("/login", UserController.login);
}
