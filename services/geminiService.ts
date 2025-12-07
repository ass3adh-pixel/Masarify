import { GoogleGenAI } from "@google/genai";
import { Transaction, Category, Language } from "../types";

// Helper to safely get the API Key in different environments (Vite, CRA, Node)
const getApiKey = (): string | undefined => {
  // 1. Try Vite Standard (Most likely for this project)
  // @ts-ignore
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_KEY) {
    // @ts-ignore
    return import.meta.env.VITE_API_KEY;
  }
  
  // 2. Try Create React App Standard
  if (typeof process !== 'undefined' && process.env && process.env.REACT_APP_API_KEY) {
    return process.env.REACT_APP_API_KEY;
  }

  // 3. Try Standard Node/Server (Fallback)
  if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
    return process.env.API_KEY;
  }

  return undefined;
};

const processTransactionsForAI = (transactions: Transaction[], categories: Category[], currency: string) => {
  // Simplify data to reduce token usage and privacy risk
  return transactions.map(t => {
    const cat = categories.find(c => c.id === t.categoryId);
    return {
      date: t.date.split('T')[0],
      amount: t.amount,
      type: t.type,
      category: cat ? cat.nameEn : 'Unknown', // Always send EN for better AI reasoning, AI will translate back
    };
  });
};

export const getFinancialAdvice = async (
  query: string,
  transactions: Transaction[],
  categories: Category[],
  language: Language,
  currency: string
): Promise<string> => {
  const apiKey = getApiKey();

  if (!apiKey) {
    console.error("Masarify Error: API Key is missing.");
    return language === Language.AR 
      ? "عذراً، مفتاح الربط مع الذكاء الاصطناعي مفقود. يرجى التأكد من إعداد VITE_API_KEY في إعدادات Netlify." 
      : "Error: API Key is missing. Please set VITE_API_KEY in your Netlify settings.";
  }

  const ai = new GoogleGenAI({ apiKey: apiKey });
  
  const simplifiedData = processTransactionsForAI(transactions, categories, currency);
  // Take last 100 transactions for better context, but safeguard token limits
  const recentData = simplifiedData.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 100);
  const dataString = JSON.stringify(recentData);

  const systemInstruction = `You are an expert financial advisor named "Masarify AI". 
  Analyze the provided transaction JSON data. 
  The user's language is ${language === Language.AR ? 'Arabic' : 'English'}.
  Respond strictly in ${language === Language.AR ? 'Arabic' : 'English'}.
  Be concise, encouraging, and provide specific actionable advice based on the spending patterns.
  Format your response in Markdown (use bullet points, bold text).
  Focus on high spending categories and saving opportunities.
  The currency code is ${currency}.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          { text: `Here is my recent transaction data: ${dataString}` },
          { text: `User Question: ${query}` }
        ]
      },
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
      }
    });

    return response.text || (language === Language.AR ? "لم أتمكن من توليد إجابة." : "I could not generate a response.");
  } catch (error) {
    console.error("Gemini API Error:", error);
    return language === Language.AR 
      ? "عذراً، حدث خطأ أثناء الاتصال بالمستشار الذكي. يرجى المحاولة لاحقاً." 
      : "Sorry, an error occurred connecting to the Smart Advisor.";
  }
};