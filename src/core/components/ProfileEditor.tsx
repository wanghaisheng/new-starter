'use client';

import React, { useState } from 'react';
import { IonButton, IonContent, IonHeader, IonTitle, IonToolbar, IonIcon } from '@ionic/react';
import { camera, images } from 'ionicons/icons';
import { User } from '@/core/models/user';
import { Form, FormItem } from './Form';
import { Card } from './Card';

interface ProfileEditorProps {
  user: User;
  onSave: (updatedUser: User) => void;
  onCancel: () => void;
}

export const ProfileEditor: React.FC<ProfileEditorProps> = ({ user, onSave, onCancel }) => {
  const [formData, setFormData] = useState<Partial<User>>({
    name: user.name,
    age: user.age,
    bio: user.bio,
    interests: [...user.interests],
    location: user.location,
    gender: user.gender || ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // 清除该字段的错误
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name?.trim()) {
      newErrors.name = '姓名不能为空';
    }
    
    if (!formData.age || formData.age < 18) {
      newErrors.age = '年龄必须大于或等于18岁';
    }
    
    if (!formData.bio?.trim()) {
      newErrors.bio = '请填写个人简介';
    }
    
    if (!formData.interests || formData.interests.length === 0) {
      newErrors.interests = '请至少添加一个兴趣爱好';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSave({
        ...user,
        ...formData as User
      });
    }
  };

  const handlePhotoUpload = () => {
    // 这里将来会实现照片上传功能
    console.log('照片上传功能待实现');
  };

  return (
    <>
      <IonHeader>
        <IonToolbar>
          <IonTitle>编辑个人资料</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <Form onSubmit={handleSubmit} className="space-y-4">
          {/* 照片上传区域 */}
          <Card title="照片" className="mb-4">
            <div className="grid grid-cols-3 gap-2 mb-4">
              {user.photos.map((photo, index) => (
                <div key={index} className="relative aspect-square overflow-hidden rounded-lg">
                  <img src={photo} alt={`照片 ${index + 1}`} className="w-full h-full object-cover" />
                </div>
              ))}
              <div 
                className="aspect-square flex items-center justify-center bg-gray-100 rounded-lg cursor-pointer"
                onClick={handlePhotoUpload}
              >
                <IonIcon icon={images} size="large" className="text-gray-500" />
              </div>
            </div>
            <IonButton expand="block" onClick={handlePhotoUpload}>
              <IonIcon icon={camera} slot="start" />
              上传新照片
            </IonButton>
          </Card>

          {/* 基本信息编辑 */}
          <Card title="基本信息" className="mb-4">
            <FormItem
              label="姓名"
              name="name"
              value={formData.name || ''}
              onChange={(value) => handleChange('name', value)}
              required
              error={errors.name}
            />
            
            <FormItem
              label="年龄"
              name="age"
              type="number"
              value={formData.age || ''}
              onChange={(value) => handleChange('age', parseInt(value) || '')}
              required
              error={errors.age}
            />
            
            <FormItem
              label="性别"
              name="gender"
              type="select"
              value={formData.gender || ''}
              onChange={(value) => handleChange('gender', value)}
              options={[
                { value: 'male', label: '男' },
                { value: 'female', label: '女' },
                { value: 'other', label: '其他' }
              ]}
            />
            
            <FormItem
              label="个人简介"
              name="bio"
              type="textarea"
              value={formData.bio || ''}
              onChange={(value) => handleChange('bio', value)}
              placeholder="介绍一下自己..."
              required
              error={errors.bio}
            />
            
            <FormItem
              label="位置"
              name="location"
              value={typeof formData.location === 'string' ? formData.location : '使用当前位置'}
              onChange={(value) => handleChange('location', value)}
              placeholder="你的城市"
            />
          </Card>

          {/* 兴趣标签 */}
          <Card title="兴趣爱好" className="mb-4">
            <FormItem
              label="添加你的兴趣爱好"
              name="interests"
              type="tags"
              value={formData.interests || []}
              onChange={(value) => handleChange('interests', value)}
              placeholder="添加兴趣标签"
              error={errors.interests}
            />
          </Card>

          {/* 操作按钮 */}
          <div className="flex gap-2 mt-6">
            <IonButton expand="block" type="submit" className="flex-1">
              保存
            </IonButton>
            <IonButton expand="block" fill="outline" onClick={onCancel} className="flex-1">
              取消
            </IonButton>
          </div>
        </Form>
      </IonContent>
    </>
  );
};