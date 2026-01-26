import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

const CBT_TECHNIQUES = {
  1: ["Identifying distorted thoughts", "Building awareness of triggers", "Understanding the cognitive model"],
  2: ["Thought recording", "Recognizing automatic negative thoughts", "Beginning cognitive restructuring"],
  3: ["Challenging cognitive distortions", "Evidence gathering", "Alternative perspective taking"],
  4: ["Behavioral experiments", "Testing beliefs through action", "Building new response patterns"],
  5: ["Core belief identification", "Understanding belief origins", "Beginning belief modification"],
  6: ["Continuing belief work", "Building healthier self-talk", "Reinforcing new patterns"],
  7: ["Relapse prevention planning", "Identifying high-risk situations", "Building coping strategies"],
  8: ["Consolidating CBT skills", "Creating a personal toolkit", "Transitioning to maintenance"],
};

const ACT_TECHNIQUES = {
  9: ["Values clarification", "Understanding what matters most", "Connecting behavior to values"],
  10: ["Mindfulness foundations", "Present moment awareness", "Non-judgmental observation"],
  11: ["Cognitive defusion", "Stepping back from thoughts", "Seeing thoughts as mental events"],
  12: ["Acceptance practices", "Making room for difficult emotions", "Dropping the struggle"],
  13: ["Self-as-context", "The observing self", "Transcending the conceptualized self"],
  14: ["Committed action", "Values-based goal setting", "Building meaningful habits"],
  15: ["Psychological flexibility", "Integrating ACT skills", "Responding rather than reacting"],
  16: ["Building a sustainable practice", "Long-term maintenance", "Continuing the journey"],
};

export async function getAIEncouragement(
  weekNumber: number,
  context?: { mood?: number; urgeLevel?: number; completedWeeks?: number[] }
): Promise<string> {
  const phase = weekNumber <= 8 ? "CBT" : "ACT";
  const techniques = weekNumber <= 8 
    ? CBT_TECHNIQUES[weekNumber as keyof typeof CBT_TECHNIQUES] 
    : ACT_TECHNIQUES[weekNumber as keyof typeof ACT_TECHNIQUES];

  const systemPrompt = `You are a supportive, non-judgmental wellness coach for a sexual integrity program. 
Your role is STRICTLY LIMITED to:
1. Providing encouragement and emotional support
2. Reminding users of ${phase} techniques they've learned
3. Offering gentle motivation to continue their journey

CRITICAL BOUNDARIES - You must NEVER:
- Engage with any crisis situations (suicide, self-harm, abuse) - simply say "Please reach out to a professional counselor or crisis line for support with this"
- Provide medical or psychiatric advice
- Discuss legal matters
- Engage with specific sexual content or behaviors in detail
- Judge, shame, or moralize
- Attempt to be a replacement for therapy

The user is currently in Week ${weekNumber} of a 16-week program.
Phase: ${phase === "CBT" ? "Cognitive Behavioral Therapy (Weeks 1-8)" : "Acceptance & Commitment Therapy (Weeks 9-16)"}
Current week's focus areas: ${techniques?.join(", ") || "General wellness techniques"}

Keep responses brief (2-3 sentences), warm, and encouraging. Reference specific techniques from this week when appropriate.`;

  const userContext = context ? `
Current mood level: ${context.mood ?? "not recorded"}/10
Current urge level: ${context.urgeLevel ?? "not recorded"}/10
Weeks completed so far: ${context.completedWeeks?.length ?? 0}` : "";

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Please provide a brief, encouraging message for someone working through Week ${weekNumber} of the program.${userContext}` }
      ],
      max_completion_tokens: 200,
      temperature: 0.7,
    });

    return response.choices[0]?.message?.content || "You're doing great work by showing up today. Keep moving forward one day at a time.";
  } catch (error) {
    console.error("AI encouragement error:", error);
    return "You're doing great work by showing up today. Every step forward matters.";
  }
}

export async function getAITechniqueReminder(
  weekNumber: number,
  techniqueName?: string
): Promise<string> {
  const phase = weekNumber <= 8 ? "CBT" : "ACT";
  const techniques = weekNumber <= 8 
    ? CBT_TECHNIQUES[weekNumber as keyof typeof CBT_TECHNIQUES] 
    : ACT_TECHNIQUES[weekNumber as keyof typeof ACT_TECHNIQUES];

  const systemPrompt = `You are a supportive wellness coach providing technique reminders for a sexual integrity program.
Your role is ONLY to:
1. Briefly explain ${phase} techniques in simple, practical terms
2. Provide gentle suggestions for how to apply the technique

NEVER:
- Engage with crisis situations
- Provide medical/psychiatric advice
- Discuss specific behaviors in detail
- Be judgmental

Keep responses brief (3-4 sentences) and practical.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Briefly remind me about this technique from Week ${weekNumber}: ${techniqueName || techniques?.[0] || "the main skill for this week"}` }
      ],
      max_completion_tokens: 250,
      temperature: 0.7,
    });

    return response.choices[0]?.message?.content || `This week focuses on ${techniques?.[0] || "building your skills"}. Take it one step at a time.`;
  } catch (error) {
    console.error("AI technique reminder error:", error);
    return `This week focuses on ${techniques?.[0] || "building your skills"}. Remember to be patient with yourself.`;
  }
}
