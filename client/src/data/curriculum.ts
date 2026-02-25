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
    title: "Self-Regulation & Impulse Management",
    phase: 1,
    phaseName: "Foundation & Stabilization",
    overview: "This week focuses on building practical skills for managing urges and regulating your emotional and physical states. You'll develop a toolkit of strategies for when triggers arise.",
    teaching: [
      {
        id: "self-regulation",
        title: "Understanding Self-Regulation",
        content: [
          "Self-regulation is your ability to manage your thoughts, emotions, and behaviors in pursuit of long-term goals. It's the capacity to pause between stimulus and response.",
          "In CSBD, self-regulation has been compromised. The behavior has become automatic, and the pause between trigger and response has shortened to almost nothing.",
          "Good news: Self-regulation is a skill that can be strengthened with practice. Like a muscle, it grows stronger the more you use it.",
          "The goal isn't to never experience urges. The goal is to increase your capacity to experience urges without automatically acting on them."
        ]
      },
      {
        id: "coping-strategies",
        title: "Building Your Coping Strategy Toolkit",
        content: [
          "DISTRACTION STRATEGIES: Engage your mind and body in something else. Exercise, call a friend, work on a project, go for a walk, play a game. The key is to choose activities that genuinely engage your attention.",
          "OPPOSITE ACTION: Do the opposite of what the urge wants. If the urge says 'isolate,' connect with someone. If it says 'stay in this room,' leave. If it says 'pick up the phone,' put it in another room.",
          "STIMULUS CONTROL: Remove or limit access to triggers. Install blocking software, rearrange your environment, avoid high-risk locations, change your routine to eliminate opportunity.",
          "GROUNDING TECHNIQUES: Bring yourself back to the present moment. The 5-4-3-2-1 technique: Name 5 things you see, 4 you hear, 3 you can touch, 2 you smell, 1 you taste.",
          "REACH OUT: Contact your support system. Call your accountability partner, text a trusted friend, attend a meeting. Connection is powerful medicine for urges rooted in isolation."
        ]
      },
      {
        id: "delay-strategies",
        title: "The Power of Delay",
        content: [
          "Research shows that if you can delay acting on an urge, the urge's power diminishes significantly. Every minute you wait, you take back control.",
          "The 15-Minute Rule: When an urge hits, commit to waiting just 15 minutes before making a decision. Use that time to employ coping strategies. Often, the urge will pass or significantly decrease.",
          "Play the tape forward: Before acting, imagine the entire sequence. Not just the behavior, but the aftermath. How will you feel in one hour? Tomorrow? How does this fit with your values and goals?",
          "Remember: Urges are like waves. They rise, they peak, and they fall. You don't have to fight them - you just have to not feed them."
        ]
      },
      {
        id: "emotional-regulation",
        title: "Emotional Regulation Skills",
        content: [
          "Many urges are driven by underlying emotional states. Learning to recognize and manage emotions reduces vulnerability to triggers.",
          "Step 1 - Name It: Simply labeling an emotion reduces its intensity. 'I am feeling anxious' or 'I notice anger' creates distance between you and the emotion.",
          "Step 2 - Accept It: Emotions are information, not commands. You can feel anxious without needing to escape anxiety. You can feel bored without needing stimulation.",
          "Step 3 - Express It: Find healthy outlets for emotions. Journal, talk to someone, exercise, create something. Unexpressed emotions often drive compulsive behavior.",
          "Step 4 - Address It: If possible, address the underlying need. If you're lonely, seek connection. If you're stressed, address the stressor. If you're tired, rest."
        ]
      },
      {
        id: "environment-setup",
        title: "Environmental Restructuring",
        content: [
          "Don't rely on willpower when you can change your environment. Make acting out harder and healthy choices easier.",
          "Device Management: Use accountability software, keep devices in public spaces, remove apps that trigger you, consider downgrading to a simpler phone during vulnerable periods.",
          "Home Environment: Remove or secure devices at night, change your routine to avoid high-risk times, create spaces that are trigger-free.",
          "Time Management: Unstructured time is dangerous. Build structure into your day. Fill lonely times with meaningful activities or connection.",
          "Remember: The goal is to buy yourself time. Every barrier between you and the behavior gives you more opportunity to choose differently."
        ]
      },
      {
        id: "technology-safety",
        title: "Technology Safety and Digital Boundaries",
        content: [
          "In the digital age, technology is both a primary access point for problematic behavior and an essential part of daily life. Effective technology management is critical for recovery.",
          "ACCOUNTABILITY SOFTWARE: Tools like Covenant Eyes, Bark, or Ever Accountable send reports to someone you trust. This isn't about surveillance - it's about support. Knowing someone will see your activity creates a pause before impulsive action.",
          "DEVICE MANAGEMENT STRATEGIES: Charge phones outside the bedroom. Use app blockers during high-risk hours. Consider a 'dumb phone' or basic phone for evenings/weekends. Enable SafeSearch on all devices. Remove browsers from phones if feasible - use only apps.",
          "SOCIAL MEDIA BOUNDARIES: Unfollow or mute accounts that trigger you. Set time limits on apps. Consider deleting problematic apps entirely. Be honest: if 'just scrolling' often leads to problems, it's not innocent.",
          "LOCATION-BASED TRIGGERS: Avoid browsing in bed, bathrooms, or other private spaces. Create device-free zones in your home. If a particular location is linked to acting out, change your patterns."
        ]
      },
      {
        id: "building-digital-structure",
        title: "Building Digital Structure",
        content: [
          "Structure is your ally. The more decisions you automate, the fewer opportunities for impulsive choices.",
          "MORNING ROUTINE: Don't check devices for the first 30-60 minutes. Start with something grounding: exercise, meditation, reading, or journaling before screen time.",
          "EVENING ROUTINE: Set a 'screens off' time at least 1 hour before bed. Charge devices in a common area, not your bedroom. Replace screen time with connection, reading, or rest.",
          "HIGH-RISK TIMES: Identify your vulnerable hours (often late night, early morning, or during transitions). Build accountability or activity into these times.",
          "TRAVEL PROTOCOLS: Hotels and travel are high-risk. Plan ahead: request TV blocking, use accountability software, schedule check-ins with your accountability partner, stay connected to your support system."
        ]
      }
    ],
    reflectionQuestions: [
      {
        id: "q1",
        question: "What coping strategies have worked for you in the past? What made them effective?"
      },
      {
        id: "q2",
        question: "What environmental changes could you make to reduce your exposure to triggers and limit access during vulnerable times?"
      },
      {
        id: "q3",
        question: "What emotions are most likely to drive your urges? How do you typically handle these emotions?"
      },
      {
        id: "q4",
        question: "Who is in your support network? Who can you reach out to when you're struggling?"
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
      "Complete the Coping Strategy Toolkit exercise",
      "Create your Environmental Restructuring Plan",
      "Develop your Emergency Coping Plan",
      "Implement at least 2 environmental changes this week",
      "Practice the 15-minute delay at least once when an urge arises",
      "Use at least 3 different coping strategies this week",
      "Complete daily monitoring logs for all 7 days"
    ]
  },

  5: {
    weekNumber: 5,
    title: "Understanding Shame & Guilt",
    phase: 1,
    phaseName: "Foundation & Stabilization",
    overview: "This week explores the critical difference between shame and guilt, and how shame fuels the cycle of compulsive behavior. You'll learn self-compassion practices that break the shame cycle.",
    teaching: [
      {
        id: "shame-vs-guilt-deep",
        title: "Shame vs. Guilt: A Deeper Look",
        content: [
          "GUILT is about behavior: 'I did something bad.' It's focused on a specific action. It motivates repair and change. It can be resolved through amends and different behavior.",
          "SHAME is about identity: 'I am bad.' It's focused on the self. It paralyzes and perpetuates cycles. It leads to hiding, isolation, and hopelessness.",
          "The crucial difference: Guilt says, 'I made a mistake.' Shame says, 'I am a mistake.'",
          "Research by Dr. Brene Brown shows that shame is positively correlated with addiction, depression, and destructive behavior. Guilt, on the other hand, is inversely correlated with these outcomes.",
          "This means: The more shame you feel, the more likely you are to continue the behavior. Shame doesn't motivate change - it fuels the cycle."
        ]
      },
      {
        id: "shame-cycle",
        title: "How Shame Fuels the Cycle",
        content: [
          "After acting out, shame floods in. You feel fundamentally flawed, disgusting, hopeless. This shame creates intense emotional pain.",
          "To escape this pain, you need relief. And the behavior you're trying to stop has been your primary source of relief. So shame drives you back to the very behavior that caused the shame.",
          "The shame cycle: Act Out → Shame → Emotional Pain → Need for Escape → Act Out → More Shame. It's a vicious, self-reinforcing loop.",
          "Breaking this cycle requires replacing shame with accountability. You take responsibility for behavior without attacking your worth as a person."
        ]
      },
      {
        id: "self-compassion",
        title: "The Power of Self-Compassion",
        content: [
          "Self-compassion is treating yourself with the same kindness you would offer a good friend. It's not self-pity or letting yourself off the hook. It's recognizing your humanity.",
          "Dr. Kristin Neff identifies three components of self-compassion: (1) Self-kindness instead of self-judgment, (2) Common humanity instead of isolation, (3) Mindfulness instead of over-identification with thoughts.",
          "Research shows that self-compassion is associated with: Less depression and anxiety, greater motivation to change, more resilience after failure, and better ability to take responsibility.",
          "Counter-intuitively, being kind to yourself makes you more likely to change, not less. Shame paralyzes. Compassion mobilizes."
        ]
      },
      {
        id: "practicing-self-compassion",
        title: "How to Practice Self-Compassion",
        content: [
          "WHEN YOU FAIL: Notice the self-critical voice. Ask: 'What would I say to a friend in this situation?' Then say that to yourself.",
          "COMMON HUMANITY: Remind yourself that you are not alone. Millions of people struggle with this. Your struggle is part of the human experience, not proof that you're uniquely broken.",
          "MINDFUL AWARENESS: Notice your emotions without drowning in them. Say 'I am experiencing shame' rather than 'I am shameful.' Create distance between you and the feeling.",
          "SELF-COMPASSION BREAK: When struggling, try this: (1) 'This is a moment of suffering' (mindfulness), (2) 'Suffering is part of life' (common humanity), (3) 'May I be kind to myself' (self-kindness)."
        ]
      },
      {
        id: "distinguishing-behavior-identity",
        title: "Separating Behavior from Identity",
        content: [
          "You are not your behavior. You are a person who has engaged in certain behaviors. These are not the same thing.",
          "Your behavior can change. Your worth as a person is not contingent on your behavior. You don't have to earn the right to be treated with dignity.",
          "This doesn't mean avoiding accountability. It means taking responsibility for actions without concluding that you are fundamentally defective.",
          "The shift: From 'I am an addict' to 'I am a person who has struggled with compulsive behavior and is working to change.' From 'I am disgusting' to 'I have done things I regret and am committed to doing differently.'"
        ]
      }
    ],
    reflectionQuestions: [
      {
        id: "q1",
        question: "Describe a moment when you felt the weight of shame most intensely. What did you do with that feeling? Looking back, what would a compassionate response have looked like?"
      },
      {
        id: "q2",
        question: "What does your inner critic say to you after you act out? What tone does it use? What words?"
      },
      {
        id: "q3",
        question: "What would it mean to take responsibility for your behavior without attacking your worth as a person?"
      },
      {
        id: "q4",
        question: "If a good friend came to you with this struggle, what would you say to them? Can you say that to yourself?"
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
      "Complete the Shame Inventory exercise",
      "Write your Self-Compassion Letter",
      "Complete the Reframing Shame to Accountability exercise",
      "Practice the Self-Compassion Break at least once daily",
      "Notice when shame arises and practice reframing it",
      "Share your experience with shame with your accountability partner",
      "Complete daily monitoring logs for all 7 days"
    ]
  },

  6: {
    weekNumber: 6,
    title: "Relationships, Attachment & Intimacy",
    phase: 1,
    phaseName: "Foundation & Stabilization",
    overview: "This week explores how CSBD affects relationships and how attachment patterns influence sexual behavior. You'll examine the difference between pseudo-intimacy and genuine connection.",
    teaching: [
      {
        id: "csbd-relationships",
        title: "How CSBD Affects Relationships",
        content: [
          "CSBD doesn't happen in isolation. It profoundly affects relationships - both intimate partnerships and other connections.",
          "Common relationship impacts include: Erosion of trust, emotional disconnection, secrecy creating distance, partner trauma and betrayal, decreased sexual intimacy in the relationship, and using relationships to manage image rather than connect.",
          "The paradox: The behavior often begins as an escape from relationship difficulties, but it creates more relationship difficulties, which increases the need to escape.",
          "Many men with CSBD report feeling like they're living a double life. The gap between their public persona and their private behavior creates isolation and shame."
        ]
      },
      {
        id: "attachment-patterns",
        title: "Understanding Attachment Patterns",
        content: [
          "Attachment theory explains how early relationships shape our patterns of connection throughout life. These patterns influence how we handle intimacy, trust, and emotional needs.",
          "SECURE ATTACHMENT: Comfortable with intimacy and independence. Can express needs. Trusts others. Handles conflict well.",
          "ANXIOUS ATTACHMENT: Fears abandonment. Seeks constant reassurance. May be clingy or jealous. Relationships feel unstable.",
          "AVOIDANT ATTACHMENT: Uncomfortable with closeness. Values independence highly. May dismiss emotional needs. Keeps partners at distance.",
          "Many men with CSBD have insecure attachment patterns. The behavior becomes a way to meet emotional needs without the vulnerability of real intimacy."
        ]
      },
      {
        id: "pseudo-intimacy",
        title: "Pseudo-Intimacy vs. Genuine Intimacy",
        content: [
          "CSBD often provides pseudo-intimacy - the appearance or feeling of connection without the reality of it.",
          "Pseudo-intimacy characteristics: No risk of rejection, no vulnerability required, predictable and controllable, one-sided, leaves you feeling more alone afterward.",
          "Genuine intimacy characteristics: Requires vulnerability, involves mutual sharing, unpredictable and sometimes uncomfortable, leaves you feeling more connected afterward.",
          "The brain can be fooled by pseudo-intimacy in the short term, but it doesn't meet the deeper need for connection. This is why the behavior doesn't satisfy - it can't provide what you actually need."
        ]
      },
      {
        id: "intimacy-avoidance",
        title: "How CSBD Functions as Intimacy Avoidance",
        content: [
          "For many men, compulsive sexual behavior serves as a way to avoid the vulnerability of genuine intimacy. It provides sexual release without the risk of emotional exposure.",
          "Signs that CSBD may be intimacy avoidance: Choosing the behavior over connection with a partner, using the behavior after conflict or rejection, feeling more comfortable with fantasy than reality, difficulty being emotionally present during sex with a partner.",
          "Recovery involves not just stopping the behavior but developing the capacity for genuine intimacy. This often means facing the fears that drove the avoidance in the first place."
        ]
      },
      {
        id: "rebuilding-trust",
        title: "The Path to Rebuilding Trust",
        content: [
          "If your behavior has been discovered, rebuilding trust is a long process. Trust is rebuilt through consistent actions over time, not words or promises.",
          "Key principles: Complete honesty going forward - no more secrets. Actions match words consistently. Patience with your partner's healing process - they didn't create this wound and shouldn't have to rush to heal it. Taking full responsibility without defensiveness.",
          "If disclosure hasn't happened, consider whether, when, and how to disclose. This is a complex decision that should ideally involve professional guidance.",
          "Whether or not you're in a relationship, building healthy connection is essential for recovery. Isolation is fuel for the cycle."
        ]
      },
      {
        id: "trauma-and-csbd",
        title: "Understanding Trauma's Role in CSBD",
        content: [
          "Many men with CSBD have experienced some form of trauma, often in childhood. Research shows a strong correlation between Adverse Childhood Experiences (ACEs) and compulsive sexual behavior.",
          "ADVERSE CHILDHOOD EXPERIENCES (ACEs) include: Physical, emotional, or sexual abuse. Physical or emotional neglect. Household dysfunction (substance abuse, mental illness, domestic violence, incarceration, divorce). Witnessing violence or traumatic events.",
          "How trauma connects to CSBD: The behavior becomes a coping mechanism for unresolved pain. Sexual arousal can temporarily regulate difficult emotions. Dissociation during the behavior mirrors trauma responses. The cycle recreates patterns of secrecy, shame, and violation.",
          "Important: Recognizing trauma's role is not about making excuses. It's about understanding the full picture so you can heal completely. You are responsible for your behavior AND you deserve compassion for what you've experienced."
        ]
      },
      {
        id: "trauma-responses",
        title: "Trauma Responses and Sexual Behavior",
        content: [
          "Trauma affects the nervous system in profound ways. The behavior may have become a way to manage these effects.",
          "HYPERAROUSAL: Feeling constantly on edge, anxious, or unable to relax. The behavior may provide temporary relief or numbing.",
          "HYPOAROUSAL: Feeling numb, disconnected, or emotionally flat. The behavior may be an attempt to 'feel something.'",
          "DISSOCIATION: Feeling disconnected from yourself or reality. The trance-like state during compulsive behavior is often dissociative.",
          "If you recognize trauma in your history, specialized trauma treatment (such as EMDR, Somatic Experiencing, or trauma-focused therapy) may be essential alongside this program. Consider discussing this with your mentor."
        ]
      },
      {
        id: "partner-betrayal-trauma",
        title: "Understanding Partner/Betrayal Trauma",
        content: [
          "When CSBD is discovered, partners often experience what's called betrayal trauma. This is a real psychological injury, not just disappointment or anger.",
          "Betrayal trauma symptoms include: Intrusive thoughts and flashbacks. Hypervigilance and checking behaviors. Difficulty trusting their own perceptions. Anxiety, depression, and PTSD symptoms. Physical symptoms like sleep disruption and appetite changes.",
          "Your partner's reactions are trauma responses, not attempts to punish you. Understanding this can help you respond with patience rather than defensiveness.",
          "Partners deserve their own support and healing process. Encourage (but don't force) them to seek their own therapy or support groups for betrayed partners."
        ]
      },
      {
        id: "disclosure-guidance",
        title: "Disclosure: If, When, and How",
        content: [
          "Disclosure is one of the most difficult decisions in recovery. There's no one-size-fits-all answer.",
          "REASONS TO DISCLOSE: Honesty is foundational to genuine intimacy. Secrets maintain the double life. Partners deserve to make informed decisions. Disclosure often brings relief from the burden of secrecy.",
          "CONSIDERATIONS: Timing matters - disclosure during crisis may cause more harm. Professional guidance is highly recommended. Therapeutic disclosure (facilitated by a professional) is often more effective. Consider your partner's support system and resources.",
          "WHAT DISCLOSURE IS NOT: It's not a detailed confession of every act. It's not meant to relieve your guilt at your partner's expense. It's not a one-time event but an ongoing commitment to honesty.",
          "If you're considering disclosure, work with a qualified professional experienced in sexual addiction and betrayal trauma. They can help both of you navigate this process."
        ]
      }
    ],
    reflectionQuestions: [
      {
        id: "q1",
        question: "If the people closest to you could see the version of you that you want to become, what would be different about how you show up for them?"
      },
      {
        id: "q2",
        question: "Which attachment pattern do you identify with? How might early experiences have shaped this pattern?"
      },
      {
        id: "q3",
        question: "Have you experienced any Adverse Childhood Experiences (ACEs)? If so, how might these connect to your current struggles? (Note: This is for your reflection - share with your mentor if appropriate)"
      },
      {
        id: "q4",
        question: "If your partner knows about your behavior, what do they need from you right now? If they don't know, what considerations are you weighing about disclosure?"
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
      "Read all Week 6 material, including the trauma-informed sections",
      "Complete the Relationship Impact Assessment",
      "Complete the Attachment Pattern Exploration",
      "Complete the Trauma and History Exploration exercise (at your own pace)",
      "If in a relationship, complete the Trust Rebuilding Plan",
      "Identify your Barriers to Genuine Intimacy",
      "Take one small step toward greater connection this week",
      "Consider whether additional trauma support (EMDR, trauma therapy) might be beneficial",
      "Complete daily monitoring logs for all 7 days"
    ]
  },

  7: {
    weekNumber: 7,
    title: "Problem-Solving & Communication",
    phase: 1,
    phaseName: "Foundation & Stabilization",
    overview: "This week develops practical problem-solving skills and healthy communication patterns. Many urges arise from unresolved problems and unmet needs that haven't been clearly expressed.",
    teaching: [
      {
        id: "problem-solving-model",
        title: "A Model for Problem-Solving",
        content: [
          "Many men with CSBD have used the behavior as their primary coping mechanism. When problems arise, instead of addressing them, they escape into the behavior.",
          "Effective problem-solving involves: (1) Define the problem clearly, (2) Generate possible solutions (brainstorm without judging), (3) Evaluate each solution (pros and cons), (4) Choose a solution and create an action plan, (5) Implement the plan, (6) Evaluate the results and adjust.",
          "This sounds simple, but when you're stressed, upset, or triggered, your brain often skips to the familiar escape route. Having a structured approach helps.",
          "Many problems that seem overwhelming become manageable when broken down into steps."
        ]
      },
      {
        id: "needs-identification",
        title: "Identifying and Expressing Needs",
        content: [
          "Underneath every urge is often an unmet need. You might need connection, validation, rest, meaning, or relief from stress. The behavior is an attempt to meet these needs, but it doesn't actually fulfill them.",
          "Common needs that drive CSBD: Need for connection and intimacy, need for validation or to feel desired, need for escape from stress or pain, need for excitement or stimulation, need to feel powerful or in control.",
          "When you can identify the underlying need, you can find healthier ways to meet it. Instead of acting out to feel connected, you can reach out to a real person. Instead of acting out to escape stress, you can address the stressor.",
          "The question to ask when an urge arises: 'What need is this trying to meet? How can I meet that need in a healthy way?'"
        ]
      },
      {
        id: "assertive-communication",
        title: "Assertive Communication",
        content: [
          "PASSIVE COMMUNICATION: Not expressing needs or opinions. Leads to resentment. Example: 'Whatever you want is fine.'",
          "AGGRESSIVE COMMUNICATION: Expressing needs in a way that violates others' rights. Creates conflict. Example: 'You never listen to me!'",
          "ASSERTIVE COMMUNICATION: Expressing needs clearly and respectfully. Builds connection. Example: 'I feel unheard when we don't discuss this. I need us to talk about it.'",
          "Assertive communication uses 'I' statements. The formula: 'I feel [emotion] when [situation]. I need [need].' This expresses your experience without attacking the other person."
        ]
      },
      {
        id: "conflict-resolution",
        title: "Healthy Conflict Resolution",
        content: [
          "Conflict is inevitable in relationships. The goal isn't to avoid conflict but to handle it well. Unresolved conflict often triggers the cycle.",
          "Principles for healthy conflict: Address issues when calm, not in the heat of anger. Listen to understand, not just to respond. Focus on the issue, not attacking the person. Be willing to compromise. Take breaks if needed to regulate emotions.",
          "After conflict, check in with yourself. Are you triggered? Are you rationalizing a reason to act out? Conflict is a high-risk time.",
          "Some conflicts can't be resolved in one conversation. That's okay. Progress matters more than immediate resolution."
        ]
      },
      {
        id: "boundary-setting",
        title: "Setting and Maintaining Boundaries",
        content: [
          "Boundaries are limits that define where you end and others begin. Healthy boundaries protect your recovery and your relationships.",
          "External boundaries: Limits on what others can do to you. Internal boundaries: Limits on your own behavior. Both are essential for recovery.",
          "Examples of recovery boundaries: No devices in the bedroom. No social media after 10 PM. No being alone in triggering environments. Commitment to honesty with accountability partner.",
          "Setting boundaries often feels uncomfortable at first, especially if you're used to avoiding conflict. But boundaries are acts of self-care and respect."
        ]
      }
    ],
    reflectionQuestions: [
      {
        id: "q1",
        question: "What problems in your life have you been avoiding or escaping from? How has the behavior served as a substitute for problem-solving?"
      },
      {
        id: "q2",
        question: "What underlying needs does your behavior try to meet? How else could you meet those needs?"
      },
      {
        id: "q3",
        question: "How would you describe your communication style? Where could you be more assertive?"
      },
      {
        id: "q4",
        question: "Think about a time you said 'yes' when you should have said 'no,' or stayed silent when you needed to speak up. What held you back, and what would you do differently now?"
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
      "Complete the Problem-Solving Practice exercise",
      "Complete Needs Mapping exercise",
      "Practice Assertive Communication",
      "Create your Boundary Setting Plan",
      "Practice at least one assertive conversation this week",
      "Identify one boundary and begin implementing it",
      "Complete daily monitoring logs for all 7 days"
    ]
  },

  8: {
    weekNumber: 8,
    title: "Relapse Prevention - Part 1",
    phase: 1,
    phaseName: "Foundation & Stabilization",
    overview: "This week introduces the first phase of relapse prevention - understanding warning signs, creating initial prevention plans, and preparing for the transition to Phase 2.",
    teaching: [
      {
        id: "understanding-relapse",
        title: "Understanding Lapse vs. Relapse",
        content: [
          "LAPSE: A slip. A single incident. A return to the behavior that is quickly interrupted. It doesn't have to become a pattern.",
          "RELAPSE: A return to the old pattern. Not just one slip, but re-engaging with the cycle. A surrender to the old way of living.",
          "The difference is what happens after. A lapse becomes relapse when you give up, hide, and return to the full cycle. A lapse can become a learning experience when you respond with honesty and recommitment.",
          "Important: A lapse is not a failure. It's data. It shows you where your plan needs strengthening. The only true failure is refusing to get back up."
        ]
      },
      {
        id: "warning-signs",
        title: "Recognizing Your Warning Signs",
        content: [
          "Relapse doesn't usually happen suddenly. It's a process that unfolds over time, with warning signs along the way.",
          "EMOTIONAL WARNING SIGNS: Increasing isolation, irritability, anxiety, depression, feeling 'off,' loss of motivation.",
          "BEHAVIORAL WARNING SIGNS: Skipping accountability check-ins, letting routines slip, testing boundaries, 'forgetting' to use tools, rationalizing small compromises.",
          "COGNITIVE WARNING SIGNS: Permission-giving thoughts returning, fantasizing, minimizing consequences, romanticizing the behavior.",
          "PHYSICAL WARNING SIGNS: Disrupted sleep, poor self-care, physical tension, feeling physically depleted."
        ]
      },
      {
        id: "traffic-light",
        title: "The Traffic Light System",
        content: [
          "GREEN ZONE (Stable): Connected to support, using tools, following structure, practicing honesty, managing urges well. Action: Maintain current practices.",
          "YELLOW ZONE (Caution): Warning signs appearing, stress increasing, urges more frequent, starting to isolate or avoid. Action: Increase accountability, boost coping strategies, address what's happening.",
          "RED ZONE (Danger): Strong urges, active rationalization, close to or already acting out, losing perspective. Action: Emergency plan - reach out immediately, leave the situation, use all tools available.",
          "Knowing what zone you're in helps you take appropriate action. Don't wait until you're in the red zone to respond."
        ]
      },
      {
        id: "initial-prevention-plan",
        title: "Building Your Initial Prevention Plan",
        content: [
          "A relapse prevention plan includes: Your personal warning signs, your coping strategies for each stage, your support contacts, your environmental controls, and your emergency action plan.",
          "The plan should be specific and accessible. Know exactly what you'll do when warning signs appear. Don't wait until you're in crisis to figure it out.",
          "Share your plan with someone who can help you implement it. An accountability partner or mentor who knows your plan can spot warning signs you might miss.",
          "Review and update your plan regularly. As you learn more about your patterns, the plan should evolve."
        ]
      },
      {
        id: "phase-transition",
        title: "Transitioning to Phase 2",
        content: [
          "Phase 1 has focused on understanding your behavior, building skills, and stabilizing. You've learned about triggers, cognitive restructuring, coping strategies, and relationship patterns.",
          "Phase 2 will shift focus from behavior management to values-based living. You'll learn Acceptance and Commitment Therapy (ACT) principles that will help you build a life of meaning and purpose.",
          "The goal is not just to stop the behavior but to create a life so full of meaning that the behavior loses its appeal. This is the key to long-term recovery.",
          "Remember: Recovery is not a destination but a journey. The skills you've learned in Phase 1 will continue to be used alongside the new approaches in Phase 2."
        ]
      }
    ],
    reflectionQuestions: [
      {
        id: "q1",
        question: "What are your earliest warning signs that you're moving away from stability? What happens first?"
      },
      {
        id: "q2",
        question: "What zone are you typically in before acting out? How quickly do you move from green to red?"
      },
      {
        id: "q3",
        question: "If you could go back and talk to yourself on Day 1 of this program, what would you say? What do you know now that you wish you knew then?"
      },
      {
        id: "q4",
        question: "What areas still need the most work? What will you focus on strengthening?"
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
      "Complete your Personal Warning Signs Inventory",
      "Create your Traffic Light Plan",
      "Complete the Phase 1 Reflection exercise",
      "Share your warning signs and plan with accountability partner",
      "Review all Phase 1 materials and note areas for continued growth",
      "Prepare mentally for Phase 2's focus on values and meaning",
      "Complete daily monitoring logs for all 7 days"
    ]
  },

  9: {
    weekNumber: 9,
    title: "Introduction to ACT & Psychological Flexibility",
    phase: 2,
    phaseName: "Integration & Values",
    overview: "Welcome to Phase 2. This week introduces Acceptance and Commitment Therapy (ACT) and the concept of psychological flexibility - the key to long-term recovery and a meaningful life.",
    teaching: [
      {
        id: "what-is-act",
        title: "What Is ACT?",
        content: [
          "Acceptance and Commitment Therapy (ACT) is a form of behavioral therapy that uses acceptance, mindfulness, and values-based action to increase psychological flexibility.",
          "Unlike approaches that focus on eliminating unwanted thoughts or feelings, ACT teaches you to change your relationship with them. You learn to have difficult thoughts and feelings without being controlled by them.",
          "ACT is based on the idea that suffering comes not from painful experiences themselves, but from our struggle against them. When we fight reality, we lose.",
          "The goal of ACT is not to feel better (though that often happens), but to build a rich and meaningful life while handling the pain that inevitably comes with it."
        ]
      },
      {
        id: "psychological-flexibility",
        title: "Psychological Flexibility",
        content: [
          "Psychological flexibility is the ability to be present, open up to difficult experiences, and do what matters. It's the opposite of getting stuck.",
          "When you're psychologically flexible, you can: Contact the present moment rather than being lost in the past or future. Open up to thoughts and feelings rather than fighting them. Connect with your values rather than acting on impulse. Take committed action rather than staying stuck.",
          "Psychological inflexibility looks like: Fusion with thoughts (believing everything your mind says), experiential avoidance (running from discomfort), disconnection from values (acting on impulse rather than purpose), and inaction or impulsive action.",
          "CSBD is often a symptom of psychological inflexibility. The behavior is an attempt to escape uncomfortable internal experiences."
        ]
      },
      {
        id: "six-processes",
        title: "The Six Core Processes of ACT",
        content: [
          "ACT develops psychological flexibility through six interrelated processes:",
          "1. PRESENT MOMENT AWARENESS: Being here now, not lost in past regrets or future worries.",
          "2. ACCEPTANCE: Opening up to experiences as they are, rather than fighting them.",
          "3. COGNITIVE DEFUSION: Seeing thoughts as thoughts, not as commands or absolute truths.",
          "4. SELF-AS-CONTEXT: The observing self - the 'you' who notices thoughts and feelings without being defined by them.",
          "5. VALUES: Clarifying what truly matters to you - your chosen direction in life.",
          "6. COMMITTED ACTION: Taking concrete steps toward your values, even when it's uncomfortable."
        ]
      },
      {
        id: "control-agenda",
        title: "The Problem with the Control Agenda",
        content: [
          "Most of us have been taught that the solution to uncomfortable feelings is to control or eliminate them. Feel anxious? Calm down. Feel sad? Cheer up. Feel an urge? Suppress it.",
          "This 'control agenda' works for external problems. If your house is cold, you turn up the heat. If you're hungry, you eat. But internal experiences don't work the same way.",
          "Trying to control or suppress thoughts and feelings often backfires. Try not to think of a pink elephant. What happened? The more you fight a thought, the stronger it gets.",
          "In CSBD, the control agenda has likely been your strategy: trying to suppress urges, fighting off thoughts, avoiding uncomfortable feelings. How has that worked? ACT offers a different approach."
        ]
      },
      {
        id: "willingness",
        title: "From Control to Willingness",
        content: [
          "Instead of fighting your internal experiences, ACT invites you to be willing to have them. Not wanting them, not enjoying them - just making room for them.",
          "Willingness means: I can have this urge and not act on it. I can feel this shame and still take action. I can have the thought 'I'm a failure' and still keep going.",
          "This is radically different from what you've been doing. It's not resignation or giving up. It's choosing to engage with life fully, including the parts that hurt.",
          "When you stop fighting internal experiences, you free up enormous energy for what actually matters - living according to your values."
        ]
      }
    ],
    reflectionQuestions: [
      {
        id: "q1",
        question: "How have you tried to control or eliminate unwanted thoughts, feelings, or urges? How well has that worked?"
      },
      {
        id: "q2",
        question: "What would it mean to be 'willing' to have uncomfortable experiences without acting on them or running from them?"
      },
      {
        id: "q3",
        question: "When you're 'stuck,' what usually has you stuck? Thoughts? Feelings? Avoidance? Old habits?"
      },
      {
        id: "q4",
        question: "What would a more psychologically flexible response to urges look like for you?"
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
      "Complete the Control Agenda Assessment",
      "Complete the Psychological Flexibility Self-Assessment",
      "Practice one Willingness Experiment and record results",
      "Notice times you're using the control agenda during the week",
      "Practice being willing to have urges without acting on them",
      "Continue daily monitoring logs for all 7 days"
    ]
  },

  10: {
    weekNumber: 10,
    title: "Cognitive Defusion",
    phase: 2,
    phaseName: "Integration & Values",
    overview: "This week teaches cognitive defusion - the skill of stepping back from your thoughts and seeing them as mental events rather than literal truths you must obey.",
    teaching: [
      {
        id: "fusion-vs-defusion",
        title: "Fusion vs. Defusion",
        content: [
          "FUSION is when you're 'hooked' by your thoughts. You believe them absolutely, react to them automatically, and let them dictate your behavior. When fused with a thought, it feels like the truth, not like a thought.",
          "DEFUSION is stepping back from thoughts. You see them as mental events - words and pictures passing through your mind - rather than absolute truths you must act on.",
          "Examples of fusion: 'I have an urge, so I have to act on it.' 'I feel hopeless, so there's no point in trying.' 'I had the thought that I'm broken, so I must be broken.'",
          "Defusion doesn't mean the thoughts go away. It means they have less control over your behavior. You can have the thought 'I need to act out' and not act on it."
        ]
      },
      {
        id: "thoughts-not-facts",
        title: "Thoughts Are Not Facts",
        content: [
          "Your mind is a thought-generating machine. It produces thousands of thoughts every day. Not all of them are true, useful, or worth acting on.",
          "Many thoughts are just echoes of the past, stories your mind tells on repeat, or predictions about the future that may never happen.",
          "The thought 'I'm a failure' is just a thought. It's not a fact. It's not a command. It's just words in your head.",
          "When you're fused with a thought, it feels like reality. When you're defused, you can see: 'Oh, there's my mind again, telling me that story.'"
        ]
      },
      {
        id: "defusion-techniques",
        title: "Defusion Techniques",
        content: [
          "'I'M HAVING THE THOUGHT THAT...': Instead of 'I'm worthless,' say 'I'm having the thought that I'm worthless.' This creates distance between you and the thought.",
          "'THANKING YOUR MIND': When your mind offers unhelpful commentary, try: 'Thanks, mind. I notice you're trying to protect me, but I've got this.'",
          "'NAMING THE STORY': If you have a recurring thought pattern, give it a name. 'Oh, there's the I'm Broken Story again.' 'Here comes the Permission Story.'",
          "'SINGING THE THOUGHT': Take an intrusive thought and sing it to the tune of 'Happy Birthday' or another silly song. Notice how it changes the thought's power.",
          "'LEAVES ON A STREAM': Imagine placing each thought on a leaf and watching it float down a stream. You observe the thoughts passing without grabbing onto them."
        ]
      },
      {
        id: "urge-defusion",
        title: "Defusing from Urges",
        content: [
          "Urges can feel like commands. 'I NEED to do this.' But an urge is just a physical sensation plus thoughts. It's not a command you must obey.",
          "When an urge arises, try: 'I'm having the urge to act out.' 'There's a pull toward the behavior.' 'My mind is telling me I need relief.'",
          "Notice the urge as a physical sensation. Where is it in your body? What does it actually feel like? Observe it with curiosity rather than fear.",
          "Remember: You are not your urge. You are the one noticing the urge. This awareness gives you choice."
        ]
      },
      {
        id: "defusion-limitations",
        title: "What Defusion Is NOT",
        content: [
          "Defusion is NOT positive thinking. You're not replacing negative thoughts with positive ones. You're changing your relationship to all thoughts.",
          "Defusion is NOT getting rid of thoughts. The thoughts may still be there. But they have less grip on you.",
          "Defusion is NOT denying or suppressing. You fully acknowledge the thought. You just don't let it drive your behavior.",
          "The goal is not to never have unwanted thoughts. The goal is to have them without being controlled by them."
        ]
      }
    ],
    reflectionQuestions: [
      {
        id: "q1",
        question: "What thoughts do you commonly get 'hooked' by? Which thoughts have the most power over your behavior?"
      },
      {
        id: "q2",
        question: "If you could step back from your thoughts and see them as just thoughts, how might your behavior change?"
      },
      {
        id: "q3",
        question: "What 'story' does your mind tell you most often? Can you give it a name?"
      },
      {
        id: "q4",
        question: "What's the difference between 'I'm a failure' and 'I'm having the thought that I'm a failure'?"
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
      "Complete the Identifying Fusion exercise",
      "Name at least 2 recurring 'stories' your mind tells",
      "Practice 'I'm having the thought that...' at least 5 times",
      "Practice defusing from at least one urge",
      "Complete the Defusion Practice Log",
      "Notice when you're fused with thoughts throughout the week",
      "Complete daily monitoring logs for all 7 days"
    ]
  },

  11: {
    weekNumber: 11,
    title: "Values Clarification",
    phase: 2,
    phaseName: "Integration & Values",
    overview: "This week focuses on clarifying what truly matters to you. Values are the compass that guides committed action and gives life meaning beyond the avoidance of pain.",
    teaching: [
      {
        id: "what-are-values",
        title: "What Are Values?",
        content: [
          "Values are your heart's deepest desires for how you want to behave as a human being. They're about who you want to be and what you want to stand for.",
          "Values are not goals. Goals can be achieved and checked off. Values are ongoing directions - you never 'arrive' at a value, you live it moment by moment.",
          "Examples: 'Being a loving partner' is a value. 'Getting married' is a goal. 'Being honest' is a value. 'Telling the truth about this one thing' is a goal.",
          "Values are freely chosen. They're not 'shoulds' imposed from outside. They're what YOU would choose if you could live according to your deepest convictions."
        ]
      },
      {
        id: "values-vs-goals",
        title: "Values vs. Goals",
        content: [
          "GOALS are specific outcomes you can achieve. They have endpoints. Examples: Stop acting out for 90 days. Get a promotion. Repair my marriage.",
          "VALUES are directions you travel. They have no endpoint. Examples: Living with integrity. Being a committed partner. Pursuing growth.",
          "You can fail a goal but you can't fail a value. If you slip, you haven't 'failed' at the value of integrity - you just stepped away from it momentarily. You can step back toward it in the next moment.",
          "Goals are important, but they serve values. Ask: 'What value does this goal serve? Why does it matter?'"
        ]
      },
      {
        id: "why-values-matter",
        title: "Why Values Matter in Recovery",
        content: [
          "Without clear values, recovery becomes about what you're running from (the behavior and its consequences) rather than what you're moving toward (a meaningful life).",
          "Running from pain is exhausting and unsustainable. Moving toward meaning is energizing and sustainable.",
          "Values provide the 'why' for the hard work of recovery. When you know WHY integrity matters, you can endure the discomfort of change.",
          "Values also provide a compass when you're lost. When urges are strong, you can ask: 'What would the person I want to be do right now?'"
        ]
      },
      {
        id: "value-domains",
        title: "Life Domains for Values",
        content: [
          "Values can be explored across different life domains:",
          "RELATIONSHIPS & FAMILY: What kind of partner, parent, family member do you want to be?",
          "WORK & CAREER: What qualities do you want to bring to your work? What do you want to contribute?",
          "PERSONAL GROWTH: Who do you want to become? What qualities do you want to develop?",
          "HEALTH & WELLBEING: How do you want to treat your body? What does self-care mean to you?",
          "COMMUNITY & SOCIAL: How do you want to contribute to your community? What kind of friend do you want to be?",
          "SPIRITUALITY & MEANING: What gives your life meaning? What connects you to something larger than yourself?"
        ]
      },
      {
        id: "values-and-behavior",
        title: "Connecting Values to Behavior",
        content: [
          "Values only matter when they're translated into action. A value you never act on is just an idea.",
          "For each value, ask: 'What would I be doing if I were living this value? What would someone see me doing?'",
          "Then ask: 'Am I doing those things? If not, what's stopping me?'",
          "Often, what's stopping us is discomfort. ACT teaches that we can feel the discomfort and take the action anyway. This is committed action - the subject of next week."
        ]
      }
    ],
    reflectionQuestions: [
      {
        id: "q1",
        question: "What kind of person do you want to be? What do you want to stand for?"
      },
      {
        id: "q2",
        question: "If you were living fully according to your values, what would be different about your life?"
      },
      {
        id: "q3",
        question: "How has your behavior conflicted with your values? What has that cost you?"
      },
      {
        id: "q4",
        question: "What values have been most neglected during your struggle with CSBD? How would you like to reclaim them?"
      }
    ],
    exercises: [
      {
        id: "values-clarification",
        title: "Values Clarification",
        instructions: "Explore your values in each major life domain.",
        fields: [
          {
            id: "relationships",
            label: "RELATIONSHIPS: What kind of partner, parent, or family member do you want to be? What values matter most here?",
            type: "textarea",
            placeholder: "Describe your relationship values..."
          },
          {
            id: "work",
            label: "WORK: What values do you want to bring to your work or career? What matters to you professionally?",
            type: "textarea",
            placeholder: "Describe your work values..."
          },
          {
            id: "personal",
            label: "PERSONAL GROWTH: What kind of person are you striving to become? What qualities do you want to develop?",
            type: "textarea",
            placeholder: "Describe your growth values..."
          },
          {
            id: "health",
            label: "HEALTH: How do you want to care for yourself physically, mentally, and emotionally?",
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
      "Read all Week 11 material",
      "Complete the Values Clarification exercise for all life domains",
      "Identify and rank your top 5 core values",
      "Complete the Values-Action Gap Analysis",
      "Take at least one values-based action this week",
      "Notice when you're living according to your values and when you're not",
      "Share your values with your accountability partner",
      "Complete daily monitoring logs for all 7 days"
    ]
  },

  12: {
    weekNumber: 12,
    title: "Acceptance & Mindfulness",
    phase: 2,
    phaseName: "Integration & Values",
    overview: "This week deepens your practice of acceptance and mindfulness - the willingness to experience the present moment fully, including uncomfortable thoughts and feelings, without defense.",
    teaching: [
      {
        id: "what-is-acceptance",
        title: "What Is Acceptance?",
        content: [
          "Acceptance means making room for uncomfortable experiences - thoughts, feelings, urges, sensations - instead of fighting them.",
          "Acceptance is NOT approval. You don't have to like something to accept it. You can accept that you have an urge while disagreeing with acting on it.",
          "Acceptance is NOT resignation or giving up. It's the opposite - it frees you to take effective action instead of wasting energy on an internal war.",
          "Acceptance is NOT weakness. It takes enormous strength to face difficult experiences openly rather than running from them."
        ]
      },
      {
        id: "clean-vs-dirty-pain",
        title: "Clean Pain vs. Dirty Pain",
        content: [
          "CLEAN PAIN is the unavoidable pain of being human. Loss, disappointment, fear, sadness - these are part of life. Clean pain hurts, but it doesn't destroy.",
          "DIRTY PAIN is the suffering we add on top of clean pain through struggle and avoidance. It's the pain about the pain. Examples: Shame about feeling sad. Anxiety about feeling anxious. Frustration with having urges.",
          "Much of our suffering comes from dirty pain. We have an urge, which is uncomfortable (clean pain), and then we beat ourselves up for having the urge (dirty pain).",
          "Acceptance reduces dirty pain. You still have the clean pain of urges and difficult feelings, but you don't pile on additional suffering by fighting them."
        ]
      },
      {
        id: "mindfulness-basics",
        title: "Mindfulness: Being Present",
        content: [
          "Mindfulness is paying attention to the present moment, on purpose, without judgment.",
          "When you're mindful, you notice what's happening right now - sensations in your body, thoughts in your mind, the environment around you - without getting lost in stories about the past or future.",
          "CSBD often involves disconnection from the present. Acting out happens in a 'trance' state, disconnected from consequences, values, and reality. Mindfulness is the antidote.",
          "Mindfulness isn't about achieving a special state. It's about being fully present with whatever is happening, even if what's happening is uncomfortable."
        ]
      },
      {
        id: "urge-mindfulness",
        title: "Mindfulness with Urges",
        content: [
          "When an urge arises, mindfulness means observing it with curiosity rather than reacting to it with fear or action.",
          "Notice where the urge lives in your body. What physical sensations are present? Is there tension, heat, pressure? What happens to these sensations as you observe them?",
          "Notice the thoughts that accompany the urge. Don't engage with them - just observe them passing through, like clouds across the sky.",
          "Watch the urge rise, peak, and fall. Like a wave, it will pass. You don't have to fight it or act on it. You just have to be willing to experience it."
        ]
      },
      {
        id: "expansion",
        title: "The Expansion Technique",
        content: [
          "Expansion is a way of making space for difficult emotions instead of pushing them away.",
          "HOW TO PRACTICE: (1) Notice the difficult emotion (anxiety, shame, loneliness, anger). (2) Find where you feel it in your body. (3) Imagine breathing into that area. (4) Visualize creating space around the sensation - like opening a tight fist. (5) Allow the feeling to be there without fighting it. (6) Say to yourself: 'I can make room for this.'",
          "This doesn't make the feeling go away. It reduces the struggle and suffering around it.",
          "With practice, you develop the capacity to have difficult feelings without being overwhelmed by them."
        ]
      }
    ],
    reflectionQuestions: [
      {
        id: "q1",
        question: "What feelings or experiences are you most unwilling to have? What do you fight against or try to escape?"
      },
      {
        id: "q2",
        question: "How much of your suffering is 'dirty pain' - pain you add through struggle rather than the original difficult experience?"
      },
      {
        id: "q3",
        question: "What would change if you could make room for uncomfortable feelings without acting to escape them?"
      },
      {
        id: "q4",
        question: "When do you feel most present and aware? When are you most likely to 'check out' or disconnect?"
      }
    ],
    exercises: [
      {
        id: "clean-dirty-pain",
        title: "Clean Pain vs. Dirty Pain Analysis",
        instructions: "Examine a recent difficult experience and separate the clean and dirty pain.",
        fields: [
          {
            id: "experience",
            label: "Describe a recent difficult experience (urge, feeling, situation):",
            type: "textarea",
            placeholder: "Describe the experience..."
          },
          {
            id: "clean-pain",
            label: "What was the clean pain? (The original uncomfortable feeling or experience)",
            type: "textarea",
            placeholder: "Describe the clean pain..."
          },
          {
            id: "dirty-pain",
            label: "What dirty pain did you add? (Struggle, self-criticism, anxiety about the feeling, etc.)",
            type: "textarea",
            placeholder: "Describe the dirty pain..."
          },
          {
            id: "acceptance",
            label: "What would it look like to accept the clean pain without adding dirty pain?",
            type: "textarea",
            placeholder: "Describe an acceptance response..."
          }
        ]
      },
      {
        id: "body-scan",
        title: "Body Scan Practice",
        instructions: "Practice a mindful body scan and record your experience.",
        fields: [
          {
            id: "practice",
            label: "Practice: Sit quietly for 5-10 minutes. Move your attention slowly through your body from head to toe, noticing whatever sensations are present without judgment. What did you notice?",
            type: "textarea",
            placeholder: "Describe what you noticed during the body scan..."
          },
          {
            id: "difficult",
            label: "Were there areas of discomfort? How did you respond to them?",
            type: "textarea",
            placeholder: "Describe areas of discomfort and your response..."
          }
        ]
      },
      {
        id: "expansion-practice",
        title: "Expansion Technique Practice",
        instructions: "Practice the expansion technique with a difficult emotion.",
        fields: [
          {
            id: "emotion",
            label: "What emotion did you practice with?",
            type: "textarea",
            placeholder: "Name the emotion..."
          },
          {
            id: "location",
            label: "Where was it in your body?",
            type: "textarea",
            placeholder: "Describe the location..."
          },
          {
            id: "result",
            label: "What happened when you created space for it instead of fighting it?",
            type: "textarea",
            placeholder: "Describe what happened..."
          },
          {
            id: "intensity",
            label: "What did you notice about the intensity? Did it change?",
            type: "textarea",
            placeholder: "Describe any changes..."
          }
        ]
      },
      {
        id: "daily-acceptance",
        title: "Daily Acceptance Practice Log",
        instructions: "Practice acceptance daily using this prompt: 'What am I unwilling to feel right now?' Then practice making room for it.",
        fields: [
          {
            id: "log",
            label: "Record your daily acceptance practice (what you were unwilling to feel and what happened when you practiced acceptance):",
            type: "textarea",
            placeholder: "Day 1:\nDay 2:\nDay 3:\nDay 4:\nDay 5:\nDay 6:\nDay 7:"
          },
          {
            id: "learning",
            label: "What did you learn about your relationship with discomfort this week?",
            type: "textarea",
            placeholder: "Key learnings..."
          }
        ]
      }
    ],
    homeworkChecklist: [
      "Read all Week 12 material",
      "Complete Clean Pain vs. Dirty Pain exercise",
      "Practice body scan at least 3 times this week",
      "Complete body scan practice log",
      "Practice urge mindfulness with at least one real urge",
      "Practice expansion technique with a difficult emotion",
      "Use daily acceptance practice prompt all 7 days",
      "Complete daily acceptance practice log",
      "Complete daily monitoring logs for all 7 days"
    ]
  },

  13: {
    weekNumber: 13,
    title: "Committed Action",
    phase: 2,
    phaseName: "Integration & Values",
    overview: "This week moves you from insight to action. Committed action means doing what matters - living according to your values - even when it's uncomfortable, even when urges or fear show up.",
    teaching: [
      {
        id: "what-is-committed-action",
        title: "What Is Committed Action?",
        content: [
          "Committed action means doing what matters - living according to your values - even when you don't feel like it, even when it's hard, even when urges or fear show up.",
          "This is the backbone of long-term recovery. Values clarification tells you where you want to go. Committed action gets you there.",
          "The key insight: You don't have to feel ready to take action. Most men wait until the urge goes away, they feel motivated, they're confident they can succeed, or the fear subsides. ACT says: You can feel anxious, unmotivated, fearful, or have urges AND still take values-based action.",
          "The 'do what works' principle: Does this action move me toward my values or away from them?"
        ]
      },
      {
        id: "motivation-vs-commitment",
        title: "Motivation vs. Commitment",
        content: [
          "MOTIVATION is a feeling. It comes and goes. 'I feel inspired to change.' 'I'm excited about recovery.' Feels good, but unreliable.",
          "COMMITMENT is a choice. It stays regardless of feelings. 'I will do this even when I don't feel like it.' 'This matters, so I'm showing up.' Doesn't always feel good, but it's reliable.",
          "Recovery requires commitment, not motivation. You'll have days when you don't feel motivated - days when you're tired, discouraged, or overwhelmed.",
          "Committed action means showing up anyway. You do what your values dictate, not what your feelings dictate."
        ]
      },
      {
        id: "small-steps",
        title: "The Power of Small Steps",
        content: [
          "Don't underestimate the power of small, consistent actions. Small steps work because they're achievable (less overwhelming), they build momentum, they create new neural pathways, and they prove to yourself you can do it.",
          "Examples of small steps: Call one person from your support network. Practice urge surfing for 5 minutes. Write one thought record. Go for a 10-minute walk. Journal for 5 minutes. Read one page of this workbook.",
          "The compound effect: Small actions, done consistently, create massive change over time.",
          "Big leaps often fail because they're overwhelming. Small steps succeed because they're doable."
        ]
      },
      {
        id: "barriers-to-action",
        title: "Barriers to Committed Action",
        content: [
          "Common obstacles include: Fear, shame, avoidance, perfectionism, urges, fatigue, emotional discomfort, relationship tension, and 'I don't feel like it' thinking.",
          "ACT teaches you to move forward WITH the discomfort, not after it disappears.",
          "Common barrier responses: 'I don't feel like it' - Feeling follows action, not the other way around. Take action based on values, not feelings. 'I'm too tired' - Do a smaller version. Can't do 30 minutes? Do 5. 'It won't make a difference anyway' - This is the 'hopelessness' story. Thank your mind. Then act anyway. 'I'll start tomorrow' - Tomorrow never comes. What's one thing you can do in the next 60 seconds? 'I'm afraid I'll fail' - Failure is guaranteed if you don't try. Taking action is success, regardless of outcome."
        ]
      },
      {
        id: "smart-goals",
        title: "SMART Goals for Values",
        content: [
          "SMART goals help translate values into specific, actionable commitments. SMART = Specific, Measurable, Achievable, Relevant, Time-bound.",
          "The committed action process: (1) Identify a value (e.g., 'Be a present and emotionally available husband'). (2) Choose a specific behavior (e.g., 'Check in emotionally with my wife for 10 minutes each night'). (3) Set a realistic frequency (e.g., '5 nights per week'). (4) Prepare for barriers (e.g., 'I'm tired,' 'We're busy' - plan responses). (5) Track and review.",
          "Action without review becomes inconsistent. Set up a way to track your committed actions and review them regularly."
        ]
      }
    ],
    reflectionQuestions: [
      {
        id: "q1",
        question: "What values-based actions have you been avoiding? What would committed action look like?"
      },
      {
        id: "q2",
        question: "What barriers most often prevent you from taking action aligned with your values?"
      },
      {
        id: "q3",
        question: "Think of a time when you took action despite not feeling ready. What happened?"
      },
      {
        id: "q4",
        question: "What small step could you take today toward one of your core values?"
      }
    ],
    exercises: [
      {
        id: "smart-goals",
        title: "SMART Goals for Committed Action",
        instructions: "Create SMART goals for three different timeframes.",
        fields: [
          {
            id: "this-week",
            label: "THIS WEEK: Value I'm acting on, specific action, how often, how I'll track it:",
            type: "textarea",
            placeholder: "Value:\nSpecific action:\nHow often:\nHow I'll track it:"
          },
          {
            id: "this-month",
            label: "THIS MONTH: Value I'm acting on, specific action, how often, how I'll track it:",
            type: "textarea",
            placeholder: "Value:\nSpecific action:\nHow often:\nHow I'll track it:"
          },
          {
            id: "three-months",
            label: "NEXT 3 MONTHS: Value I'm acting on, specific action, how often, how I'll track it:",
            type: "textarea",
            placeholder: "Value:\nSpecific action:\nHow often:\nHow I'll track it:"
          }
        ]
      },
      {
        id: "barrier-plan",
        title: "Barrier Troubleshooting",
        instructions: "Identify your personal barriers to committed action and plan responses.",
        fields: [
          {
            id: "barrier1",
            label: "Barrier 1: What commonly stops you from taking values-based action?",
            type: "textarea",
            placeholder: "Barrier:"
          },
          {
            id: "response1",
            label: "How will you respond to this barrier?",
            type: "textarea",
            placeholder: "My response:"
          },
          {
            id: "barrier2",
            label: "Barrier 2:",
            type: "textarea",
            placeholder: "Barrier:"
          },
          {
            id: "response2",
            label: "Response:",
            type: "textarea",
            placeholder: "My response:"
          },
          {
            id: "barrier3",
            label: "Barrier 3:",
            type: "textarea",
            placeholder: "Barrier:"
          },
          {
            id: "response3",
            label: "Response:",
            type: "textarea",
            placeholder: "My response:"
          }
        ]
      },
      {
        id: "weekly-tracker",
        title: "Weekly Action Tracker",
        instructions: "Track your committed actions daily this week.",
        fields: [
          {
            id: "tracking",
            label: "For each day, record: Values-based action taken, difficulty level, what helped, barriers faced:",
            type: "textarea",
            placeholder: "Day 1:\nDay 2:\nDay 3:\nDay 4:\nDay 5:\nDay 6:\nDay 7:"
          },
          {
            id: "easier",
            label: "What made it easier to take committed action?",
            type: "textarea",
            placeholder: "What helped..."
          },
          {
            id: "harder",
            label: "What made it harder?",
            type: "textarea",
            placeholder: "What was challenging..."
          },
          {
            id: "impact",
            label: "How did taking values-based action affect your urges or mood?",
            type: "textarea",
            placeholder: "Impact observed..."
          }
        ]
      }
    ],
    homeworkChecklist: [
      "Read all Week 13 material",
      "Create 3 SMART goals (this week, this month, next 3 months)",
      "Complete barrier troubleshooting exercise",
      "Identify and reach out to accountability partner(s)",
      "Take at least one values-based action every day this week",
      "Complete weekly action tracker",
      "Notice: What makes committed action easier? What makes it harder?",
      "Complete daily monitoring logs for all 7 days"
    ]
  },

  14: {
    weekNumber: 14,
    title: "Self-as-Context & Identity",
    phase: 2,
    phaseName: "Integration & Values",
    overview: "This week explores one of the most transformative ACT principles: Self-as-Context - the observing self. You'll learn to separate who you are from what you think, feel, or have done.",
    teaching: [
      {
        id: "observer-self",
        title: "The Observer Self",
        content: [
          "One of the most profound insights from ACT is this: You are not your thoughts, feelings, or behaviors. You are the one observing them. This is called self-as-context or the observer self.",
          "Think of it this way: You've had thousands of thoughts throughout your life. Some you remember, most you've forgotten. But YOU - the one noticing those thoughts - has remained constant.",
          "You've experienced countless emotions. Joy, anger, shame, peace. They've all come and gone. But YOU - the one experiencing those emotions - has been there all along.",
          "You've engaged in many behaviors. Some you're proud of, some you regret. But YOU - the one choosing those behaviors - is not defined by any single action.",
          "You are the container, not the contents."
        ]
      },
      {
        id: "conceptualized-self",
        title: "The Conceptualized Self Problem",
        content: [
          "Most men with CSBD are fused with their 'conceptualized self' - the story their mind tells about who they are.",
          "Common fused identities: 'I AM an addict.' 'I AM broken.' 'I AM my urges.' 'I AM my behavior.' 'I AM a failure.' 'I AM disgusting.'",
          "When you're fused with this identity: The behavior becomes who you are, not what you do. Shame becomes overwhelming. Change feels impossible. Recovery feels like fighting yourself.",
          "Self-as-context offers a different perspective. You've done things. You've had experiences. But those things are not who you ARE."
        ]
      },
      {
        id: "two-selves",
        title: "The Two 'Selves'",
        content: [
          "THE THINKING SELF (Conceptualized Self): The part of you filled with thoughts, judgments, urges, stories. This is the voice that says 'I'm broken,' 'I'll always fail,' 'I need to act out,' 'I'm worthless.'",
          "THE OBSERVING SELF (Self-as-Context): The calm, steady awareness that watches thoughts, emotions, urges, sensations, and experiences come and go.",
          "Nothing you've felt, thought, or done has ever damaged the observing self. It's always there, always aware, always capable of noticing what's happening.",
          "When you identify with the observing self rather than the thinking self, difficult experiences lose their power to define you."
        ]
      },
      {
        id: "identity-transformation",
        title: "Identity Transformation",
        content: [
          "Recovery involves identity transformation. You're not just changing behavior - you're changing your relationship to who you are.",
          "The old identity: 'I am someone who struggles with this.' The new identity: 'I am someone who is building a life of integrity.'",
          "This doesn't mean denying your past. It means not being defined by it. You can acknowledge what you've done without concluding that it defines who you are.",
          "Key truths of the observing self: You are not your thoughts. You are not your urges. You are not your emotions. You are not your past behavior. You are not your diagnosis. You are not your shame. You are the one who notices all of these."
        ]
      },
      {
        id: "values-aligned-identity",
        title: "Building a Values-Aligned Identity",
        content: [
          "Instead of defining yourself by your behavior or your struggles, define yourself by your values and direction.",
          "Complete this sentence based on your values (not your behavior): 'I am a man who...'",
          "Examples: 'I am a man who chooses honesty.' 'I am a man who shows up with courage.' 'I am a man who protects his integrity.' 'I am a man who is learning and growing.' 'I am a man who takes responsibility.'",
          "This isn't about pretending you're perfect. It's about orienting your identity around where you're going, not where you've been."
        ]
      }
    ],
    reflectionQuestions: [
      {
        id: "q1",
        question: "What labels or identities have you fused with? How have these defined your sense of self?"
      },
      {
        id: "q2",
        question: "If you could step back and observe your thoughts and feelings without being defined by them, what would change?"
      },
      {
        id: "q3",
        question: "Who are you beyond your behavior? What is true about you that your struggles haven't touched?"
      },
      {
        id: "q4",
        question: "What values-based identity statement would you like to grow into? 'I am a man who...'"
      }
    ],
    exercises: [
      {
        id: "identity-assessment",
        title: "Identity Fusion Assessment",
        instructions: "Explore the identities you've fused with.",
        fields: [
          {
            id: "labels",
            label: "What labels or identities do you apply to yourself? (e.g., 'I am an addict,' 'I am broken,' etc.)",
            type: "textarea",
            placeholder: "List the identities you've fused with..."
          },
          {
            id: "origins",
            label: "Where did these labels come from? How did they develop?",
            type: "textarea",
            placeholder: "Explore the origins..."
          },
          {
            id: "cost",
            label: "What has fusing with these identities cost you? How have they limited you?",
            type: "textarea",
            placeholder: "Consider the costs..."
          }
        ]
      },
      {
        id: "observer-practice",
        title: "Observer Self Practice",
        instructions: "Practice connecting with the observing self through meditation.",
        fields: [
          {
            id: "meditation",
            label: "Sit quietly. Notice your thoughts without engaging them. Notice your feelings without drowning in them. Notice sensations in your body. Now notice the part of you that is noticing all of this. What was this experience like?",
            type: "textarea",
            placeholder: "Describe your experience..."
          },
          {
            id: "insight",
            label: "What did you learn about the difference between who you are and what you experience?",
            type: "textarea",
            placeholder: "Key insights..."
          },
          {
            id: "application",
            label: "How does this perspective change how you view urges or shame?",
            type: "textarea",
            placeholder: "Application of insights..."
          }
        ]
      },
      {
        id: "beyond-behavior",
        title: "Who Am I Beyond My Behavior?",
        instructions: "Explore who you are independent of your struggles.",
        fields: [
          {
            id: "qualities",
            label: "What positive qualities do you have that remain true regardless of your behavior? (e.g., loyal, caring, creative)",
            type: "textarea",
            placeholder: "List your enduring qualities..."
          },
          {
            id: "roles",
            label: "What roles do you play that aren't defined by CSBD? (e.g., father, friend, professional)",
            type: "textarea",
            placeholder: "List your roles..."
          },
          {
            id: "contributions",
            label: "What do you contribute to others' lives?",
            type: "textarea",
            placeholder: "Your contributions..."
          },
          {
            id: "values-statement",
            label: "Complete this: 'I am a man who...' (based on your values, not your behavior)",
            type: "textarea",
            placeholder: "I am a man who..."
          }
        ]
      }
    ],
    homeworkChecklist: [
      "Read all Week 14 material",
      "Complete the Identity Fusion Assessment",
      "Practice observer self meditation at least once",
      "Complete 'Who Am I Beyond My Behavior?' exercise",
      "Write your values-aligned identity statement",
      "Notice when you're fusing with CSBD identity vs. observing experiences",
      "Practice separating behavior from identity throughout the week",
      "Complete daily monitoring logs for all 7 days"
    ]
  },

  15: {
    weekNumber: 15,
    title: "Comprehensive Relapse Prevention",
    phase: 2,
    phaseName: "Integration & Values",
    overview: "This week integrates everything you've learned into a comprehensive relapse prevention plan. You'll combine CBT skills and ACT principles into a sustainable recovery lifestyle.",
    teaching: [
      {
        id: "integrated-approach",
        title: "The Integrated Approach",
        content: [
          "You've learned CBT skills (Weeks 1-8) and ACT principles (Weeks 9-14). Now it's time to integrate everything into a comprehensive relapse prevention plan.",
          "This isn't just about stopping behavior. It's about building a sustainable recovery lifestyle.",
          "PHASE 1 SKILLS (CBT): Understanding the CSBD cycle, identifying triggers, cognitive restructuring, urge surfing and coping strategies, self-compassion practices, communication and problem-solving.",
          "PHASE 2 SKILLS (ACT): Acceptance of uncomfortable experiences, cognitive defusion, values clarification, committed action despite discomfort, mindfulness practices, self-as-context.",
          "The integrated approach uses BOTH sets of tools together."
        ]
      },
      {
        id: "integrated-urge-response",
        title: "The Integrated Response to Urges",
        content: [
          "When an urge appears, you now have a complete toolkit:",
          "1. NOTICE (Mindfulness) - Observe the urge without judgment. 'An urge is present.'",
          "2. DEFUSE (ACT) - 'I'm having the thought that I need to act out' (not 'I MUST act out').",
          "3. ACCEPT (ACT) - Make room for discomfort. Don't fight the urge, allow it.",
          "4. CONNECT TO VALUES (ACT) - What matters right now? What kind of person do I want to be?",
          "5. CHALLENGE THOUGHTS (CBT) - Check for cognitive distortions. What's the evidence?",
          "6. USE COPING SKILLS (CBT) - Implement specific strategies: urge surfing, opposite action, reach out.",
          "7. COMMIT TO ACTION (ACT) - Do what aligns with values, regardless of how you feel."
        ]
      },
      {
        id: "four-zones",
        title: "The Four Relapse Zones",
        content: [
          "GREEN ZONE (Stable): Connected, using tools, following structure, honest, practicing awareness. Maintain current practices.",
          "YELLOW ZONE (Warning): Increased stress, avoidance, skipping routines, strong urges, emotional withdrawal. Increase accountability, boost coping strategies.",
          "ORANGE ZONE (High Risk): Preoccupation, rituals beginning, opportunity seeking, secrecy, loss of emotional regulation. Emergency protocol - reach out immediately.",
          "RED ZONE (Critical): About to act out, already acted out, shame spike, avoidance of accountability. Crisis response - use all resources.",
          "Your plan determines which direction you go after a warning sign."
        ]
      },
      {
        id: "recovery-lifestyle",
        title: "Building a Recovery Lifestyle",
        content: [
          "Relapse prevention isn't just about managing urges. It's about building a life that supports recovery.",
          "PHYSICAL HEALTH: Regular exercise, adequate sleep (7-9 hours), nutritious food, limit alcohol and substances.",
          "EMOTIONAL REGULATION: Ongoing therapy, regular mindfulness practice, journaling, healthy emotional outlets.",
          "SOCIAL CONNECTION: Strong support network, regular accountability check-ins, support group attendance, healthy friendships.",
          "SPIRITUAL PRACTICE: Prayer or meditation, faith community, values-based reflection, practices that create meaning.",
          "MEANINGFUL WORK: Engagement in meaningful activities, contributing to others, using your strengths, pursuing growth.",
          "JOY AND RECREATION: Hobbies, play, rest, activities that bring genuine joy."
        ]
      },
      {
        id: "structure-and-routine",
        title: "Life Structure and Routines",
        content: [
          "Structure is the foundation of relapse prevention. Unstructured time is risky time.",
          "Key areas to structure: Sleep schedule, morning routine, evening routine, work hours, exercise, connection time, accountability check-ins.",
          "Build routines that support your values and make healthy choices automatic. When you don't have to decide what to do, you're less vulnerable to making poor choices.",
          "Review your structure weekly. Adjust as needed. When you notice you're slipping on structure, that's a yellow zone warning sign."
        ]
      }
    ],
    reflectionQuestions: [
      {
        id: "q1",
        question: "Which skills from Phase 1 (CBT) have been most helpful? Which from Phase 2 (ACT)?"
      },
      {
        id: "q2",
        question: "What does your current recovery lifestyle look like? What areas need strengthening?"
      },
      {
        id: "q3",
        question: "What are your top 5 high-risk situations? What's your plan for each?"
      },
      {
        id: "q4",
        question: "What daily and weekly practices will you commit to for ongoing recovery?"
      }
    ],
    exercises: [
      {
        id: "zone-identification",
        title: "My Zone Identification",
        instructions: "Describe your personal indicators for each zone.",
        fields: [
          {
            id: "green",
            label: "GREEN ZONE: What behaviors, thoughts, and emotions indicate I'm stable?",
            type: "textarea",
            placeholder: "Behaviors:\nThoughts:\nEmotions:"
          },
          {
            id: "yellow",
            label: "YELLOW ZONE: What warning signs indicate I'm at elevated risk?",
            type: "textarea",
            placeholder: "Behaviors:\nThoughts:\nEmotions:"
          },
          {
            id: "orange",
            label: "ORANGE ZONE: What indicates I'm at high risk?",
            type: "textarea",
            placeholder: "Behaviors:\nThoughts:\nEmotions:"
          },
          {
            id: "red",
            label: "RED ZONE: What indicates I'm in crisis?",
            type: "textarea",
            placeholder: "Behaviors:\nThoughts:\nEmotions:"
          }
        ]
      },
      {
        id: "emergency-plan",
        title: "Emergency Action Plan",
        instructions: "Create your plan for when urges become overwhelming.",
        fields: [
          {
            id: "contact1",
            label: "Person I will call immediately (name and phone):",
            type: "textarea",
            placeholder: "Name:\nPhone:"
          },
          {
            id: "contact2",
            label: "Backup person (name and phone):",
            type: "textarea",
            placeholder: "Name:\nPhone:"
          },
          {
            id: "location",
            label: "Where I will go (leave the situation):",
            type: "textarea",
            placeholder: "Location..."
          },
          {
            id: "grounding",
            label: "How I will ground myself (3 specific actions):",
            type: "textarea",
            placeholder: "1.\n2.\n3."
          },
          {
            id: "remove-access",
            label: "How I will remove access (device, location, etc.):",
            type: "textarea",
            placeholder: "Steps to remove access..."
          },
          {
            id: "values-action",
            label: "One immediate values-based action I will take:",
            type: "textarea",
            placeholder: "Values-based action..."
          }
        ]
      },
      {
        id: "complete-plan",
        title: "My Complete Relapse Prevention Plan",
        instructions: "Create your comprehensive plan.",
        fields: [
          {
            id: "warning-signs",
            label: "MY TOP 5 WARNING SIGNS:",
            type: "textarea",
            placeholder: "1.\n2.\n3.\n4.\n5."
          },
          {
            id: "high-risk",
            label: "MY TOP 5 HIGH-RISK SITUATIONS:",
            type: "textarea",
            placeholder: "1.\n2.\n3.\n4.\n5."
          },
          {
            id: "coping",
            label: "MY GO-TO COPING STRATEGIES:",
            type: "textarea",
            placeholder: "1.\n2.\n3.\n4.\n5."
          },
          {
            id: "support",
            label: "MY SUPPORT SYSTEM (accountability partner, mentor, support group):",
            type: "textarea",
            placeholder: "List your support system..."
          },
          {
            id: "daily",
            label: "MY DAILY RECOVERY PRACTICES:",
            type: "textarea",
            placeholder: "What I will do every day..."
          },
          {
            id: "weekly",
            label: "MY WEEKLY RECOVERY PRACTICES:",
            type: "textarea",
            placeholder: "What I will do every week..."
          }
        ]
      },
      {
        id: "lifestyle-assessment",
        title: "Recovery Lifestyle Assessment",
        instructions: "Rate each area from 1-10 (1 = needs major work, 10 = thriving).",
        fields: [
          {
            id: "physical",
            label: "Physical Health: Rating and what needs improvement:",
            type: "textarea",
            placeholder: "Rating: /10\nNeeds improvement:"
          },
          {
            id: "emotional",
            label: "Emotional Regulation: Rating and what needs improvement:",
            type: "textarea",
            placeholder: "Rating: /10\nNeeds improvement:"
          },
          {
            id: "social",
            label: "Social Connection: Rating and what needs improvement:",
            type: "textarea",
            placeholder: "Rating: /10\nNeeds improvement:"
          },
          {
            id: "spiritual",
            label: "Spiritual Practice: Rating and what needs improvement:",
            type: "textarea",
            placeholder: "Rating: /10\nNeeds improvement:"
          },
          {
            id: "meaning",
            label: "Meaningful Work/Purpose: Rating and what needs improvement:",
            type: "textarea",
            placeholder: "Rating: /10\nNeeds improvement:"
          },
          {
            id: "joy",
            label: "Joy and Recreation: Rating and what needs improvement:",
            type: "textarea",
            placeholder: "Rating: /10\nNeeds improvement:"
          }
        ]
      }
    ],
    homeworkChecklist: [
      "Read all Week 15 material",
      "Complete Zone Identification exercise",
      "Create your Emergency Action Plan",
      "Complete your Comprehensive Relapse Prevention Plan",
      "Complete Recovery Lifestyle Assessment",
      "Share your plan with your accountability partner or mentor",
      "Begin implementing daily and weekly recovery practices",
      "Complete daily monitoring logs for all 7 days"
    ]
  },

  16: {
    weekNumber: 16,
    title: "Integration & Moving Forward",
    phase: 2,
    phaseName: "Integration & Values",
    overview: "Congratulations on reaching the final week. This week is about integrating everything you've learned, celebrating your progress, and preparing for the ongoing journey ahead.",
    teaching: [
      {
        id: "journey-review",
        title: "Your 16-Week Journey",
        content: [
          "Over the past 16 weeks, you've done profound work. Let's review what you've learned:",
          "PHASE 1 (Foundation & Stabilization): Understanding the CSBD cycle and how to interrupt it, your personal triggers and warning signs, challenging cognitive distortions, urge management and coping strategies, the difference between shame and guilt, self-compassion practices, how CSBD affects relationships and attachment, problem-solving and assertive communication.",
          "PHASE 2 (Integration & Values): Acceptance vs. control, cognitive defusion techniques, values clarification, mindfulness and present-moment awareness, committed action despite discomfort, self-as-context (the observer self), comprehensive relapse prevention.",
          "You are not the same person who started this workbook 16 weeks ago."
        ]
      },
      {
        id: "definition-of-integrity",
        title: "Your Definition of Sexual Integrity",
        content: [
          "Sexual integrity means living: With honesty, with clarity, with alignment to your values, without secrecy, without compulsion, with courage and connection.",
          "This isn't about perfection. It's about direction. It's about consistently moving toward the person you want to be.",
          "Your definition of sexual integrity is personal. It's based on your values, your commitments, and your vision for your life.",
          "Sexual integrity isn't a destination you arrive at. It's a way of living that you practice every day."
        ]
      },
      {
        id: "values-lifestyle-plan",
        title: "Your Long-Term Values Plan",
        content: [
          "Values remain the foundation. Your long-term plan should address multiple life domains: Relationships, marriage/intimacy, parenting (if applicable), spirituality/faith, health, career, community, and personal growth.",
          "For each domain, consider: Why this area matters, what actions support your values, what obstacles may arise, and how you will respond to those obstacles.",
          "This isn't a rigid plan but a living document. Review it regularly and adjust as your life evolves.",
          "Remember: The goal is not perfection but direction. Every day is a new opportunity to live according to your values."
        ]
      },
      {
        id: "recovery-blueprint",
        title: "Your Recovery Blueprint",
        content: [
          "Long-term recovery requires: Accountability, structure, connection, ongoing reflection, and rituals of integrity.",
          "MORNING STRUCTURE: How will you begin your day aligned with integrity?",
          "EVENING STRUCTURE: How will you review your day and reset?",
          "WEEKLY STRUCTURE: Check-ins, habit review, faith or mindfulness practice, relationship connection.",
          "MONTHLY STRUCTURE: Evaluate progress, adjust goals, strengthen values-aligned habits.",
          "Your recovery lifestyle is the container that holds all the skills you've learned."
        ]
      },
      {
        id: "moving-forward",
        title: "Moving Forward",
        content: [
          "This isn't the end. This is the beginning. The work you've done here has prepared you for the life you're building.",
          "Remember: Your story is still being written. You are capable of healing. You are defined not by your past but by your direction. Every day is a new opportunity to live your values.",
          "Continue the practices that have helped you. Stay connected to your support system. When you struggle (and you will), return to what you've learned.",
          "You've completed something significant. Take time to acknowledge that. Then take the next step."
        ]
      },
      {
        id: "if-i-relapse",
        title: "If I Relapse After the Program",
        content: [
          "Let's be honest: Many men will experience lapses or relapses after completing this program. This doesn't mean the program failed or that you failed. It means you're human and recovery is a process.",
          "WHAT TO DO IMMEDIATELY: (1) Stop as soon as you realize what's happening. A lapse doesn't have to become a full relapse. (2) Reach out to someone - your mentor, accountability partner, or support group. Isolation is the enemy. (3) Don't let shame spiral you further. Use the self-compassion tools you learned.",
          "WITHIN 24-48 HOURS: (1) Complete a relapse analysis - what led to this? What warning signs did you miss? (2) Review your relapse prevention plan. Does it need updating? (3) Recommit to your daily practices. Don't wait until you 'feel ready.'",
          "WHAT NOT TO DO: Don't conclude that recovery is impossible. Don't use 'I already messed up' thinking to continue acting out. Don't hide or isolate. Don't punish yourself - it fuels the cycle.",
          "IMPORTANT: A relapse is data, not destiny. It shows you where your plan needs strengthening. Every person who has achieved long-term recovery has faced setbacks. What matters is what you do next."
        ]
      },
      {
        id: "ongoing-support",
        title: "Ongoing Support Resources",
        content: [
          "Recovery doesn't end when the program ends. Here are resources for continued support:",
          "INDIVIDUAL THERAPY: Continue working with a therapist who specializes in sexual compulsivity. EMDR or trauma-focused therapy may be helpful if you haven't addressed underlying trauma.",
          "SUPPORT GROUPS: Sex Addicts Anonymous (SAA), Celebrate Recovery, SMART Recovery, and similar groups provide ongoing community and accountability.",
          "COUPLES THERAPY: If you're in a relationship, consider ongoing couples work with a therapist trained in betrayal trauma.",
          "RETREAT PROGRAMS: Intensive multi-day workshops and retreats can provide breakthrough experiences at critical moments.",
          "BOOKS AND RESOURCES: Continue reading and learning. Recommended: 'Out of the Shadows' by Patrick Carnes, 'Unwanted' by Jay Stringer, 'The Happiness Trap' by Russ Harris.",
          "BOOSTER SESSIONS: Consider scheduling quarterly 'booster' sessions with your mentor to review your progress and address any emerging issues."
        ]
      }
    ],
    reflectionQuestions: [
      {
        id: "q1",
        question: "What have you learned about yourself over these 16 weeks? What patterns do you now understand?"
      },
      {
        id: "q2",
        question: "What tools and skills have helped you the most? Which do you still need to strengthen?"
      },
      {
        id: "q3",
        question: "How has your identity begun to change? Who are you becoming?"
      },
      {
        id: "q4",
        question: "What do you want to carry into the future? What is your vision for your life?"
      }
    ],
    exercises: [
      {
        id: "16-week-reflection",
        title: "16-Week Reflection",
        instructions: "Reflect on your journey through this program.",
        fields: [
          {
            id: "learned",
            label: "What have I learned about myself?",
            type: "textarea",
            placeholder: "Reflect on your learning..."
          },
          {
            id: "patterns",
            label: "What patterns do I now understand?",
            type: "textarea",
            placeholder: "Describe the patterns you've identified..."
          },
          {
            id: "tools",
            label: "What tools have helped me the most?",
            type: "textarea",
            placeholder: "List your most helpful tools..."
          },
          {
            id: "strengthen",
            label: "What skills do I still need to strengthen?",
            type: "textarea",
            placeholder: "Areas for continued growth..."
          },
          {
            id: "identity",
            label: "How has my identity begun to change?",
            type: "textarea",
            placeholder: "Describe your identity shift..."
          },
          {
            id: "relationships",
            label: "What relationships have shifted, healed, or grown?",
            type: "textarea",
            placeholder: "Describe relationship changes..."
          }
        ]
      },
      {
        id: "integrity-definition",
        title: "My Definition of Sexual Integrity",
        instructions: "Write your personal definition of sexual integrity.",
        fields: [
          {
            id: "definition",
            label: "Sexual integrity means that I...",
            type: "textarea",
            placeholder: "Write your definition..."
          }
        ]
      },
      {
        id: "values-lifestyle",
        title: "Values-Based Lifestyle Plan",
        instructions: "Create your plan for each major life domain.",
        fields: [
          {
            id: "relationships",
            label: "RELATIONSHIPS: Why this matters, actions that support my values, potential obstacles, how I'll respond:",
            type: "textarea",
            placeholder: "Your relationships plan..."
          },
          {
            id: "intimacy",
            label: "MARRIAGE/INTIMACY: Why this matters, actions that support my values, potential obstacles, how I'll respond:",
            type: "textarea",
            placeholder: "Your intimacy plan..."
          },
          {
            id: "spirituality",
            label: "SPIRITUALITY/FAITH: Why this matters, actions that support my values, potential obstacles, how I'll respond:",
            type: "textarea",
            placeholder: "Your spirituality plan..."
          },
          {
            id: "health",
            label: "HEALTH: Why this matters, actions that support my values, potential obstacles, how I'll respond:",
            type: "textarea",
            placeholder: "Your health plan..."
          },
          {
            id: "growth",
            label: "PERSONAL GROWTH: Why this matters, actions that support my values, potential obstacles, how I'll respond:",
            type: "textarea",
            placeholder: "Your growth plan..."
          }
        ]
      },
      {
        id: "recovery-blueprint",
        title: "My Recovery Blueprint",
        instructions: "Define your daily, weekly, and monthly structure.",
        fields: [
          {
            id: "morning",
            label: "MORNING STRUCTURE: How I will begin each day:",
            type: "textarea",
            placeholder: "Morning routine..."
          },
          {
            id: "evening",
            label: "EVENING STRUCTURE: How I will end each day:",
            type: "textarea",
            placeholder: "Evening routine..."
          },
          {
            id: "weekly",
            label: "WEEKLY STRUCTURE: Check-ins, practices, connections:",
            type: "textarea",
            placeholder: "Weekly practices..."
          },
          {
            id: "monthly",
            label: "MONTHLY STRUCTURE: Review, adjust, strengthen:",
            type: "textarea",
            placeholder: "Monthly review..."
          }
        ]
      },
      {
        id: "commitment-statement",
        title: "Final Commitment Statement",
        instructions: "Write your commitment for the next 12 months.",
        fields: [
          {
            id: "commitment",
            label: "Over the next 12 months, I commit to living with sexual integrity by...",
            type: "textarea",
            placeholder: "Write your commitment..."
          }
        ]
      },
      {
        id: "letter-to-future-self",
        title: "Letter to My Future Self",
        instructions: "Write a letter to yourself 6 months from now. Include your values, reminders of challenges you might face, encouragement, and the tools that work for you.",
        fields: [
          {
            id: "letter",
            label: "Dear Future Self,",
            type: "textarea",
            placeholder: "Write your letter..."
          }
        ]
      }
    ],
    homeworkChecklist: [
      "Complete the 16-Week Reflection",
      "Write your personal definition of sexual integrity",
      "Create your Values-Based Lifestyle Plan for all domains",
      "Build your Recovery Blueprint with daily/weekly/monthly structure",
      "Write your Final Commitment Statement",
      "Write a letter to your future self (to read in 6 months)",
      "Share your plan with your mentor or accountability partner",
      "Schedule your first post-program check-in",
      "Celebrate completing this program - you've done significant work"
    ]
  }
};

export const WEEK_TITLES: Record<number, string> = {
  1: "The Moment You Stop Pretending",
  2: "Nothing About This Is Random",
  3: "Your Mind Is Not Telling You the Truth",
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
