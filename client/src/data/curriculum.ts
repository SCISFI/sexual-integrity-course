export interface ReflectionQuestion {
  id: string;
  question: string;
}

export interface Exercise {
  id: string;
  title: string;
  instructions: string;
  fields: {
    id: string;
    label: string;
    type: "textarea" | "text" | "number";
    placeholder?: string;
  }[];
}

export interface TeachingSection {
  id: string;
  title: string;
  content: string[];
}

export interface WeekContent {
  weekNumber: number;
  title: string;
  phase: 1 | 2;
  phaseName: string;
  overview: string;
  teaching: TeachingSection[];
  reflectionQuestions: ReflectionQuestion[];
  exercises: Exercise[];
  homeworkChecklist: string[];
}

export const WEEK_CONTENT: Record<number, WeekContent> = {
  1: {
    weekNumber: 1,
    title: "Welcome & Understanding CSBD",
    phase: 1,
    phaseName: "Foundation & Stabilization",
    overview: "This week is about slowing down: understanding what Compulsive Sexual Behavior Disorder actually is, learning the cycle that drives it, and clarifying your personal motivation for change.",
    teaching: [
      {
        id: "what-is-csbd",
        title: "What Is Compulsive Sexual Behavior Disorder?",
        content: [
          "Compulsive Sexual Behavior Disorder (CSBD) is recognized in the ICD-11 (the World Health Organization's International Classification of Diseases) as an impulse control disorder.",
          "The official definition: \"A persistent pattern of failure to control intense, repetitive sexual impulses or urges, resulting in repetitive sexual behavior that causes marked distress or impairment in personal, family, social, educational, occupational, or other important areas of functioning.\"",
          "Key features include: (1) Repetitive sexual activities become a central focus of your life, (2) Numerous unsuccessful efforts to reduce or control the behavior, (3) Continued behavior despite harmful consequences, (4) Distress or impairment in important areas of functioning.",
          "Research indicates that approximately 3-6% of the general population meets criteria for CSBD. That means millions of people struggle with this. You are not alone. You are not uniquely broken.",
          "Important: CSBD is a clinical condition, not a moral failure or a character flaw. It's a recognized impulse control disorder that responds to treatment."
        ]
      },
      {
        id: "addiction-cycle",
        title: "The Addiction Cycle",
        content: [
          "CSBD follows a predictable, repeating cycle. Understanding this cycle is the first critical step toward interrupting it.",
          "STAGE 1 - PREOCCUPATION: Your mind becomes increasingly focused on sexual thoughts, fantasies, or planning. This includes obsessive thoughts, mental planning, feeling \"zoned out\" or in a trance-like state, difficulty concentrating on other tasks, and increasing anxiety or restlessness.",
          "STAGE 2 - RITUALIZATION: This is the bridge between thinking and doing. These are preparatory steps that lead directly to acting out: opening browsers in private mode, checking for privacy, arranging schedules to create opportunity, \"just checking\" certain websites. For most men, once ritualization begins, the behavior becomes extremely difficult to stop.",
          "STAGE 3 - ACTING OUT: The sexual behavior itself. What it feels like in the moment: temporary relief from anxiety, brief pleasure, numbness or escape from difficult emotions, tunnel vision where consequences disappear, time distortion (hours feel like minutes).",
          "STAGE 4 - DESPAIR: After acting out, reality crashes back in. Intense shame, guilt about broken promises, fear of being discovered, promises to \"never do it again,\" feeling hopeless about change, isolation and hiding.",
          "The cruel trap: Despair creates the exact emotions (shame, anxiety, hopelessness) that trigger the next cycle. You feel terrible, so you need escape, so you return to the very behavior that made you feel terrible."
        ]
      },
      {
        id: "what-this-is-not",
        title: "Understanding What This Is NOT",
        content: [
          "CSBD is NOT simply having a high sex drive. Having frequent sexual desire is normal. CSBD is about loss of control and negative consequences, not frequency alone.",
          "CSBD is NOT enjoying sex or masturbation. Healthy sexuality includes pleasure. The issue is compulsion, not enjoyment.",
          "CSBD is NOT having sexual thoughts or fantasies. Sexual thoughts are normal and healthy. CSBD involves obsessive, intrusive thoughts that interfere with functioning.",
          "CSBD is NOT being interested in pornography. Many people view pornography without problems. CSBD involves compulsive use despite harm.",
          "CSBD IS: Loss of control over sexual behavior despite repeated attempts to stop. Continued behavior despite significant negative consequences. Using sex as the primary coping mechanism for uncomfortable emotions. Significant distress or life impairment."
        ]
      },
      {
        id: "healthy-vs-csbd",
        title: "How CSBD Differs from Healthy Sexuality",
        content: [
          "Healthy Sexuality: Enhances life and relationships | CSBD: Damages life and relationships",
          "Healthy Sexuality: Rooted in choice and mutual consent | CSBD: Rooted in compulsion and urge",
          "Healthy Sexuality: Connected to personal values | CSBD: Conflicts with personal values",
          "Healthy Sexuality: Enhances intimacy and connection | CSBD: Substitutes for or avoids intimacy",
          "Healthy Sexuality: Integrated with other areas of life | CSBD: Separate, hidden, or compartmentalized",
          "Healthy Sexuality: Brings genuine satisfaction | CSBD: Brings temporary relief followed by shame"
        ]
      },
      {
        id: "brain-science",
        title: "The Brain Science: Why This Happens",
        content: [
          "You're not weak-willed. You're not morally deficient. Your brain has formed powerful neural pathways that make this behavior feel automatic and nearly impossible to resist.",
          "PREFRONTAL CORTEX (The Brake): Handles executive function, impulse control, and consequence evaluation. In CSBD, it has weakened ability to override urges and gets bypassed when you're triggered.",
          "LIMBIC SYSTEM (The Gas Pedal): Handles reward, motivation, and emotional responses. In CSBD, it becomes hypersensitive to sexual cues, floods the system with \"GO\" signals, and creates powerful urges that feel life-or-death urgent.",
          "THE RESULT: When triggered, your gas pedal is flooring it while your brake is weak. This is why willpower alone doesn't work. You need strategies that work WITH your brain, not against it."
        ]
      },
      {
        id: "shame-vs-guilt",
        title: "The Role of Shame vs. Guilt",
        content: [
          "GUILT says: \"I did something bad.\" It focuses on behavior. It motivates repair and change. It can be resolved through making amends and changing behavior.",
          "SHAME says: \"I am bad.\" It focuses on identity. It paralyzes and perpetuates cycles. It leads to hiding and isolation.",
          "Shame doesn't motivate change — it fuels the cycle. When you feel fundamentally broken, you hide. When you hide, you disconnect. When you disconnect, you need escape. When you need escape, you act out. When you act out, you feel more shame.",
          "This program will help you move from shame to accountability — taking responsibility for behavior without attacking your worth as a person."
        ]
      }
    ],
    reflectionQuestions: [
      {
        id: "q1",
        question: "Why is sexual integrity important to me right now? What has brought me to this point?"
      },
      {
        id: "q2",
        question: "What has my behavior cost me (emotionally, relationally, spiritually, professionally)?"
      },
      {
        id: "q3",
        question: "What fears or doubts do I have about changing? What am I afraid of losing?"
      },
      {
        id: "q4",
        question: "If nothing changes, what will my life look like in 5 years? What will staying the same cost me?"
      }
    ],
    exercises: [
      {
        id: "my-story",
        title: "My Story in Brief",
        instructions: "Write a brief summary of your story. When did problematic sexual behavior begin? What patterns have you noticed? What have you tried before? Be honest — this is for you.",
        fields: [
          {
            id: "story",
            label: "My Story",
            type: "textarea",
            placeholder: "Write your story here..."
          }
        ]
      },
      {
        id: "sexual-integrity-definition",
        title: "What Does Sexual Integrity Mean to Me?",
        instructions: "Before we define sexual integrity for you, we want to know what it means to YOU. Don't worry about getting it \"right\" — this is your starting point.",
        fields: [
          {
            id: "definition",
            label: "To me, sexual integrity means...",
            type: "textarea",
            placeholder: "Write your definition..."
          }
        ]
      }
    ],
    homeworkChecklist: [
      "Read all Week 1 material",
      "Complete \"My Story in Brief\" exercise",
      "Complete all 4 reflection questions",
      "Define what sexual integrity means to you",
      "Begin daily self-monitoring (use Daily Check-In)",
      "Identify one person you could potentially talk to about your struggle"
    ]
  }
};

