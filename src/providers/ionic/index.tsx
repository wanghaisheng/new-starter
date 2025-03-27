'use client';

import { IonApp } from '@ionic/react';
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

// 动态导入IonApp，禁用SSR
const DynamicIonApp = dynamic(() => Promise.resolve(IonApp), { ssr: false });

export function IonicProvider({ children }: PropsWithChildren) {
  useEffect(() => {
    // 在客户端初始化Ionic
    document.documentElement.classList.add('ion-ce');
  }, []);

  return (
    <DynamicIonApp>
      {children}
    </DynamicIonApp>
  );
}
