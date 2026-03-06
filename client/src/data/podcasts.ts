export interface PodcastEpisode {
  title: string;
  file: string;
  description?: string;
}

export const WEEK_PODCASTS: Record<number, PodcastEpisode> = {
  1: {
    title: "The Moment You Stop Pretending",
    file: "/podcasts/week-1.m4a",
    description: "A program overview and introduction to the core concepts in this week's lesson.",
  },
};
