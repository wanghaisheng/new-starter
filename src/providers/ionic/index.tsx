'use client';

import { IonApp, setupIonicReact } from '@ionic/react';
import { PropsWithChildren, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

// 导入Ionic样式
import '@ionic/react/css/core.css';
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

// 配置Ionic，禁用任何内置路由行为
setupIonicReact({
  mode: 'ios',
  hardwareBackButton: false, // 禁用硬件返回按钮行为
  animated: true,
  swipeBackEnabled: false,  // 禁用滑动返回
  rippleEffect: false,      // 禁用涟漪效果
});

// 动态导入IonApp，禁用SSR
const DynamicIonApp = dynamic(() => Promise.resolve(IonApp), { ssr: false });

export function IonicProvider({ children }: PropsWithChildren) {
  useEffect(() => {
    // 在客户端初始化Ionic
    document.documentElement.classList.add('ion-ce');
    
    // 全局事件处理：阻止所有Ionic可能触发的导航事件
    const handleClick = (e: MouseEvent) => {
      // 检查是否点击的是Ionic导航元素
      const target = e.target as HTMLElement;
      if (target && target.closest('ion-tab-bar, ion-tab-button, ion-router, ion-route')) {
        // 如果是Ionic导航元素，我们只允许我们自己的处理程序处理它
        const href = target.getAttribute('href');
        if (href === undefined || href === '#' || href === '') {
          e.preventDefault();
          e.stopPropagation();
        }
      }
    };
    
    // 添加全局点击监听
    document.addEventListener('click', handleClick, true);
    
    // 清理函数
    return () => {
      document.removeEventListener('click', handleClick, true);
    };
  }, []);

  return (
    <DynamicIonApp>
      {children}
    </DynamicIonApp>
  );
}
