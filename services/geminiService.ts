import { GoogleGenAI, Modality } from "@google/genai";
import { StoryOptions } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateStoryWithGemini = async (options: StoryOptions): Promise<{ title: string; content: string }> => {
  const modelId = "gemini-3-flash-preview";
  
  const systemInstruction = `
    You are a professional Persian storyteller (قصه گو). 
    Your goal is to write engaging, creative, and age-appropriate stories in the Persian (Farsi) language.
    Strictly follow the user's requirements regarding genre, topic, and age group.
    
    Output Format:
    Return the response in strictly valid JSON format with two keys: "title" and "content".
    - "title": A creative title for the story in Persian.
    - "content": The full body of the story in Persian, formatted with markdown (paragraphs, bold text for emphasis).
    
    Do not wrap the JSON in markdown code blocks (like \`\`\`json). Just return the raw JSON string if possible, or I will parse it out.
  `;

  const lengthPrompt = options.length === 'short' ? 'حدود ۳۰۰ کلمه' : options.length === 'medium' ? 'حدود ۶۰۰ کلمه' : 'حدود ۱۰۰۰ کلمه';

  const userPrompt = `
    موضوع داستان: ${options.prompt}
    ژانر: ${options.genre}
    گروه سنی: ${options.ageGroup}
    طول داستان: ${lengthPrompt}
    
    لطفا یک داستان جذاب و آموزنده بنویس.
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: userPrompt,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json" 
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");

    // Parse JSON
    const json = JSON.parse(text);
    return {
      title: json.title || "داستان بدون عنوان",
      content: json.content || "محتوایی یافت نشد."
    };

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("خطا در تولید داستان. لطفا دوباره تلاش کنید.");
  }
};

// --- Audio Utilities ---

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

let audioContext: AudioContext | null = null;
let currentSource: AudioBufferSourceNode | null = null;

export const stopAudio = () => {
  if (currentSource) {
    try {
      currentSource.stop();
    } catch (e) {
      // Ignore errors if already stopped
    }
    currentSource = null;
  }
};

export const generateStoryAudio = async (text: string): Promise<string> => {
   // Clean markdown for better TTS experience
   const cleanText = text.replace(/[*_#`\[\]]/g, '');

   try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: {
        parts: [{ text: cleanText }]
      },
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) throw new Error("No audio generated");
    
    return base64Audio;
   } catch (error) {
     console.error("Audio generation failed", error);
     throw error;
   }
}

export const playAudioData = async (base64Audio: string): Promise<void> => {
    // Stop any currently playing audio
    stopAudio();

    if (!audioContext) {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
    }
    
    if (audioContext.state === 'suspended') {
      await audioContext.resume();
    }

    const audioBuffer = await decodeAudioData(
      decode(base64Audio),
      audioContext,
      24000,
      1
    );
    
    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContext.destination);
    source.start();
    currentSource = source;

    return new Promise((resolve) => {
      source.onended = () => {
        currentSource = null;
        resolve();
      };
    });
};