import { FastifyInstance } from "fastify";
import { MeetingController } from "../controllers/MeetingController";
import multer from "fastify-multer";

const upload = multer({ dest: "uploads/" });

export async function MeetingRoutes(app: FastifyInstance) {
  app.post("/meetings", MeetingController.createMeeting);
  app.post(
    "/meetings/audio-upload",
    { preHandler: upload.single("audio") },
    MeetingController.uploadAudio
  );
  
  app.post("/meetings/:id/upload-audio", MeetingController.uploadAudio);
  app.post("/meetings/:id/transcribe", MeetingController.transcribeMeeting);
  app.get("/meetings", MeetingController.getMeetings);
  app.get("/meetings/:id", MeetingController.getMeetingById);
}
