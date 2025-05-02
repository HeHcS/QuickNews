import { Suspense } from 'react';
import VideoFeed from '@/components/ui/VideoFeed';

export default function BusinessPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VideoFeed />
    </Suspense>
  );
} 