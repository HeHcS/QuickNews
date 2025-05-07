import { Suspense } from 'react';
import VideoFeed from '@/components/ui/VideoFeed';

export default function TechPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VideoFeed />
    </Suspense>
  );
} 