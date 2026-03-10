export interface PodcastEpisode {
  title: string;
  file: string;
  description?: string;
}

export const WEEK_PODCASTS: Record<number, PodcastEpisode> = {
  1: {
    title: "The Moment You Stop Pretending",
    file: "/podcasts/week-1.mp4",
    description: "A visual breakdown of the core concepts in this week's lesson.",
  },
  2: {
    title: "Nothing About This Is Random",
    file: "/podcasts/week-2.mp4",
    description: "A visual breakdown of the core concepts in this week's lesson.",
  },
  3: {
    title: "Your Mind Is Not Telling You the Truth",
    file: "/podcasts/Week-3.mp4",
    description: "A visual breakdown of the core concepts in this week's lesson.",
  },
  4: {
    title: "Willpower Isn't Enough",
    file: "/podcasts/week-4.mp4",
    description: "A visual breakdown of the core concepts in this week's lesson.",
  },
  5: {
    title: "Shame Is Not Your Conscience",
    file: "/podcasts/Week-5.mp4",
    description: "A visual breakdown of the core concepts in this week's lesson.",
  },
  6: {
    title: "The People You've Been Living Around",
    file: "/podcasts/Week-6.mp4",
    description: "A visual breakdown of the core concepts in this week's lesson.",
  },
  7: {
    title: "What Needs to Be Said",
    file: "/podcasts/Week-7.mp4",
    description: "A visual breakdown of the core concepts in this week's lesson.",
  },
  8: {
    title: "The Architecture of Not Going Back",
    file: "/podcasts/Week-8.mp4",
    description: "A visual breakdown of the core concepts in this week's lesson.",
  },
};
