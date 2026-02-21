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
          content: `You are the SC-IFSI Integrity Coach. 
          Context: The user is in Week ${weekNumber} of the 16-week journey.
          Rules:
          1. Use the provided SC-IFSI workbook as your primary guide.
          2. Be empathetic and professional.
          3. If the user mentions a crisis, direct them to scifsi.com/help.
          4. Keep responses under 200 words.`
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