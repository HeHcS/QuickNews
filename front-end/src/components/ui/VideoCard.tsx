import Image from 'next/image';
import Link from 'next/link';

interface VideoCardProps {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  creator: {
    name: string;
    avatar?: string;
  };
  views: number;
  duration: string;
}

export default function VideoCard({
  id,
  title,
  description,
  thumbnail,
  creator,
  views,
  duration,
}: VideoCardProps) {
  return (
    <Link href={`/watch/${id}`} className="group">
      <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
        <div className="relative aspect-video">
          <Image
            src={thumbnail}
            alt={title}
            fill
            className="object-cover"
          />
          <div className="absolute bottom-2 right-2 bg-black/80 text-white px-2 py-1 rounded text-sm">
            {duration}
          </div>
        </div>
        <div className="p-4">
          <h3 className="font-semibold text-lg mb-2 group-hover:text-primary">
            {title}
          </h3>
          <p className="text-gray-600 text-sm mb-2 line-clamp-2">
            {description}
          </p>
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center space-x-2">
              {creator.avatar && (
                <Image
                  src={creator.avatar}
                  alt={creator.name}
                  width={24}
                  height={24}
                  className="rounded-full"
                />
              )}
              <span>{creator.name}</span>
            </div>
            <span>{views.toLocaleString()} views</span>
          </div>
        </div>
      </div>
    </Link>
  );
} 