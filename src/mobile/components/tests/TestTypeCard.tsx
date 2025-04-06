import { TestType } from '@/core/lib/db/types';
import { GlassCard } from '@/mobile/components/ui/GlassCard';
import { Icon } from '@/mobile/components/ui/Icon';

interface TestTypeCardProps {
  test: TestType;
  isSelected: boolean;
  onSelect: () => void;
}

export function TestTypeCard({ test, isSelected, onSelect }: TestTypeCardProps) {
  return (
    <GlassCard
      className={`relative overflow-hidden cursor-pointer transition-all duration-300 ${
        isSelected ? 'ring-2 ring-primary-500' : ''
      }`}
      onClick={onSelect}
    >
      <div
        className="absolute inset-0 opacity-10"
        style={{ backgroundColor: test.color }}
      />
      <div className="relative p-6">
        <div className="flex items-center mb-4">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center mr-4"
            style={{ backgroundColor: test.color }}
          >
            <Icon name={test.icon} className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800">{test.name}</h2>
        </div>
        <p className="text-gray-600">{test.description}</p>
      </div>
    </GlassCard>
  );
} 