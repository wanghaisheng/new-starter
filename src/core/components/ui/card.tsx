'use client';

import React, { ReactNode } from 'react';
import { IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonCardSubtitle } from '@ionic/react';

interface CardProps {
  title?: string;
  subtitle?: string;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
  children: ReactNode;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({
  title,
  subtitle,
  className = '',
  headerClassName = '',
  contentClassName = '',
  children,
  onClick
}) => {
  return (
    <IonCard className={`overflow-hidden shadow-md rounded-lg ${className}`} onClick={onClick}>
      {(title || subtitle) && (
        <IonCardHeader className={headerClassName}>
          {subtitle && <IonCardSubtitle>{subtitle}</IonCardSubtitle>}
          {title && <IonCardTitle>{title}</IonCardTitle>}
        </IonCardHeader>
      )}
      <IonCardContent className={contentClassName}>
        {children}
      </IonCardContent>
    </IonCard>
  );
};