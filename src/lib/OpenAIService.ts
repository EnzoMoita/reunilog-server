import axios, { AxiosError } from "axios";
import FormData from "form-data";
import fs from "fs";

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export class OpenAIService {
  static async transcribeAudio(audioPath: string, retries = 3): Promise<string> {
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
        
        if (error instanceof AxiosError) {
          // If it's a rate limit error, wait and retry
          if (error.response?.status === 429) {
            console.log(`Rate limited, attempt ${attempt + 1}/${retries}. Waiting before retry...`);
            // Wait for 2 seconds before retrying (adjust as needed)
            await delay(2000 * (attempt + 1));
            continue;
          }
          
          // If it's another type of error, throw it immediately
          throw new Error(
            error.response?.data?.error?.message || 
            'Failed to transcribe audio'
          );
        }
        
        // For non-Axios errors, wait before retrying
        await delay(1000 * (attempt + 1));
      }
    }

    // If we've exhausted all retries, throw the last error
    throw lastError;
  }

  static async summarizeTranscript(transcript: string, retries = 3): Promise<string> {
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
        
        if (error instanceof AxiosError) {
          if (error.response?.status === 429) {
            console.log(`Rate limited, attempt ${attempt + 1}/${retries}. Waiting before retry...`);
            await delay(2000 * (attempt + 1));
            continue;
          }
          
          throw new Error(
            error.response?.data?.error?.message || 
            'Failed to summarize transcript'
          );
        }
        
        await delay(1000 * (attempt + 1));
      }
    }

    throw lastError;
  }
}