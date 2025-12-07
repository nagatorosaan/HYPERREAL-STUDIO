import { GoogleGenAI } from "@google/genai";
import { GenerationSettings, ReferenceImage } from "../types";

// Helper to safely access the API Key
const getApiKey = (): string => {
  let apiKey = '';
  try {
    // Check if process and process.env exist (Node/Bundler environment)
    if (typeof process !== 'undefined' && process.env) {
      apiKey = process.env.API_KEY || '';
    }
  } catch (e) {
    console.warn("Error accessing process.env:", e);
  }
  
  if (!apiKey) {
      console.log("HyperReal Studio: No API Key found in process.env.API_KEY");
  } else {
      console.log("HyperReal Studio: API Key detected.");
  }

  return apiKey;
};

export const generateImage = async (
  prompt: string,
  referenceImages: ReferenceImage[],
  settings: GenerationSettings
): Promise<string> => {
  const apiKey = getApiKey();
  
  if (!apiKey) {
    throw new Error("API_KEY_MISSING");
  }

  const ai = new GoogleGenAI({ apiKey });

  // Enhance prompt based on style
  let finalPrompt = prompt;
  if (settings.style !== "Photorealistic") {
    finalPrompt = `${settings.style} style: ${prompt}`;
  } else {
    finalPrompt = `Ultra-realistic, 8k, highly detailed, photorealistic: ${prompt}`;
  }

  // Prepare contents
  const parts: any[] = [];
  
  // Add reference images if any
  referenceImages.forEach(ref => {
    parts.push({
      inlineData: {
        data: ref.data,
        mimeType: ref.mimeType
      }
    });
  });

  // Add text prompt
  parts.push({ text: finalPrompt });

  try {
    // Using gemini-2.5-flash-image for high performance and fewer restrictions
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: parts
      },
      config: {
        imageConfig: {
          aspectRatio: settings.aspectRatio,
        }
      }
    });

    // Extract image
    const candidates = response.candidates;
    if (candidates && candidates.length > 0 && candidates[0].content && candidates[0].content.parts) {
      for (const part of candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    }

    throw new Error("No image data found in response");
  } catch (error) {
    console.error("Generation error details:", error);
    throw error;
  }
};