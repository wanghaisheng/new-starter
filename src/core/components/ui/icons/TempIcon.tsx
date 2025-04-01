import React from 'react';

interface TempIconProps {
  name: string;
  size?: number;
  color?: string;
  className?: string;
}

/**
 * 临时图标组件
 * 
 * 用于在开发过程中，当设计素材尚未最终确定或提供时，提供临时SVG图标
 * 遵循UI素材管理指南中的规范
 */
export const TempIcon: React.FC<TempIconProps> = ({ 
  name, 
  size = 24, 
  color = 'currentColor',
  className = ''
}) => {
  // 根据name返回不同的临时SVG
  switch (name) {
    case 'home':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
          <title>首页图标</title>
          <rect x="4" y="10" width="16" height="10" stroke={color} strokeWidth="2" fill="none" />
          <path d="M4 10L12 3L20 10" stroke={color} strokeWidth="2" fill="none" />
          {/* 注释：这是临时SVG，将被实际设计替换 */}
        </svg>
      );
    case 'user':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
          <title>用户图标</title>
          <circle cx="12" cy="8" r="4" stroke={color} strokeWidth="2" fill="none" />
          <path d="M4 20C4 16.6863 7.58172 14 12 14C16.4183 14 20 16.6863 20 20" stroke={color} strokeWidth="2" fill="none" />
          {/* 注释：这是临时SVG，将被实际设计替换 */}
        </svg>
      );
    case 'settings':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
          <title>设置图标</title>
          <circle cx="12" cy="12" r="2" stroke={color} strokeWidth="2" fill="none" />
          <path d="M19.4 15C19.7 14.4 20 13.7 20 13C20 12.3 19.8 11.6 19.4 11L16.8 11.8C16.6 11.4 16.3 11 15.9 10.7L16.7 8.1C16.1 7.7 15.4 7.4 14.7 7.3C14 7.2 13.3 7.2 12.6 7.4L11.8 10C11.4 10 11 10.2 10.7 10.4L8.1 9.6C7.7 10.2 7.4 10.9 7.3 11.6C7.2 12.3 7.2 13 7.4 13.7L10 14.5C10 14.9 10.2 15.3 10.4 15.6L9.6 18.2C10.2 18.6 10.9 18.9 11.6 19C12.3 19.1 13 19.1 13.7 18.9L14.5 16.3C14.9 16.3 15.3 16.1 15.6 15.9L18.2 16.7C18.6 16.1 18.9 15.4 19 14.7C19.1 14 19.1 13.3 18.9 12.6L16.3 11.8C16.3 11.4 16.1 11 15.9 10.7L16.7 8.1" stroke={color} strokeWidth="2" fill="none" />
          {/* 注释：这是临时SVG，将被实际设计替换 */}
        </svg>
      );
    case 'notification':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
          <title>通知图标</title>
          <path d="M10 5C10 3.89543 10.8954 3 12 3C13.1046 3 14 3.89543 14 5V5.5C16.3487 6.31986 18 8.61305 18 11.3333V15.8889L20 17.8889V18.8889H4V17.8889L6 15.8889V11.3333C6 8.61305 7.65127 6.31986 10 5.5V5Z" stroke={color} strokeWidth="2" fill="none" />
          <path d="M9 19C9 20.1046 9.89543 21 11 21H13C14.1046 21 15 20.1046 15 19H9Z" stroke={color} strokeWidth="2" fill="none" />
          {/* 注释：这是临时SVG，将被实际设计替换 */}
        </svg>
      );
    case 'success':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
          <title>成功图标</title>
          <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" fill="none" />
          <path d="M8 12L11 15L16 9" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          {/* 注释：这是临时SVG，将被实际设计替换 */}
        </svg>
      );
    case 'error':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
          <title>错误图标</title>
          <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" fill="none" />
          <path d="M15 9L9 15" stroke={color} strokeWidth="2" strokeLinecap="round" />
          <path d="M9 9L15 15" stroke={color} strokeWidth="2" strokeLinecap="round" />
          {/* 注释：这是临时SVG，将被实际设计替换 */}
        </svg>
      );
    case 'loading':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
          <title>加载动画</title>
          <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" strokeDasharray="20 31" fill="none">
            <animateTransform
              attributeName="transform"
              attributeType="XML"
              type="rotate"
              from="0 12 12"
              to="360 12 12"
              dur="1s"
              repeatCount="indefinite"/>
          </circle>
          {/* 注释：这是临时SVG，将被实际设计替换 */}
        </svg>
      );
    // 默认图标，显示图标名称的占位符
    default:
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
          <title>{name}图标</title>
          <rect x="4" y="4" width="16" height="16" stroke={color} strokeWidth="2" fill="none" />
          <text x="12" y="14" textAnchor="middle" fill={color} fontSize="8">{name}</text>
          {/* 注释：这是临时SVG，将被实际设计替换 */}
        </svg>
      );
  }
};

export default TempIcon;