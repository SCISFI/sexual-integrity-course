import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

const CBT_TECHNIQUES = {
  1: [
    "Identifying distorted thoughts",
    "Building awareness of triggers",
    "Understanding the cognitive model",
  ],
  2: [
    "Thought recording",
    "Recognizing automatic negative thoughts",
    "Beginning cognitive restructuring",
  ],
  3: [
    "Challenging cognitive distortions",
    "Evidence gathering",
    "Alternative perspective taking",
  ],
  4: [
    "Behavioral experiments",
    "Testing beliefs through action",
    "Building new response patterns",
  ],
  5: [
    "Core belief identification",
    "Understanding belief origins",
    "Beginning belief modification",
  ],
  6: [
    "Continuing belief work",
    "Building healthier self-talk",
    "Reinforcing new patterns",
  ],
  7: [
    "Relapse prevention planning",
    "Identifying high-risk situations",
    "Building coping strategies",
  ],
  8: [
    "Consolidating CBT skills",
    "Creating a personal toolkit",
    "Transitioning to maintenance",
  ],
};

const ACT_TECHNIQUES = {
  9: [
    "Values clarification",
    "Understanding what matters most",
    "Connecting behavior to values",
  ],
  10: [
    "Mindfulness foundations",
    "Present moment awareness",
    "Non-judgmental observation",
  ],
  11: [
    "Cognitive defusion",
    "Stepping back from thoughts",
    "Seeing thoughts as mental events",
  ],
  12: [
    "Acceptance practices",
    "Making room for difficult emotions",
    "Dropping the struggle",
  ],
  13: [
    "Self-as-context",
    "The observing self",
    "Transcending the conceptualized self",
  ],
  14: [
    "Committed action",
    "Values-based goal setting",
    "Building meaningful habits",
  ],
  15: [
    "Psychological flexibility",
    "Integrating ACT skills",
    "Responding rather than reacting",
  ],
  16: [
    "Building a sustainable practice",
    "Long-term maintenance",
    "Continuing the journey",
  ],
};

// -----------------------------------------------------
// Existing client-oriented functions (kept for backward compatibility)
// NOTE: You should disable client endpoints in routes.ts (v2 hybrid).
// These functions may still be useful for STAFF drafting, but do not
// expose them directly to clients via the app.
// -----------------------------------------------------

export async function getAIEncouragement(
  weekNumber: number,
  context?: { mood?: number; urgeLevel?: number; completedWeeks?: number[] }
): Promise<string> {
  const phase = weekNumber <= 8 ? "CBT" : "ACT";
  const techniques =
    weekNumber <= 8
      ? CBT_TECHNIQUES[weekNumber as keyof typeof CBT_TECHNIQUES]
      : ACT_TECHNIQUES[weekNumber as keyof typeof ACT_TECHNIQUES];

  const systemPrompt = `You are a supportive, non-judgmental wellness coach for a sexual integrity program.
Your role is STRICTLY LIMITED to:
1) Providing encouragement and emotional support
2) Reminding users of ${phase} techniques they've learned
3) Offering gentle motivation to continue their journey

CRITICAL BOUNDARIES - You must NEVER:
- Engage with crisis situations (suicide, self-harm, abuse). If this arises, say: "Please reach out to a licensed professional counselor or a crisis line for support."
- Provide medical or psychiatric advice
- Discuss legal matters
- Engage with specific sexual content or behaviors in detail
- Judge, shame, or moralize
- Attempt to replace therapy

The user is currently in Week ${weekNumber} of a 16-week program.
Phase: ${
    phase === "CBT"
      ? "Cognitive Behavioral Therapy (Weeks 1-8)"
      : "Acceptance & Commitment Therapy (Weeks 9-16)"
  }
Current week's focus areas: ${techniques?.join(", ") || "General wellness techniques"}

Keep responses brief (2-3 sentences), warm, and encouraging.`;

  const userContext = context
    ? `
Current mood level: ${context.mood ?? "not recorded"}/10
Current urge level: ${context.urgeLevel ?? "not recorded"}/10
Weeks completed so far: ${context.completedWeeks?.length ?? 0}`
    : "";

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Please provide a brief, encouraging message for someone working through Week ${weekNumber} of the program.${userContext}`,
        },
      ],
      max_completion_tokens: 200,
      temperature: 0.7,
    });

    return (
      response.choices[0]?.message?.content ||
      "You're doing meaningful work by showing up today. Keep moving forward one step at a time."
    );
  } catch (error) {
    console.error("AI encouragement error:", error);
    return "You're doing meaningful work by showing up today. Every step forward matters.";
  }
}

export async function getAITechniqueReminder(
  weekNumber: number,
  techniqueName?: string
): Promise<string> {
  const phase = weekNumber <= 8 ? "CBT" : "ACT";
  const techniques =
    weekNumber <= 8
      ? CBT_TECHNIQUES[weekNumber as keyof typeof CBT_TECHNIQUES]
      : ACT_TECHNIQUES[weekNumber as keyof typeof ACT_TECHNIQUES];

  const systemPrompt = `You are a supportive wellness coach providing technique reminders for a sexual integrity program.
Your role is ONLY to:
1) Briefly explain ${phase} techniques in simple, practical terms
2) Provide gentle suggestions for how to apply the technique

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
        {
          role: "user",
          content: `Briefly remind me about this technique from Week ${weekNumber}: ${
            techniqueName || techniques?.[0] || "the main skill for this week"
          }`,
        },
      ],
      max_completion_tokens: 250,
      temperature: 0.7,
    });

    return (
      response.choices[0]?.message?.content ||
      `This week focuses on ${techniques?.[0] || "building your skills"}. Take it one step at a time.`
    );
  } catch (error) {
    console.error("AI technique reminder error:", error);
    return `This week focuses on ${techniques?.[0] || "building your skills"}. Remember to be patient with yourself.`;
  }
}

