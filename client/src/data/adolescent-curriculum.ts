import type { WeekContent } from "./curriculum";

function placeholderWeek(weekNumber: number, title: string, phase: 1 | 2, phaseName: string): WeekContent {
  return {
    weekNumber,
    title,
    phase,
    phaseName,
    overview: "This week's content is being prepared and will be available soon. Your mentor will let you know when it is ready. In the meantime, continue your daily check-ins and stay connected with your mentor.",
    teaching: [
      {
        id: "coming-soon",
        title: "Content Coming Soon",
        content: [
          "The curriculum for this week is being finalized by our team.",
          "You will be notified when this week's lesson is ready.",
          "Please continue your daily check-in practice and check in with your mentor.",
        ],
      },
    ],
    reflectionQuestions: [
      {
        id: "q1",
        question: "What is one thing you are proud of from this week?",
      },
      {
        id: "q2",
        question: "What was the hardest moment this week and how did you handle it?",
      },
      {
        id: "q3",
        question: "Who did you connect with this week? How did that feel?",
      },
      {
        id: "q4",
        question: "What is one thing you want to do differently next week?",
      },
    ],
    exercises: [],
    homeworkChecklist: [
      "Complete your daily check-ins",
      "Write your weekly reflection answers",
      "Check in with your mentor",
    ],
  };
}

export const ADOLESCENT_CURRICULUM: Record<number, WeekContent> = {
  1: placeholderWeek(1, "Starting Here", 1, "Foundation"),
  2: placeholderWeek(2, "Understanding Patterns", 1, "Foundation"),
  3: placeholderWeek(3, "What Triggers Look Like", 1, "Foundation"),
  4: placeholderWeek(4, "The Urge and What to Do With It", 1, "Foundation"),
  5: placeholderWeek(5, "Emotions Aren't the Enemy", 1, "Foundation"),
  6: placeholderWeek(6, "Why Hiding Makes It Worse", 1, "Foundation"),
  7: placeholderWeek(7, "What Real Connection Looks Like", 1, "Foundation"),
  8: placeholderWeek(8, "Building Better Habits", 1, "Foundation"),
  9: placeholderWeek(9, "Your Thoughts Aren't Always True", 2, "Growth & Values"),
  10: placeholderWeek(10, "Stepping Back From Your Mind", 2, "Growth & Values"),
  11: placeholderWeek(11, "Who You Are Underneath", 2, "Growth & Values"),
  12: placeholderWeek(12, "What Actually Matters to You", 2, "Growth & Values"),
  13: placeholderWeek(13, "Accepting the Hard Stuff", 2, "Growth & Values"),
  14: placeholderWeek(14, "Taking Action Anyway", 2, "Growth & Values"),
  15: placeholderWeek(15, "Protecting What You've Built", 2, "Growth & Values"),
  16: placeholderWeek(16, "Who You're Becoming", 2, "Growth & Values"),
};

export const ADOLESCENT_WEEK_TITLES: Record<number, string> = Object.fromEntries(
  Object.entries(ADOLESCENT_CURRICULUM).map(([k, v]) => [Number(k), v.title])
);
