import { MeetingRepository } from "../repositories/MeetingRepository";
import { OpenAIService } from "../lib/OpenAIService";
import { FastifyRequest, FastifyReply } from "fastify";

export class MeetingController {
  static async createMeeting(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { title, description, date } = request.body as {
        title: string;
        description?: string;
        date: string;
      };

      const userId = request.user?.id; // Certifique-se que o middleware de autenticação adiciona `user` ao request

      if (!userId) {
        return reply.status(401).send({ error: "Unauthorized" });
      }

      const meeting = await MeetingRepository.create({ title, description, date, userId });
      return reply.status(201).send(meeting);
    } catch (error) {
      const errorMessage = (error as Error).message;
      return reply.status(500).send({ error: "Failed to create meeting", details: errorMessage });
    }
  }

  static async uploadAudio(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      const { audioUrl } = request.body as { audioUrl: string };

      if (!audioUrl) {
        return reply.status(400).send({ error: "Audio URL is required" });
      }

      const meeting = await MeetingRepository.updateAudio(id, audioUrl);
      return reply.send(meeting);
    } catch (error) {
      const errorMessage = (error as Error).message;
      return reply.status(500).send({ error: "Failed to upload audio", details: errorMessage });
    }
  }

  static async transcribeMeeting(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };

      const meeting = await MeetingRepository.findById(id);

      if (!meeting || !meeting.audio_url) {
        return reply.status(400).send({ error: "Audio file not uploaded yet" });
      }

      const transcript = await OpenAIService.transcribeAudio(meeting.audio_url);
      const result = await MeetingRepository.saveTranscript(id, transcript);

      return reply.send(result);
    } catch (error) {
      const errorMessage = (error as Error).message;
      return reply.status(500).send({ error: "Failed to transcribe meeting", details: errorMessage });
    }
  }

  static async getMeetings(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = request.user?.id; // Certifique-se que o middleware de autenticação adiciona `user` ao request

      if (!userId) {
        return reply.status(401).send({ error: "Unauthorized" });
      }

      const meetings = await MeetingRepository.findByUser(userId);
      return reply.send(meetings);
    } catch (error) {
      const errorMessage = (error as Error).message;
      return reply.status(500).send({ error: "Failed to fetch meetings", details: errorMessage });
    }
  }

  static async getMeetingById(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };

      const meeting = await MeetingRepository.findById(id);

      if (!meeting) {
        return reply.status(404).send({ error: "Meeting not found" });
      }

      return reply.send(meeting);
    } catch (error) {
      const errorMessage = (error as Error).message;
      return reply.status(500).send({ error: "Failed to fetch meeting", details: errorMessage });
    }
  }
}