// -----------------------------------------------------
// NEW: Staff-only Draft Generator (v2 Hybrid)
// -----------------------------------------------------

export async function generateStaffDraft(input: {
  focus: string;
  tone?: "neutral" | "direct" | "warm" | string;
  constraints?: string;
  clientSummary?: unknown; // optional, keep minimal if you later pass it
}): Promise<string> {
  const focus = (input.focus ?? "").toString().trim();
  const tone = (input.tone ?? "neutral").toString().trim();
  const constraints = (input.constraints ?? "").toString().trim();

  if (!focus) {
    return "Draft could not be generated because 'focus' was missing.";
  }

  // Staff-only: Do NOT address the client directly.
  // Provide options and wording that the mentor/therapist can adapt.
  const systemPrompt = `
You are a drafting assistant for a clinician/mentor running an integrity-focused program.
You generate STAFF-ONLY drafts to help the professional prepare their own communication or session plan.

ABSOLUTE RULES:
- Output is staff-facing. Do NOT write as if you are speaking to the client.
- Do NOT diagnose, interpret motives, or infer hidden meaning.
- Do NOT score risk, streaks, compliance, or success/failure.
- Do NOT include explicit sexual content.
- Do NOT provide legal advice.
- If crisis/self-harm is mentioned, output a staff-facing note: "Escalate to appropriate crisis protocol."
- Keep language neutral, respectful, and practical.
- Prefer questions, options, and short scripts the professional can edit.

FORMAT:
- Provide 3 sections:
  1) "Draft Options" (2-3 short options)
  2) "Suggested Questions" (4-6 questions)
  3) "Boundary Notes" (2-4 bullets)

Tone guidance: ${tone}
Additional constraints (if any): ${constraints || "None"}
`.trim();

  const userPrompt = `
Create a staff-only draft for the following focus:
"${focus}"

If client context is provided, treat it as minimal metadata only and do not quote it verbatim:
${input.clientSummary ? JSON.stringify(input.clientSummary).slice(0, 800) : "(no client summary provided)"}
`.trim();

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_completion_tokens: 500,
      temperature: 0.5,
    });

    const text =
      response.choices[0]?.message?.content?.trim() ||
      "No draft returned. Try again with a more specific focus.";

    return text;
  } catch (error) {
    console.error("generateStaffDraft error:", error);
    return "Draft generation failed. Please try again.";
  }
}