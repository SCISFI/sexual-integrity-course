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
  exercises: (Exercise | null)[];
  homeworkChecklist: string[];
}

export const WEEK_CONTENT: Record<number, WeekContent> = {
  1: {
    weekNumber: 1,
    title: "The Moment You Stop Pretending",
    phase: 1,
    phaseName: "Foundation & Stabilization",
    overview: "This week is about honesty. Not the dramatic kind — the quiet kind. Naming what brought you here, understanding the cycle that's been running you, and deciding whether you're willing to do something different — not just for yourself.",
    teaching: [
      {
        id: "if-youre-here",
        title: "If You're Here, It's Probably Because Something Broke",
        content: [
          "Maybe she found something. Maybe you finally told her. Maybe the look on her face is still with you — and you don't know how to un-see it.",
          "You're not here because you woke up one day and decided to do some self-improvement. You're here because something happened. Something real. And someone you love is living with the fallout right now.",
          "You may be successful. Disciplined. Respected. High-functioning. And still stuck. If your professional life is built on discipline and control — but this area is not — that contradiction deserves attention. Not judgment. Attention.",
          "You've probably promised yourself you would stop — and didn't. You've cleared browser history. You've minimized what happened. You've thought, \"This is the last time.\" None of that worked. Because this isn't about intelligence or willpower. It's about a cycle. And cycles don't break with promises. They break with understanding and interruption.",
          "Compulsive Sexual Behavior Disorder (CSBD) is recognized in the ICD-11 as an impulse control disorder. Approximately 3–6% of the general population meets the criteria — tens of millions of people. You are not alone. You are not uniquely broken. And this is not a moral failure. It's a clinical condition that responds to structured intervention.",
          "This program doesn't just work on you. It works on what you broke — and whether it can be rebuilt. That's the weight of this. You should feel it. But you should also know: every person who has walked this path started exactly where you are right now."
        ]
      },
      {
        id: "the-cycle",
        title: "The Cycle That Is Running You",
        content: [
          "Problematic sexual behavior follows a predictable, repeating pattern. Here's the key insight: seeing the cycle IS the first intervention. The moment you can name what's happening, you've already created space between the urge and the action.",
          "STAGE 1 — PREOCCUPATION: Mental drift. Planning. Fantasy. Obsessive focus. Increasing anxiety or restlessness. You may not even realize you've entered this stage — it often begins subtly, like background noise that gradually gets louder.",
          "STAGE 2 — RITUALIZATION: Private mode. Creating opportunity. Justifying \"just checking.\" This is the bridge between thinking and doing — and this is where momentum builds. For most men, once ritualization begins, the behavior becomes extremely difficult to stop. The anticipation becomes part of the high.",
          "STAGE 3 — ACTING OUT: Temporary relief. Numbing. Escape. Tunnel vision. Time distortion. Notably, the relief is almost never as satisfying as the anticipation promised.",
          "STAGE 4 — DESPAIR: Shame. Self-attack. Promises. Fear of exposure. Isolation.",
          "Here is the trap: Despair creates the emotional state that fuels the next preoccupation. You feel shame → you disconnect → you feel alone → you seek relief → you repeat. The behavior is not random. It is patterned. And what is patterned can be interrupted."
        ]
      },
      {
        id: "the-hidden-driver",
        title: "The Hidden Driver: Isolation",
        content: [
          "Most acting out happens alone. Most shame is carried alone. Most escalation happens in secrecy.",
          "Discovery didn't create the problem. Discovery exposed it. Your behavior has always lived in relationship — even when it was secret. The hiding, the compartmentalizing, the double life — that was never just about you. Someone else was living in the gap between who you appeared to be and who you actually were.",
          "This program is not just about stopping behavior. It is about increasing connection density. Integrity does not grow in isolation. It grows in exposure.",
          "If nothing changes except your behavior, relapse is likely. If your relational world changes, your patterns weaken. Over the coming weeks, you will learn how to increase relational exposure, build emotional literacy, strengthen meaningful bonds, and increase accountability density.",
          "We are not just reducing behavior. We are reducing loneliness. That distinction changes everything about how recovery works.",
          "The men who succeed in this program are not the ones with the most willpower. They are the ones who let themselves be known."
        ]
      },
      {
        id: "what-this-is",
        title: "What This Is (And What It Is Not)",
        content: [
          "This is not about having a high sex drive. This is not about sexual thoughts. This is not about enjoying sex. This program is pro-freedom, not anti-sex.",
          "This is about: loss of control, secrecy, escalation, continued behavior despite cost, and using sex as the primary way to manage uncomfortable emotions.",
          "If your behavior is hidden, escalating, and costing you something — it deserves attention. Not judgment. Attention.",
          "The clearest way to see the difference: Healthy sexuality is integrated, chosen, and relational. Compulsive sexuality is isolated, compulsive, and secret. One builds trust. The other erodes it.",
          "The goal is not to eliminate your sexuality. The goal is to free you from compulsive patterns so you can experience sexuality that is genuinely chosen, genuinely connecting, and genuinely satisfying.",
          "Recovery isn't about becoming someone who doesn't have sexual desires. It's about becoming someone whose sexual choices align with their values and enhance their life — and their relationships."
        ]
      },
      {
        id: "why-willpower-fails",
        title: "Why Willpower Hasn't Worked",
        content: [
          "You are not weak. Your brain has formed reinforcement pathways that make this behavior feel automatic and nearly impossible to resist.",
          "When triggered: your limbic system (the \"gas pedal\") floods urgency, while your prefrontal cortex (the \"brake\") gets bypassed. That is why \"I know better\" has never been enough.",
          "Dopamine — the brain's \"wanting\" chemical — doesn't just create pleasure. It creates anticipation and craving. In CSBD, the dopamine system has been trained to release massive amounts in response to sexual cues. Over time, the brain needs more stimulation for the same response, driving escalation.",
          "Research shows that chronic compulsive behavior actually reduces prefrontal cortex activity — literally weakening your brake pedal. When triggered, your gas pedal is flooring it while your brake is weak.",
          "Recovery is not white-knuckling. It is retraining. You need strategies that work WITH your brain, not against it.",
          "The hope — neuroplasticity: The same brain plasticity that created these pathways can rewire them. Every time you choose a different response to a trigger, you strengthen new neural pathways and weaken old ones. The urges become less intense. The brake gets stronger. Recovery is not just a metaphor — it's a measurable, biological reality."
        ]
      },
      {
        id: "shame-vs-accountability",
        title: "Shame vs. Accountability",
        content: [
          "Guilt says: \"I did something wrong.\" Shame says: \"I am something wrong.\"",
          "Shame fuels secrecy. Secrecy fuels isolation. Isolation fuels the cycle. This is why shame is not motivation — it is fuel for the very behavior you're trying to stop.",
          "Here is the difference in practice. Shame: \"I'm a disgusting person.\" Accountability: \"I engaged in behavior that doesn't reflect my values, and I'm taking steps to change.\" Shame: \"No one could love me if they knew.\" Accountability: \"I've been hiding parts of my life, and I'm choosing to be more honest.\" Shame: \"I'll never change — this is just who I am.\" Accountability: \"Change is hard, but my past doesn't determine my future.\"",
          "This program will move you from shame to accountability. Accountability says: \"I am responsible for my behavior. I am not my behavior.\" That distinction is critical.",
          "Most men do not fail recovery because they relapse. They fail because they return to secrecy. You are here. That already breaks secrecy.",
          "You've started to see the cycle. You've named the isolation. But your brain has formed powerful reinforcement pathways that operate beneath your awareness. Next week, we map the exact cycle you run on autopilot — and show you where your exit ramps are."
        ]
      }
    ],
    reflectionQuestions: [
      {
        id: "q1",
        question: "What brought you here? What was the moment — the conversation, the discovery, the look — that made this real?"
      },
      {
        id: "q2",
        question: "Which stage of the cycle do you most recognize in yourself? Describe your personal version of each stage."
      },
      {
        id: "q3",
        question: "What part of you benefits from staying the same? What does isolation protect you from?"
      },
      {
        id: "q4",
        question: "What has this pattern cost you — and the people closest to you? Be specific about the relational damage, not just the personal cost."
      },
      {
        id: "q5",
        question: "How does understanding that this is a brain pattern — not a character flaw — change how you see yourself?"
      },
      {
        id: "q6",
        question: "If nothing changes, where will you be in five years? If everything changes, who would you have to become?"
      }
    ],
    exercises: [
      {
        id: "my-story",
        title: "My Story in Brief",
        instructions: "Be specific. Patterns hide in vagueness. This is for you — no one else needs to see it unless you choose to share. The act of writing it down is itself a step out of hiding.",
        fields: [
          {
            id: "when-it-began",
            label: "When did this begin? What were you feeling at that time?",
            type: "textarea",
            placeholder: "Describe when and how it started..."
          },
          {
            id: "patterns-noticed",
            label: "What patterns have you noticed over time? How has the behavior changed or escalated?",
            type: "textarea",
            placeholder: "Describe the patterns you've observed..."
          },
          {
            id: "what-tried",
            label: "What have you tried before? Where did you return to secrecy?",
            type: "textarea",
            placeholder: "Describe previous attempts at change..."
          },
          {
            id: "relational-impact",
            label: "How has this affected the people closest to you? What do you imagine your partner is feeling right now?",
            type: "textarea",
            placeholder: "Describe the relational impact honestly..."
          }
        ]
      },
      null,
      {
        id: "connection-inventory",
        title: "Connection Inventory",
        instructions: "Isolation is the hidden driver. This exercise helps you see your current connection landscape honestly — not to force action, but to surface awareness.",
        fields: [
          {
            id: "who-knows",
            label: "Who in your life knows about your struggle? (If no one, write \"no one\" — that's important information.)",
            type: "textarea",
            placeholder: "List the people who know, if any..."
          },
          {
            id: "who-hiding-from",
            label: "Who are you spending the most energy hiding this from? What would they think if they knew?",
            type: "textarea",
            placeholder: "Describe who you're hiding from and what you fear..."
          },
          {
            id: "barrier-to-connection",
            label: "What would have to be true for you to let one person in? What's the barrier?",
            type: "textarea",
            placeholder: "Identify what stands between you and honesty..."
          }
        ]
      },
      null,
      null,
      {
        id: "your-commitment",
        title: "Your Commitment",
        instructions: "This is not symbolic. This is the first behavioral intervention. Writing a commitment creates accountability — even if no one else reads it.",
        fields: [
          {
            id: "commitment-statement",
            label: "In your own words, write your commitment to this process. You can use this as a starting point: \"I am here because something needs to change. Not just for me — for the people I've hurt by staying hidden. I am willing to be honest, even when it's hard.\"",
            type: "textarea",
            placeholder: "Write your commitment in your own words..."
          },
          {
            id: "one-thing-different",
            label: "What is one specific thing you will do differently this week?",
            type: "textarea",
            placeholder: "Name one concrete action..."
          }
        ]
      }
    ],
    homeworkChecklist: [
      "Read all Week 1 material",
      "Complete \"My Story in Brief\" exercise",
      "Complete all 6 reflection questions",
      "Complete \"Connection Inventory\" exercise",
      "Write your commitment statement",
      "Begin daily self-monitoring (use Daily Check-In)"
    ]
  },

  2: {
    weekNumber: 2,
    title: "Nothing About This Is Random",
    phase: 1,
    phaseName: "Foundation & Stabilization",
    overview: "The cycle doesn't care how smart you are. It runs the same way on successful men as it does on everyone else. This week, you stop watching it from a distance and start mapping it precisely — your triggers, your rituals, your permission slips, your exit ramps. A cycle you can see is a cycle you can interrupt.",
    teaching: [
      {
        id: "not-random",
        title: "The Lie You've Been Telling Yourself",
        content: [
          "\"It just happened.\" \"I wasn't thinking.\" \"I don't know why I do it.\" These aren't lies you tell other people. They're lies you tell yourself — and they're costing you.",
          "Here's what's actually true: there is a sequence. There has always been a sequence. Every single time. You've been living that sequence on autopilot, which is why it feels spontaneous. It isn't.",
          "Think about the last time. Not the acting out itself — the hours before it. You were feeling something. You went somewhere, opened something, started something small. You told yourself something. There was a chain of events. There always is.",
          "This matters because chains can be broken. But only if you can see them. A behavior that 'just happens' cannot be interrupted. A behavior that follows a predictable sequence — with identifiable steps and decision points — can be stopped at any one of them.",
          "This week, you build the map. Not a generic map. Yours."
        ]
      },
      {
        id: "trigger-types",
        title: "What Pulls the Trigger",
        content: [
          "A trigger is whatever starts the chain — not the behavior itself, but the first link. The thing that moves you from baseline to preoccupied. It's rarely dramatic. Most of the time it's completely ordinary.",
          "EMOTIONAL TRIGGERS: Loneliness is probably the most common. Not always the sharp kind — sometimes the quiet kind. You're surrounded by people and still feel like no one actually knows you. Stress. Anger you haven't processed. Boredom — which is often low-grade depression in disguise. And here's one that surprises most men: celebration. Success. Relief. Positive emotion can trigger the cycle just as reliably as negative emotion, because the brain has learned to pair reward with this behavior.",
          "ENVIRONMENTAL TRIGGERS: Hotel rooms. Being home alone after everyone goes to bed. A specific time of day — often late at night, after the house is quiet. A certain device in a certain location. The loss of structure that weekends bring. Travel. Most men can list their environmental triggers in under two minutes — because they've encountered them hundreds of times without naming them.",
          "RELATIONAL TRIGGERS: An argument with your partner. Feeling dismissed or criticized. Going to bed in silence. The slow erosion of a week where every conversation was surface-level. Feeling rejected — whether or not the rejection was real. Disconnection in your primary relationship is one of the most consistent precursors to relapse in this population.",
          "PHYSICAL TRIGGERS: Fatigue is underestimated. When you're exhausted, your prefrontal cortex — the part of your brain responsible for impulse control — is running at reduced capacity. Poor sleep is particularly dangerous: after a bad night, urge intensity measurably increases and resistance measurably decreases. Hunger. Illness. Physical tension with no outlet.",
          "Your triggers are specific. This week, you write them down — not a list of categories, but a list of actual moments, situations, and states that you know from your own experience start the cycle."
        ]
      },
      {
        id: "halt-states",
        title: "Your Vulnerability Window",
        content: [
          "HALT-BS isn't a slogan. It's a clinical observation: when you're in any of these six states, your neurological resistance to urges drops significantly. These aren't excuses. They're intelligence.",
          "HUNGRY: Physical hunger is one layer. But 'hungry' in this context also means any unmet need — connection, meaning, rest, validation. The men most at risk are often not physically hungry. They're starving for something they can't name.",
          "ANGRY: Anger that hasn't been expressed or processed doesn't disappear — it becomes pressure. The behavior becomes a pressure valve. You're not acting out because you want to. You're acting out because sitting with unprocessed anger feels impossible and this has always provided relief.",
          "LONELY: We said it last week. We'll say it again: isolation is the engine of this behavior. The cycle requires secrecy. It feeds on disconnection. Loneliness — including the loneliness of being physically surrounded by people who don't actually know you — is not just a trigger. It's the climate this behavior needs to survive.",
          "TIRED: Sleep deprivation impairs the prefrontal cortex the same way alcohol does. You wouldn't make a major decision drunk. Exhausted men are making relapse decisions with equivalent impairment — and almost never recognizing it.",
          "BORED: An unstimulated mind looks for stimulation. Boredom is rarely just boredom — it's often a signal that something important is missing: purpose, engagement, connection, meaning. Men who are invested in their lives — their work, their relationships, their growth — are less bored. That's not coincidence.",
          "STRESSED: Cortisol — the primary stress hormone — directly activates the brain's reward-seeking systems. Under stress, the brain does not reason toward healthy choices. It seeks relief. You've trained it to find relief in one specific place. Under stress, that training intensifies.",
          "Check in on HALT-BS daily this week. Not as a ritual — as intelligence gathering. You are learning the conditions under which your cycle becomes most dangerous."
        ]
      },
      {
        id: "ritual-mapping",
        title: "The Ritual You Don't Think of as a Ritual",
        content: [
          "Most men can identify their triggers. Fewer can identify their rituals. This is where the cycle becomes nearly unstoppable — and where you need the most precision.",
          "Ritualization is the bridge between preoccupation and acting out. It's the sequence of small behaviors that create opportunity and build momentum. Opening a specific browser. Picking up the phone after everyone's asleep. Telling yourself 'I'm just going to check.' Closing the door. Deleting the history before you've even started. These feel unremarkable in the moment. They are not.",
          "Here's why rituals matter: by the time ritualization is moving, your brain has already flooded with anticipatory dopamine. The decision, neurologically, has already been made. You're not choosing at that point. You're executing a program that started several steps ago.",
          "Your rituals are specific, repeatable, and recognizable — if you're looking for them. Most men haven't been looking. They've been experiencing the ritual as 'it just happened.' But replay any incident carefully and the ritual is there. It always is.",
          "Map your ritual this week. Every step you can remember. The earlier in the sequence you can recognize where you are, the more effectively you can interrupt it. Interrupting the ritual at step one is possible. Interrupting it at step seven — when the window is open, the door is locked, and the anticipation is at its peak — is nearly impossible.",
          "The ritual is not the problem. The ritual is the map."
        ]
      },
      {
        id: "permission-thoughts",
        title: "The Permission Slip",
        content: [
          "Before every incident, your mind does something specific: it generates a thought that makes continuing feel acceptable. This is not random. This is not weakness. This is the cycle's internal lawyer — and it is very good at its job.",
          "'I've had a hard week. I deserve this.' 'Just this once, then I'll stop for good.' 'No one's going to know.' 'I've already started — might as well finish.' 'This doesn't count because...' 'I'll deal with it tomorrow.' 'She's been distant anyway.'",
          "These thoughts don't feel like permission slips when you're inside them. They feel like facts. They feel like relief. They feel reasonable. That's the design. The permission slip isn't supposed to look like a permission slip — it's supposed to feel like a conclusion you arrived at honestly.",
          "Here's what's actually happening: the cycle is generating the thought to justify what it has already started moving toward. You're not deciding to act out and then rationalizing it. The rationalization is part of the cycle — it comes up automatically, precisely when you need a reason to stop, and gives you a reason not to.",
          "Learning to recognize your specific permission-giving thoughts — the exact language your mind uses — is one of the highest-leverage skills in this program. Because the moment you can see a thought as a thought rather than a fact, you've created a gap. And gaps are where choices live.",
          "Write yours down this week. Use your actual language — not generic examples. The more precisely you can name your permission slip, the less power it has."
        ]
      },
      {
        id: "exit-ramps",
        title: "Your Exit Ramps",
        content: [
          "Here is the most important thing you will take from this week: you have exit ramps. More than you think. But they disappear as the cycle progresses.",
          "AT PREOCCUPATION: The exit ramp is wide. You can redirect attention. You can reach out to someone. You can change your environment — leave the room, leave the house. You can do a HALT-BS check and address whatever underlying state is driving the vulnerability. The urge has momentum, but it isn't overwhelming yet. This is the easiest point to stop — and the point most men don't recognize they've reached.",
          "AT RITUALIZATION: The ramp is narrowing. It's still there, but using it requires deliberate, effortful disruption — not a small course correction. Calling someone, leaving the physical environment, doing something physiologically disruptive — exercise, cold water, hard physical movement — can work here. But passive resistance, just trying not to while staying in the same room with the same device, almost never works at this stage. The brain needs a pattern interrupt, not willpower.",
          "AT ACTING OUT: There is no meaningful exit ramp. The brain has committed. The neurological decision was made several steps ago. Attempting to stop here is possible but the psychological cost is high and the success rate is low. This is not a character failure. This is what happens when a pattern that has been reinforced hundreds of times reaches its destination.",
          "This is why your goal for this week is not 'resist acting out.' Your goal is to learn to recognize preoccupation — the familiar drift, the restlessness, the beginning of planning — and to intervene there, before momentum builds.",
          "The more precisely you map your cycle, the earlier you'll see it coming. And the earlier you see it, the more exit ramps you have. That is the math of recovery."
        ]
      }
    ],
    reflectionQuestions: [
      {
        id: "q1",
        question: "Walk back through the last time you acted out. Start 24 hours before. What were you feeling? Where were you, and what were you doing in the hours leading up to it? What told you something was building — and did you notice it at the time? Map the sequence as precisely as you can."
      },
      {
        id: "q2",
        question: "What are your two or three most consistent triggers — the states or situations that most reliably start your cycle? How long have you known this about yourself without naming it out loud?"
      },
      {
        id: "q3",
        question: "Write down the exact language your mind uses to give you permission. Not the generic examples from the reading — your actual words. What does your internal lawyer say?"
      },
      {
        id: "q4",
        question: "Where in your cycle is your earliest realistic exit ramp? What would you have to do to take it — and what would you have to be willing to feel in that moment instead of continuing?"
      }
    ],
    exercises: [
      {
        id: "trigger-inventory",
        title: "Personal Trigger Inventory",
        instructions: "Name your specific triggers in each category. Not the category definitions — your actual triggers. The more specific you are, the more useful this map becomes. Generic answers protect the cycle. Specific answers interrupt it.",
        fields: [
          {
            id: "emotional",
            label: "Emotional Triggers — the internal states that reliably start your cycle",
            type: "textarea",
            placeholder: "Be specific: what feelings, not just categories..."
          },
          {
            id: "environmental",
            label: "Environmental Triggers — specific places, times, situations, and access points",
            type: "textarea",
            placeholder: "Be specific: what locations, times of day, devices, situations..."
          },
          {
            id: "relational",
            label: "Relational Triggers — specific relationship dynamics that activate vulnerability",
            type: "textarea",
            placeholder: "Be specific: what interactions, conflicts, or disconnections..."
          },
          {
            id: "physical",
            label: "Physical Triggers — body states that lower your resistance",
            type: "textarea",
            placeholder: "Be specific: what physical conditions make you most vulnerable..."
          }
        ]
      },
      {
        id: "cycle-map",
        title: "Your Cycle Map",
        instructions: "Map your personal version of each stage. Use a real incident as your reference point — not a hypothetical. Write what actually happens for you, not what the cycle is supposed to look like. The more honest and specific you are, the more useful this becomes.",
        fields: [
          {
            id: "preoccupation",
            label: "Preoccupation: What does it feel like when you first enter this stage? What are the early signs — the mental drift, the restlessness, the beginning of planning?",
            type: "textarea",
            placeholder: "What does preoccupation actually look like and feel like for you..."
          },
          {
            id: "ritualization",
            label: "Ritualization: What are your specific steps? Walk through the sequence — every small behavior that creates opportunity and builds momentum toward acting out.",
            type: "textarea",
            placeholder: "List your actual ritual steps in sequence..."
          },
          {
            id: "acting-out",
            label: "Acting Out: What specifically constitutes acting out for you? Be honest — this is the behavior you're here to change.",
            type: "textarea",
            placeholder: "Describe specifically what acting out means for you..."
          },
          {
            id: "despair",
            label: "Despair: What do you feel and think immediately after? How long does it last — and how does it set up the next cycle?",
            type: "textarea",
            placeholder: "Describe what happens in you after acting out..."
          }
        ]
      },
      {
        id: "permission-thoughts",
        title: "Your Permission Slips",
        instructions: "Write down the specific thoughts your mind generates to justify continuing. Use your actual language — the words you actually use with yourself, not cleaned-up versions. These thoughts are the cycle's last line of defense. Naming them precisely is how you begin to dismantle them.",
        fields: [
          {
            id: "thoughts",
            label: "What does your internal voice say? List every permission-giving thought you recognize — even the ones that still feel somewhat reasonable.",
            type: "textarea",
            placeholder: "Write your actual permission-giving thoughts..."
          }
        ]
      }
    ],
    homeworkChecklist: [
      "Read all Week 2 material",
      "Complete the Personal Trigger Inventory — use specific language, not categories",
      "Complete your Cycle Map using a real incident as your reference point",
      "Write your permission-giving thoughts in your own words",
      "Do a HALT-BS check at least twice daily — morning and evening",
      "When you notice preoccupation this week, write down what triggered it and when you noticed it",
      "Complete daily check-ins for all 7 days"
    ]
  },

  3: {
    weekNumber: 3,
    title: "Your Mind Is Not Telling You the Truth",
    phase: 1,
    phaseName: "Foundation & Stabilization",
    overview: "You know when you're triggered. You know your cycle. But there's something happening in the space between trigger and choice that you may never have looked at directly — a voice that runs automatically, faster than conscious thought, generating conclusions that feel like facts. This week, you examine that voice. And you learn what to do with it.",
    teaching: [
      {
        id: "the-gap",
        title: "The Ten Seconds Between Trigger and Choice",
        content: [
          "Last week you mapped your triggers. You identified the states that make you vulnerable and the situations that start the chain. But here's what most men discover when they look closely: the trigger and the acting out are not directly connected. There is a gap between them.",
          "In that gap, something happens. Fast — often faster than you can consciously track. Your brain generates a thought. Not a random thought. A specific thought, shaped by years of reinforcement, that moves you from triggered to committed. That thought is the subject of this week.",
          "The sequence works like this: Trigger → Automatic Thought → Emotion → Behavior. Same trigger, different thought, completely different outcome. This is the fundamental insight of cognitive behavioral therapy — and the most practically useful thing you will learn in Phase 1.",
          "The goal is not to think positively. The goal is not to suppress thoughts. The goal is to think accurately — to catch the thought that is running you and ask whether it is actually true. Most of the time, it is not."
        ]
      },
      {
        id: "automatic-thoughts",
        title: "What Your Brain Does Without Permission",
        content: [
          "Automatic thoughts are not chosen. They arise involuntarily, in milliseconds, in response to situations. You didn't decide to have them. They feel like facts because they arrive with the authority of facts — but they're interpretations. And interpretations can be wrong.",
          "Your brain has been running the same interpretive software for years, possibly decades. It has learned, through repetition, to generate specific thoughts in response to specific triggers. Those thoughts have become so automatic that most men don't experience them as thoughts at all. They experience them as reality.",
          "'I need this.' That doesn't feel like a thought. It feels like a statement of fact about your internal state. 'I can't handle this.' That doesn't feel like an interpretation. It feels like a report from the inside. 'No one will know.' That doesn't feel like a decision to deceive. It feels like a simple observation.",
          "None of these are facts. They are automatic thoughts — and they are the bridge between your trigger and your behavior. Learn to catch them, and you've found the single most powerful intervention point in your entire cycle."
        ]
      },
      {
        id: "cognitive-distortions",
        title: "The Distortions Running Your Mind",
        content: [
          "Automatic thoughts that fuel compulsive behavior follow recognizable patterns. These aren't character flaws — they're cognitive errors. And like all errors, they can be identified and corrected.",
          "ALL-OR-NOTHING THINKING: 'I've already looked — might as well go all the way.' 'I slipped once, so I've already failed this week.' 'If I can't be perfect at this, what's the point?' This thinking eliminates the middle ground where most recovery actually happens.",
          "MINIMIZATION: 'It's not that bad compared to what other men do.' 'No one is actually getting hurt.' 'This is small compared to my other problems.' Minimization is particularly dangerous because it sounds reasonable. It's the thought that keeps the cycle invisible.",
          "ENTITLEMENT: 'I work harder than most people — I deserve this.' 'After the week I've had, I've earned this.' 'She hasn't been available, so what am I supposed to do?' Entitlement converts a choice into a conclusion. It makes acting out feel not just acceptable but deserved.",
          "EMOTIONAL REASONING: 'I feel like I need this, so I must need it.' 'The urge feels irresistible, so it must be irresistible.' 'I feel hopeless about changing, so change must be impossible.' Emotions are real. They are not, however, reliable guides to what is true.",
          "FORTUNE-TELLING: 'I know I'm going to fail eventually — I always do.' 'This program won't work for me.' 'I'll never be able to stop.' Fortune-telling predicts the future based on the past and then uses that prediction to justify not trying.",
          "CATASTROPHIZING RECOVERY: 'If she finds out how bad this really is, she'll leave.' 'If I'm honest, everything will fall apart.' This thought keeps secrecy intact and makes change feel more dangerous than continuing. It is the cycle's most powerful self-protection mechanism."
        ]
      },
      {
        id: "challenging-thoughts",
        title: "The Challenge",
        content: [
          "Challenging a distorted thought is not the same as replacing it with a positive one. Positive thinking fails in high-urge moments because it doesn't hold up to internal scrutiny. What works is accuracy.",
          "When you catch an automatic thought, run it through four questions: What is the actual evidence for this thought? What evidence contradicts it? Am I confusing a feeling with a fact? What would I tell another man who had this exact thought?",
          "The goal is not a thought that feels better. The goal is a thought that is more true. 'I need this' becomes: 'I want this. I am not in danger. This urge is uncomfortable, not irresistible. I have tolerated discomfort before and I can tolerate it now.' That's not optimism. That's accuracy.",
          "'I've already failed this week' becomes: 'I looked at something I shouldn't have. That is one decision. It does not determine the rest of the day or the week. The next choice is still mine.' Again — not positive. Accurate.",
          "The challenge works because the brain's threat-response system responds to accurate information, not cheerful information. You are not trying to feel better. You are trying to see clearly. Those are different targets, and accuracy hits more reliably.",
          "This takes practice. The distortion is fast; the challenge is slower. But with repetition, the gap narrows. The challenge becomes faster. The distortion loses authority. That is the neurological reality of what you are doing when you practice this skill."
        ]
      },
      {
        id: "urge-surfing",
        title: "When the Wave Hits",
        content: [
          "An urge is not a command. It is a wave — it rises, peaks, and falls, regardless of whether you act on it. The average urge, left unfed, peaks within 15–20 minutes and subsides. You have tolerated urges before. You are doing it right now.",
          "Urge surfing is the practice of observing an urge without acting on it. Not fighting it. Not suppressing it. Observing it — the way you would observe weather from inside a building. It is real. It is outside you. It does not have to come in.",
          "When a strong urge hits: Stop moving. If you can, sit down. Notice where you feel it in your body — chest, stomach, jaw, hands. Give it a number: 1 to 10. Don't try to make it go away. Just describe it accurately to yourself.",
          "Then watch what happens. The number changes. It may go up first — that's normal. It will come down. Urges that are observed without being fed do not stay at their peak. The neuroscience is unambiguous on this: the wave breaks.",
          "What you are proving to your brain, every time you surf an urge, is that the urge is survivable. That the discomfort does not require relief. That you are capable of tolerating something your brain has been treating as an emergency. Each time you do this, the next urge is slightly less urgent. Not because the biology changes overnight — but because the evidence accumulates.",
          "You are not the urge. You are the one who can watch it and choose."
        ]
      },
      {
        id: "real-time-practice",
        title: "Using This When It Actually Matters",
        content: [
          "Everything in this week's material is useless unless you can access it in the moment — when you're triggered, when the automatic thought has already fired, when the urge is real and present and the cycle is moving.",
          "Here's the honest truth about cognitive restructuring: you will not remember to do it perfectly in high-urge moments. The distortion is fast and practiced. The challenge is new and slower. This is normal. The goal is not perfection — it's repetition.",
          "In low-intensity moments — before the cycle is moving — practice identifying your distortions. Use the exercises below. Get familiar with your specific patterns. The men who know their three or four most common distortions by name, who have written down the challenge for each one, are the men who can actually access this skill when the urge is at a seven.",
          "When the cycle is moving, one question is enough: Is this thought actually true? Not 'is this thought comfortable?' Not 'does this thought make me feel better?' Just: is it true? That single question, asked honestly, can create a gap. And gaps are where choices live.",
          "The urge surfing and thought challenging work together. The urge surfing buys you time. The thought challenging uses that time. Together, they make the cycle interruptible at a point where, before this week, it felt automatic."
        ]
      }
    ],
    reflectionQuestions: [
      {
        id: "q1",
        question: "Which two or three cognitive distortions do you recognize most clearly in yourself? Give a specific, real example of each — the actual thought your mind generates, not a generic version."
      },
      {
        id: "q2",
        question: "Think about a recent moment when you were close to acting out but didn't — or a moment when you did. What was the automatic thought? What did your mind tell you that made continuing feel justified or inevitable?"
      },
      {
        id: "q3",
        question: "Take your most powerful permission-giving thought from last week. Apply the four challenge questions to it. What does the more accurate version of that thought actually say?"
      },
      {
        id: "q4",
        question: "What do you believe, at a gut level, about your ability to change? Write that belief down. Then ask: is this a fact, or is it a thought that has been running long enough to feel like one?"
      }
    ],
    exercises: [
      {
        id: "distortion-identification",
        title: "Your Distortion Profile",
        instructions: "Name the automatic thoughts you actually use — not the generic examples from the reading, but your specific thoughts. For each one, identify which distortion type it is and write the more accurate version. This is your personal distortion map. The more precisely you know your patterns, the earlier you can catch them.",
        fields: [
          {
            id: "distortion1",
            label: "Distorted thought about yourself (e.g., about who you are or whether you can change) — write the thought, name the distortion, write the accurate version:",
            type: "textarea",
            placeholder: "Thought / Distortion type / More accurate version..."
          },
          {
            id: "distortion2",
            label: "Distorted thought you use to minimize or justify the behavior — write the thought, name the distortion, write the accurate version:",
            type: "textarea",
            placeholder: "Thought / Distortion type / More accurate version..."
          },
          {
            id: "distortion3",
            label: "Distorted thought that appears when an urge is strong — write the thought, name the distortion, write the accurate version:",
            type: "textarea",
            placeholder: "Thought / Distortion type / More accurate version..."
          }
        ]
      },
      {
        id: "thought-record",
        title: "Thought Record — A Real Incident",
        instructions: "Use a real situation from this week or recently — a moment when an urge was present or when you acted out. Work through it honestly. The goal is not to feel better about what happened. The goal is to see exactly what your mind was doing.",
        fields: [
          {
            id: "situation",
            label: "The situation: What happened? Where were you, what time was it, what had the day been like?",
            type: "textarea",
            placeholder: "Describe the situation specifically..."
          },
          {
            id: "automatic-thoughts",
            label: "Automatic thoughts: What went through your mind? Capture the actual words — especially the ones that gave permission.",
            type: "textarea",
            placeholder: "Write your actual automatic thoughts..."
          },
          {
            id: "emotions",
            label: "Emotions: What were you feeling before the thought? During? Rate the intensity of each (0–10).",
            type: "textarea",
            placeholder: "List emotions and intensity ratings..."
          },
          {
            id: "distortions",
            label: "Distortions: Which patterns do you recognize? Be specific.",
            type: "textarea",
            placeholder: "Name the distortions present..."
          },
          {
            id: "balanced-thought",
            label: "The accurate version: What would a more honest, evidence-based thought look like? (Not positive — accurate.)",
            type: "textarea",
            placeholder: "Write the more accurate thought..."
          },
          {
            id: "outcome",
            label: "What changed when you looked at it this way? What does this tell you about the next time?",
            type: "textarea",
            placeholder: "What shifted, and what does it mean going forward..."
          }
        ]
      },
      {
        id: "urge-surfing-practice",
        title: "Urge Surfing Log",
        instructions: "This week, when an urge arises, don't fight it and don't feed it. Observe it. Complete this log after the experience — even if you acted on the urge. What you're building here is awareness of the wave: how it feels, how it moves, and what actually happens when you don't immediately respond to it.",
        fields: [
          {
            id: "urge-description",
            label: "When did it occur? What triggered it? How intense was it at its peak (1–10)?",
            type: "textarea",
            placeholder: "Describe the urge and its context..."
          },
          {
            id: "physical-sensations",
            label: "Where did you feel it in your body? What physical sensations were present?",
            type: "textarea",
            placeholder: "Chest, stomach, jaw, hands — where and what did it feel like..."
          },
          {
            id: "observation",
            label: "What happened to the intensity as you observed it? Did it peak and fall? How long did the full wave last?",
            type: "textarea",
            placeholder: "Describe how the urge moved over time..."
          },
          {
            id: "learning",
            label: "What did this experience show you about the urge — specifically about whether it is actually irresistible?",
            type: "textarea",
            placeholder: "What did you learn about the nature of urges..."
          }
        ]
      }
    ],
    homeworkChecklist: [
      "Read all Week 3 material",
      "Complete your Distortion Profile — name your three specific patterns and write the accurate version of each",
      "Complete at least one full Thought Record using a real incident this week",
      "Practice urge surfing at least once and complete the log honestly — even if you acted on the urge",
      "This week, when an automatic thought fires, ask one question: Is this actually true?",
      "Complete daily check-ins for all 7 days"
    ]
  },

  4: {
    weekNumber: 4,
    title: "When the Urge Hits",
    phase: 1,
    phaseName: "Foundation & Stabilization",
    overview: "You know your triggers. You can name your thoughts. But when the urge actually arrives — in your body, in your chest, behind your eyes — knowing things doesn't help much. This week is about what you actually do in that moment. Not theory. Not insight. Action.",
    teaching: [
      {
        id: "self-regulation",
        title: "What's Actually Happening in Your Brain",
        content: [
          "When a strong urge hits, your prefrontal cortex — the part responsible for long-term thinking, values, and consequences — essentially goes offline. Your limbic system, the emotional and survival-driven center, takes over. This is not a character flaw. This is neuroscience.",
          "Neurobiologist Jill Bolte Taylor documented that the physiological spike of an emotion — the actual chemical surge — lasts about 90 seconds. After 90 seconds, if you don't feed the feeling with additional thought, it begins to dissipate. What keeps it alive is your attention.",
          "This means the goal in the first 90 seconds isn't to think your way out. It's to survive them without making a decision. If you can buy 90 seconds, you're back in the game. If you can buy 15 minutes, you're probably safe.",
          "The behavior you're trying to stop has been your primary nervous system regulator. Your brain learned early that this sequence reliably produced relief. That's the whole problem — it works, in the short term. Recovery is the process of teaching your nervous system a different path to relief."
        ]
      },
      {
        id: "coping-strategies",
        title: "The Window Between Urge and Action",
        content: [
          "Week 3 gave you the cognitive tools — thought records, distortion challenges, urge surfing. Those are your mid-range tools. They work when the urge is a 4 or 5 out of 10. This week is about what to do when it's an 8.",
          "At high-intensity urges, your thinking brain is impaired. You won't challenge a cognitive distortion when the urge is screaming. You need pre-decided, automatic responses that don't require much thought.",
          "OPPOSITE ACTION: Whatever the urge wants, do the opposite. Urge says close the door? Open it. Urge says pick up the phone? Put it in another room and walk out. Urge says stay in bed? Get up and put your shoes on. The specific opposite doesn't matter. The direction does.",
          "CHANGE YOUR PHYSIOLOGY: Your body is in an arousal state. Change it. Cold water on your face. Ten pushups. A brisk walk. Call someone. Your nervous system can't maintain a high-intensity urge state if you actively disrupt the physiology driving it.",
          "GROUNDING: When you're flooded, bring yourself back to the present sensory environment. Name five things you can see. Four you can hear. Three you can touch. Two you can smell. One you can taste. This is not a gimmick — it interrupts rumination by forcing your attention into the present moment where the imagined reward does not exist."
        ]
      },
      {
        id: "delay-strategies",
        title: "The 15-Minute Protocol",
        content: [
          "You are not making a lifetime commitment right now. You're making a 15-minute commitment. That's it. When the urge hits, commit to one thing: you will not act on this urge for 15 minutes.",
          "Set a timer. Tell someone. Change your physical location. The 15 minutes is not about willpower. It's about creating enough distance from the peak of the urge that your prefrontal cortex can come back online.",
          "Play the tape all the way forward. Not to the moment of relief — your brain will do that automatically. Past it. To the 2 a.m. feeling afterward. To the conversation you'll have to have. To who you were trying to be when you started this program.",
          "Urges move in waves. They rise. They peak. They fall. Every urge you have ever had in your life has eventually passed — whether you acted on it or not. The wave breaks whether you feed it or not. You just have to outlast the peak."
        ]
      },
      {
        id: "emotional-regulation",
        title: "The Emotion Under the Urge",
        content: [
          "Before you had this behavior, you had an emotional need that wasn't getting met. The behavior became the answer. Understanding this doesn't excuse the behavior — but it tells you what you're actually fighting.",
          "When an urge appears, there is almost always an emotion underneath it. Loneliness. Boredom. Anxiety. Anger. Shame. Rejection. The urge is the brain's solution to the emotion. Your job is to identify the actual emotion and address that instead.",
          "The four-step sequence: Name it — 'I'm feeling anxious.' Own it — 'This is a real feeling.' Sit with it — don't immediately reach for relief. Address it — what does the emotion actually need? Anxiety might need movement. Loneliness might need a phone call. Anger might need an honest conversation you've been avoiding.",
          "This takes practice. The default is still the old path. But every time you identify the emotion and address it directly, you are literally building new neural pathways. The old pathway weakens. The new one strengthens. Recovery is, in part, a neurological process."
        ]
      },
      {
        id: "environment-setup",
        title: "Your Environment Should Be Doing Half the Work",
        content: [
          "Willpower is a finite resource. It depletes. At the end of a long day, after a hard conversation, when you're tired and alone — your willpower reserves are low. This is when most slips happen. You cannot rely on willpower alone.",
          "Your environment should be working for you. Every barrier between you and the behavior buys you time. Every piece of accountability software is a reminder that someone else will see. Every device out of the bedroom is one fewer opportunity.",
          "Be ruthlessly honest about what your high-risk situations look like: time of day, physical location, emotional state, device proximity, level of isolation. Then engineer your environment to make those situations less dangerous. This is not weakness. It's strategy.",
          "Device management is non-negotiable. Covenant Eyes, Bark, Ever Accountable — pick one and use it. Charge your phone outside the bedroom. Remove browsers from your phone. These are not suggestions. Men who act out in this area almost universally do it late at night, alone, on a device in a private space. Change those variables."
        ]
      },
      {
        id: "technology-safety",
        title: "The Technology Problem Is Specific",
        content: [
          "This isn't a generic internet-safety conversation. Smartphones with private browser access are the primary access point for compulsive sexual behavior for most men in this program. That's the honest picture.",
          "If you have full private browser access on your phone with no accountability software, you have built a relapse into your weekly schedule. At some point, the right combination of emotions, isolation, and opportunity will line up. The behavior will happen. Not because you're weak — because the access makes it nearly inevitable.",
          "ACCOUNTABILITY SOFTWARE: This is not surveillance. It is support infrastructure. The knowledge that your browsing will be seen by someone you respect creates a pause where no pause existed before. That pause is where recovery happens. One person in your life should receive these reports.",
          "SOCIAL MEDIA HYGIENE: Unfollow, mute, or delete accounts that predictably lead you down the path. 'Just scrolling' is not innocent if you know where it ends. Your brain is not neutral — it's looking for the hit. Don't give it the opening.",
          "LOCATION-BASED RULES: Devices do not enter the bedroom. If that's where it happens, that's the rule. Hotels are high risk. Plan specifically for travel — request TV blocking, keep your accountability partner informed, schedule check-ins."
        ]
      },
      {
        id: "building-digital-structure",
        title: "Structure Replaces Decision-Making",
        content: [
          "The more you pre-decide, the less vulnerable you are in the moment. When you're already in a high-risk emotional state is not when you want to be making decisions about technology access and bedtime.",
          "MORNING: No devices for the first 30 minutes. Start with something that puts you in contact with your values — a brief reflection, prayer, physical movement, journaling. Set the tone before your day starts setting it for you.",
          "EVENING: Screens off at least an hour before bed. Phone charging in the kitchen or living room. This isn't just about preventing late-night slips — sleep quality matters directly to emotional regulation the following day.",
          "HIGH-RISK HOURS: You know what they are. For most men it's late night, early morning, or specific windows during the week when they're alone. Build accountability into those times. Tell someone. Have a plan. Don't leave yourself with open time and open access.",
          "TRAVEL: This is where men who are stable at home tend to slip. You're out of your routine, often alone in a hotel, with a TV and no accountability infrastructure. Plan it specifically. Request TV blocking. Check in with your accountability partner when you arrive and before bed."
        ]
      }
    ],
    reflectionQuestions: [
      {
        id: "q1",
        question: "What does a high-intensity urge feel like in your body? Where do you feel it? What are the physical sensations — and what is the earliest signal you can catch before it escalates?"
      },
      {
        id: "q2",
        question: "What emotion is most often underneath your urges? If you had to name the feeling the behavior is trying to solve, what is it?"
      },
      {
        id: "q3",
        question: "What environmental changes would most reduce your access and vulnerability? Be specific: devices, locations, times, people."
      },
      {
        id: "q4",
        question: "Who in your life could be your accountability person — someone who gets real reports, not just someone who knows you're 'trying to be better'?"
      }
    ],
    exercises: [
      {
        id: "coping-toolkit",
        title: "My Coping Strategy Toolkit",
        instructions: "Build your personal toolkit of coping strategies for different situations.",
        fields: [
          {
            id: "distraction",
            label: "Distraction Strategies: List 5 activities that genuinely engage your attention",
            type: "textarea",
            placeholder: "1. \n2. \n3. \n4. \n5."
          },
          {
            id: "opposite-action",
            label: "Opposite Actions: For each urge pattern, what is the opposite action you can take?",
            type: "textarea",
            placeholder: "Urge to isolate → \nUrge to use device → \nUrge to stay up late →"
          },
          {
            id: "grounding",
            label: "Grounding Techniques: Which grounding exercises work best for you?",
            type: "textarea",
            placeholder: "List your preferred grounding techniques..."
          },
          {
            id: "support-contacts",
            label: "Support Contacts: Who can you reach out to? List names and phone numbers.",
            type: "textarea",
            placeholder: "Name: [number]\nName: [number]"
          }
        ]
      },
      {
        id: "environmental-plan",
        title: "Environmental Restructuring Plan",
        instructions: "Plan specific changes you will make to your environment to reduce vulnerability.",
        fields: [
          {
            id: "device-changes",
            label: "Device Management: What changes will you make to your devices and technology?",
            type: "textarea",
            placeholder: "List specific changes..."
          },
          {
            id: "home-changes",
            label: "Home Environment: What changes will you make at home?",
            type: "textarea",
            placeholder: "List specific changes..."
          },
          {
            id: "schedule-changes",
            label: "Schedule Changes: How will you structure high-risk times?",
            type: "textarea",
            placeholder: "List schedule changes..."
          },
          {
            id: "barriers",
            label: "Barriers: What obstacles will you put between yourself and the behavior?",
            type: "textarea",
            placeholder: "List barriers you will create..."
          }
        ]
      },
      {
        id: "technology-safety-plan",
        title: "My Technology Safety Plan",
        instructions: "Create a comprehensive plan for managing technology in your recovery.",
        fields: [
          {
            id: "accountability-software",
            label: "Accountability Software: What will you use? Who will receive reports?",
            type: "textarea",
            placeholder: "Software:\nAccountability partner:"
          },
          {
            id: "device-rules",
            label: "Device Rules: Where will you charge devices? When will you have screens-off time?",
            type: "textarea",
            placeholder: "Charging location:\nScreens-off time:\nOther rules:"
          },
          {
            id: "social-media",
            label: "Social Media Plan: What apps will you delete, limit, or modify? What boundaries will you set?",
            type: "textarea",
            placeholder: "Apps to delete:\nApps to limit:\nTime limits:\nOther boundaries:"
          },
          {
            id: "travel-plan",
            label: "Travel Protocol: What will you do differently when traveling or staying in hotels?",
            type: "textarea",
            placeholder: "Hotel TV blocking:\nAccountability check-ins:\nOther safeguards:"
          },
          {
            id: "commitment",
            label: "My Commitment: Write a statement committing to your technology boundaries.",
            type: "textarea",
            placeholder: "I commit to..."
          }
        ]
      },
      {
        id: "emergency-plan",
        title: "Emergency Coping Plan",
        instructions: "Create a plan for when urges are strong. What will you do?",
        fields: [
          {
            id: "step1",
            label: "First 5 Minutes: What will you do immediately when a strong urge hits?",
            type: "textarea",
            placeholder: "Immediate actions..."
          },
          {
            id: "step2",
            label: "Next 10 Minutes: If the urge persists, what will you do next?",
            type: "textarea",
            placeholder: "Follow-up actions..."
          },
          {
            id: "step3",
            label: "Emergency Contact: Who will you call if you can't manage alone?",
            type: "textarea",
            placeholder: "Name and number..."
          },
          {
            id: "reminder",
            label: "Values Reminder: Write a brief reminder of why this matters to you.",
            type: "textarea",
            placeholder: "Why am I doing this?"
          }
        ]
      }
    ],
    homeworkChecklist: [
      "Read all Week 4 material",
      "Complete your Coping Strategy Toolkit — don't just list ideas, pre-decide which ones for which urge intensities",
      "Complete your Environmental Restructuring Plan and implement at least 2 changes this week",
      "Install accountability software if you haven't already — and tell someone who will receive the reports",
      "Complete your Emergency Coping Plan before you need it, not during",
      "Use the 15-minute delay when an urge hits — record what happened",
      "Complete daily check-ins for all 7 days"
    ]
  },

  5: {
    weekNumber: 5,
    title: "Shame Is Not Your Conscience",
    phase: 1,
    phaseName: "Foundation & Stabilization",
    overview: "There is a voice that comes after acting out. It's vicious. It tells you that you're disgusting, that you'll never change, that you're broken at the core. Most men in this program believe that voice is their conscience. It isn't. It's shame. And it's one of the primary reasons the cycle continues.",
    teaching: [
      {
        id: "shame-vs-guilt-deep",
        title: "The Difference Between the Two Voices",
        content: [
          "Guilt says: 'I did something that violated my values.' It's about the action. It's specific, bounded, and oriented toward repair. Guilt can motivate change because it points at a behavior — something you can actually do something about.",
          "Shame says: 'I am the thing I did.' It's about your identity. It's global, diffuse, and oriented toward hiding. Shame cannot motivate change because it's not telling you something went wrong — it's telling you that YOU are wrong. And if you are the problem, there is no solution.",
          "This distinction sounds philosophical until you see what shame does to a man in the middle of a relapse. Guilt says: 'You violated your integrity — that matters.' Shame says: 'You're exactly what you've always been. Why fight it?' Guess which one wins in that moment.",
          "Dr. Brené Brown's research across thousands of interviews is unambiguous: shame is positively correlated with addiction, depression, aggression, and destructive behavior. Guilt is inversely correlated with those outcomes. The most dangerous thing the cycle does is generate shame, because shame guarantees the cycle continues."
        ]
      },
      {
        id: "shame-cycle",
        title: "The Cycle Shame Creates",
        content: [
          "Here is what the shame loop looks like in practice: You act out. Shame floods in — the visceral sense of being disgusting, broken, hopeless. That shame creates intense emotional pain. You need relief from that pain. The most available source of relief is the behavior. So you act out again, now generating even more shame.",
          "The cycle is not: Act out → feel bad → want to stop. The cycle is: Act out → feel shame → shame creates unbearable pain → act out to escape the pain → more shame. The behavior is both the cause and the solution. That's why it's so difficult to stop with willpower alone.",
          "The shame also drives isolation. And isolation — the absence of honest human connection — is the ecosystem where CSBD thrives. The man who is most ashamed is the man who tells no one, which means the man who has no accountability, which means the man most likely to relapse.",
          "Breaking the loop doesn't mean minimizing what you've done. It means replacing shame — which attacks your person — with accountability — which addresses your behavior. You did something you don't want to do. That's real. You are not, at your core, your worst behavior. That's also real."
        ]
      },
      {
        id: "self-compassion",
        title: "What Self-Compassion Actually Is",
        content: [
          "Most men in this program resist self-compassion. It sounds like permission. Like letting yourself off the hook. Like saying what you did doesn't matter. None of that is what self-compassion means.",
          "Self-compassion, as Dr. Kristin Neff defines it, has three components. Self-kindness: treating yourself with the same basic decency you'd offer a person you respect who made a serious mistake. Common humanity: recognizing that suffering and struggle are not unique to you — they are part of what it means to be human. Mindfulness: being able to observe your emotional state without being consumed by it or shutting it down.",
          "The research on self-compassion is counterintuitive and clear: people who practice self-compassion after failure are MORE likely to take responsibility, MORE likely to change, and MORE resilient when they struggle again. Shame makes men hide. Compassion makes them get back up.",
          "This is not the same as self-pity, which focuses inward and stays stuck. Self-compassion acknowledges the pain AND orients toward the future. 'That was hard. I did something I regret. I am still a person capable of doing better. What now?'"
        ]
      },
      {
        id: "practicing-self-compassion",
        title: "Practicing Accountability Without Assault",
        content: [
          "There is a version of 'taking responsibility' that is actually just shame in disguise. It looks responsible — all that self-flagellation, the vows, the remorse. But it's not oriented toward change. It's oriented toward punishment. And punishment without a path forward is just suffering.",
          "Real accountability sounds like this: 'I acted out on Tuesday night. I know what triggered it — I was alone, I was angry about the conversation with my wife, I didn't use any of my tools. I didn't reach out to anyone. I need to look at my environment and my plan for that situation.' That's accountability. It's specific. It's behavioral. It points at something changeable.",
          "The self-compassion break, when shame is acute: Name it — 'This is a moment of real pain.' Normalize it — 'Other men in recovery have felt exactly this.' Kindness — not to what you did, but to the person experiencing the consequence: 'I am going to treat myself with basic decency while I figure out what to do next.'",
          "When your inner critic fires after a slip, try this question: 'What would I actually say to a man I respected who came to me and told me he'd just done what I did?' That is what you are allowed to say to yourself. Not more brutal. Not softer either. Exactly that."
        ]
      },
      {
        id: "distinguishing-behavior-identity",
        title: "You Are Not the Worst Thing You've Done",
        content: [
          "The behavior is real. The impact is real. The harm — to yourself, to people you love — is real. None of that is minimized by what comes next.",
          "You are also not the behavior. You are a person who has engaged in behaviors that violate your values and cause harm. The behavior can change. The harm can, in many cases, be addressed. Neither of those things is possible if you've collapsed your entire identity into what you've done.",
          "The shift is subtle but critical. Not: 'I am an addict.' But: 'I am a man who has struggled with compulsive sexual behavior and I'm in the process of changing that.' Not: 'I am disgusting.' But: 'I have done things I'm not proud of and I'm committed to doing differently.' The first framing closes the door. The second leaves it open.",
          "This is not optimism. It's not positive thinking. It's accurate thinking. Who you are is not fixed at your worst moment. It is shaped by what you do in the hundreds of moments that follow."
        ]
      }
    ],
    reflectionQuestions: [
      {
        id: "q1",
        question: "What does your inner critic say to you after you act out? Write out the actual words. What tone does it take? Does it sound like a voice from your past?"
      },
      {
        id: "q2",
        question: "How has shame — not guilt, but shame about who you are — functioned in the cycle? Has it ever actually stopped you from acting out, or does it drive you back?"
      },
      {
        id: "q3",
        question: "What would it sound like to hold yourself accountable for your behavior without attacking your worth as a person? Write that out."
      },
      {
        id: "q4",
        question: "If a man you deeply respected came to you and described exactly what you've done — what would you actually say to him? Write it. Then direct it at yourself."
      }
    ],
    exercises: [
      {
        id: "shame-inventory",
        title: "Shame Inventory",
        instructions: "Explore your relationship with shame. Be honest and specific.",
        fields: [
          {
            id: "messages",
            label: "What shame messages do you tell yourself? What does your inner critic say?",
            type: "textarea",
            placeholder: "List the shame messages..."
          },
          {
            id: "origins",
            label: "Where did these messages come from? (Family, culture, religion, past experiences)",
            type: "textarea",
            placeholder: "Explore the origins..."
          },
          {
            id: "effects",
            label: "How has shame affected your behavior and recovery?",
            type: "textarea",
            placeholder: "Describe the effects..."
          }
        ]
      },
      {
        id: "compassion-letter",
        title: "Self-Compassion Letter",
        instructions: "Write a letter to yourself from the perspective of a kind, understanding friend who knows everything about your struggle.",
        fields: [
          {
            id: "letter",
            label: "Dear [Your Name],",
            type: "textarea",
            placeholder: "Write your letter of compassion and understanding..."
          }
        ]
      },
      {
        id: "reframe-shame",
        title: "Reframing Shame to Accountability",
        instructions: "Take shame statements and reframe them as accountability statements that take responsibility without attacking your worth.",
        fields: [
          {
            id: "reframe1",
            label: "Shame: 'I am disgusting.' Accountability:",
            type: "textarea",
            placeholder: "Write the accountability reframe..."
          },
          {
            id: "reframe2",
            label: "Shame: 'I'll never change.' Accountability:",
            type: "textarea",
            placeholder: "Write the accountability reframe..."
          },
          {
            id: "reframe3",
            label: "Shame: 'I'm a terrible person.' Accountability:",
            type: "textarea",
            placeholder: "Write the accountability reframe..."
          },
          {
            id: "own-reframe",
            label: "Now reframe your own most common shame message:",
            type: "textarea",
            placeholder: "Shame: \nAccountability:"
          }
        ]
      }
    ],
    homeworkChecklist: [
      "Read all Week 5 material",
      "Complete the Shame Inventory — write out the actual words your inner critic uses, not a summary of them",
      "Write your Self-Compassion Letter — write it as if to a man you deeply respect who is going through exactly what you are",
      "Complete the Reframing Shame to Accountability exercise for your three most common shame statements",
      "This week when shame hits after a slip or a close call, practice the self-compassion break before going into self-attack mode",
      "Tell your accountability partner specifically what shame sounds like for you — not what you did, but how your inner critic responds",
      "Complete daily check-ins for all 7 days"
    ]
  },

  6: {
    weekNumber: 6,
    title: "The People You've Been Living Around",
    phase: 1,
    phaseName: "Foundation & Stabilization",
    overview: "CSBD does not happen in a vacuum. It happens inside a life with real people in it — people you love, people you've hurt, people you've kept out. This week is about understanding what the behavior has done to the relationships you care about most, why intimacy feels dangerous, and what the wounds in your history have to do with all of it.",
    teaching: [
      {
        id: "csbd-relationships",
        title: "Living a Double Life",
        content: [
          "Most men in this program describe the same experience: the life that other people see, and the life that happens when no one's looking. The curated version and the real one. The man who shows up at family dinner and the man who's alone late at night.",
          "That gap — the double life — is not just a moral problem. It's a relational one. Every hour you spend maintaining secrecy is an hour you're not present. Every interaction filtered through 'they can't know about this' is an interaction you're not fully in.",
          "The paradox that traps men here: the behavior often starts as an escape from relationship pain. But it creates more relationship pain, which increases the need to escape, which drives more of the behavior. CSBD is, in part, a relational disorder that wears a sexual mask.",
          "The men in this program who recover — really recover, not just white-knuckle through it — are almost universally men who stopped maintaining the double life. Not necessarily through dramatic disclosure, but through ending the fundamental posture of hiding."
        ]
      },
      {
        id: "attachment-patterns",
        title: "Why You Are This Way With People",
        content: [
          "Attachment theory asks a simple question: when you were a child and you needed comfort, connection, or safety — what happened? The answer to that question, repeated hundreds of times across your childhood, hardwired your nervous system to expect certain things from closeness.",
          "SECURE ATTACHMENT: Closeness was generally safe. Needs were mostly met. Connection and independence could coexist. People with this pattern find intimacy manageable, even nourishing.",
          "ANXIOUS ATTACHMENT: Connection was inconsistent or conditional. You learned that love required performance, and that people could withdraw without warning. In adulthood this looks like fear of abandonment, needing reassurance, difficulty tolerating relationship uncertainty.",
          "AVOIDANT ATTACHMENT: Closeness was dangerous or unreliable. You learned to suppress emotional needs and self-regulate in isolation. In adulthood this looks like discomfort with emotional intimacy, preference for independence, difficulty letting people in.",
          "Many men with CSBD have avoidant or anxious patterns. The behavior is often a solution to the vulnerability problem that genuine intimacy creates. You can get the neurochemical hit without the relational exposure."
        ]
      },
      {
        id: "pseudo-intimacy",
        title: "The Substitute That Never Satisfies",
        content: [
          "The behavior provides what could be called pseudo-intimacy: the feeling of connection, desire, or being wanted — without any of the vulnerability, risk, or reciprocity of real intimacy.",
          "Pseudo-intimacy is controlled. It requires nothing from you emotionally. It cannot reject you. It cannot disappoint you. It cannot see you and decide you're not enough. This is precisely why it's compelling — and precisely why it doesn't work.",
          "The brain cannot be fully satisfied by pseudo-intimacy because the need it's trying to meet is a genuine relational need. You need to be known, to matter, to be in real connection with another person. A screen cannot provide that. An anonymous encounter cannot provide that. The pseudo-intimacy can temporarily mute the need, but the need returns stronger.",
          "This is why the behavior escalates over time for most men. Not because they're depraved, but because what they're using to meet the need provides diminishing returns. The only thing that actually meets the need is genuine intimacy — which requires everything the behavior was designed to avoid."
        ]
      },
      {
        id: "trauma-and-csbd",
        title: "The Wound Beneath the Pattern",
        content: [
          "Research on Adverse Childhood Experiences — ACEs — consistently shows that early trauma is significantly overrepresented in men who develop compulsive sexual behavior. Physical abuse. Emotional abuse. Sexual abuse. Neglect. Household dysfunction. Witnessing violence. These are not excuses. They are causal factors.",
          "Here's the mechanism: Trauma disrupts the nervous system's ability to regulate itself. The child who learns that adults are dangerous, that closeness leads to pain, that needs are met with rejection or punishment — that child develops ways to survive. Sexual behavior, discovered at puberty, can become a powerful self-regulating mechanism. A reliable escape from a dysregulated nervous system.",
          "The trance-like quality of compulsive sexual behavior — the way time disappears, the dissociation from everything outside the moment — is not accidental. That dissociation is a trauma response. It's the same mechanism children use to survive overwhelming experiences. The behavior hijacked it.",
          "Recognizing trauma's role is not about removing your responsibility. You are responsible for your behavior. And you deserve compassion for what created the conditions. Both are true. If you recognize significant trauma in your history, the work you do here is important AND you likely need specialized trauma support — EMDR, somatic therapy, or a trauma-trained therapist — alongside this program."
        ]
      },
      {
        id: "partner-betrayal-trauma",
        title: "What Your Partner Is Actually Experiencing",
        content: [
          "If your partner knows about your behavior, or if they've discovered it, what they're experiencing has a clinical name: betrayal trauma. This is not an informal description. It is a recognized psychological injury with symptoms that mirror PTSD.",
          "Intrusive thoughts about what happened. Flashbacks triggered by ordinary moments. Hypervigilance — checking your phone, your location, your affect. A fundamental rupture in their sense of reality. Difficulty trusting their own perceptions. Anxiety, depression, physical symptoms — disrupted sleep, appetite changes, somatic tension.",
          "Your partner's reactions — the anger, the obsessive checking, the oscillation between rage and grief — are trauma responses. They are not overreactions. They are not manipulation tactics. They are a nervous system that has been genuinely injured processing something genuinely injurious.",
          "The most important thing to understand here: your partner cannot heal on your timeline. The normal defensive response — 'How long do I have to keep paying for this?' — is the wrong frame entirely. They didn't do this to themselves. Demanding that they recover on your schedule is another layer of the same fundamental disregard. Their healing is their work. Your work is to stop doing things that are harming them, and to make space for their process."
        ]
      },
      {
        id: "rebuilding-trust",
        title: "The Path Back Into Real Connection",
        content: [
          "Trust is not rebuilt through remorse. It is rebuilt through consistent, verifiable behavior over time. The words 'I'll never do it again' have no value — you've said them before, and so have your predecessors. What rebuilds trust is doing differently, consistently, long enough that a pattern of integrity is established.",
          "That means complete honesty going forward — not just absence of lies, but proactive transparency. It means accountability software, check-ins, openness about where you are and who you're with. It means not asking your partner to simply trust you while you continue to give them no rational basis to do so.",
          "It also means taking full responsibility without defensive caveats. 'I did this and I take full responsibility' is different from 'I did this, but you should know that I was under a lot of pressure.' One closes the wound slightly. The other re-opens it.",
          "Whether you're in a relationship or not, your recovery depends on genuine human connection. Isolation is the substrate in which this behavior grows. Recovery requires the opposite: people who know the real version of you, who can see when you're struggling, and who are authorized to challenge you. That's not optional. It's structural."
        ]
      }
    ],
    reflectionQuestions: [
      {
        id: "q1",
        question: "Describe the double life honestly — the gap between who people see and what's actually been happening. What has maintaining that gap cost you? What has it cost the people in your life?"
      },
      {
        id: "q2",
        question: "Which attachment pattern resonates most? How do you think your early experiences shaped your relationship with closeness and vulnerability?"
      },
      {
        id: "q3",
        question: "Have there been significant early experiences — abuse, neglect, household dysfunction, loss — that you've never fully addressed? How might those experiences connect to the pattern you're working to change?"
      },
      {
        id: "q4",
        question: "If you're in a relationship affected by this behavior: what does your partner need from you right now that you haven't been giving? Be honest. Don't write what sounds good — write what's true."
      }
    ],
    exercises: [
      {
        id: "relationship-impact",
        title: "Relationship Impact Assessment",
        instructions: "Honestly assess how your behavior has affected your relationships.",
        fields: [
          {
            id: "partner",
            label: "How has the behavior affected your partner or closest relationship?",
            type: "textarea",
            placeholder: "Describe the impact..."
          },
          {
            id: "trust",
            label: "How has trust been affected? What would rebuilding trust require?",
            type: "textarea",
            placeholder: "Describe the impact on trust..."
          },
          {
            id: "emotional",
            label: "How has emotional intimacy been affected?",
            type: "textarea",
            placeholder: "Describe the emotional impact..."
          },
          {
            id: "other-relationships",
            label: "How has the behavior affected other relationships (family, friends)?",
            type: "textarea",
            placeholder: "Describe other relationship impacts..."
          }
        ]
      },
      {
        id: "attachment-exploration",
        title: "Attachment Pattern Exploration",
        instructions: "Explore your attachment patterns and how they influence your behavior.",
        fields: [
          {
            id: "pattern",
            label: "Which attachment style do you most identify with? Why?",
            type: "textarea",
            placeholder: "Describe your attachment pattern..."
          },
          {
            id: "origins",
            label: "How might your early family experiences have shaped this pattern?",
            type: "textarea",
            placeholder: "Explore the origins..."
          },
          {
            id: "current-impact",
            label: "How does this pattern show up in your current relationships?",
            type: "textarea",
            placeholder: "Describe current impacts..."
          },
          {
            id: "csbd-connection",
            label: "How might this attachment pattern connect to your CSBD?",
            type: "textarea",
            placeholder: "Explore the connection..."
          }
        ]
      },
      {
        id: "intimacy-barriers",
        title: "Barriers to Genuine Intimacy",
        instructions: "Identify what prevents you from experiencing genuine intimacy.",
        fields: [
          {
            id: "fears",
            label: "What fears do you have about genuine intimacy? What might happen if you're truly known?",
            type: "textarea",
            placeholder: "List your fears..."
          },
          {
            id: "behaviors",
            label: "What behaviors do you use to avoid intimacy or vulnerability?",
            type: "textarea",
            placeholder: "List avoidance behaviors..."
          },
          {
            id: "steps",
            label: "What is one small step you could take this week toward greater intimacy or connection?",
            type: "textarea",
            placeholder: "Describe one step..."
          }
        ]
      },
      {
        id: "trauma-exploration",
        title: "Trauma and History Exploration (Optional but Recommended)",
        instructions: "This exercise helps you explore potential connections between your history and current struggles. Only complete what feels safe. Consider sharing with your mentor.",
        fields: [
          {
            id: "aces",
            label: "Adverse Childhood Experiences: Did you experience any of the following? (Check all that apply, or describe in your own words): Emotional/physical/sexual abuse, Neglect, Household dysfunction, Witnessing violence, Parental divorce/separation, etc.",
            type: "textarea",
            placeholder: "List any that apply, or write 'None that I'm aware of'..."
          },
          {
            id: "connection",
            label: "How might these experiences connect to your current struggles with CSBD?",
            type: "textarea",
            placeholder: "Explore potential connections..."
          },
          {
            id: "coping",
            label: "How has sexual behavior served as a coping mechanism for unresolved pain?",
            type: "textarea",
            placeholder: "Explore this connection..."
          },
          {
            id: "support-needed",
            label: "What additional support might you need to address trauma? (EMDR, trauma-focused therapy, etc.)",
            type: "textarea",
            placeholder: "Consider what support would help..."
          }
        ]
      },
      {
        id: "trust-rebuilding-plan",
        title: "Trust Rebuilding Plan (For Those in Relationships)",
        instructions: "If you're in a relationship affected by your behavior, create a plan for rebuilding trust.",
        fields: [
          {
            id: "current-state",
            label: "What is the current state of trust in your relationship? Be honest.",
            type: "textarea",
            placeholder: "Describe the current state..."
          },
          {
            id: "partner-needs",
            label: "What does your partner need from you right now? Have you asked them directly?",
            type: "textarea",
            placeholder: "List what they need..."
          },
          {
            id: "actions",
            label: "What specific, consistent actions will you take to rebuild trust? (Not promises - actions)",
            type: "textarea",
            placeholder: "List specific actions..."
          },
          {
            id: "partner-support",
            label: "How will you support your partner's healing process? Have you encouraged them to seek their own support?",
            type: "textarea",
            placeholder: "Describe how you'll support them..."
          }
        ]
      }
    ],
    homeworkChecklist: [
      "Read all Week 6 material",
      "Complete the Relationship Impact Assessment honestly — not what you've already apologized for, but the full picture",
      "Complete the Attachment Pattern Exploration — trace where your current patterns came from",
      "Complete the Trauma and History Exploration at whatever depth feels safe — and consider bringing what you find to your mentor",
      "If in a relationship, complete the Trust Rebuilding Plan with specific actions, not intentions",
      "Identify your single biggest barrier to genuine intimacy and name it honestly",
      "Take one concrete step toward real connection this week — not a gesture, but a real one",
      "Complete daily check-ins for all 7 days"
    ]
  },

  7: {
    weekNumber: 7,
    title: "What Needs to Be Said",
    phase: 1,
    phaseName: "Foundation & Stabilization",
    overview: "There are conversations you've been avoiding. You know which ones they are. The thing you haven't said to your partner. The resentment you've been swallowing. The need you've never found the words for. Unspoken things don't disappear — they go underground and come out as something else. This week, we name them.",
    teaching: [
      {
        id: "problem-solving-model",
        title: "What You've Been Using Instead of Words",
        content: [
          "For most men in this program, the behavior has served a communication function. Not just a relief function, not just an escape function — it has been the answer to problems that needed different solutions.",
          "You felt disconnected from your partner. Instead of addressing it, you found connection elsewhere. You were under enormous stress at work. Instead of acknowledging that and asking for support, you escaped. You were angry about something you couldn't bring yourself to say. The behavior absorbed the tension.",
          "This is not a character flaw. It's a skill deficit. Most men were not taught how to identify emotional needs, articulate them clearly, and make direct requests of people they depend on. The behavior filled the gap. Recovery means learning to do the thing the behavior was doing, in a different, better way.",
          "The problem-solving sequence for things the behavior has been solving: Define the actual problem — the real one, not the symptom. Generate possible solutions. Choose one. Act on it. Evaluate. This is slower, more exposed, and harder than acting out. It's also the only thing that actually works."
        ]
      },
      {
        id: "needs-identification",
        title: "What You're Actually Hungry For",
        content: [
          "Under almost every urge is an unmet need. The urge is your brain's proposed solution. Before you can solve the problem differently, you have to name the problem accurately.",
          "Common needs that drive CSBD: Connection — real contact with another person who knows and accepts you. Validation — feeling that you matter, that you're desired, that you're enough. Relief — from stress, fear, anger, or pain that has nowhere to go. Control — a sense of power or agency when life feels unmanageable. Sensation — aliveness, intensity, escape from numbness.",
          "When an urge appears, try this question: 'What am I actually hungry for right now?' Not the behavior — but the need the behavior is trying to solve. Name it. Anxiety about tomorrow's meeting? Loneliness from the distance between you and your wife? Anger at something you said nothing about?",
          "Once you've named the actual need, you can ask the next question: how do I meet this directly? Loneliness is addressed by contact — pick up the phone. Stress is addressed by movement, rest, or conversation. Anger usually needs a conversation you've been postponing. The need has an answer. The behavior is just the wrong one."
        ]
      },
      {
        id: "assertive-communication",
        title: "The Language You Were Never Taught",
        content: [
          "Most men were socialized away from direct emotional communication. 'I'm fine.' 'It doesn't matter.' 'Just drop it.' The language of male stoicism is extremely efficient for a lot of situations. It is catastrophic in intimate relationships and in recovery.",
          "PASSIVE COMMUNICATION is not saying what you mean. 'Whatever you want.' 'It's fine.' The words say one thing. The resentment says another. Passive communication doesn't prevent conflict — it defers and amplifies it.",
          "AGGRESSIVE COMMUNICATION is saying what you feel in a way that makes the other person defensive. 'You never...' 'You always...' 'You make me...' The message might even be accurate. The delivery closes the other person down.",
          "ASSERTIVE COMMUNICATION is saying what is true from your experience, without attacking. The formula: 'I feel [emotion] when [specific situation]. I need [specific request].' Not: 'You never make me feel wanted.' But: 'I feel disconnected from you when we go days without talking about anything real. I need us to have a real conversation tonight.' Same content. Different outcome."
        ]
      },
      {
        id: "conflict-resolution",
        title: "Conflict Is Recovery Work",
        content: [
          "Unresolved conflict is a primary trigger for most men in this program. You have a hard conversation with your partner. Or you need to have one and you don't. You walk away with the tension still in your body. You're alone. You have access to your phone. The next part of the story is predictable.",
          "Recovery requires getting competent at conflict. Not comfortable — competent. The goal is not to avoid conflict or win it. The goal is to process it without it becoming a trigger.",
          "The principles: Address conflict when you're regulated enough to listen, not just respond. Use your body as a signal — if you're flooded, take a break and come back. Listen to understand what the other person is experiencing, not just to prepare your counterargument. Attack the problem, not the person.",
          "After a difficult conversation, check in with yourself honestly. Are you still carrying it? Are you rationalizing? Is that unresolved energy becoming a trigger? Conflict that doesn't get processed doesn't go away — it goes somewhere."
        ]
      },
      {
        id: "boundary-setting",
        title: "A Boundary Is Not a Wall",
        content: [
          "Boundaries get misunderstood in recovery conversations. They're not about controlling other people. They're not ultimatums. They are clear statements of what you will and won't do — commitments you make to yourself that you communicate to others.",
          "Recovery boundaries are structural. No devices in the bedroom is not a conversation or a hope — it's a boundary you've set with yourself. Accountability software reporting to someone specific is a boundary. A check-in time with your accountability partner is a boundary. These work because you don't renegotiate them in real time.",
          "Relational boundaries are different — they're about what you're willing to participate in. 'I'm not willing to go to that situation without having a plan and telling someone.' 'I'm not willing to keep secrets about where I am.' These require communication and sometimes negotiation.",
          "Setting a boundary often feels aggressive to men who've been passive. It isn't. A clearly communicated limit is more respectful than passive compliance followed by resentment. The discomfort of setting a boundary is almost always less costly than the behavior you engage in when you don't."
        ]
      }
    ],
    reflectionQuestions: [
      {
        id: "q1",
        question: "What problem in your life has the behavior been 'solving'? What is the actual need underneath your most frequent urges? Be specific."
      },
      {
        id: "q2",
        question: "What conversation are you avoiding right now? What would you say if you weren't afraid of the response?"
      },
      {
        id: "q3",
        question: "Where in your life are you communicating passively — saying 'it's fine' when it isn't, going along rather than saying what you need?"
      },
      {
        id: "q4",
        question: "What boundaries do you need to set — with yourself, with your environment, with other people — that you haven't set yet? What's stopping you?"
      }
    ],
    exercises: [
      {
        id: "problem-solving-practice",
        title: "Problem-Solving Practice",
        instructions: "Choose a current problem in your life and work through the problem-solving steps.",
        fields: [
          {
            id: "problem",
            label: "Define the problem clearly:",
            type: "textarea",
            placeholder: "What is the problem?"
          },
          {
            id: "solutions",
            label: "Brainstorm possible solutions (list at least 5, without judging):",
            type: "textarea",
            placeholder: "1.\n2.\n3.\n4.\n5."
          },
          {
            id: "evaluation",
            label: "Evaluate your top 3 solutions (pros and cons of each):",
            type: "textarea",
            placeholder: "Solution 1: Pros/Cons\nSolution 2: Pros/Cons\nSolution 3: Pros/Cons"
          },
          {
            id: "action-plan",
            label: "Choose a solution and create an action plan:",
            type: "textarea",
            placeholder: "Chosen solution:\nStep 1:\nStep 2:\nStep 3:"
          }
        ]
      },
      {
        id: "needs-mapping",
        title: "Needs Mapping",
        instructions: "Identify the underlying needs that your behavior has tried to meet.",
        fields: [
          {
            id: "needs-list",
            label: "What needs has your behavior tried to meet? (connection, validation, escape, excitement, control, etc.)",
            type: "textarea",
            placeholder: "List the needs..."
          },
          {
            id: "healthy-alternatives",
            label: "For each need, identify at least one healthy way to meet it:",
            type: "textarea",
            placeholder: "Need: [how to meet it]\nNeed: [how to meet it]"
          }
        ]
      },
      {
        id: "assertiveness-practice",
        title: "Assertive Communication Practice",
        instructions: "Practice converting passive or aggressive statements into assertive ones.",
        fields: [
          {
            id: "scenario1",
            label: "Passive: 'It's fine, I guess.' What do you really need to say?",
            type: "textarea",
            placeholder: "I feel... when... I need..."
          },
          {
            id: "scenario2",
            label: "Aggressive: 'You never think about anyone but yourself!' What could you say instead?",
            type: "textarea",
            placeholder: "I feel... when... I need..."
          },
          {
            id: "own-scenario",
            label: "Write an assertive statement for a real situation in your life where you've been passive or aggressive:",
            type: "textarea",
            placeholder: "I feel... when... I need..."
          }
        ]
      },
      {
        id: "boundary-plan",
        title: "Boundary Setting Plan",
        instructions: "Identify boundaries you need to set and plan how to communicate them.",
        fields: [
          {
            id: "boundaries",
            label: "What boundaries do you need to set to protect your recovery?",
            type: "textarea",
            placeholder: "List your needed boundaries..."
          },
          {
            id: "communication",
            label: "How will you communicate these boundaries to others if needed?",
            type: "textarea",
            placeholder: "Plan your communication..."
          },
          {
            id: "enforcement",
            label: "What will you do if boundaries are tested or violated?",
            type: "textarea",
            placeholder: "Plan for enforcement..."
          }
        ]
      }
    ],
    homeworkChecklist: [
      "Read all Week 7 material",
      "Complete the Problem-Solving Practice exercise for a real, current problem — not a hypothetical",
      "Complete your Needs Mapping — for each recent urge, name the need underneath it",
      "Practice one assertive conversation this week using the I-feel-when-I-need format. Write down how it went.",
      "Create your Boundary Setting Plan and set at least one boundary this week — with yourself or someone else",
      "Complete daily check-ins for all 7 days"
    ]
  },

  8: {
    weekNumber: 8,
    title: "The Architecture of Not Going Back",
    phase: 1,
    phaseName: "Foundation & Stabilization",
    overview: "You've spent seven weeks understanding the pattern — the triggers, the thoughts, the emotions, the relational wounds underneath it. Now you build the structure that protects what you're trying to create. A relapse prevention plan is not a set of rules. It's a map of yourself that you've prepared in advance, for the version of yourself that will be less capable of thinking clearly.",
    teaching: [
      {
        id: "understanding-relapse",
        title: "The Difference Between a Lapse and a Relapse",
        content: [
          "A LAPSE is a single incident. One slip. The behavior happened. It is data — painful data — about where the plan wasn't strong enough, what situation wasn't anticipated, what emotional state bypassed the tools. A lapse does not have to become anything more than a single incident.",
          "A RELAPSE is what happens after the lapse if you respond to it with shame, hiding, and surrender. It's not the slip that creates relapse — it's the 'I've already blown it' thinking that follows, that gives you permission to keep going. Relapse is the return to the full cycle, not just the moment of acting out.",
          "The critical window is the 24 hours after a lapse. What you do in those 24 hours determines whether it stays a lapse. If you tell someone immediately, if you complete a reflection on what happened and why, if you recommit and adjust your plan — it ends there. If you hide, rationalize, and continue in silence — it doesn't.",
          "A lapse is not a failure. It is the most specific possible information about where your plan needs work. Every man who achieves long-term recovery has had slips. What distinguishes them is not that they were perfect — it's that they got back up faster and more honestly each time."
        ]
      },
      {
        id: "warning-signs",
        title: "The Signals Before the Signal",
        content: [
          "Relapse almost never comes out of nowhere. There is a process. It unfolds over hours or days — sometimes weeks — before the behavior happens. The problem is that the warning signs can feel like normal life until you know what to look for.",
          "EMOTIONAL SIGNALS: Increasing isolation. Irritability that doesn't match the situation. Low-grade anxiety you're not addressing. A flatness or numbness you're not naming. Feeling 'off' in a way that's hard to articulate. These are yellow zone signs.",
          "BEHAVIORAL SIGNALS: Skipping your check-ins. Letting the accountability software lapse. Rationalizing exceptions to your boundaries. Spending more time alone in high-risk environments. 'Testing' your edges without admitting that's what you're doing.",
          "COGNITIVE SIGNALS: The permission-giving thoughts returning. Fantasizing or mental rehearsing. Minimizing what the behavior costs. Romanticizing what it provides. 'I've been good for a while' thinking. The distortions from Week 3 showing up in force.",
          "PHYSICAL SIGNALS: Disrupted sleep. Not exercising. Not eating well. Physical tension held in the body. These aren't just lifestyle issues — they are vulnerability states that lower the threshold at which urges become unmanageable."
        ]
      },
      {
        id: "traffic-light",
        title: "The Four Zones",
        content: [
          "GREEN: Connected. Using your tools. Following your structure. Honest with the people in your accountability network. Urges are manageable. This is the zone your plan should keep you in. The work in the green zone is maintenance — staying consistent, not getting complacent.",
          "YELLOW: Warning signs have appeared. Stress is elevated. Urges are more frequent. You've started to isolate or let some practices slip. You're not in danger yet, but you're moving toward it. Response: Increase accountability immediately. Tell someone what's happening. Return to your core practices. Address whatever is driving the drift.",
          "ORANGE: Preoccupation is increasing. You're mentally rehearsing. You've moved toward opportunity or access in ways you're rationalizing. You may be fantasizing. Your emotional regulation is compromised. Response: Emergency contact — call someone now. Remove access. Get out of the physical space you're in. Use every tool available.",
          "RED: You're about to act out, or you already have. Response: Crisis protocol. Reach out within the hour. Don't let shame drive you underground. The next 24 hours are critical."
        ]
      },
      {
        id: "initial-prevention-plan",
        title: "Your First Prevention Plan",
        content: [
          "A relapse prevention plan is built in the green zone, where you're thinking clearly — not in the yellow or orange zone, where you're not. If you don't build it now, you'll be improvising when you need to execute.",
          "The plan answers five questions in advance: What are my earliest warning signs — the first things that appear before I'm in trouble? What specific actions will I take at each zone level? Who will I call, and at what point? What environmental controls are in place? What do I do in the first 24 hours after a slip?",
          "The plan needs to live somewhere you'll access it under pressure. Not just in this workbook — on your phone, or in a conversation with your accountability partner who knows the plan and will hold you to it.",
          "Review and update the plan every 30 days. Your patterns will become clearer over time. The plan should evolve with your understanding."
        ]
      },
      {
        id: "phase-transition",
        title: "What Phase 2 Offers That Phase 1 Can't",
        content: [
          "Phase 1 has been about stabilization and understanding. You've mapped the cycle, challenged the thoughts, built coping strategies, examined your relationships, confronted your shame. This is critical foundational work. It is not enough.",
          "Here's the honest limitation of behavior management: it is running away from something. And you can run for a while. But men who only ever run — who stop the behavior without replacing it with something — often eventually stop running.",
          "Phase 2 turns the frame around. Instead of running from the behavior, you start moving toward a life. Acceptance and Commitment Therapy gives you tools not for managing discomfort better, but for building something worth choosing over the behavior. Values. Meaning. Committed action in the directions that matter.",
          "The goal is not just to not do the thing. The goal is to want something else more. Phase 2 builds that. It doesn't replace what you learned in Phase 1 — it gives it somewhere to go."
        ]
      }
    ],
    reflectionQuestions: [
      {
        id: "q1",
        question: "What are your earliest warning signs? Not the last-moment signs — the first ones. What's the earliest signal that you're drifting?"
      },
      {
        id: "q2",
        question: "What zone are you typically in when you act out? How long did the drift from green to red take last time? What did you miss or ignore?"
      },
      {
        id: "q3",
        question: "Looking at the seven weeks of this program so far: what have you learned about yourself that you didn't know before? What surprised you?"
      },
      {
        id: "q4",
        question: "What does 'a life worth choosing over the behavior' look like to you? What would have to be true about your life for this to be genuinely unappealing?"
      }
    ],
    exercises: [
      {
        id: "warning-signs-inventory",
        title: "Personal Warning Signs Inventory",
        instructions: "Identify your specific warning signs in each category.",
        fields: [
          {
            id: "emotional",
            label: "Emotional Warning Signs (feelings that indicate vulnerability):",
            type: "textarea",
            placeholder: "List your emotional warning signs..."
          },
          {
            id: "behavioral",
            label: "Behavioral Warning Signs (actions that precede relapse):",
            type: "textarea",
            placeholder: "List your behavioral warning signs..."
          },
          {
            id: "cognitive",
            label: "Cognitive Warning Signs (thoughts that indicate danger):",
            type: "textarea",
            placeholder: "List your cognitive warning signs..."
          },
          {
            id: "physical",
            label: "Physical Warning Signs (body signals of vulnerability):",
            type: "textarea",
            placeholder: "List your physical warning signs..."
          }
        ]
      },
      {
        id: "traffic-light-plan",
        title: "My Traffic Light Plan",
        instructions: "Create your plan for each zone.",
        fields: [
          {
            id: "green-zone",
            label: "GREEN ZONE: What practices will you maintain when stable?",
            type: "textarea",
            placeholder: "Daily practices, weekly check-ins, ongoing support..."
          },
          {
            id: "yellow-zone",
            label: "YELLOW ZONE: What will you do when warning signs appear?",
            type: "textarea",
            placeholder: "Increased accountability, specific coping strategies..."
          },
          {
            id: "red-zone",
            label: "RED ZONE: What is your emergency plan?",
            type: "textarea",
            placeholder: "Who to call, where to go, immediate actions..."
          }
        ]
      },
      {
        id: "phase-1-reflection",
        title: "Phase 1 Reflection",
        instructions: "Reflect on your journey through Phase 1.",
        fields: [
          {
            id: "learned",
            label: "What are the most important things you've learned about yourself?",
            type: "textarea",
            placeholder: "Key learnings..."
          },
          {
            id: "helpful",
            label: "Which skills or tools have been most helpful?",
            type: "textarea",
            placeholder: "Most helpful tools..."
          },
          {
            id: "challenges",
            label: "What has been most challenging?",
            type: "textarea",
            placeholder: "Greatest challenges..."
          },
          {
            id: "phase2-hopes",
            label: "What do you hope to gain from Phase 2?",
            type: "textarea",
            placeholder: "Hopes for Phase 2..."
          }
        ]
      }
    ],
    homeworkChecklist: [
      "Read all Week 8 material",
      "Complete your Personal Warning Signs Inventory — be specific, not generic",
      "Build your Traffic Light Plan with specific actions at each zone, not vague intentions",
      "Complete the Phase 1 Reflection — what you've actually learned, not what you were supposed to learn",
      "Share your warning signs and plan with your accountability partner so they can help you see what you miss",
      "Complete daily check-ins for all 7 days"
    ]
  },

  9: {
    weekNumber: 9,
    title: "What Fighting Has Cost You",
    phase: 2,
    phaseName: "Integration & Values",
    overview: "You've been fighting for a long time. Fighting the urges. Fighting the thoughts. Fighting the feelings. Fighting the version of yourself you don't want to be. Phase 1 gave you better weapons. This week begins Phase 2, which asks a harder question: what if fighting isn't the right strategy?",
    teaching: [
      {
        id: "what-is-act",
        title: "The Strategy That Hasn't Worked",
        content: [
          "Think honestly about your history with this behavior. How long have you been trying to control it, suppress it, white-knuckle through it? Months? Years? Decades? And the strategy — trying harder, resolving harder, punishing yourself harder — has produced what results?",
          "This is not an accusation. Most men in this program are trying extremely hard. The problem is not the effort. The problem is the strategy. And the strategy that most men are using — the control agenda, the war against their own internal experience — is making things worse, not better.",
          "Acceptance and Commitment Therapy begins with what's called 'creative hopelessness' — a frank examination of whether the control strategy has actually worked. Not as a reason to give up. As a reason to try something fundamentally different.",
          "ACT does not ask you to try harder. It asks you to try differently. The difference is this: instead of fighting your internal experience, you change your relationship to it. You stop running from the storm and start learning to walk through it."
        ]
      },
      {
        id: "psychological-flexibility",
        title: "Why Fighting Makes It Worse",
        content: [
          "Here is the counterintuitive truth about internal experiences: the harder you fight them, the stronger they get. Try right now not to think about a white bear. What happened? The instruction itself creates the thought.",
          "Psychologists call this the 'rebound effect.' Suppression backfires. When you tell yourself 'don't think about this, don't feel this, don't have this urge,' you are placing those things at the center of your attention. You are making them louder.",
          "CSBD is, in part, driven by experiential avoidance — the attempt to control or escape uncomfortable internal states. You feel anxious. You can't tolerate the anxiety. The behavior provides relief. The anxiety comes back. You've actually trained your nervous system to need the escape.",
          "The alternative is not enduring pain heroically. It's changing your fundamental relationship to discomfort. Not: 'I must destroy this urge.' But: 'I can have this urge and not be controlled by it.' Not: 'I must not feel this shame.' But: 'I can feel shame and still act with integrity.' The difference is everything."
        ]
      },
      {
        id: "six-processes",
        title: "Six Tools, One Goal",
        content: [
          "ACT builds what researchers call psychological flexibility — the ability to be fully present with your experience, to have thoughts and feelings without being dictated by them, and to take action in the direction of your values regardless of how you feel. This is exactly what CSBD takes from you.",
          "The six interrelated processes: PRESENT MOMENT AWARENESS — being here, now, where the behavior doesn't actually exist. ACCEPTANCE — making room for discomfort rather than running from it. COGNITIVE DEFUSION — seeing thoughts as thoughts, not commands. SELF-AS-CONTEXT — the observer self, the part of you that cannot be broken. VALUES — your compass, your reason. COMMITTED ACTION — moving toward what matters, despite discomfort.",
          "You'll spend the next several weeks working through each of these in depth. They build on each other. They also reinforce the CBT skills from Phase 1 — they don't replace them. A defusion technique and a thought record used together are more powerful than either alone.",
          "The overall goal of Phase 2 is not just 'not doing the behavior.' It's building a life with enough meaning, connection, and direction that the behavior loses its comparative appeal. That's long-term recovery."
        ]
      },
      {
        id: "control-agenda",
        title: "The Cost of the Control Strategy",
        content: [
          "Take stock honestly: What has the control strategy cost you? How much mental energy has gone into suppression, avoidance, and management of your internal life? How much of your life has been organized around not feeling certain things, not thinking certain thoughts, not being in certain situations?",
          "The cost of the control strategy is enormous and rarely calculated. It's the exhaustion of constant vigilance. It's the life you haven't lived because you were too busy managing the one you were trying to suppress. It's the relationships that couldn't be fully entered because you were carrying a secret.",
          "ACT calls this 'the struggle switch.' When the switch is on, every uncomfortable experience becomes a problem to solve, a battle to win. When the switch is off, a difficult experience is just... a difficult experience. You can have it without it defining you or dictating your next move.",
          "Turning off the struggle switch is not passive. It is one of the most active, courageous things you can do. It requires you to face what you've been running from — to stand in the presence of discomfort without reaching for escape. The men who do this consistently are the men who recover."
        ]
      },
      {
        id: "willingness",
        title: "Willingness Is Not Approval",
        content: [
          "The concept that will anchor Phase 2 is willingness. Willingness is not wanting something. It's not enjoying something. It's not agreeing that something should be happening. It is making room for something to be present without fighting it or running from it.",
          "'I am willing to have this urge.' Not: 'I want this urge.' Not: 'I'm okay with this urge.' Just: 'This urge is present, and I can make room for it to be present without acting on it.' That's a fundamentally different relationship to your experience.",
          "'I am willing to feel this shame without letting it make my decisions for me.' Not suppressing it. Not drowning in it. Just — holding it. Being with it. Continuing to act with integrity despite it.",
          "Willingness is a practice. You will not be immediately good at it. The years of habitual avoidance don't disappear in a week. But every time you practice — every time you have an uncomfortable experience and make room for it rather than reaching for escape — you are literally changing your nervous system. This is how recovery becomes sustainable."
        ]
      }
    ],
    reflectionQuestions: [
      {
        id: "q1",
        question: "Be honest about the control strategy: how long have you been fighting this? What results has that strategy produced? Not what you hoped — what actually happened?"
      },
      {
        id: "q2",
        question: "What internal experiences — emotions, thoughts, physical sensations — are you most unwilling to have? What do you do to avoid them?"
      },
      {
        id: "q3",
        question: "What has the control strategy cost you — in energy, in relationships, in life unlived? Try to actually add this up."
      },
      {
        id: "q4",
        question: "What would it mean to be 'willing' to have an urge without acting on it? Not happy about it — just willing. Does that feel possible? What gets in the way?"
      }
    ],
    exercises: [
      {
        id: "control-assessment",
        title: "The Control Agenda Assessment",
        instructions: "Examine your attempts to control internal experiences.",
        fields: [
          {
            id: "strategies",
            label: "What strategies have you used to control, suppress, or eliminate unwanted thoughts, feelings, or urges?",
            type: "textarea",
            placeholder: "List your control strategies..."
          },
          {
            id: "effectiveness",
            label: "How effective have these strategies been in the long run? What has been the cost?",
            type: "textarea",
            placeholder: "Evaluate the effectiveness and cost..."
          },
          {
            id: "alternative",
            label: "What might be an alternative to trying to control these experiences?",
            type: "textarea",
            placeholder: "Consider alternatives..."
          }
        ]
      },
      {
        id: "flexibility-assessment",
        title: "Psychological Flexibility Self-Assessment",
        instructions: "Rate yourself on each component of psychological flexibility (1=rarely, 10=consistently).",
        fields: [
          {
            id: "present-moment",
            label: "Present Moment: I can be fully present without getting lost in past or future. Rate 1-10 and explain:",
            type: "textarea",
            placeholder: "Rating: \nExplanation:"
          },
          {
            id: "acceptance",
            label: "Acceptance: I can open up to difficult feelings without fighting them. Rate 1-10 and explain:",
            type: "textarea",
            placeholder: "Rating: \nExplanation:"
          },
          {
            id: "defusion",
            label: "Defusion: I can see thoughts as thoughts rather than facts I must obey. Rate 1-10 and explain:",
            type: "textarea",
            placeholder: "Rating: \nExplanation:"
          },
          {
            id: "values",
            label: "Values: I have clarity about what truly matters to me. Rate 1-10 and explain:",
            type: "textarea",
            placeholder: "Rating: \nExplanation:"
          },
          {
            id: "action",
            label: "Committed Action: I take consistent action toward my values even when uncomfortable. Rate 1-10 and explain:",
            type: "textarea",
            placeholder: "Rating: \nExplanation:"
          }
        ]
      },
      {
        id: "willingness-experiment",
        title: "Willingness Experiment",
        instructions: "Practice willingness with a mild uncomfortable experience this week.",
        fields: [
          {
            id: "experience",
            label: "What uncomfortable thought, feeling, or sensation will you practice being willing to have?",
            type: "textarea",
            placeholder: "Describe the experience..."
          },
          {
            id: "practice",
            label: "How did you practice willingness? What did you do differently than usual?",
            type: "textarea",
            placeholder: "Describe your practice..."
          },
          {
            id: "observation",
            label: "What did you notice? What happened when you made room for it instead of fighting it?",
            type: "textarea",
            placeholder: "Record your observations..."
          }
        ]
      }
    ],
    homeworkChecklist: [
      "Read all Week 9 material",
      "Complete the Control Agenda Assessment — be brutal about what the control strategy has actually cost you",
      "Complete the Psychological Flexibility Self-Assessment honestly — where you actually are, not where you want to be",
      "Practice one Willingness Experiment and record what happened when you made room instead of fighting",
      "Notice this week every time you use a control strategy — suppression, avoidance, distraction — and write it down",
      "Complete daily check-ins for all 7 days"
    ]
  },

  10: {
    weekNumber: 10,
    title: "Your Thoughts Don't Have Permission",
    phase: 2,
    phaseName: "Integration & Values",
    overview: "Last week you examined the cost of fighting your internal experience. This week you learn the first major ACT skill: defusion — the ability to step back from your thoughts and see them for what they are. Thoughts are not facts. They are not commands. They are not you. They are events passing through your mind. You get to decide whether to obey them.",
    teaching: [
      {
        id: "fusion-vs-defusion",
        title: "Hooked vs. Free",
        content: [
          "FUSION is when your thoughts have you. You believe them automatically. You react to them without choice. The thought 'I need to act out' arrives and the next moment you're acting. The thought 'I'm hopeless' arrives and the next moment you've stopped trying. Fusion feels like reality. It feels like what's true.",
          "DEFUSION is when you have your thoughts — when you can see them as events, as words and images produced by a brain, rather than as commands or facts about the world. You can have the thought 'I need to act out' and notice it as a thought. You can have the thought 'I'm broken' and recognize it as one more output of a machine that has been programmed by experience.",
          "The difference is not in what thoughts appear. The difference is in the relationship to the thought. Fusion and defusion produce entirely different behaviors from exactly the same thought.",
          "This is the most practically powerful skill in Phase 2. When you can defuse from an urge — when you can step back from 'I NEED this' and observe 'there is a pull toward this behavior' — you have created a gap. In that gap is your life."
        ]
      },
      {
        id: "thoughts-not-facts",
        title: "Your Mind Is a Story Machine",
        content: [
          "Your mind produces thoughts at a rate of thousands per day. Most of them are automatic — driven by pattern, by habit, by the accumulated weight of your history. They are not curated by wisdom. They are not filtered for accuracy. They simply arrive.",
          "Many of the most powerful thoughts driving compulsive behavior are not true. 'I deserve this.' 'I've earned it.' 'I'll stop tomorrow.' 'No one will ever know.' 'I'm broken anyway, so why fight it.' These feel true when they're active. They are not facts. They are the output of a machine that has learned what to say to get you to act.",
          "Week 3 taught you to challenge thoughts — to interrogate their accuracy. Defusion is different. You don't argue with the thought. You step back and recognize it as a thought. 'Oh. There's the I-deserve-this story again. My mind is running that program.' You don't have to fight it. You just don't have to obey it.",
          "The thought 'I'm a failure' and the statement 'I'm having the thought that I'm a failure' describe exactly the same mental event. They produce entirely different emotional responses and entirely different behaviors. That is the power of defusion."
        ]
      },
      {
        id: "defusion-techniques",
        title: "The Tools",
        content: [
          "'I'M HAVING THE THOUGHT THAT...': Simply add this prefix. 'I'm worthless' becomes 'I'm having the thought that I'm worthless.' The thought may still be present. Its grip on you is fundamentally different. Practice this until it becomes automatic.",
          "'NAMING THE STORY': Your mind runs recurring programs — the same thought patterns, the same justifications, the same catastrophic predictions. Give them names. 'Oh — the Permission Story.' 'There's the I'm-Already-Broken Story.' 'The Nobody-Cares Story is running.' A named story has far less authority than an unnamed one.",
          "'THANKING YOUR MIND': When the thought arrives, try: 'Thanks for that, mind.' Not sarcastically — genuinely acknowledging that your mind is trying to protect you or solve a problem, even when it's doing it badly. 'Thanks for reminding me of that risk. I've got this.'",
          "'LEAVES ON A STREAM': Close your eyes. Imagine a gentle stream. Place each thought on a leaf and watch it float away. You don't grab onto the leaves. You don't push them under. You just watch them move. Practice this with urge-related thoughts specifically.",
          "'DEFUSING AN URGE': When an urge is present, notice it rather than fighting it or feeding it. 'There's a pull toward the behavior right now. I notice it in my chest. I notice the thought that relief is nearby. This is an urge. I am the one noticing it.' That last line is everything."
        ]
      },
      {
        id: "urge-defusion",
        title: "Using This When an Urge Is Active",
        content: [
          "Defusion is not a cold-weather exercise. It has to work when the urge is hot — when the pull is strong, when the thoughts are insistent, when the whole system is pushing you toward acting out.",
          "Here is the sequence for high-intensity urge defusion: Name what's happening — 'An urge is present.' Locate it physically — where in your body? What does it actually feel like as sensation, separate from the story? Defuse the primary thought — 'I'm having the thought that I need this.' Separate yourself from the urge — 'I am the one noticing this urge. The urge does not have permission to make my decisions.'",
          "Notice that this is not fighting the urge. You are not pushing it down or trying to make it go away. You're observing it. And here's what happens when you observe something fully without acting on it: the urge rises, peaks, and falls. Every time. You don't have to destroy it. You just have to outlast the peak.",
          "You are not your urge. You are the one noticing the urge. That distinction — experienced in the body, in the moment, under real pressure — is one of the most important things you will learn in this program."
        ]
      },
      {
        id: "defusion-limitations",
        title: "What Defusion Is Not",
        content: [
          "Defusion is not positive thinking. You are not trying to replace negative thoughts with positive ones. You are not trying to convince yourself that everything is fine. The thought may still be unpleasant. The urge may still be strong. You're changing your relationship to them, not their content.",
          "Defusion is not suppression. You're not pushing thoughts away or refusing to acknowledge them. Defusion requires you to fully acknowledge the thought — and then hold it differently. 'I'm noticing this thought fully, and I am not this thought.'",
          "Defusion is not a quick fix. It is a practice. The first few times you try it, the thought will still feel powerful. With repetition, the automaticity weakens. The gap between thought and action grows. That gap is where your freedom lives.",
          "Defusion doesn't always work. Under very high emotional intensity, defusion is harder. That's why you also have the physiological tools from Week 4, the thought records from Week 3, and the support network from Week 1. No single tool is the whole answer."
        ]
      }
    ],
    reflectionQuestions: [
      {
        id: "q1",
        question: "What thoughts do you most commonly get hooked by? Not generic thoughts — your specific ones. The permission-giving ones, the hopeless ones, the justifying ones. Name them."
      },
      {
        id: "q2",
        question: "What recurring 'stories' does your mind run? What would you name them? Practice naming them out loud."
      },
      {
        id: "q3",
        question: "Try saying your most powerful negative self-belief as 'I'm having the thought that...' What happens? Does it land differently? Why or why not?"
      },
      {
        id: "q4",
        question: "What is the difference between 'I am broken' and 'I am having the thought that I am broken'? Write about this — don't just answer in your head."
      }
    ],
    exercises: [
      {
        id: "fusion-identification",
        title: "Identifying Fusion",
        instructions: "Identify thoughts you commonly get fused with and practice defusing.",
        fields: [
          {
            id: "thoughts",
            label: "List 5 thoughts that commonly 'hook' you and drive your behavior:",
            type: "textarea",
            placeholder: "1.\n2.\n3.\n4.\n5."
          },
          {
            id: "reframe",
            label: "Rewrite each thought using 'I'm having the thought that...'",
            type: "textarea",
            placeholder: "1. I'm having the thought that...\n2.\n3.\n4.\n5."
          }
        ]
      },
      {
        id: "naming-stories",
        title: "Naming Your Stories",
        instructions: "Identify recurring thought patterns and give them names.",
        fields: [
          {
            id: "story1",
            label: "Describe a recurring 'story' your mind tells (e.g., the failure story, the hopeless story):",
            type: "textarea",
            placeholder: "Describe the story..."
          },
          {
            id: "name1",
            label: "What will you name this story?",
            type: "text",
            placeholder: "The _______ Story"
          },
          {
            id: "story2",
            label: "Describe another recurring story:",
            type: "textarea",
            placeholder: "Describe the story..."
          },
          {
            id: "name2",
            label: "What will you name this story?",
            type: "text",
            placeholder: "The _______ Story"
          }
        ]
      },
      {
        id: "defusion-practice",
        title: "Defusion Practice Log",
        instructions: "Practice defusion techniques throughout the week and record your experiences.",
        fields: [
          {
            id: "technique1",
            label: "Practice 'I'm having the thought that...' with an intrusive thought. What happened?",
            type: "textarea",
            placeholder: "Record your experience..."
          },
          {
            id: "technique2",
            label: "Practice 'Naming the Story' when a recurring pattern shows up. What happened?",
            type: "textarea",
            placeholder: "Record your experience..."
          },
          {
            id: "technique3",
            label: "Practice defusing from an urge. How did you observe it without acting on it?",
            type: "textarea",
            placeholder: "Record your experience..."
          },
          {
            id: "learning",
            label: "What did you learn from practicing defusion this week?",
            type: "textarea",
            placeholder: "Key learnings..."
          }
        ]
      }
    ],
    homeworkChecklist: [
      "Read all Week 10 material",
      "Complete the Identifying Fusion exercise — name your specific hooks, not generic ones",
      "Name at least two recurring stories your mind runs and give them names you'll actually use",
      "Practice 'I'm having the thought that...' with real thoughts this week — not hypothetical ones",
      "Practice defusing from at least one urge this week and record what happened",
      "Complete the Defusion Practice Log honestly — including times it didn't work",
      "Complete daily check-ins for all 7 days"
    ]
  },

  11: {
    weekNumber: 11,
    title: "The Part of You That Doesn't Change",
    phase: 2,
    phaseName: "Integration & Values",
    overview: "You've learned to step back from your thoughts. Now you go deeper: you learn to step back from your identity. Who you are is not the same as what you've done, what you feel, or what your mind tells you. There is a part of you that has been watching this whole story unfold. That part cannot be broken. This week, you find it.",
    teaching: [
      {
        id: "observer-self",
        title: "The Steady Observer",
        content: [
          "Here is something worth considering carefully: you have had thousands of thoughts throughout your life. Thoughts about who you are, what you're worth, what you're capable of. Most of those thoughts have changed — the beliefs you held at fifteen are not the beliefs you hold now. But YOU — the one who had those thoughts, and noticed them changing — you have been present through all of it.",
          "You have experienced enormous pain. Shame, fear, grief, anger. You have experienced good things too. Joy, connection, moments of real clarity. All of those emotions have come and gone. But YOU — the one experiencing them — have been continuously present. The contents of your experience have changed constantly. The container has remained.",
          "ACT calls this the 'observing self' or 'self-as-context.' It is the part of you that is aware of your thoughts without being your thoughts. The part that notices your feelings without being your feelings. The part that is watching this recovery process happen — that can see the cycle, name the triggers, recognize the distortions.",
          "You are not your thoughts. You are not your urges. You are not your emotions. You are not your history. You are not your diagnosis. You are not your shame. You are the one who has been noticing all of these things. That observer — stable, aware, unchosen — is who you are at the deepest level."
        ]
      },
      {
        id: "conceptualized-self",
        title: "The Problem With the Story You Tell About Yourself",
        content: [
          "Most of us relate to ourselves through a conceptualized self — the story we tell about who we are. 'I am an addict.' 'I am broken.' 'I am a failure.' 'I am my urges.' 'I am what I've done.' These stories feel like facts. They are not facts. They are narratives constructed from experience, often painful experience, and they have been mistaken for identity.",
          "When you're fused with your conceptualized self, change feels impossible. If 'I AM broken,' then being broken is what I am. If 'I AM my behavior,' then stopping the behavior would mean ceasing to exist in some fundamental sense. The fused identity makes recovery feel like self-destruction.",
          "Men with CSBD who stay stuck are very often men who have fused with an identity that either excuses the behavior ('this is just who I am') or makes change feel futile ('I'm too broken to be different'). Both forms of fusion serve the same function: they protect you from the painful work of actual change by making change seem impossible.",
          "Self-as-context offers a different frame entirely. You are not your behavior. You have engaged in behavior. You are not your shame. You have experienced shame. You are not your history. You have a history. The difference is everything."
        ]
      },
      {
        id: "two-selves",
        title: "The Two Parts of You",
        content: [
          "THE THINKING SELF is the part of you generating content: thoughts, judgments, stories, urges, memories, predictions. It's busy, loud, and often wrong. It's the voice that says 'I'll never change,' 'I deserve this,' 'Nobody knows what I'm really like.' It's also the voice that said 'I need to do something about this' and brought you here.",
          "THE OBSERVING SELF is the part of you that notices all of that content. It doesn't generate thoughts — it watches them. It doesn't have urges — it observes them. It doesn't tell stories about you — it watches the stories being told.",
          "A useful way to access the observer: Close your eyes and notice that you can observe your thoughts without being them. Notice that you can observe your emotional state without drowning in it. Notice that you can observe your urges without obeying them. Whatever you just noticed from — that's it. That's the observer. That's the stable ground.",
          "Nothing you have ever felt, thought, or done has damaged the observing self. It is always there. Always aware. Always capable of noticing what is happening. Recovery, in part, is the practice of identifying with the observer rather than with the content it observes."
        ]
      },
      {
        id: "identity-transformation",
        title: "Nothing You've Done Has Broken This",
        content: [
          "This is probably the most important thing in Week 11: the observer self — your deepest level of selfhood — is intact. It has not been corrupted by the behavior. It has not been destroyed by the shame. It is not defined by the worst things you've done.",
          "This is not a therapeutic reassurance. It's not someone being kind to you. It's a structural claim. If you can observe your behavior — if you can see that it's a pattern, name it, and recognize that you don't want to live this way — then there is a part of you that is not the behavior. That part is where recovery is possible.",
          "The men who recover from CSBD are not men who had less severe patterns or more willpower. They are men who found something stable inside themselves to stand on while they did the work of change. The observing self is that stable ground.",
          "Whatever you've done, whatever you feel, whatever your mind is telling you about who you are: there is a part of you that is noticing all of that, that has been present through all of it, and that cannot be reduced to any of it. Find that. Stand there. Do the work from there."
        ]
      },
      {
        id: "values-aligned-identity",
        title: "Building a Values-Aligned Identity",
        content: [
          "Identifying with the observer self doesn't mean having no identity. It means your identity is no longer defined by your worst behavior or your most painful history. It can be defined instead by your values and the direction you're choosing.",
          "Complete this sentence: 'I am a man who...' Not based on your history. Based on your values. 'I am a man who chooses honesty even when it's costly.' 'I am a man who shows up for the people who depend on him.' 'I am a man who is doing the hard work of becoming who he wants to be.'",
          "These statements are not positive affirmations pretending the past didn't happen. They're directional claims — about where you're headed, not where you've been. Identity formed around direction is flexible enough to survive setbacks. Identity formed around behavior is destroyed by every slip.",
          "Next week you'll clarify your values in depth. For now, begin practicing the identity shift: when you catch yourself saying 'I am broken' or 'I am my behavior,' try: 'I am a man who has struggled with this, and I am the one who is choosing to change.' Both of those things can be true."
        ]
      }
    ],
    reflectionQuestions: [
      {
        id: "q1",
        question: "What labels or identities have you fused with? 'I am an addict.' 'I am broken.' 'I am my urges.' Write them out. Where did they come from?"
      },
      {
        id: "q2",
        question: "Try sitting quietly for two minutes and observing your thoughts without engaging them. What did you notice? Was there a part of you that was doing the noticing? Describe that experience."
      },
      {
        id: "q3",
        question: "What is true about you — qualities, commitments, ways of being — that your behavior hasn't touched? What does the behavior not define?"
      },
      {
        id: "q4",
        question: "Complete this: 'I am a man who...' Based on your values, not your history. Write three versions. Which one feels most true to who you're becoming?"
      }
    ],
    exercises: [
      {
        id: "identity-assessment",
        title: "Identity Fusion Assessment",
        instructions: "Explore the identities you have fused with — the stories you tell about who you are.",
        fields: [
          {
            id: "labels",
            label: "What labels or identities do you apply to yourself? Write the actual statements your mind uses — 'I am broken,' 'I am an addict,' 'I am my urges,' etc.",
            type: "textarea",
            placeholder: "List the identities you've fused with..."
          },
          {
            id: "origins",
            label: "Where did these labels come from? What experiences, relationships, or moments created them?",
            type: "textarea",
            placeholder: "Explore the origins..."
          },
          {
            id: "cost",
            label: "What has fusing with these identities cost you? How have they made change feel impossible or have they justified the behavior?",
            type: "textarea",
            placeholder: "Consider the costs..."
          }
        ]
      },
      {
        id: "observer-practice",
        title: "Observer Self Practice",
        instructions: "Practice connecting with the observing self — the part of you that notices without being what it notices.",
        fields: [
          {
            id: "meditation",
            label: "Find a quiet place. Sit for five minutes. Notice your thoughts without engaging them — observe them passing. Notice your feelings without drowning in them. Notice sensations in your body. Then notice: there is something doing all this noticing. That is you at the deepest level. What was this experience like?",
            type: "textarea",
            placeholder: "Describe your experience..."
          },
          {
            id: "insight",
            label: "What did you learn about the difference between who you are and what you experience? What was the observer noticing?",
            type: "textarea",
            placeholder: "Key insights..."
          },
          {
            id: "application",
            label: "How does the observer self perspective change how you relate to urges, shame, or the belief that you're broken? Be specific.",
            type: "textarea",
            placeholder: "Application of insights..."
          }
        ]
      },
      {
        id: "beyond-behavior",
        title: "Who Am I Beyond This Behavior?",
        instructions: "Explore who you are independent of your struggle — and begin building a values-based identity.",
        fields: [
          {
            id: "qualities",
            label: "What positive qualities do you have that the behavior hasn't taken from you? What remains true about you regardless of what you've done?",
            type: "textarea",
            placeholder: "List your enduring qualities..."
          },
          {
            id: "roles",
            label: "What roles do you play that aren't defined by CSBD? Father, husband, friend, professional, community member. What do you bring to those roles?",
            type: "textarea",
            placeholder: "List your roles and what you bring to them..."
          },
          {
            id: "contributions",
            label: "What do you contribute to the lives of others? What would be missing if you weren't there?",
            type: "textarea",
            placeholder: "Your contributions..."
          },
          {
            id: "values-statement",
            label: "Complete this three times: 'I am a man who...' Base it on your values and direction, not your history.",
            type: "textarea",
            placeholder: "I am a man who...\nI am a man who...\nI am a man who..."
          }
        ]
      }
    ],
    homeworkChecklist: [
      "Read all Week 11 material",
      "Complete the Identity Fusion Assessment — write out the actual labels, not summaries of them",
      "Practice the observer self meditation at least three times this week and record what you notice each time",
      "Complete the 'Who Am I Beyond This Behavior?' exercise with real specificity",
      "Write your three 'I am a man who...' statements and read them each morning this week",
      "Notice this week when you fuse with a negative identity label — and practice seeing it as a label rather than a fact",
      "Complete daily check-ins for all 7 days"
    ]
  },

  12: {
    weekNumber: 12,
    title: "What You're Actually Living For",
    phase: 2,
    phaseName: "Integration & Values",
    overview: "You now have a stable observer to stand on. You can defuse from thoughts. You can make room for discomfort. Now comes the question that makes all of that work worth doing: what are you actually living for? Not what you should care about. Not what would make other people approve of you. What actually matters to you — deeply, truly — when you strip away the noise?",
    teaching: [
      {
        id: "what-are-values",
        title: "What Values Actually Are",
        content: [
          "Values are not rules. They are not the things you're supposed to want or the things your parents told you to care about. Values are your deepest freely chosen commitments about how you want to live — what kind of person you want to be, what you want to stand for, what you want your life to be about when it's over.",
          "Values are not goals. A goal is something you can achieve and check off: stop acting out for 90 days, repair the marriage, get the promotion. A value is a direction — something you move toward continuously, that you never fully arrive at. 'Being a faithful and present husband' is a value. 'Having the conversation I've been avoiding' is a goal that serves that value.",
          "You cannot fail a value. If you have a slip, you haven't failed at the value of integrity — you've stepped away from it momentarily. And you can step back toward it in the very next moment. That's what makes values more resilient than goals as a foundation for recovery.",
          "This week is real work, not a worksheet. Don't write what sounds good. Write what's actually true — what you care about when you're most honest with yourself, in your quietest moments, without anyone watching."
        ]
      },
      {
        id: "values-vs-goals",
        title: "Values vs. Goals: The Distinction That Changes Everything",
        content: [
          "GOALS have endpoints. They can be achieved, and then they're done. Goals are critical — they translate values into specific, measurable actions. But goals without values are arbitrary. They're just things on a list. Values give goals meaning.",
          "VALUES have no endpoint. 'Being honest' is not a finish line you cross. It's a direction you face every moment. 'Being a committed father' is not something you complete. It's who you choose to be, in every interaction, for as long as you live.",
          "This is also why values-based recovery is more durable than goal-based recovery. If your goal is '90 days sober,' what happens at day 91? If your value is 'living with integrity,' the direction never expires.",
          "For every goal you have in recovery, ask: what value does this serve? Why does it actually matter? Get to the heart of it. 'I want to stop this behavior because... it's ruining my marriage. Why does that matter? Because being a faithful partner is one of the most important things I can be. That's a value.' That's what you're actually working toward."
        ]
      },
      {
        id: "why-values-matter",
        title: "Why This Changes Recovery",
        content: [
          "Here is the limitation of Phase 1, stated plainly: running from the behavior is exhausting. You can maintain it through willpower and fear for a while. But eventually, the tension between the discomfort of abstinence and the relief of the behavior tips back in the wrong direction. Phase 1 tools help. They're not enough on their own.",
          "Phase 2 turns the frame. Instead of running away from the behavior, you start running toward something. Values provide the destination — the direction that is more compelling than the relief the behavior provides. Men who recover long-term are almost universally men who found something to live FOR, not just something to live WITHOUT.",
          "When an urge hits and you can ask 'what kind of man do I want to be right now?' and have a real answer — an answer that is more compelling than the urge — you have something that no amount of willpower or cognitive restructuring can provide.",
          "That answer only comes from doing this week's work honestly. Not aspirationally. Not performing recovery. Sitting with the actual question of what matters to you, and writing what's actually true."
        ]
      },
      {
        id: "value-domains",
        title: "Your Values Across Your Life",
        content: [
          "Values appear across all of life's domains. The work here is to identify what you genuinely care about in each area — not what you think you should care about.",
          "RELATIONSHIPS AND FAMILY: What kind of partner, father, son, brother do you want to be? Not who you've been — who you want to be.",
          "WORK AND VOCATION: What do you want to contribute through your work? What qualities do you want to bring to it? What matters to you professionally beyond just making money?",
          "PERSONAL INTEGRITY AND GROWTH: What kind of man are you trying to become? What qualities do you want to be known for — inside your family, inside yourself?",
          "HEALTH AND PHYSICAL CARE: How do you want to treat the only body you have? What does caring for yourself actually look like?",
          "COMMUNITY AND FAITH: What do you owe to others beyond your immediate circle? What larger commitments — to faith, to community, to humanity — matter to you?",
          "Be specific. 'Being a good dad' is a start. 'Being the kind of father who shows up for the hard conversations, who my kids can come to about anything, who doesn't live a double life' is a value."
        ]
      },
      {
        id: "values-and-behavior",
        title: "The Gap Between What You Believe and How You Live",
        content: [
          "Most men in this program have values they believe in genuinely. They love their families. They believe in honesty. They care about who they're becoming. The CSBD exists in direct conflict with all of those values, and they know it.",
          "The gap between values and behavior is painful. It produces shame. It also produces motivation — if you can stay with it instead of numbing it. The question 'am I living according to what I actually believe?' is one of the most clarifying questions available to you.",
          "For each value, ask: what would I be doing if I were actually living this? What would someone watching me see? Then ask honestly: am I doing those things? If not, what's stopping me?",
          "Next week we move into committed action — specific, concrete steps toward your values. For this week, the work is to get the values right. Spend real time with the exercises. Don't rush. What you write here is the compass you'll carry into the rest of the program."
        ]
      }
    ],
    reflectionQuestions: [
      {
        id: "q1",
        question: "When you're most honest with yourself — not performing, not aspiring — what do you actually care about most? What does your life being well-lived mean to you?"
      },
      {
        id: "q2",
        question: "What values has your behavior most directly violated? Name the conflict plainly, without softening it."
      },
      {
        id: "q3",
        question: "If you were living fully according to your deepest values, what would be concretely different about your life one year from now?"
      },
      {
        id: "q4",
        question: "What values have been neglected or buried during this struggle? What would it mean to reclaim them?"
      }
    ],
    exercises: [
      {
        id: "values-clarification",
        title: "Values Clarification",
        instructions: "Explore your values in each major life domain. Be specific and honest. Don't write what sounds good — write what's actually true for you.",
        fields: [
          {
            id: "relationships",
            label: "RELATIONSHIPS: What kind of partner, parent, or family member do you want to be? Be specific about the qualities and behaviors that matter, not just the role.",
            type: "textarea",
            placeholder: "Describe your relationship values..."
          },
          {
            id: "work",
            label: "WORK: What do you want to contribute through your work? What qualities do you want to bring to it?",
            type: "textarea",
            placeholder: "Describe your work values..."
          },
          {
            id: "personal",
            label: "PERSONAL INTEGRITY: What kind of man are you striving to become? What qualities do you want to be known for — not publicly, but in the privacy of your own integrity?",
            type: "textarea",
            placeholder: "Describe your integrity values..."
          },
          {
            id: "health",
            label: "HEALTH: How do you want to treat your body? What does taking care of yourself actually look like?",
            type: "textarea",
            placeholder: "Describe your health values..."
          },
          {
            id: "community",
            label: "COMMUNITY: What kind of friend, neighbor, or citizen do you want to be? How do you want to contribute?",
            type: "textarea",
            placeholder: "Describe your community values..."
          },
          {
            id: "spirituality",
            label: "SPIRITUALITY/MEANING: What gives your life meaning? What connects you to something larger?",
            type: "textarea",
            placeholder: "Describe your spiritual/meaning values..."
          }
        ]
      },
      {
        id: "values-ranking",
        title: "Core Values Identification",
        instructions: "From all the values you identified, select and rank your top 5 core values.",
        fields: [
          {
            id: "top5",
            label: "List your top 5 core values in order of importance:",
            type: "textarea",
            placeholder: "1.\n2.\n3.\n4.\n5."
          },
          {
            id: "why",
            label: "For each value, write why it matters to you:",
            type: "textarea",
            placeholder: "1. [Value] matters because...\n2.\n3.\n4.\n5."
          }
        ]
      },
      {
        id: "values-action-gap",
        title: "Values-Action Gap Analysis",
        instructions: "Examine the gap between your values and your current behavior.",
        fields: [
          {
            id: "gap",
            label: "For each of your top 5 values, rate how consistently you're living it (1-10):",
            type: "textarea",
            placeholder: "1. [Value]: /10\n2. [Value]: /10\n3.\n4.\n5."
          },
          {
            id: "barriers",
            label: "What's preventing you from living these values more fully?",
            type: "textarea",
            placeholder: "Identify barriers..."
          },
          {
            id: "one-step",
            label: "For the value with the biggest gap, what's ONE action you could take this week to move toward it?",
            type: "textarea",
            placeholder: "One concrete action..."
          }
        ]
      },
      {
        id: "valued-living-assessment",
        title: "Valued Living Assessment (VLQ-Inspired)",
        instructions: "For each life domain, rate both IMPORTANCE (how much this area matters to you) and CONSISTENCY (how consistently you live according to your values in this area). Use a scale of 1-10.",
        fields: [
          {
            id: "family",
            label: "FAMILY: How important is family to you? How consistently are you living your family values?",
            type: "textarea",
            placeholder: "Importance: /10\nConsistency: /10\nGap (if any) and why:"
          },
          {
            id: "marriage-intimate",
            label: "MARRIAGE/INTIMATE RELATIONSHIPS: How important? How consistently are you living these values?",
            type: "textarea",
            placeholder: "Importance: /10\nConsistency: /10\nGap (if any) and why:"
          },
          {
            id: "parenting",
            label: "PARENTING (if applicable): How important? How consistent?",
            type: "textarea",
            placeholder: "Importance: /10\nConsistency: /10\nGap (if any) and why:\n(Write N/A if not applicable)"
          },
          {
            id: "friendship",
            label: "FRIENDSHIP/SOCIAL: How important? How consistent?",
            type: "textarea",
            placeholder: "Importance: /10\nConsistency: /10\nGap (if any) and why:"
          },
          {
            id: "work",
            label: "WORK/CAREER: How important? How consistent?",
            type: "textarea",
            placeholder: "Importance: /10\nConsistency: /10\nGap (if any) and why:"
          },
          {
            id: "education-growth",
            label: "EDUCATION/PERSONAL GROWTH: How important? How consistent?",
            type: "textarea",
            placeholder: "Importance: /10\nConsistency: /10\nGap (if any) and why:"
          },
          {
            id: "recreation",
            label: "RECREATION/LEISURE: How important? How consistent?",
            type: "textarea",
            placeholder: "Importance: /10\nConsistency: /10\nGap (if any) and why:"
          },
          {
            id: "spirituality",
            label: "SPIRITUALITY/FAITH: How important? How consistent?",
            type: "textarea",
            placeholder: "Importance: /10\nConsistency: /10\nGap (if any) and why:"
          },
          {
            id: "health",
            label: "PHYSICAL HEALTH/SELF-CARE: How important? How consistent?",
            type: "textarea",
            placeholder: "Importance: /10\nConsistency: /10\nGap (if any) and why:"
          },
          {
            id: "community",
            label: "COMMUNITY/CITIZENSHIP: How important? How consistent?",
            type: "textarea",
            placeholder: "Importance: /10\nConsistency: /10\nGap (if any) and why:"
          },
          {
            id: "biggest-gap",
            label: "Which domain has the BIGGEST gap between importance and consistency? What one action will you take this week to close that gap?",
            type: "textarea",
            placeholder: "Domain:\nAction I will take:"
          }
        ]
      }
    ],
    homeworkChecklist: [
      "Read all Week 12 material",
      "Complete the Values Clarification exercise for all life domains — be specific, not generic",
      "Identify and rank your top 5 core values with a real explanation of why each one matters",
      "Complete the Values-Action Gap Analysis honestly — rate where you actually are, not where you want to be",
      "Take at least one concrete values-based action this week and record what it was",
      "Share your top three values with your accountability partner and discuss the gap",
      "Complete daily check-ins for all 7 days"
    ]
  },

  13: {
    weekNumber: 13,
    title: "Stop Running",
    phase: 2,
    phaseName: "Integration & Values",
    overview: "You've spent nine weeks building tools. You've learned to see the cycle, challenge the thoughts, defuse from your mind's stories, find the stable ground of the observer self, and identify what you're actually living for. This week brings you to the hardest skill in the entire program: acceptance. Not resignation. Not giving up. The active, courageous choice to stop running from what hurts.",
    teaching: [
      {
        id: "what-is-acceptance",
        title: "What Acceptance Actually Is",
        content: [
          "Acceptance does not mean wanting the pain. It does not mean thinking the pain is acceptable. It does not mean giving up. Acceptance means stopping the war — choosing to no longer spend energy trying to force reality into a shape it refuses to take.",
          "You cannot think your way out of an urge. You cannot shame yourself free of grief. You cannot will away the anxiety that precedes a high-risk situation. These are not logical failures. They are the nature of internal experience. It does not respond to force. It responds to observation.",
          "The willingness introduced in Week 9 gets deepened here into a full practice. Willingness was the concept. Acceptance is the embodied skill — the moment-by-moment choice to have what you're having, feel what you're feeling, and continue to act according to your values anyway.",
          "This is the most difficult thing you will be asked to do in this program. Not because it requires great willpower — it actually requires the opposite of willpower. It requires that you put down the weapon you've been using against yourself and stand in the presence of what you've been running from."
        ]
      },
      {
        id: "clean-vs-dirty-pain",
        title: "Clean Pain and Dirty Pain",
        content: [
          "CLEAN PAIN is the unavoidable cost of being alive and caring about things. The anxiety before a difficult conversation. The grief after a loss. The shame after acting out. The loneliness of a Friday night you don't know what to do with. Clean pain is real, and it hurts. It is not optional.",
          "DIRTY PAIN is what you add. The shame about the shame. The anxiety about the anxiety. 'I shouldn't be feeling this.' 'What's wrong with me that I still want this?' 'If I were really in recovery, I wouldn't be struggling.' Dirty pain is self-inflicted. It is created by the fight against clean pain.",
          "Most of what makes CSBD so persistent is dirty pain. The behavior produces clean pain — guilt, relational damage, loss of integrity. The man then responds to that clean pain with dirty pain — self-punishment, hiding, despair — which creates more vulnerability, which drives more behavior. The cycle is powered by dirty pain.",
          "Acceptance does not eliminate clean pain. Clean pain is the cost of living a full life. Acceptance eliminates dirty pain by removing the fight. When you stop fighting the anxiety, the anxiety is just anxiety — not a catastrophe. When you stop fighting the urge, the urge is just an urge — not a verdict about your character."
        ]
      },
      {
        id: "mindfulness-basics",
        title: "Present Moment as Anchor",
        content: [
          "The behavior almost never happens in the present moment. It happens in the imagined future ('I'll feel better if I do this') or the remembered past ('I always do this eventually'). It happens in fantasy, in anticipation, in the story your mind tells about what relief will feel like.",
          "The present moment is where the behavior doesn't exist yet. It's where there is only this breath, this sensation, this choice. Mindfulness — present moment awareness — is not a relaxation technique. It's a relocation. You return from the mental future where the behavior is already happening to the actual present where it is not.",
          "CSBD acts in a dissociative fog. The decision to act out often happens before conscious awareness catches up — the man is already deep in the ritual before he recognizes what's happening. Mindfulness interrupts this by maintaining contact with the present, where he can see the choice clearly.",
          "Present moment awareness doesn't require meditation. It requires the practice of returning — when you notice you've drifted into mental rehearsal or fantasy, you return to now. What do you see? What do you hear? What do you feel in your body right now? That's it. Return to now. Again and again."
        ]
      },
      {
        id: "urge-mindfulness",
        title: "Sitting With an Urge",
        content: [
          "The standard response to an urge is to run — to distract, suppress, escape, or act out. Week 13 asks you to try something different: sit with the urge and observe it. Not endure it heroically. Not fight it. Observe it.",
          "When an urge is present, locate it in your body first. Where exactly is it? What does it feel like as pure physical sensation — before you put any words or meanings on it? Heat? Pressure? Tension? Restlessness? Most men discover that the urge, as a physical sensation, is actually not that intense. It's the story around the sensation — 'I can't stand this,' 'this is going to keep getting worse,' 'I have to do something' — that makes it overwhelming.",
          "Observe the sensation with curiosity: 'There is a pull right now. I can feel it in my chest. It's about a 6 out of 10. I'm watching it.' Notice what happens over the next few minutes. Urges peak and fall. Every time. If you observe an urge without feeding it with fantasy or fighting it with suppression, it will fall within minutes.",
          "You are practicing what researchers call 'urge surfing.' You ride the wave. You don't paddle into it (acting out) or try to stop the ocean (suppression). You stay on the board and let the wave pass. With repetition, this becomes automatic — and the waves become shorter and less powerful."
        ]
      },
      {
        id: "expansion",
        title: "Creating Space for Difficult Emotions",
        content: [
          "Acceptance operates through the body as much as through the mind. Here is the core practice, called expansion: when you notice a difficult emotion, you stop trying to make it smaller and instead make space for it to be present.",
          "THE PRACTICE: Name what you're feeling. Find it in your body — where is it located, what does it feel like? Breathe into that area of your body, as if the breath can enter the space where the emotion lives. Imagine the space around the sensation expanding — not to make it go away, but to make room for it. Say to yourself: 'I can have this feeling. It doesn't have to leave for me to be okay.'",
          "This feels counterintuitive because every instinct says 'make it smaller.' The practice asks you to make it bigger — to expand your tolerance rather than compress the emotion. What typically happens is that the emotion loses its urgency when it's no longer being fought. It may still be present, but it is no longer driving.",
          "Practice this with every significant emotion this week. Not just urges — shame, loneliness, anxiety, grief, anger. The men who make the most progress in Phase 2 are the ones who practice acceptance with the full range of their emotional life, not just with the symptoms of the behavior."
        ]
      }
    ],
    reflectionQuestions: [
      {
        id: "q1",
        question: "What emotions or experiences are you most unwilling to have? What do you do — automatically, without thinking — to avoid them?"
      },
      {
        id: "q2",
        question: "Identify a specific instance of dirty pain from this week. What was the clean pain (the original feeling)? What did you add on top of it?"
      },
      {
        id: "q3",
        question: "When you imagine accepting a urge fully — not fighting it, not acting on it, just having it — what do you notice? What comes up? What's the fear?"
      },
      {
        id: "q4",
        question: "What has the running actually cost you? Not in abstract — specifically. What have you missed, numbed, or avoided being fully present for?"
      }
    ],
    exercises: [
      {
        id: "clean-dirty-pain",
        title: "Clean Pain vs. Dirty Pain",
        instructions: "Use a real, recent experience — not a hypothetical. Separate what actually happened from what you added.",
        fields: [
          {
            id: "experience",
            label: "Describe a specific recent difficult experience — an urge, an emotional state, a conflict:",
            type: "textarea",
            placeholder: "Describe the experience specifically..."
          },
          {
            id: "clean-pain",
            label: "What was the clean pain? The original, unavoidable discomfort — before you responded to it:",
            type: "textarea",
            placeholder: "Describe the clean pain..."
          },
          {
            id: "dirty-pain",
            label: "What dirty pain did you add? Shame about feeling this. Anxiety about the anxiety. Self-criticism. Catastrophizing.",
            type: "textarea",
            placeholder: "Describe the dirty pain you added..."
          },
          {
            id: "acceptance",
            label: "What would it look like to fully accept the clean pain without adding any dirty pain? What would you do differently?",
            type: "textarea",
            placeholder: "Describe an acceptance response..."
          }
        ]
      },
      {
        id: "body-scan",
        title: "Present Moment Practice",
        instructions: "Sit quietly for 10 minutes. Move your attention through your body slowly, noticing sensations without trying to change them. Record what you found.",
        fields: [
          {
            id: "practice",
            label: "What did you notice during the practice? Where was there tension, discomfort, ease? What surprised you?",
            type: "textarea",
            placeholder: "Describe what you noticed..."
          },
          {
            id: "difficult",
            label: "Were there areas of discomfort? What was your instinct — to move away from them, or stay with them? What did you choose?",
            type: "textarea",
            placeholder: "Describe your response to discomfort..."
          }
        ]
      },
      {
        id: "expansion-practice",
        title: "Expansion Practice",
        instructions: "Practice the expansion technique with a real difficult emotion this week — not a mild one. Choose something with actual charge.",
        fields: [
          {
            id: "emotion",
            label: "What emotion did you practice with? Be specific — not just 'anxiety,' but what kind, about what:",
            type: "textarea",
            placeholder: "Name the emotion and its context..."
          },
          {
            id: "location",
            label: "Where was it in your body? What did it actually feel like as physical sensation?",
            type: "textarea",
            placeholder: "Describe the physical experience..."
          },
          {
            id: "result",
            label: "What happened when you made room for it instead of fighting it? Did the intensity change? What did you notice?",
            type: "textarea",
            placeholder: "Describe what happened..."
          },
          {
            id: "intensity",
            label: "What was difficult about this practice? What did your mind tell you while you were trying to do it?",
            type: "textarea",
            placeholder: "Describe the difficulty and what your mind said..."
          }
        ]
      },
      {
        id: "daily-acceptance",
        title: "Daily Acceptance Log",
        instructions: "Each day this week, notice one moment when you were unwilling to have an experience, and practice acceptance with it. Record what happened.",
        fields: [
          {
            id: "log",
            label: "Daily log — what you were unwilling to have, what you did instead, and what practicing acceptance looked like:",
            type: "textarea",
            placeholder: "Day 1:\nDay 2:\nDay 3:\nDay 4:\nDay 5:\nDay 6:\nDay 7:"
          },
          {
            id: "learning",
            label: "What did you learn about your relationship with discomfort over this week? What changed, even slightly?",
            type: "textarea",
            placeholder: "Key learnings..."
          }
        ]
      }
    ],
    homeworkChecklist: [
      "Read all Week 13 material",
      "Complete the Clean Pain vs. Dirty Pain exercise using a real recent experience",
      "Practice the body scan at least three times and record what you found each time",
      "Practice the expansion technique with a genuinely difficult emotion — not a mild one",
      "Complete the daily acceptance log for all 7 days",
      "Practice urge surfing with at least one real urge this week — observe without acting or fighting",
      "Complete daily check-ins for all 7 days"
    ]
  },

  14: {
    weekNumber: 14,
    title: "From Knowing to Doing",
    phase: 2,
    phaseName: "Integration & Values",
    overview: "You've clarified your values. You know what you're living for. You've built the internal skills — defusion, acceptance, present moment awareness, the observer self. Now comes the simplest and hardest part: doing it. Not perfectly. Not when you feel ready. Not when the conditions are ideal. Now, with whatever discomfort is present, moving in the direction that matters.",
    teaching: [
      {
        id: "what-is-committed-action",
        title: "The Gap Between Knowing and Doing",
        content: [
          "Most men in recovery know exactly what they should do. They've read the books, attended the groups, completed the exercises. They know that isolation is a risk factor. They know that certain thoughts are distortions. They know what their values are. And they still act out.",
          "The gap between knowing and doing is not an information problem. It's not solved by more insight, more understanding, more content. It's solved by one thing: doing the next right action regardless of how you feel about it.",
          "Committed action is the ACT term for this. It means acting in the direction of your values — not your feelings, not your urges, not your comfort, not your mood. You might feel anxious, unmotivated, discouraged, or terrified. You act according to your values anyway. That's it. That's committed action.",
          "This sounds simple. It is not easy. It requires everything you've built over the last thirteen weeks — the defusion, the acceptance, the present moment contact, the observer self, the values clarity — all of it deployed in service of a single act in a single moment."
        ]
      },
      {
        id: "motivation-vs-commitment",
        title: "Motivation Is the Wrong Goal",
        content: [
          "Motivation is a feeling. It rises and falls. It responds to novelty, to success, to social reinforcement. It disappears in the face of fatigue, discouragement, and monotony. Waiting for motivation is how men stay stuck for years — endlessly starting, slipping, starting again, always at the mercy of an emotional state they cannot control.",
          "Commitment is a choice, made in advance, maintained by values rather than feelings. 'I will do this because it reflects who I am trying to be, not because I feel like it.' Commitment survives the morning when you don't want to get up. It survives the evening when the urge is strong. It survives the day when nothing feels worth it.",
          "Recovery requires commitment, not motivation. You will have periods of high motivation — early on, after a close call, when something costs you. You will have long stretches of low motivation — when recovery feels routine, when you're tired, when the behavior's consequences feel distant. The commitment has to hold through both.",
          "Here is the practical implication: never make your recovery practices conditional on how you feel. Don't say 'I'll do my check-in when I feel up to it.' Say 'I do my check-in. That's who I am now.' The unconditional practice is the one that actually holds."
        ]
      },
      {
        id: "small-steps",
        title: "Small and Consistent Beats Large and Heroic",
        content: [
          "One of the most common patterns in early recovery is heroic commitment followed by collapse. The man makes enormous promises — he'll do everything perfectly, attend every group, never slip again. He holds it for a few weeks on sheer willpower. Then the willpower runs out and he stops everything.",
          "Small, consistent, sustainable actions beat large heroic commitments every time. The man who does a 5-minute check-in every day for a year has built more recovery than the man who does an hour-long deep session for two weeks and then quits.",
          "The compound effect applies to recovery as much as to finance: small deposits, made consistently, grow into something no single large deposit can match. Every day you complete a check-in, call an accountability partner, read a page, do a brief defusion practice — that compounds. Six months of daily small acts builds a nervous system that knows how to be in recovery.",
          "This week, don't aim for heroic change. Aim for sustainable daily action. Choose three to five specific behaviors that reflect your values — behaviors small enough to do on your worst day — and commit to doing them every day without exception."
        ]
      },
      {
        id: "barriers-to-action",
        title: "The Barriers Are the Practice",
        content: [
          "Every barrier to committed action is an invitation to practice everything you've learned. 'I don't feel like it' — defuse from the feeling and act anyway. 'I'll fail' — defuse from the prediction and act anyway. 'It won't make a difference' — defuse from the hopelessness story and act anyway. 'I'm too tired' — accept the tiredness and do the smaller version of the action. The barrier is not the obstacle to practice. The barrier IS the practice.",
          "The barriers you encounter most often are your specific practice areas. If 'I don't feel like it' is your main barrier, your practice is acting on values when motivation is low. If fear of failure is your barrier, your practice is tolerating the fear and moving forward. If perfectionism is your barrier, your practice is doing it imperfectly and continuing.",
          "Write down the top three barriers that have historically stopped you from taking values-based action. For each one, write a prepared response you will use when it shows up this week. Not a motivational response — a practical one. 'When I notice the thought [barrier], I will [specific action].' The response needs to be decided before the barrier appears, not during.",
          "Track your committed actions daily. Not to grade yourself — to see patterns. What kinds of days make action easier? What situations make it harder? What does the barrier look like when it first appears? The data will refine your plan."
        ]
      },
      {
        id: "smart-goals",
        title: "Translating Values Into Specific Behavior",
        content: [
          "A value is a direction. A committed action is a specific behavior in that direction, with a time and a frequency. 'Being a present father' is a value. 'Putting my phone in another room during dinner and asking my kids one question about their day' is a committed action.",
          "The more specific the action, the more likely it happens. 'I'll be more honest' fails. 'I will tell my wife one true thing about my week every Sunday evening' succeeds. Specificity removes ambiguity and ambiguity is where avoidance hides.",
          "For each of your top three values, identify one specific committed action you will take this week. It should be: specific enough that you know exactly when you've done it, small enough to do on a bad day, connected clearly to a value you've identified as important.",
          "Share your committed actions with your accountability partner before the week begins. Their knowing increases your likelihood of follow-through. Their asking about it at the end of the week closes the loop."
        ]
      }
    ],
    reflectionQuestions: [
      {
        id: "q1",
        question: "Where has the knowing-doing gap been most costly in your recovery? Where have you known what to do and not done it — repeatedly?"
      },
      {
        id: "q2",
        question: "What are the three barriers that most reliably stop you from taking values-based action? Be specific about what they look and sound like."
      },
      {
        id: "q3",
        question: "Name one time you took action despite not feeling ready or motivated. What happened? What did that cost you? What did it give you?"
      },
      {
        id: "q4",
        question: "What are the three smallest possible actions you could take daily — actions small enough to complete on your worst day — that would still reflect your values?"
      }
    ],
    exercises: [
      {
        id: "smart-goals",
        title: "Values-to-Action Translation",
        instructions: "For each of your top three values, identify one specific committed action — with a time, a frequency, and a way of tracking it.",
        fields: [
          {
            id: "this-week",
            label: "VALUE 1 — Action I'm committing to, when, how often, how I'll know I did it:",
            type: "textarea",
            placeholder: "Value:\nSpecific action:\nWhen/how often:\nHow I'll know I did it:"
          },
          {
            id: "this-month",
            label: "VALUE 2 — Action I'm committing to, when, how often, how I'll know I did it:",
            type: "textarea",
            placeholder: "Value:\nSpecific action:\nWhen/how often:\nHow I'll know I did it:"
          },
          {
            id: "three-months",
            label: "VALUE 3 — Action I'm committing to, when, how often, how I'll know I did it:",
            type: "textarea",
            placeholder: "Value:\nSpecific action:\nWhen/how often:\nHow I'll know I did it:"
          }
        ]
      },
      {
        id: "barrier-plan",
        title: "Barrier Response Plan",
        instructions: "Identify your top three barriers to committed action and write your prepared response to each — decided now, before the barrier appears.",
        fields: [
          {
            id: "barrier1",
            label: "Barrier 1: What specifically stops you most often? What does it look and sound like?",
            type: "textarea",
            placeholder: "Barrier:"
          },
          {
            id: "response1",
            label: "Prepared response: When I notice this barrier, I will...",
            type: "textarea",
            placeholder: "My prepared response:"
          },
          {
            id: "barrier2",
            label: "Barrier 2:",
            type: "textarea",
            placeholder: "Barrier:"
          },
          {
            id: "response2",
            label: "Prepared response:",
            type: "textarea",
            placeholder: "My prepared response:"
          },
          {
            id: "barrier3",
            label: "Barrier 3:",
            type: "textarea",
            placeholder: "Barrier:"
          },
          {
            id: "response3",
            label: "Prepared response:",
            type: "textarea",
            placeholder: "My prepared response:"
          }
        ]
      },
      {
        id: "weekly-tracker",
        title: "Daily Action Tracker",
        instructions: "Track your committed actions each day. Include the action, whether you completed it, and what barrier (if any) you encountered and how you responded.",
        fields: [
          {
            id: "tracking",
            label: "Daily log — action taken, completed or not, barrier encountered, how you responded:",
            type: "textarea",
            placeholder: "Day 1:\nDay 2:\nDay 3:\nDay 4:\nDay 5:\nDay 6:\nDay 7:"
          },
          {
            id: "easier",
            label: "What made it easier to take committed action this week?",
            type: "textarea",
            placeholder: "What helped..."
          },
          {
            id: "harder",
            label: "What made it harder? What do you want to adjust next week?",
            type: "textarea",
            placeholder: "What was challenging and what you'll adjust..."
          },
          {
            id: "impact",
            label: "What effect did consistent values-based action have on your urges, mood, or sense of yourself?",
            type: "textarea",
            placeholder: "Impact observed..."
          }
        ]
      }
    ],
    homeworkChecklist: [
      "Read all Week 14 material",
      "Complete the Values-to-Action Translation for your top three values",
      "Complete the Barrier Response Plan — decide your responses before the barriers appear",
      "Share your committed actions with your accountability partner before the week starts",
      "Take at least one committed action daily — small enough to do on a bad day",
      "Complete the Daily Action Tracker honestly, including when you didn't follow through",
      "Complete daily check-ins for all 7 days"
    ]
  },

  15: {
    weekNumber: 15,
    title: "Protect What You've Built",
    phase: 2,
    phaseName: "Integration & Values",
    overview: "You are two weeks from the end of this program. Which means you are not at the finish line — you are entering the most dangerous territory in recovery: the stretch when the initial urgency has faded, the early wins are behind you, and the long game begins. This week you build the structure that protects everything you've worked for.",
    teaching: [
      {
        id: "observer-self",
        title: "Why This Moment Is Risky",
        content: [
          "There is a predictable danger zone in recovery that claims a disproportionate number of men: the period after the acute crisis has passed. You came into this program with something broken — a relationship, a secret that finally surfaced, a level of self-disgust that made continuing impossible. That urgency drove you through the early weeks.",
          "Urgency is a fuel. It burns hot and it runs out. As the worst of the crisis recedes, as the initial relief of starting recovery fades into the grind of maintenance, the urgency diminishes. And with it, so does the vigilance. This is when men stop checking in, start letting structure slip, begin rationalizing small exceptions.",
          "This is not weakness. It is a predictable neurological pattern. The brain that found the behavior rewarding does not stop finding it rewarding because you decided to recover. It waits. It exploits the complacency that comes when the crisis fades. The structure you build now — in the next two weeks — is what holds when the urgency is gone.",
          "The question this week is not 'how do I recover?' You've been answering that for fourteen weeks. The question is 'how do I protect what I've built when I no longer feel like I need to?'"
        ]
      },
      {
        id: "conceptualized-self",
        title: "The Integrated Response to Urges",
        content: [
          "You now have a complete toolkit, and you need to know how to deploy it under pressure — when the urge is active, when the cognitive distortions are running, when the emotional state is compromised. Here is the full sequence.",
          "STEP 1 — NOTICE: 'An urge is present.' Name it. Don't react. Make contact with present moment. Where are you? What do you see? What is the actual situation?",
          "STEP 2 — DEFUSE: 'I'm having the thought that I need to act out.' Not 'I NEED to act out.' Create the gap between the thought and the action. Name the story your mind is running.",
          "STEP 3 — ACCEPT: Make room for the urge without fighting it or feeding it. Locate it in your body. Breathe into it. 'I can have this urge without obeying it.'",
          "STEP 4 — CONNECT TO VALUES: 'What kind of man do I want to be right now?' Pull your answer from the work you did in Week 12. This is why that work was real work, not a worksheet.",
          "STEP 5 — ACT: Do the next right thing — the values-based action that reflects who you're becoming, not who you've been. Call someone. Leave the room. Complete a check-in. The action doesn't have to be large."
        ]
      },
      {
        id: "two-selves",
        title: "Your Zone System — In Depth",
        content: [
          "Week 8 introduced the zone system. You're now equipped to build it out with real specificity — specific to your patterns, your triggers, your early warning signs, your emergency contacts.",
          "GREEN ZONE: What does stability actually look like for you — not in general, but in your specific life? What practices are you maintaining? What relationships are you showing up in? What does your sleep, your physicality, your emotional honesty look like when you're stable? The green zone is not the absence of difficulty — it's the presence of functioning systems.",
          "YELLOW ZONE: What are your first warning signs — not the obvious ones, but the subtle early ones? The ones that precede the more visible symptoms by days or weeks? For most men, these are behavioral: skipping check-ins, spending more time alone, letting phone calls go unanswered, rationalizing small exceptions to environmental controls. Know YOUR first signs.",
          "ORANGE/RED ZONES: You need a written emergency protocol — not a plan you'll figure out in the moment, because in the moment you won't think clearly. The protocol includes: who you call first, what you do if they don't answer, where you physically go, what you do with device access, and what you commit to in the first 24 hours after a slip."
        ]
      },
      {
        id: "identity-transformation",
        title: "Structure Is Not Optional",
        content: [
          "Unstructured time is high-risk time. This is empirical — not a moral statement. Men who maintain structure in sleep, exercise, work, social connection, and accountability practice have dramatically better outcomes than men who don't. The structure is not a cage. It is a container that makes other choices automatic.",
          "The daily practices that matter most are small and consistent: the check-in, the brief reflection, the physical movement, the honest conversation with someone who knows what you're working on. None of these take more than 15 minutes. Together, they create a nervous system that knows how to be in recovery.",
          "Build a morning anchor — something you do every morning without exception that signals to your nervous system that this is a day lived with integrity. It doesn't have to be elaborate. Five minutes of writing. Three minutes of reflection on your values. A single honest sentence about your state. The consistency matters more than the content.",
          "Review your warning signs and your plan with your mentor or accountability partner this week. Make sure they know your zone system — not so they can manage your recovery, but so they can see what you might miss when you're in the yellow zone and your insight is compromised."
        ]
      },
      {
        id: "values-aligned-identity",
        title: "After the Program Ends",
        content: [
          "This program ends in one week. That is not the end of recovery. It is the end of the structured introduction to recovery. What happens after is the actual work — the long game, the years of daily practice, the maintenance of relationships and accountability and values-based living.",
          "The men who stay well after a program like this are not the men who were most compliant during it. They're the men who internalized the framework — who took ownership of the tools and made them their own — who built lives with enough meaning and connection that the behavior lost its comparative appeal.",
          "What does your post-program structure look like? Who are you accountable to? What are your daily practices? What happens if you slip — what is your 24-hour protocol? These answers need to exist before the program ends, not after.",
          "This week you build the bridge. Not because the structure of a 16-week program is where your recovery lives — but because what you build now carries you into the years ahead."
        ]
      }
    ],
    reflectionQuestions: [
      {
        id: "q1",
        question: "When has complacency hit you before — in this program or in previous recovery attempts? What were the early warning signs you missed? What would you notice earlier now?"
      },
      {
        id: "q2",
        question: "Write out your personal zone system in detail — not the generic version, but what green, yellow, and orange/red actually look like for you specifically."
      },
      {
        id: "q3",
        question: "What is your emergency protocol? Write out the specific steps, in order, including names and phone numbers. What do you do if your first contact doesn't answer?"
      },
      {
        id: "q4",
        question: "What does your post-program structure look like? Be specific: daily practices, weekly accountability, what happens after a slip."
      }
    ],
    exercises: [
      {
        id: "zone-identification",
        title: "Your Personal Zone System",
        instructions: "Build out your zone system with your specific indicators — not generic descriptions, but what these zones actually look like in your life.",
        fields: [
          {
            id: "green",
            label: "GREEN ZONE: What does stability look like for you specifically? What behaviors, emotional states, and relationship patterns indicate you're stable?",
            type: "textarea",
            placeholder: "Behaviors:\nEmotional state:\nRelationship patterns:\nPractices I'm maintaining:"
          },
          {
            id: "yellow",
            label: "YELLOW ZONE: What are your earliest warning signs — the ones that appear before the more obvious symptoms? Be specific about what slipping looks like for you.",
            type: "textarea",
            placeholder: "First signs (behavioral):\nFirst signs (emotional):\nFirst signs (cognitive):\nWhat I tell myself to explain it away:"
          },
          {
            id: "orange",
            label: "ORANGE/RED ZONE: What indicates you're in high risk or crisis? What is your emergency protocol — specific steps, specific names, specific actions?",
            type: "textarea",
            placeholder: "High-risk indicators:\nStep 1:\nStep 2:\nStep 3:\nWho I call:\nWhat I do with device access:"
          },
          {
            id: "lapse-protocol",
            label: "24-HOUR PROTOCOL AFTER A SLIP: What do you commit to doing within 24 hours of a lapse — specifically?",
            type: "textarea",
            placeholder: "Within the first hour:\nWithin 24 hours:\nWho knows about my protocol:"
          }
        ]
      },
      {
        id: "emergency-plan",
        title: "Post-Program Structure",
        instructions: "Define the structure you're carrying into life after this program ends.",
        fields: [
          {
            id: "contact1",
            label: "DAILY PRACTICES: What will you do every day without exception? Small enough to do on a bad day.",
            type: "textarea",
            placeholder: "List your non-negotiable daily practices..."
          },
          {
            id: "contact2",
            label: "WEEKLY ACCOUNTABILITY: Who will you be accountable to after the program? How often? What will that look like?",
            type: "textarea",
            placeholder: "Name, frequency, format..."
          },
          {
            id: "location",
            label: "ONGOING SUPPORT: What ongoing support are you committing to — groups, individual work, couples work, faith community?",
            type: "textarea",
            placeholder: "List your ongoing support commitments..."
          },
          {
            id: "grounding",
            label: "RISK MANAGEMENT: What environmental controls are you maintaining after the program? What stays in place?",
            type: "textarea",
            placeholder: "Environmental controls, accountability software, boundaries..."
          },
          {
            id: "remove-access",
            label: "COMPLACENCY PROTOCOL: What specifically will you do if you notice you're slipping in your practices — if structure starts to erode?",
            type: "textarea",
            placeholder: "Your plan for when complacency appears..."
          }
        ]
      },
      {
        id: "complete-plan",
        title: "Comprehensive Relapse Prevention Plan",
        instructions: "Build your complete, specific, living relapse prevention plan. This replaces and updates the initial plan from Week 8.",
        fields: [
          {
            id: "warning-signs",
            label: "MY TOP 5 WARNING SIGNS — in order, from earliest to latest:",
            type: "textarea",
            placeholder: "1. (earliest)\n2.\n3.\n4.\n5. (latest before acting out)"
          },
          {
            id: "high-risk",
            label: "MY TOP 5 HIGH-RISK SITUATIONS — with a specific response plan for each:",
            type: "textarea",
            placeholder: "1. Situation / Response:\n2.\n3.\n4.\n5."
          },
          {
            id: "coping",
            label: "MY GO-TO COPING TOOLS — the ones that have actually worked, not the ones that sound good:",
            type: "textarea",
            placeholder: "1.\n2.\n3.\n4.\n5."
          },
          {
            id: "support",
            label: "MY SUPPORT SYSTEM — names, roles, and what they know about my recovery:",
            type: "textarea",
            placeholder: "List each person, their role, and what they know..."
          },
          {
            id: "daily",
            label: "MY DAILY NON-NEGOTIABLES — what I will do every day regardless of how I feel:",
            type: "textarea",
            placeholder: "List your daily practices..."
          },
          {
            id: "weekly",
            label: "MY WEEKLY NON-NEGOTIABLES — structured accountability, connection, review:",
            type: "textarea",
            placeholder: "List your weekly practices..."
          }
        ]
      }
    ],
    homeworkChecklist: [
      "Read all Week 15 material",
      "Complete Your Personal Zone System exercise with real specificity — not generic descriptions",
      "Complete the Post-Program Structure exercise — your plan for after the program ends",
      "Complete your Comprehensive Relapse Prevention Plan with your updated understanding",
      "Share your plan with your accountability partner or mentor and get their feedback",
      "Identify one area where complacency has already started to appear and name it honestly",
      "Complete daily check-ins for all 7 days"
    ]
  },

  16: {
    weekNumber: 16,
    title: "Who You've Become",
    phase: 2,
    phaseName: "Integration & Values",
    overview: "Sixteen weeks ago you came to this program with something you needed to change. This week you take honest stock of what has actually changed — not what you hoped would change, not what you're supposed to say in the final week, but what is genuinely different. You look clearly at who you are becoming. You write the commitments that carry you forward. And you acknowledge that this ending is also a beginning.",
    teaching: [
      {
        id: "integrated-approach",
        title: "The Honest Inventory",
        content: [
          "The final week of this program is not a celebration ceremony. It is an honest inventory. A clear-eyed look at what has changed, what has not, what you've learned, and what still needs work. Not because you should end on a somber note — because recovery that proceeds from honesty lasts, and recovery that proceeds from performance doesn't.",
          "Some things have genuinely changed for you over these sixteen weeks. You understand the cycle differently. You have tools you didn't have before. You've named things you had been running from. Some version of your life is different — in your relationships, your self-understanding, your daily practices.",
          "Some things have not changed as much as you'd like. There are patterns that proved more resilient than expected. There were weeks you went through the motions. There are relationships that are still broken. There is work still ahead. This is true for every man who completes this program honestly.",
          "Both things are true at once. You have made real progress AND the work continues. You are genuinely different AND there is more to do. Holding both without collapsing into either false pride or despair — that is the final skill of this program."
        ]
      },
      {
        id: "integrated-urge-response",
        title: "What Actually Changed",
        content: [
          "You've completed fourteen weeks of clinical curriculum. You know the cycle. You can name the triggers. You've practiced defusion under real conditions. You've identified your values and attempted committed action. You've sat with urges without acting on them. You've told someone something you'd never told anyone.",
          "That is real. Take stock of it without inflation. Not 'I'm cured' and not 'none of it mattered.' Something has changed. The question is: what specifically? What can you do now that you couldn't do before? What do you understand about yourself that you didn't understand? What conversations have happened that wouldn't have happened?",
          "Write the real answer. Not the answer you'd give in a group setting, performing recovery. The answer you'd write if no one was reading — the honest inventory of what is genuinely different.",
          "That inventory is your starting point for the years ahead. It tells you what works, what tools to continue, what relationships have been repaired or strengthened, what you've learned to stop running from."
        ]
      },
      {
        id: "four-zones",
        title: "What Has Not Changed Yet",
        content: [
          "There are also things that haven't changed as much as you'd hoped. Patterns that proved more durable than expected. Relationships that aren't repaired yet — that may take years. An underlying wound you've touched but not healed. A vulnerability that remains. An aspect of the behavior that still has pull.",
          "Name those too. Not as reasons for despair. As the next items on the map. Knowing where the work continues is not failure — it is orientation. The man who knows his remaining vulnerabilities is in a better position than the man who declares victory and stops watching.",
          "The most dangerous thing that can happen in Week 16 is overconfidence. The sense that the program is done, the work is done, the problem is solved. Recovery is not an event you complete. It is a direction you maintain. The program ends. The direction continues.",
          "Name honestly: where are you still vulnerable? What patterns are still operating at a lower intensity? What relationships are still affected? What areas of your inner life haven't yet been fully addressed? That list is your continued agenda."
        ]
      },
      {
        id: "recovery-lifestyle",
        title: "The Long Game",
        content: [
          "Long-term recovery from CSBD is measured in years, not weeks. The research is clear: the men who maintain long-term behavioral change are not the men who were most motivated during a program. They are the men who built sustainable systems — daily practices, ongoing accountability, relationships that include honesty, and a life with enough meaning that the behavior loses its comparative appeal.",
          "The daily practices matter. Not the heroic ones — the small ones, done every day, that create a nervous system that knows how to be in recovery. The check-in. The morning anchor. The weekly conversation with someone who knows what you're working on. The monthly review of where you are against your values.",
          "The relationships matter. You cannot recover in isolation. Not because you're weak — because the behavior was partly driven by isolation, and recovery requires connection. The accountability partnership, the mentor relationship, the honest conversations that recovery makes possible — these are not program features. They are the medicine.",
          "The meaning matters. A life with no direction worth caring about is a life with diminished resistance to the behavior. The values work of Phase 2 was not therapeutic fluff. It was the construction of a reason. Keep building that reason. Let it grow."
        ]
      },
      {
        id: "structure-and-routine",
        title: "If You Slip After the Program",
        content: [
          "Many men will experience a lapse after completing this program. This is not an indictment of the program or of you. It is a data point. A lapse after sixteen weeks of serious work is categorically different from a lapse before you had tools — because now you know what to do with it.",
          "The 24 hours after a lapse are the most important 24 hours in the entire arc of a man's recovery. If he tells someone immediately, completes a reflection on what happened, recommits to his practices, and treats it as information rather than verdict — it stays a lapse. If he hides, catastrophizes, uses 'I've already blown it' thinking to continue — it becomes a relapse.",
          "Decide now, while you are thinking clearly, what you will do in those 24 hours. Not vaguely — specifically. Who will you call? What will you write? What practice will you return to first? The decision made in clarity is the one that gets executed under pressure.",
          "A slip after this program is not the end of the story. It is a chapter. What matters is not that it happened. What matters is what you do next — how fast you get back to the path, how honest you are about what the slip revealed, how you adjust your plan based on what you learned."
        ]
      }
    ],
    reflectionQuestions: [
      {
        id: "q1",
        question: "Write the honest inventory: what has actually changed over these sixteen weeks? Not what you hoped would change — what demonstrably has. Be specific."
      },
      {
        id: "q2",
        question: "What has not changed as much as you'd hoped? Where are you still vulnerable? What work continues?"
      },
      {
        id: "q3",
        question: "Who are you becoming? Not who you were, not who you should be — who are you, right now, in this moment of the story? How is that man different from the one who started Week 1?"
      },
      {
        id: "q4",
        question: "What do you want your life to look like one year from now? Be concrete. What is different? What are you doing? Who are you showing up for? What have you stopped running from?"
      }
    ],
    exercises: [
      {
        id: "16-week-reflection",
        title: "16-Week Reflection",
        instructions: "The honest inventory. Write what is actually true — not what sounds right, not what is impressive, but what you genuinely know.",
        fields: [
          {
            id: "learned",
            label: "What have you learned about yourself that you didn't know before — or knew but hadn't faced? Be specific.",
            type: "textarea",
            placeholder: "What you've genuinely learned..."
          },
          {
            id: "patterns",
            label: "What patterns do you now understand that you didn't before? How has your understanding of the cycle changed?",
            type: "textarea",
            placeholder: "Patterns you now understand..."
          },
          {
            id: "tools",
            label: "What tools have actually helped you — not the ones that sound good, but the ones you've actually used under real pressure?",
            type: "textarea",
            placeholder: "Tools that genuinely worked..."
          },
          {
            id: "strengthen",
            label: "What areas need continued work? What vulnerabilities remain? What is not yet resolved?",
            type: "textarea",
            placeholder: "Work that continues..."
          },
          {
            id: "identity",
            label: "Who are you now that's different from who you were at Week 1? What has the program changed about how you see yourself?",
            type: "textarea",
            placeholder: "Who you're becoming..."
          },
          {
            id: "relationships",
            label: "What has changed in your relationships? What conversations have happened? What repairs have begun? What still needs to be addressed?",
            type: "textarea",
            placeholder: "Relationship changes and what remains..."
          }
        ]
      },
      {
        id: "integrity-definition",
        title: "Your Definition of Sexual Integrity",
        instructions: "Write your personal definition — not the textbook definition, but what it means for you, in your specific life, with your specific history.",
        fields: [
          {
            id: "definition",
            label: "Sexual integrity for me means... (Write as much as you need. This is your definition. It should sound like you.)",
            type: "textarea",
            placeholder: "Write your definition..."
          }
        ]
      },
      {
        id: "values-lifestyle",
        title: "Your Life in One Year",
        instructions: "Write your vision for your life twelve months from now — concrete and specific, not aspirational and vague.",
        fields: [
          {
            id: "relationships",
            label: "RELATIONSHIPS: What are your closest relationships like a year from now? What is different? What conversations have happened? What repairs are underway or complete?",
            type: "textarea",
            placeholder: "Your relationships in one year..."
          },
          {
            id: "intimacy",
            label: "INTEGRITY: What does your daily life look like when you're consistently living according to your values? What does a typical Tuesday look like?",
            type: "textarea",
            placeholder: "Your integrity in daily life..."
          },
          {
            id: "spirituality",
            label: "MEANING: What are you building, contributing to, or working toward that matters to you? What gives your life a sense of direction and purpose?",
            type: "textarea",
            placeholder: "What you're living for..."
          },
          {
            id: "health",
            label: "WELLBEING: How are you taking care of yourself physically, emotionally, and relationally? What sustainable practices are in place?",
            type: "textarea",
            placeholder: "Your self-care and wellbeing..."
          },
          {
            id: "growth",
            label: "CONTINUING WORK: What is the ongoing recovery work you're committed to after this program ends? Who are you accountable to? What does that look like?",
            type: "textarea",
            placeholder: "Your continued recovery work..."
          }
        ]
      },
      {
        id: "recovery-blueprint",
        title: "Your Recovery Blueprint",
        instructions: "Define the structure that carries you forward — daily, weekly, and monthly. Be specific enough that you can execute it without thinking.",
        fields: [
          {
            id: "morning",
            label: "DAILY ANCHOR: What will you do every morning without exception to begin the day in integrity? Small enough to do when you don't feel like it.",
            type: "textarea",
            placeholder: "Your morning anchor..."
          },
          {
            id: "evening",
            label: "DAILY REVIEW: How will you end each day? What brief practice marks the close?",
            type: "textarea",
            placeholder: "Your daily review..."
          },
          {
            id: "weekly",
            label: "WEEKLY ACCOUNTABILITY: Who are you accountable to? What does that conversation look like? When does it happen?",
            type: "textarea",
            placeholder: "Your weekly accountability..."
          },
          {
            id: "monthly",
            label: "MONTHLY REVIEW: How will you evaluate your month? What do you look at? What adjustments do you make?",
            type: "textarea",
            placeholder: "Your monthly review..."
          }
        ]
      },
      {
        id: "commitment-statement",
        title: "Your Forward Commitment",
        instructions: "Write your commitment for the year ahead — not a general aspiration, but a specific statement of what you are committed to doing.",
        fields: [
          {
            id: "commitment",
            label: "In the year ahead, I commit to the following specific practices and ways of living — because they reflect who I am becoming and what I'm actually living for:",
            type: "textarea",
            placeholder: "Write your commitment..."
          }
        ]
      },
      {
        id: "letter-to-future-self",
        title: "Letter to Your Future Self",
        instructions: "Write a letter to yourself to be read six months from now. Include what you want him to remember, what you know about the challenges he'll face, what tools have helped, and what you believe he's capable of.",
        fields: [
          {
            id: "letter",
            label: "Dear Future Self,\n\n(Write what you want him to remember. Be honest. Be specific. Write it like it matters — because it does.)",
            type: "textarea",
            placeholder: "Write your letter..."
          }
        ]
      }
    ],
    homeworkChecklist: [
      "Read all Week 16 material",
      "Complete the 16-Week Reflection — the honest version, not the performance version",
      "Write your personal definition of sexual integrity",
      "Complete Your Life in One Year — concrete and specific",
      "Build your Recovery Blueprint with your actual daily/weekly/monthly structure",
      "Write your Forward Commitment",
      "Write the letter to your future self",
      "Share your reflection and commitment with your mentor or accountability partner",
      "Complete daily check-ins for all 7 days"
    ]
  }
};

export const WEEK_TITLES: Record<number, string> = {
  1: "The Moment You Stop Pretending",
  2: "Nothing About This Is Random",
  3: "Your Mind Is Not Telling You the Truth",
  4: "When the Urge Hits",
  5: "Shame Is Not Your Conscience",
  6: "The People You've Been Living Around",
  7: "What Needs to Be Said",
  8: "The Architecture of Not Going Back",
  9: "What Fighting Has Cost You",
  10: "Your Thoughts Don't Have Permission",
  11: "The Part of You That Doesn't Change",
  12: "What You're Actually Living For",
  13: "Stop Running",
  14: "From Knowing to Doing",
  15: "Protect What You've Built",
  16: "Who You've Become"
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
