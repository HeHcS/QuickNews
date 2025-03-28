export interface Video {
  id: number;
  title: string;
  username: string;
  description: string;
  thumbnailUrl: string;
  topic: string;
  duration: string;
  likesCount: number;
  commentsCount: number;
  isLive: boolean;
  creatorProfilePic: string;
}
