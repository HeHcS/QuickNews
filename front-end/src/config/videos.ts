export const videos = {
  nature: {
    flowers: 'https://assets.mixkit.co/videos/preview/mixkit-tree-with-yellow-flowers-1173-large.mp4',
    waves: 'https://assets.mixkit.co/videos/preview/mixkit-waves-in-the-water-1164-large.mp4',
    forest: 'https://assets.mixkit.co/videos/preview/mixkit-forest-stream-in-the-sunlight-529-large.mp4',
  },
  lifestyle: {
    yoga: 'https://assets.mixkit.co/videos/preview/mixkit-young-woman-practicing-yoga-in-a-park-4378-large.mp4',
    coffee: 'https://assets.mixkit.co/videos/preview/mixkit-coffee-being-poured-into-a-cup-seen-up-close-43725-large.mp4',
  },
  urban: {
    cityNight: 'https://assets.mixkit.co/videos/preview/mixkit-aerial-view-of-city-traffic-at-night-11-large.mp4',
  },
  food: {
    cooking: 'https://assets.mixkit.co/videos/preview/mixkit-chef-cooking-food-in-a-pan-with-fire-43366-large.mp4',
  },
  performance: {
    dance: 'https://assets.mixkit.co/videos/preview/mixkit-woman-doing-a-choreography-42894-large.mp4',
  },
} as const;

export type VideoCategory = keyof typeof videos;
export type VideoKey<T extends VideoCategory> = keyof typeof videos[T]; 