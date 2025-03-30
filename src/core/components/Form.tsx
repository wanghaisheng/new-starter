'use client';

import React, { ReactNode } from 'react';
import { IonItem, IonLabel, IonInput, IonTextarea, IonSelect, IonSelectOption, IonButton, IonChip, IonIcon } from '@ionic/react';
import { close } from 'ionicons/icons';

// 表单项接口
export interface FormItemProps {
  label: string;
  name: string;
  type?: 'text' | 'number' | 'email' | 'password' | 'textarea' | 'select' | 'tags';
  value: any;
  onChange: (value: any) => void;
  placeholder?: string;
  options?: Array<{value: string; label: string}>;
  required?: boolean;
  error?: string;
  className?: string;
}

// 表单项组件
export const FormItem: React.FC<FormItemProps> = ({
  label,
  name,
  type = 'text',
  value,
  onChange,
  placeholder = '',
  options = [],
  required = false,
  error,
  className = ''
}) => {
  // 处理标签输入
  const [tagInput, setTagInput] = React.useState('');
  
  const handleTagAdd = () => {
    if (tagInput.trim() && !value.includes(tagInput.trim())) {
      const newTags = [...value, tagInput.trim()];
      onChange(newTags);
      setTagInput('');
    }
  };

  const handleTagRemove = (tag: string) => {
    const newTags = value.filter((t: string) => t !== tag);
    onChange(newTags);
  };

  const renderInput = () => {
    switch (type) {
      case 'textarea':
        return (
          <IonTextarea
            name={name}
            value={value}
            onIonChange={(e) => onChange(e.detail.value!)}
            placeholder={placeholder}
            required={required}
            className={`w-full ${className}`}
          />
        );
      case 'select':
        return (
          <IonSelect
            name={name}
            value={value}
            onIonChange={(e) => onChange(e.detail.value)}
            placeholder={placeholder}
            className={`w-full ${className}`}
          >
            {options.map((option) => (
              <IonSelectOption key={option.value} value={option.value}>
                {option.label}
              </IonSelectOption>
            ))}
          </IonSelect>
        );
      case 'tags':
        return (
          <div className="w-full">
            <div className="flex items-center mb-2">
              <IonInput
                value={tagInput}
                onIonChange={(e) => setTagInput(e.detail.value!)}
                placeholder={placeholder}
                className="flex-1"
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleTagAdd())}
              />
              <IonButton size="small" onClick={handleTagAdd}>添加</IonButton>
            </div>
            <div className="flex flex-wrap gap-2">
              {value && value.map((tag: string, index: number) => (
                <IonChip key={index} className="bg-primary-100">
                  <IonLabel>{tag}</IonLabel>
                  <IonIcon icon={close} onClick={() => handleTagRemove(tag)} />
                </IonChip>
              ))}
            </div>
          </div>
        );
      default:
        return (
          <IonInput
            name={name}
            type={type}
            value={value}
            onIonChange={(e) => onChange(e.detail.value!)}
            placeholder={placeholder}
            required={required}
            className={`w-full ${className}`}
          />
        );
    }
  };

  return (
    <IonItem className={`mb-4 ${error ? 'ion-invalid' : ''}`}>
      <div className="w-full">
        <IonLabel position="stacked">
          {label}{required && <span className="text-red-500">*</span>}
        </IonLabel>
        {renderInput()}
        {error && <div className="text-red-500 text-sm mt-1">{error}</div>}
      </div>
    </IonItem>
  );
};

// 表单接口
export interface FormProps {
  children: ReactNode;
  onSubmit: (e: React.FormEvent) => void;
  className?: string;
}

// 表单组件
export const Form: React.FC<FormProps> = ({ children, onSubmit, className = '' }) => {
  return (
    <form onSubmit={onSubmit} className={`w-full ${className}`}>
      {children}
    </form>
  );
};