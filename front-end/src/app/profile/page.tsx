import BottomNav from '@/components/ui/BottomNav';

export default function ProfilePage() {
  return (
    <div className="h-screen bg-black text-white">
      <div className="flex items-center justify-center h-full">
        <h1 className="text-2xl font-bold">Profile 👤</h1>
      </div>
      <BottomNav />
    </div>
  );
} 