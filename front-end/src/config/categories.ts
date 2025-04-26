export interface Category {
  name: string;
  description: string;
}

export const APP_CATEGORIES: Category[] = [
  {
    name: 'Breaking',
    description: 'Latest breaking news and updates'
  },
  {
    name: 'Politics',
    description: 'Political news and current affairs'
  },
  {
    name: 'For You',
    description: 'Personalized content based on your interests'
  },
  {
    name: 'Tech',
    description: 'Technology news and innovations'
  },
  {
    name: 'Business',
    description: 'Business and financial news'
  },
  {
    name: 'Following',
    description: 'Content from creators you follow'
  }
]; 