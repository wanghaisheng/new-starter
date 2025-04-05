'use client';

import React, { useState, useEffect } from 'react';

import { IonButton } from '@ionic/react';
import { motion } from 'framer-motion';

import { User } from '@/core/lib/db/models/user';
import GlassCard from '@/src/mobile/components/ui/GlassCard';

interface MatchSuccessProps {
  currentUser: User;
  matchedUser: User;
  onSendMessage: () => void;
  onKeepSwiping: () => void;
  onClose?: () => void;
}

/**
 * 匹配成功界面组件
 * 
 * 显示两个用户匹配成功的动画和交互界面
 * 基于原型中的Match Screen设计
 */
const MatchSuccess: React.FC<MatchSuccessProps> = ({
  currentUser,
  matchedUser,
  onSendMessage,
  onKeepSwiping,
  onClose,
}) => {
  const [showAnimation, setShowAnimation] = useState(true);

  // 动画完成后设置showAnimation为false
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowAnimation(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  // 获取用户头像
  const currentUserPhoto = currentUser?.photos?.[0]?.url || '/assets/images/profiles/avatar-placeholder.jpg';
  const matchedUserPhoto = matchedUser?.photos?.[0]?.url || '/assets/images/profiles/profile-placeholder.jpg';
  
  // 获取匹配用户名
  const matchedUserName = matchedUser?.name || 'Someone';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="absolute inset-0 flex flex-col items-center justify-center p-6">
        {/* 标题动画 */}
        <motion.div 
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl font-bold text-pink-500 mb-2">It's a Match!</h2>
          <p className="text-slate-300">You and {matchedUserName} have liked each other</p>
        </motion.div>
        
        {/* 头像动画 */}
        <div className="flex justify-center items-end gap-6 mb-8">
          <motion.div 
            className="text-center"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-pink-500 mb-2">
              <img src={currentUserPhoto} alt="You" className="w-full h-full object-cover" />
            </div>
            <span className="text-sm">You</span>
          </motion.div>
          
          <motion.div 
            className="text-center"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-pink-500 mb-2">
              <img src={matchedUserPhoto} alt={matchedUserName} className="w-full h-full object-cover" />
            </div>
            <span className="text-sm">{matchedUserName}</span>
          </motion.div>
        </div>
        
        {/* 操作按钮 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="w-full max-w-sm"
        >
          <GlassCard className="p-6">
            <div className="space-y-4">
              <button 
                className="w-full bg-pink-600 hover:bg-pink-700 text-white py-3 rounded-full font-medium transition-all"
                onClick={onSendMessage}
              >
                Send Message
              </button>
              <button 
                className="w-full bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-full font-medium transition-all"
                onClick={onKeepSwiping}
              >
                Keep Swiping
              </button>
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </div>
  );
};

export default MatchSuccess;