import OpenAI from "openai";
import fs from "fs";
import path from "path";

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export class OpenAIService {
  static async transcribeAudio(audioPath: string, retries = 3): Promise<string> {
    try {
      // Verify file exists and is readable
      if (!fs.existsSync(audioPath)) {
        throw new Error(`Audio file not found at path: ${audioPath}`);
      }

      // Use the original webm file path
      const webmPath = audioPath;

      for (let attempt = 0; attempt < retries; attempt++) {
        try {
          console.log('Starting transcription with OpenAI...');
          
          // Create a read stream just before using it
          const fileStream = fs.createReadStream(webmPath);
          
          const response = await openai.audio.transcriptions.create({
            file: fileStream,
            model: "whisper-1",
            language: "en",
            response_format: "json"
          });

          // Close the stream
          fileStream.destroy();

          console.log('Transcription successful');
          return response.text;
        } catch (error: any) {
          console.error('OpenAI API Error:', error);

          if (error.status === 429 || error.code === 'ECONNRESET') {
            const waitTime = Math.pow(2, attempt) * 1000;
            console.log(`Rate limited or connection reset. Waiting ${waitTime}ms before retry...`);
            await delay(waitTime);
            continue;
          }
          throw error;
        }
      }
      throw new Error('Max retries exceeded for transcription');
    } catch (error) {
      console.error('Transcription failed:', error);
      throw error;
    }
  }

  static async summarizeTranscript(transcript: string): Promise<string> {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are an expert at summarizing meeting transcripts. Create a clear, concise summary with key points and action items."
          },
          {
            role: "user",
            content: `Please summarize this meeting transcript and highlight the key points and action items: ${transcript}`
          }
        ],
        temperature: 0.7,
        max_tokens: 500
      });

      return response.choices[0].message.content || '';
    } catch (error) {
      console.error('Summary generation failed:', error);
      throw error;
    }
  }
}