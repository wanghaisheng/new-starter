/**
 * 图片资源索引
 * 
 * 此文件导出所有图片资源的路径常量，按类别组织
 * 在应用中引用图片时，应该使用此文件中的常量，而不是硬编码路径
 */

// 用户头像图片
export const PROFILE_IMAGES = {
  // 女性头像
  WOMAN_1: '/assets/images/profiles/profile-women-32.jpg',
  WOMAN_2: '/assets/images/profiles/profile-women-44.jpg',
  WOMAN_3: '/assets/images/profiles/profile-women-65.jpg',
  WOMAN_4: '/assets/images/profiles/profile-women-76.jpg',
  
  // 男性头像
  MAN_1: '/assets/images/profiles/profile-men-32.jpg',
  
  // 默认头像和占位图
  DEFAULT_AVATAR: '/assets/images/profiles/default-avatar.jpg',
  AVATAR_PLACEHOLDER: '/assets/images/profiles/avatar-placeholder.jpg',
  PROFILE_PLACEHOLDER: '/assets/images/profiles/profile-placeholder.jpg',
};

// 背景图片
export const BACKGROUND_IMAGES = {
  MAIN: '/assets/images/backgrounds/background-1531123897727-8f129e1688ce.jpg',
};

// 照片占位图
export const PHOTO_PLACEHOLDERS = {
  PHOTO_1: '/assets/images/profiles/photo-placeholder-1.jpg',
  PHOTO_2: '/assets/images/profiles/photo-placeholder-2.jpg',
  PHOTO_3: '/assets/images/profiles/photo-placeholder-3.jpg',
  PHOTO_4: '/assets/images/profiles/photo-placeholder-4.jpg',
};

// 图标
export const ICONS = {
  HOME: '/assets/images/icons/icon-home.svg',
  PROFILE: '/assets/images/icons/icon-profile.svg',
  MESSAGE: '/assets/images/icons/icon-message.svg',
  SETTINGS: '/assets/images/icons/icon-settings.svg',
  SEARCH: '/assets/images/icons/icon-search.svg',
  NOTIFICATION: '/assets/images/icons/icon-notification.svg',
  LIKE: '/assets/images/icons/icon-like.svg',
  DISLIKE: '/assets/images/icons/icon-dislike.svg',
  PHOTO: '/assets/images/icons/icon-photo.svg',
};

// 导出所有图片资源
export default {
  PROFILE_IMAGES,
  BACKGROUND_IMAGES,
  PHOTO_PLACEHOLDERS,
  ICONS,
};