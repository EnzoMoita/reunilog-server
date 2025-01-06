import { prisma } from "../lib/prisma";

export class MeetingRepository {
  static async create(data: { title: any; description: any; date: any; userId: any; }) {
    return await prisma.meeting.create({
      data: {
        ...data,
        user: { connect: { id: data.userId } }
      }
    });
  }


  static async updateAudio(meetingId: any, audioUrl: any) {
    return await prisma.meeting.update({
      where: { id: meetingId },
      data: { audio_url: audioUrl },
    });
  }

  static async saveTranscript(meetingId: any, content: any) {
    return await prisma.transcript.create({
      data: { content, meeting_id: meetingId },
    });
  }

  static async findByUser(userId: any) {
    return await prisma.meeting.findMany({
      where: { user_id: userId },
      include: { transcript: true },
    });
  }

  static async findById(meetingId: any) {
    return await prisma.meeting.findUnique({
      where: { id: meetingId },
      include: { transcript: true },
    });
  }
}
