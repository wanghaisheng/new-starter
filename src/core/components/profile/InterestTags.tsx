// InterestTags: 兴趣标签组件，迁移自 mobile/components/profile/InterestTags.tsx
import React from 'react';

interface InterestTagsProps {
  tags: string[];
  onSelect?: (tag: string) => void;
  selectedTags?: string[];
}

const InterestTags: React.FC<InterestTagsProps> = ({ tags, onSelect, selectedTags = [] }) => (
  <div className="flex flex-wrap gap-2">
    {tags.map(tag => (
      <button
        key={tag}
        className={`px-3 py-1 rounded-full border text-xs transition-all ${selectedTags.includes(tag) ? 'bg-pink-600 text-white border-pink-600' : 'bg-slate-700/40 text-slate-300 border-slate-600 hover:bg-pink-600/20'}`}
        onClick={() => onSelect && onSelect(tag)}
        type="button"
      >
        {tag}
      </button>
    ))}
  </div>
);

export default InterestTags;
