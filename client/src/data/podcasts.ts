export interface PodcastEpisode {
  title: string;
  file: string;
  description?: string;
}

export const WEEK_PODCASTS: Record<number, PodcastEpisode> = {
  1: {
    title: "Deconstructing the Cycle",
    file: "/podcasts/week-1.mp4",
    description: "A visual breakdown of the core concepts in this week's lesson.",
  },
  2: {
    title: "Nothing About This Is Random",
    file: "/podcasts/week-2.mp4",
    description: "A visual breakdown of the core concepts in this week's lesson.",
  },
  4: {
    title: "Willpower Isn't Enough",
    file: "/podcasts/week-4.mp4",
    description: "A visual breakdown of the core concepts in this week's lesson.",
  },
};
