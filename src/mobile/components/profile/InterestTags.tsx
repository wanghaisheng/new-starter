'use client';

import React, { useState } from 'react';
import { IonChip, IonLabel, IonIcon, IonInput, IonButton } from '@ionic/react';
import { close, add } from 'ionicons/icons';

interface InterestTagsProps {
  tags: string[];
  onTagsChange: (tags: string[]) => void;
  maxTags?: number;
  editable?: boolean;
}

export const InterestTags: React.FC<InterestTagsProps> = ({
  tags = [],
  onTagsChange,
  maxTags = 10,
  editable = true
}) => {
  const [tagInput, setTagInput] = useState('');

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim()) && tags.length < maxTags) {
      const newTags = [...tags, tagInput.trim()];
      onTagsChange(newTags);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    const newTags = tags.filter(t => t !== tag);
    onTagsChange(newTags);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  return (
    <div className="w-full">
      {editable && (
        <div className="flex items-center mb-3">
          <IonInput
            value={tagInput}
            placeholder="添加兴趣标签"
            onIonChange={e => setTagInput(e.detail.value || '')}
            onKeyDown={handleKeyDown}
            className="flex-1"
            disabled={tags.length >= maxTags}
          />
          <IonButton 
            size="small" 
            onClick={handleAddTag}
            disabled={tags.length >= maxTags || !tagInput.trim()}
          >
            <IonIcon icon={add} />
          </IonButton>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {tags.map((tag, index) => (
          <IonChip 
            key={index} 
            className="bg-primary-100 text-primary-800"
            outline={false}
          >
            <IonLabel>{tag}</IonLabel>
            {editable && (
              <IonIcon 
                icon={close} 
                onClick={() => handleRemoveTag(tag)}
                className="cursor-pointer"
              />
            )}
          </IonChip>
        ))}
        {tags.length === 0 && (
          <div className="text-gray-500 text-sm">
            {editable ? '添加一些兴趣标签来展示你的爱好' : '暂无兴趣标签'}
          </div>
        )}
      </div>
      {editable && tags.length >= maxTags && (
        <div className="text-xs text-gray-500 mt-1">
          已达到最大标签数量 ({maxTags})
        </div>
      )}
    </div>
  );
};