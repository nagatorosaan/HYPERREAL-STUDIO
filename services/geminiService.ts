import { GoogleGenAI } from "@google/genai";
import { GenerationSettings, ReferenceImage } from "../types";

// Helper to create the AI instance with the current key
const getAiInstance = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found in environment.");
  }
  return new GoogleGenAI({ apiKey });
};

export const generateImage = async (
  prompt: string,
  referenceImages: ReferenceImage[],
  settings: GenerationSettings
): Promise<string> => {
  const ai = getAiInstance();

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
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: {
        parts: parts
      },
      config: {
        imageConfig: {
          aspectRatio: settings.aspectRatio,
          imageSize: settings.imageSize 
        }
      }
    });

    // Extract image
    // The model can return multiple parts, find the inlineData (image)
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
    console.error("Generation error:", error);
    throw error;
  }
};
