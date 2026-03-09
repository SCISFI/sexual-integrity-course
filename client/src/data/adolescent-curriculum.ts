import type { WeekContent } from "./curriculum";
import type { BiblicalReflection } from "./biblical-reflections";

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
  1: {
    weekNumber: 1,
    title: "The Moment You Stop Hiding",
    phase: 1,
    phaseName: "Foundation & Stabilization",
    overview: "This week is about honesty. Not telling everybody your business. Not making a big speech. Just getting honest about what has really been going on. If a pattern keeps pulling you back, keeps growing in secrecy, or keeps making you feel divided inside, this week is where you stop pretending it is no big deal.",
    teaching: [
      {
        id: "something-is-off",
        title: "If You're Here, Something Probably Isn't Working",
        content: [
          "Most people do not start something like this because life is going great. Usually something happened. Maybe you got caught. Maybe you scared yourself. Maybe you are just tired of feeling like there is one version of you on the outside and another version inside your head.",
          "You may still be doing okay in school, sports, church, work, or at home. But doing okay on the outside does not always mean everything is okay on the inside.",
          "You may have told yourself things like: 'It is not a big deal.' 'I can stop whenever I want.' 'Nobody knows, so it is fine.' But if something keeps pulling you back and making you feel more secretive, more disconnected, or less in control, then it deserves attention.",
          "This program is not here to shame you. It is here to help you face what is real so you can stop getting dragged around by a pattern that keeps taking more than it gives.",
        ],
      },
      {
        id: "the-pattern",
        title: "The Pattern That Keeps Repeating",
        content: [
          "A lot of unhealthy behavior follows a cycle. It usually starts before the actual choice. It starts with what is going on inside you.",
          "First comes BUILD-UP. You feel stressed, bored, lonely, angry, embarrassed, rejected, restless, or numb.",
          "Then comes DRIFT. Your mind starts moving toward the pattern. You start thinking about it, getting closer to it, or putting yourself in the same old setup.",
          "Then comes ACTION. You do the thing you were moving toward.",
          "Then comes the CRASH. Shame. Regret. Numbness. Fear. Disappointment. Promises to stop. Then the crash creates the feelings that can start the cycle all over again.",
          "The good news is this: if the pattern can be seen, it can be interrupted. You do not have to understand everything yet. You just have to start noticing your version of the cycle.",
        ],
      },
      {
        id: "secrecy",
        title: "Secrecy Makes the Pattern Stronger",
        content: [
          "Most destructive patterns grow best in hiding. The more secret something becomes, the more power it usually gains.",
          "When you are hiding, life starts to split in two: what people think is going on, and what is actually going on. That split creates pressure.",
          "The more alone you feel, the more likely you are to reach for something that gives fast relief. Then afterward you feel worse, and the secrecy gets even stronger.",
          "This does not mean you need to tell everybody everything. It does mean that staying completely alone inside the struggle usually keeps the struggle alive.",
        ],
      },
      {
        id: "not-bad-not-fine",
        title: "This Is Bigger Than 'I'm Bad' or 'It's Fine'",
        content: [
          "A lot of teens swing between two extremes. One is: 'I am disgusting.' The other is: 'This is normal, so who cares.' Neither one helps.",
          "Shame makes you hide. Minimizing makes you drift. Both keep you stuck.",
          "A better question is this: Is this pattern helping me become the kind of person I want to be?",
          "If the answer is no—if it is making you more secretive, more disconnected, less respectful, less honest, or less in control—then something needs to change.",
          "That does not mean you are broken. It means you need a different path.",
        ],
      },
      {
        id: "why-just-stop-fails",
        title: "Why 'Just Stop' Usually Does Not Work",
        content: [
          "If 'just stop' worked, you probably would have already done it.",
          "Strong habits are not just about decisions. They also connect to emotion, routine, relief, and what your brain has learned to reach for under pressure.",
          "That is why someone can know a choice is not helping and still feel pulled toward it anyway.",
          "This is not an excuse. It is an explanation. And explanations matter, because when you understand what is actually happening, you can stop using the wrong tools.",
          "You are not going to change by hating yourself harder. You change by noticing the pattern earlier, telling the truth faster, and practicing different choices before the cycle takes over.",
        ],
      },
      {
        id: "responsibility",
        title: "Responsibility Is Stronger Than Shame",
        content: [
          "Shame says: 'There is something wrong with me.' Responsibility says: 'Something I am doing needs to change.'",
          "That difference matters. Shame usually leads to hiding. Responsibility leads to ownership.",
          "Responsibility sounds like this: 'I need to be honest.' 'This pattern is not helping me.' 'I need to stop lying to myself.' 'I can start changing how I respond.'",
          "The goal this week is not to crush yourself. It is to tell the truth and take the first real step.",
        ],
      },
    ],
    reflectionQuestions: [
      {
        id: "what-brought-you-here",
        question: "What made this feel real enough that you could not keep ignoring it?",
      },
      {
        id: "where-in-cycle",
        question: "Which part of the cycle do you recognize most in yourself: build-up, drift, action, or crash?",
      },
      {
        id: "before-pattern",
        question: "What do you usually feel right before you start drifting toward the pattern?",
      },
      {
        id: "what-are-you-hiding",
        question: "What have you been hiding from other people—or from yourself?",
      },
      {
        id: "how-is-it-affecting-you",
        question: "How has this pattern affected your mood, focus, relationships, faith, confidence, or self-respect?",
      },
      {
        id: "one-change",
        question: "What would change in your life if you became more honest this week?",
      },
    ],
    exercises: [
      {
        id: "my-story-so-far",
        title: "My Story So Far",
        instructions: "You do not need to write everything. Just be honest enough to see the pattern more clearly.",
        fields: [
          {
            id: "when-started",
            label: "When did you first notice this becoming a real problem?",
            type: "textarea",
            placeholder: "Describe when it started feeling real...",
          },
          {
            id: "what-leads-up",
            label: "What usually seems to lead up to it?",
            type: "textarea",
            placeholder: "What happens before it...",
          },
          {
            id: "what-happens-after",
            label: "What usually happens afterward inside you?",
            type: "textarea",
            placeholder: "What do you feel, think, or tell yourself after...",
          },
          {
            id: "what-you-tell-yourself",
            label: "What have you been telling yourself about it?",
            type: "textarea",
            placeholder: "What story have you been telling yourself...",
          },
          {
            id: "why-hard-to-be-honest",
            label: "What makes it hard to be honest about this?",
            type: "textarea",
            placeholder: "What gets in the way of honesty...",
          },
        ],
      },
      {
        id: "my-cycle-map",
        title: "My Cycle Map",
        instructions: "Fill this out based on your real life, not what sounds like the right answer.",
        fields: [
          {
            id: "build-up",
            label: "BUILD-UP: What feelings or situations usually start the cycle?",
            type: "textarea",
            placeholder: "Bored, stressed, lonely, angry, embarrassed, rejected...",
          },
          {
            id: "drift",
            label: "DRIFT: What are the early signs that you are moving toward trouble?",
            type: "textarea",
            placeholder: "What does drifting look like for you...",
          },
          {
            id: "action",
            label: "ACTION: What does the unhealthy choice usually look like for you?",
            type: "textarea",
            placeholder: "Describe the choice honestly...",
          },
          {
            id: "crash",
            label: "CRASH: What do you usually feel or tell yourself afterward?",
            type: "textarea",
            placeholder: "What happens after...",
          },
        ],
      },
      {
        id: "who-knows",
        title: "Who Knows the Real Me?",
        instructions: "This is about honesty, not pressure. Answer as honestly as you can.",
        fields: [
          {
            id: "does-anyone-know",
            label: "Is there anyone in your life who knows you are struggling?",
            type: "text",
            placeholder: "Yes / No / Sort of",
          },
          {
            id: "if-no-why-not",
            label: "If no one knows, why not?",
            type: "textarea",
            placeholder: "What keeps you from telling the truth...",
          },
          {
            id: "who-feels-safe",
            label: "Who feels safest to be honest with?",
            type: "textarea",
            placeholder: "A parent, mentor, counselor, youth leader, other...",
          },
          {
            id: "what-do-you-fear",
            label: "What do you fear would happen if you told the truth?",
            type: "textarea",
            placeholder: "What are you afraid of...",
          },
          {
            id: "what-support-needed",
            label: "What kind of support do you think you actually need right now?",
            type: "textarea",
            placeholder: "What would help...",
          },
        ],
      },
      {
        id: "week-1-commitment",
        title: "My Week 1 Commitment",
        instructions: "Keep it simple, honest, and real.",
        fields: [
          {
            id: "why-change",
            label: "Complete this sentence: I want things to change because...",
            type: "textarea",
            placeholder: "I want things to change because...",
          },
          {
            id: "one-honest-step",
            label: "Complete this sentence: This week, one honest step I will take is...",
            type: "textarea",
            placeholder: "One honest step I will take this week is...",
          },
        ],
      },
    ],
    homeworkChecklist: [
      "Read all Week 1 material",
      "Complete My Story So Far",
      "Complete all reflection questions",
      "Complete My Cycle Map",
      "Complete Who Knows the Real Me?",
      "Write your Week 1 commitment",
      "Complete daily check-ins for all 7 days",
    ],
  },
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

export const ADOLESCENT_BIBLICAL_REFLECTIONS: Record<number, BiblicalReflection> = {
  1: {
    character: "David",
    title: "David and the Man Who Told Him the Truth",
    story: [
      "David had power and position, but he still made choices he tried to hide. For a while, it looked like he might control the story and keep everything covered up.",
      "Then Nathan stepped in and told the truth. That was the turning point. David could no longer act like he was outside the story or above what he had done.",
      "Change often starts there. Not when someone feels bad for a moment, but when they stop managing appearances and face what is actually true.",
      "That is what honesty does. It breaks the power of pretending.",
    ],
    takeaway: "Freedom often begins when hiding stops.",
    reflection: "Where am I still trying to manage how things look instead of telling the truth about what is real?",
  },
};
