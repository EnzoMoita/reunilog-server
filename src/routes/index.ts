import { FastifyInstance } from "fastify";
import { UserRoutes } from "./UserRoutes";
import { AuthRoutes } from "./AuthRoutes";
import { MeetingRoutes } from "./MeetingRoutes";

const routes = (app: FastifyInstance) => {
  app.register(UserRoutes);
  app.register(AuthRoutes);
  app.register(MeetingRoutes);
};

export default routes;
