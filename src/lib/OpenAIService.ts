import axios from "axios";

export class OpenAIService {
  static async transcribeAudio(audioUrl: string) {
    const response = await axios.post(
      "https://api.openai.com/v1/audio/transcriptions",
      {
        model: "whisper-1",
        file: audioUrl,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data.text;
  }
}
