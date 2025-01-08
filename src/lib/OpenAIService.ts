import axios, { AxiosError } from "axios";
import FormData from "form-data";
import fs from "fs";

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

class RateLimiter {
  private queue: (() => Promise<void>)[] = [];
  private isProcessing = false;

  async addTask(task: () => Promise<void>) {
    this.queue.push(task);
    if (!this.isProcessing) {
      this.processQueue();
    }
  }

  private async processQueue() {
    this.isProcessing = true;
    while (this.queue.length > 0) {
      const task = this.queue.shift();
      if (task) await task();
      await delay(1000); // Intervalo entre as solicitações
    }
    this.isProcessing = false;
  }
}

const limiter = new RateLimiter();

export class OpenAIService {
  static async transcribeAudio(audioPath: string, retries = 5): Promise<string> {
    let lastError: any;

    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const formData = new FormData();
        formData.append("model", "whisper-1");
        formData.append("file", fs.createReadStream(audioPath));

        const response = await axios.post(
          "https://api.openai.com/v1/audio/transcriptions",
          formData,
          {
            headers: {
              Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
              ...formData.getHeaders(),
            },
          }
        );

        return response.data.text;
      } catch (error) {
        lastError = error;

        if (error instanceof AxiosError && error.response?.status === 429) {
          console.log(`Rate limited, attempt ${attempt + 1}/${retries}. Waiting before retry...`);
          await delay(Math.pow(2, attempt) * 1000); // Backoff exponencial
          continue;
        }

        if (error instanceof AxiosError) {
          console.error("Axios error:", {
            status: error.response?.status,
            data: error.response?.data,
            headers: error.response?.headers,
          });
          throw new Error(
            error.response?.data?.error?.message || "Failed to transcribe audio"
          );
        }

        await delay(1000 * (attempt + 1));
      }
    }

    throw lastError;
  }

  static async summarizeTranscript(transcript: string, retries = 5): Promise<string> {
    let lastError: any;

    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const response = await axios.post(
          "https://api.openai.com/v1/chat/completions",
          {
            model: "gpt-4",
            messages: [
              { role: "system", content: "You are an assistant summarizing meeting transcripts." },
              { role: "user", content: `Summarize the following transcript: ${transcript}` },
            ],
          },
          {
            headers: {
              Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
              "Content-Type": "application/json",
            },
          }
        );

        return response.data.choices[0].message.content;
      } catch (error) {
        lastError = error;

        if (error instanceof AxiosError && error.response?.status === 429) {
          console.log(`Rate limited, attempt ${attempt + 1}/${retries}. Waiting before retry...`);
          await delay(Math.pow(2, attempt) * 1000); // Backoff exponencial
          continue;
        }

        if (error instanceof AxiosError) {
          console.error("Axios error:", {
            status: error.response?.status,
            data: error.response?.data,
            headers: error.response?.headers,
          });
          throw new Error(
            error.response?.data?.error?.message || "Failed to summarize transcript"
          );
        }

        await delay(1000 * (attempt + 1));
      }
    }

    throw lastError;
  }
}

// Adicionando ao Rate Limiter
const audioFilePaths: string[] = []; // Define your audio file paths here
audioFilePaths.forEach(audioPath => {
  limiter.addTask(async () => {
    try {
      const transcript = await OpenAIService.transcribeAudio(audioPath);
      console.log("Transcription complete:", transcript);
    } catch (error) {
      console.error("Error during transcription:", error);
    }
  });
});
