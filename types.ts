export interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  timestamp: number;
  width: number;
  height: number;
}

export interface GenerationSettings {
  aspectRatio: "1:1" | "16:9" | "9:16" | "3:4" | "4:3";
  imageSize: "1K" | "2K" | "4K"; // Only for pro model
  style: "Photorealistic" | "Cinematic" | "Anime" | "Cyberpunk" | "Surreal" | "3D Render" | "Oil Painting";
}

export interface ReferenceImage {
  id: string;
  data: string; // Base64
  mimeType: string;
}
