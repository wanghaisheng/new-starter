import { User } from '@/core/lib/db/types';
import { GlassCard } from '@/components/common/GlassCard';

interface MatchCardProps {
  user: User;
  onLike: () => void;
  onDislike: () => void;
}

export function MatchCard({ user, onLike, onDislike }: MatchCardProps) {
  return (
    <GlassCard className="p-6">
      <div className="aspect-square relative rounded-lg overflow-hidden mb-4">
        <img
          src={user.photos[0]?.url || '/default-avatar.png'}
          alt={user.name}
          className="w-full h-full object-cover"
        />
      </div>

      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-bold text-white">{user.name}</h2>
          <p className="text-gray-300">
            {user.location.city}, {user.location.country}
          </p>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-white mb-2">简介</h3>
          <p className="text-gray-300">{user.bio}</p>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-white mb-2">兴趣</h3>
          <div className="flex flex-wrap gap-2">
            {user.interests.map((interest, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm"
              >
                {interest}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="flex gap-4 mt-6">
        <button
          onClick={onDislike}
          className="flex-1 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
        >
          不喜欢
        </button>
        <button
          onClick={onLike}
          className="flex-1 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          喜欢
        </button>
      </div>
    </GlassCard>
  );
} 