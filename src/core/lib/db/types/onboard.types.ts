import {BaseEntity} from "./base-entity";
/**
 * IOnboardService - 新手引导服务接口
 * 定义了获取新手引导配置的方法
 */
/**
 * OnboardStep - 新手引导步骤类型
 * 用于描述每一页引导内容（标题、描述、图片等）
 * 扩展建议：支持富媒体、动画、交互行为、远程配置等
 */
export interface OnboardStep  extends BaseEntity {
  /** 步骤标题 */
  title: string;
  /** 步骤描述 */
  desc: string;
  /** 展示图片（本地或远程 URL） */
  image: string;
  /** 可选：富媒体（如视频、动画） */
  videoUrl?: string;
  lottieUrl?: string;
  /** 可选：自定义背景色/样式 */
  backgroundColor?: string;
  /** 可选：交互行为（如按钮、跳转） */
  action?: {
    type: 'link' | 'button' | 'custom';
    label?: string;
    url?: string;
    onClick?: () => void;
    [key: string]: any;
  };
  /** 额外扩展字段（如跳转链接、按钮等） */
  [key: string]: any;
}

/**
 * OnboardConfig - 新手引导整体配置（可选）
 * 支持多语言、分组、A/B 测试、远程动态内容等扩展
 */
export interface OnboardConfig extends BaseEntity{
  steps: OnboardStep[];
  locale?: string;
  abTestGroup?: string;
  /** 可选：远程配置版本号/ID */
  configVersion?: string;
  /** 可选：平台端类型（web/mobile/app） */
  platform?: string;
  [key: string]: any;
}
