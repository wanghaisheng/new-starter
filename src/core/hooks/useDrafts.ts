import { useState, useCallback } from 'react';

export interface Draft {
  id: string;
  conversationId: string;
  content: string;
  updatedAt: string;
}

export interface UseDraftsResult {
  drafts: Draft[];
  getDraft: (conversationId: string) => Draft | undefined;
  saveDraft: (conversationId: string, content: string) => void;
  deleteDraft: (conversationId: string) => void;
}

export function useDrafts(): UseDraftsResult {
  const [drafts, setDrafts] = useState<Draft[]>([]);

  const getDraft = useCallback((conversationId: string) => {
    return drafts.find(d => d.conversationId === conversationId);
  }, [drafts]);

  const saveDraft = useCallback((conversationId: string, content: string) => {
    setDrafts(prev => {
      const existing = prev.find(d => d.conversationId === conversationId);
      if (existing) {
        return prev.map(d => d.conversationId === conversationId ? { ...d, content, updatedAt: new Date().toISOString() } : d);
      }
      return [...prev, { id: `${conversationId}-${Date.now()}`, conversationId, content, updatedAt: new Date().toISOString() }];
    });
  }, []);

  const deleteDraft = useCallback((conversationId: string) => {
    setDrafts(prev => prev.filter(d => d.conversationId !== conversationId));
  }, []);

  return {
    drafts,
    getDraft,
    saveDraft,
    deleteDraft,
  };
}
