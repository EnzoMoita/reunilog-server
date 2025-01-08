import { FastifyRequest, FastifyReply } from "fastify";
import { MeetingRepository } from "../repositories/MeetingRepository";
import { OpenAIService } from "../lib/OpenAIService";
import * as fs from 'fs';
import path from "path";
import { pipeline } from 'stream/promises';

export class MeetingController {
  static async createMeeting(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { title, description, date } = request.body as {
        title: string;
        description?: string;
        date: string;
      };

      const userId = request.user?.id;

      if (!userId) {
        return reply.status(401).send({ error: "Unauthorized" });
      }

      const meeting = await MeetingRepository.create({
        title,
        description,
        date,
        userId,
      });

      return reply.status(201).send(meeting);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return reply.status(500).send({ error: "Failed to create meeting", details: errorMessage });
    }
  }

  static async uploadAudio(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      console.log('Processing audio upload for meeting:', id);

      const data = await request.file();
      if (!data) {
        console.error('No file received in request');
        return reply.status(400).send({ error: "Audio file is required" });
      }

      console.log('Received file:', {
        filename: data.filename,
        mimetype: data.mimetype,
        encoding: data.encoding
      });

      // Create uploads directory if it doesn't exist
      const uploadDir = path.join(process.cwd(), 'uploads');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      // Generate unique filename
      const fileExtension = '.webm';
      const filename = `${Date.now()}-${id}${fileExtension}`;
      const filepath = path.join(uploadDir, filename);

      console.log('Saving file to:', filepath);

      // Save file using pipeline
      await pipeline(data.file, fs.createWriteStream(filepath));
      console.log('File saved successfully');

      // Store the URL path in the database
      const audioUrl = `/uploads/${filename}`;
      console.log('Updating database with audio URL:', audioUrl);

      const updatedMeeting = await MeetingRepository.updateAudio(id, audioUrl);
      console.log('Database updated successfully:', updatedMeeting);

      return reply.send(updatedMeeting);
    } catch (error) {
      console.error('Upload error:', error);
      return reply.status(500).send({ 
        error: "Failed to upload audio", 
        details: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  }

  static async transcribeMeeting(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      console.log('Starting transcription for meeting:', id);

      const meeting = await MeetingRepository.findById(id);

      if (!meeting || !meeting.audio_url) {
        console.error('Meeting not found or no audio URL:', { id, audio_url: meeting?.audio_url });
        return reply.status(400).send({ error: "Audio file not uploaded yet" });
      }

      const audioPath = path.join(process.cwd(), meeting.audio_url);
      console.log('Audio file path:', audioPath);

      if (!fs.existsSync(audioPath)) {
        console.error('Audio file not found at path:', audioPath);
        return reply.status(404).send({ error: "Audio file not found" });
      }

      console.log('Starting audio transcription');
      const transcript = await OpenAIService.transcribeAudio(audioPath);
      console.log('Transcription completed');

      let summary = null;
      if (transcript) {
        try {
          summary = await OpenAIService.summarizeTranscript(transcript);
          console.log('Summary generated');
        } catch (summaryError) {
          console.error('Failed to generate summary:', summaryError);
          // Continue with just the transcript if summary fails
        }
      }

      const updatedMeeting = await MeetingRepository.saveTranscript(
        id, 
        transcript, 
        summary || ''
      );
      console.log('Meeting updated with transcript and summary');

      return reply.send(updatedMeeting);
    } catch (error) {
      console.error("Transcription error:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return reply.status(500).send({ 
        error: "Failed to transcribe meeting", 
        details: errorMessage 
      });
    }
  }

  static async getMeetings(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = request.user?.id;

      if (!userId) {
        return reply.status(401).send({ error: "Unauthorized" });
      }

      const meetings = await MeetingRepository.findByUser(userId);
      return reply.send(meetings);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
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
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return reply.status(500).send({ error: "Failed to fetch meeting", details: errorMessage });
    }
  }
}