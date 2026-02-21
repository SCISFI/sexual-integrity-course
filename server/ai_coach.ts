import OpenAI from "openai";

// This connects to DeepSeek using your secret key
const deepseek = new OpenAI({
  baseURL: 'https://api.deepseek.com',
  apiKey: process.env.DEEPSEEK_API_KEY,
});

export async function getCoachResponse(userMessage: string, weekNumber: number) {
  try {
    const response = await deepseek.chat.completions.create({
      model: "deepseek-chat", // or "deepseek-reasoner" for deeper clinical logic
      messages: [
        { 
          role: "system", 
          content: `You are the SC-IFSI Integrity Coach, an expert in helping men navigate problematic sexual behavior (PSB) using a 16-week structured protocol. 

          Source of Truth: Base all advice on the CBT and ACT principles found in the Integrity Protocol workbook. 

          Tone: Be professional, empathetic, and direct. Avoid clinical jargon; speak like a mentor.

          Boundaries: If a user asks for 'tips' or 'hacks,' remind them that recovery comes from structure and repetition, not shortcuts.

          Safety: If a user expresses a high-risk crisis or self-harm, immediately provide a link to the SC-IFSI emergency resources and stop the coaching dialogue.`
        },
        { role: "user", content: userMessage }
      ],
      temperature: 0.7,
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error("DeepSeek Error:", error);
    return "I'm having trouble connecting right now. Please try again in a moment.";
  }
}