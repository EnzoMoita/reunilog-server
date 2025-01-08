import { FastifyInstance } from "fastify";
import { MeetingController } from "../controllers/MeetingController";
import { authMiddleware } from "../utils/authMiddleware";

export async function MeetingRoutes(app: FastifyInstance) {
  app.post("/meetings", { preHandler: [authMiddleware] }, MeetingController.createMeeting);
  
  // Single route for audio upload with auth middleware
  app.post("/meetings/:id/upload-audio", { 
    preHandler: [authMiddleware],
  }, MeetingController.uploadAudio);
  
  app.post("/meetings/:id/transcribe", { preHandler: [authMiddleware] }, MeetingController.transcribeMeeting);
  app.get("/meetings", { preHandler: [authMiddleware] }, MeetingController.getMeetings);
  app.get("/meetings/:id", { preHandler: [authMiddleware] }, MeetingController.getMeetingById);
}