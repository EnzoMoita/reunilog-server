import { FastifyInstance } from "fastify";
import { UserRoutes } from "./UserRoutes";
import { AuthRoutes } from "./AuthRoutes";

const routes = (app: FastifyInstance) => {
  app.register(UserRoutes);
  app.register(AuthRoutes);
};

export default routes;
