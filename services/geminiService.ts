import { GoogleGenAI } from "@google/genai";
import { Transaction, Category, Language } from "../types";

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
  // Safety check for process.env
  const apiKey = typeof process !== 'undefined' && process.env ? process.env.API_KEY : null;

  if (!apiKey) {
    console.warn("API Key is missing. AI features will be disabled.");
    return language === Language.AR 
      ? "عذراً، مفتاح API غير متوفر. يرجى التحقق من إعدادات النظام." 
      : "API Key is missing. Please check configuration.";
  }

  const ai = new GoogleGenAI({ apiKey: apiKey });
  
  const simplifiedData = processTransactionsForAI(transactions, categories, currency);
  const dataString = JSON.stringify(simplifiedData.slice(0, 50)); // Limit to last 50 for context

  const systemInstruction = `You are an expert financial advisor named "Masarify AI". 
  Analyze the provided transaction JSON data. 
  The user's language is ${language === Language.AR ? 'Arabic' : 'English'}.
  Respond strictly in ${language === Language.AR ? 'Arabic' : 'English'}.
  Be concise, encouraging, and provide specific actionable advice based on the spending patterns.
  Format your response in Markdown.
  Focus on high spending categories and saving opportunities.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        { text: `Here is my recent transaction data: ${dataString}` },
        { text: `User Question: ${query}` }
      ],
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
      }
    });

    return response.text || "I could not generate a response at this time.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return language === Language.AR 
      ? "عذراً، حدث خطأ أثناء الاتصال بالمستشار الذكي." 
      : "Sorry, an error occurred connecting to the Smart Advisor.";
  }
};