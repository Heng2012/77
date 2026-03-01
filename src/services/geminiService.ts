import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface SearchResult {
  title: string;
  url: string;
  type: 'file' | 'video' | 'image' | 'pdf' | 'group' | 'other';
  description: string;
}

export interface SearchFilters {
  minSize?: string;
  dateRange?: string;
  minMembers?: string;
}

export async function searchTelegramResources(
  query: string, 
  type: string, 
  filters: SearchFilters = {},
  page: number = 1
): Promise<string> {
  const model = "gemini-3-flash-preview";
  
  const filterStrings = [];
  if (filters.minSize) filterStrings.push(`minimum file size: ${filters.minSize}`);
  if (filters.dateRange) filterStrings.push(`uploaded within: ${filters.dateRange}`);
  if (filters.minMembers) filterStrings.push(`minimum channel members: ${filters.minMembers}`);

  const filterContext = filterStrings.length > 0 ? `Apply these filters: ${filterStrings.join(', ')}.` : '';
  
  const prompt = `Search for public Telegram channels, groups, or direct links for ${type} related to: "${query}". 
  ${filterContext}
  This is page ${page} of the results. 
  
  CRITICAL REQUIREMENT: 
  1. Only provide links that are likely to be ACTIVE and PUBLIC.
  2. Verify the existence of the channel/group via your search grounding.
  3. Do not provide dead links or known "fake" spam channels.
  4. Focus on high-quality, verified resources.
  
  Provide a list of relevant Telegram links (t.me/...) with brief descriptions.
  Format the output clearly using Markdown. 
  Ensure every Telegram link is explicitly written out as a full URL (e.g., https://t.me/example).`;

  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("API_KEY_MISSING");
    }

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    return response.text || "No results found.";
  } catch (error: any) {
    console.error("Search error:", error);
    
    if (error.message === "API_KEY_MISSING") {
      throw new Error("API_KEY_MISSING");
    }
    
    const errorMessage = error.message || "";
    if (errorMessage.includes("API_KEY_INVALID") || errorMessage.includes("403") || errorMessage.includes("unauthorized")) {
      throw new Error("API_KEY_INVALID");
    }
    
    if (errorMessage.includes("fetch") || errorMessage.includes("network") || errorMessage.includes("ENOTFOUND")) {
      throw new Error("NETWORK_ERROR");
    }

    if (errorMessage.includes("quota") || errorMessage.includes("429") || errorMessage.includes("limit")) {
      throw new Error("QUOTA_EXCEEDED");
    }

    throw new Error("UNKNOWN_ERROR");
  }
}
