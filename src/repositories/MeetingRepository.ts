import { prisma } from "../lib/prisma";

export class MeetingRepository {
  // Criar uma nova reunião
  static async create(data: { title: string; description?: string; date: string; userId: string }) {
    return await prisma.meeting.create({
      data: {
        title: data.title,
        description: data.description,
        date: data.date,
        user: {
          connect: { id: data.userId }, // Relacionamento com o usuário
        },
      },
    });
  }

  // Atualizar o URL do áudio da reunião
  static async updateAudio(meetingId: string, audioUrl: string) {
    console.log('Updating meeting in database:', { meetingId, audioUrl });
    try {
      const result = await prisma.meeting.update({
        where: { id: meetingId },
        data: { audio_url: audioUrl },
      });
      console.log('Database update result:', result);
      return result;
    } catch (error) {
      console.error('Database update error:', error);
      throw error;
    }
  }

  // Salvar a transcrição e o resumo no modelo `Meeting`
  static async saveTranscript(meetingId: string, transcript: string, summary: string) {
    return await prisma.meeting.update({
      where: { id: meetingId },
      data: {
        transcript,
        summary,
      },
    });
  }

  // Buscar reuniões por usuário
  static async findByUser(userId: string) {
    return await prisma.meeting.findMany({
      where: { user_id: userId },
      orderBy: { created_at: "desc" },
    });
  }

  // Buscar uma reunião pelo ID
  static async findById(meetingId: string) {
    return await prisma.meeting.findUnique({
      where: { id: meetingId },
    });
  }
}
