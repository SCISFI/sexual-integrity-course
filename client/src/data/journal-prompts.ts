export const JOURNAL_PROMPTS: string[] = [
  "What am I grateful for today?",
  "What triggered me today, and how did I respond?",
  "What values did I honor today?",
  "What would I tell a friend going through what I'm experiencing?",
  "What small victory can I celebrate today?",
  "What emotion am I avoiding right now?",
  "What would my future self thank me for doing today?",
  "What is one thing I learned about myself this week?",
  "How did I show up for the people I care about today?",
  "What am I most afraid of in recovery, and why?",
  "What healthy coping skill did I use today?",
  "Who in my life supports my recovery, and how?",
  "What thought pattern did I notice repeating today?",
  "What would freedom from this struggle look like for me?",
  "What is one boundary I'm proud of maintaining?",
  "How did stress show up in my body today?",
  "What's one thing I would do differently if I could redo today?",
  "What gives me hope right now?",
  "What core belief about myself is being challenged in recovery?",
  "What moment today made me feel most alive?",
  "How am I being kind to myself in this process?",
  "What pattern in my behavior am I starting to recognize?",
  "What would integrity look like in my life right now?",
  "What am I learning about my triggers?",
  "How did I handle an uncomfortable emotion today?",
  "What step, no matter how small, did I take toward my goals?",
  "What role does shame play in my life, and how can I address it?",
  "Who do I want to become through this journey?",
  "What relationship in my life needs more attention?",
  "How am I growing stronger than my urges?"
];

export function getTodaysPrompt(): string {
  // Use the day of year to rotate prompts
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  const dayOfYear = Math.floor(diff / oneDay);
  
  return JOURNAL_PROMPTS[dayOfYear % JOURNAL_PROMPTS.length];
}