export const WEEK_TITLES: Record<number, string> = {
  1: "Welcome & Understanding CSBD",
  2: "Understanding Your Cycle & Triggers",
  3: "Cognitive Restructuring",
  4: "Self-Regulation & Impulse Management",
  5: "Understanding Shame & Guilt",
  6: "Relationships, Attachment & Intimacy",
  7: "Problem-Solving & Communication",
  8: "Relapse Prevention - Part 1",
  9: "Introduction to ACT & Psychological Flexibility",
  10: "Cognitive Defusion",
  11: "Values Clarification",
  12: "Acceptance & Mindfulness",
  13: "Committed Action",
  14: "Self-as-Context & Identity",
  15: "Comprehensive Relapse Prevention",
  16: "Integration & Moving Forward"
};

export const PHASE_INFO: Record<1 | 2, { name: string; weeks: number[]; description: string }> = {
  1: {
    name: "Foundation & Stabilization",
    weeks: [1, 2, 3, 4, 5, 6, 7, 8],
    description: "Building the foundation: understanding CSBD, identifying patterns, learning CBT skills for behavior change."
  },
  2: {
    name: "Integration & Values",
    weeks: [9, 10, 11, 12, 13, 14, 15, 16],
    description: "Building the life: ACT principles, values clarification, committed action, and sustainable recovery."
  }
};
