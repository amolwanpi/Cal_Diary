import { GoogleGenAI, Type } from "@google/genai";
import { MealSuggestion, FoodItem } from "../types";

// Ensure process is defined to avoid TypeScript errors
declare const process: {
  env: {
    API_KEY: string;
  }
};

// Guidelines require using process.env.API_KEY directly
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Helper to create the model instance (using flash for speed and cost)
const modelId = "gemini-2.5-flash";

export const analyzeFood = async (foodDescription: string): Promise<FoodItem | null> => {
  if (!process.env.API_KEY) return null;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: `วิเคราะห์สารอาหารของ "${foodDescription}" ให้หน่อย ขอค่าโดยประมาณสำหรับ 1 จาน/ชิ้น`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING, description: "ชื่ออาหารมาตรฐาน" },
            calories: { type: Type.NUMBER, description: "พลังงาน (กิโลแคลอรี่)" },
            protein: { type: Type.NUMBER, description: "โปรตีน (กรัม)" },
            carbs: { type: Type.NUMBER, description: "คาร์โบไฮเดรต (กรัม)" },
            fat: { type: Type.NUMBER, description: "ไขมัน (กรัม)" },
          },
          required: ["name", "calories", "protein", "carbs", "fat"],
        },
      },
    });

    if (response.text) {
      const data = JSON.parse(response.text);
      return {
        ...data,
        timestamp: new Date().toISOString(),
      };
    }
    return null;
  } catch (error) {
    console.error("Error analyzing food:", error);
    return null;
  }
};

export const suggestMealPlan = async (targetCalories: number): Promise<MealSuggestion[]> => {
  if (!process.env.API_KEY) return [];

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: `สร้างแผนอาหาร 1 วันสำหรับคนไทยที่ต้องการลดน้ำหนัก โดยมีเป้าหมายพลังงานรวมประมาณ ${targetCalories} แคลอรี่ ขอเมนูที่หาทานง่ายหรือทำง่าย เน้นสุขภาพแต่อร่อย`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              type: { type: Type.STRING, enum: ["breakfast", "lunch", "dinner", "snack"] },
              mealName: { type: Type.STRING },
              description: { type: Type.STRING },
              calories: { type: Type.NUMBER },
            },
            required: ["type", "mealName", "description", "calories"],
          },
        },
      },
    });

    if (response.text) {
      return JSON.parse(response.text) as MealSuggestion[];
    }
    return [];
  } catch (error) {
    console.error("Error suggesting meals:", error);
    return [];
  }
};

export const suggestFoodForRemaining = async (remainingCalories: number): Promise<MealSuggestion[]> => {
  if (!process.env.API_KEY) return [];

  const prompt = remainingCalories < 200 
    ? `เหลือโควต้า ${remainingCalories} kcal แนะนำของว่างหรือเครื่องดื่มไม่อ้วน 3 อย่าง (อาหารไทยหรือหาซื้อง่ายใน 7-11)`
    : `เหลือโควต้า ${remainingCalories} kcal แนะนำมื้ออาหารสุขภาพ 3 อย่างที่อิ่มท้องแต่แคลอรี่ไม่เกินนี้ (อาหารไทย)`;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              mealName: { type: Type.STRING },
              description: { type: Type.STRING, description: "เหตุผลที่แนะนำหรือทริคการกิน" },
              calories: { type: Type.NUMBER },
              type: { type: Type.STRING, enum: ["snack", "dinner", "lunch", "breakfast"] }
            },
            required: ["mealName", "description", "calories", "type"],
          },
        },
      },
    });

    if (response.text) {
      // Force type assignment to match interface even if AI guesses slightly off
      const results = JSON.parse(response.text);
      return results.map((r: any) => ({ ...r, type: 'snack' })); 
    }
    return [];
  } catch (error) {
    console.error("Error suggesting food for remaining:", error);
    return [];
  }
};

export const getHealthAdvice = async (userProfile: any, currentLog: any): Promise<string> => {
    if (!process.env.API_KEY) return "กรุณาใส่ API Key เพื่อรับคำแนะนำ";

    try {
        const response = await ai.models.generateContent({
            model: modelId,
            contents: `ผู้ใช้เป็นคนไม่ชอบออกกำลังกาย อายุ ${userProfile.age} หนัก ${userProfile.weight} สูง ${userProfile.height}
            วันนี้กินไป ${currentLog.calories} kcal (จากเป้าหมาย TDEE ที่ควรลด) ดื่มน้ำไป ${currentLog.water} แก้ว
            ช่วยวิเคราะห์สั้นๆ และให้กำลังใจ พร้อมเตือนเรื่องดื่มน้ำถ้ายังดื่มน้อย (เป้าหมาย 8 แก้ว) ตอบแบบเป็นกันเอง สั้นๆ กระชับ`,
        });
        return response.text || "สู้ๆ นะครับ วันนี้ทำได้ดีแล้ว!";
    } catch (error) {
        return "ไม่สามารถเชื่อมต่อ AI ได้ขณะนี้";
    }
}