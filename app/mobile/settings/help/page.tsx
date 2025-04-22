'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  IonContent,
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonBackButton,
  IonList,
  IonItem,
  IonLabel,
  IonIcon,
  IonButton,
  IonItemDivider,
  IonSearchbar,
  IonAccordionGroup,
  IonAccordion,
  IonItemGroup,
  IonNote
} from '@ionic/react';
import { 
  helpCircleOutline, 
  chatbubbleOutline, 
  mailOutline, 
  documentTextOutline,
  chevronDownOutline,
  chevronUpOutline
} from 'ionicons/icons';
import BottomNavBar from '@/mobile/components/navigation/BottomNavBar';

export default function HelpSettingsPage() {
  const router = useRouter();
  const [searchText, setSearchText] = useState('');
  const [expandedAccordion, setExpandedAccordion] = useState<string | null>(null);

  const faqItems = [
    {
      title: 'How do I create an account?',
      content: 'To create an account, click the "Sign Up" button on the login screen. You can sign up using your email address, phone number, or Google account.'
    },
    {
      title: 'How do I edit my profile?',
      content: 'Go to Settings > Profile to edit your personal information, photos, and preferences.'
    },
    {
      title: 'How do I change my privacy settings?',
      content: 'Navigate to Settings > Privacy to manage your profile visibility, online status, and data collection preferences.'
    },
    {
      title: 'How do I report a user?',
      content: 'You can report a user by visiting their profile, clicking the menu button (three dots), and selecting "Report User".'
    },
    {
      title: 'How do I delete my account?',
      content: 'To delete your account, go to Settings > Account > Delete Account. Please note that this action is permanent and cannot be undone.'
    }
  ];

  const filteredFaqItems = faqItems.filter(item =>
    item.title.toLowerCase().includes(searchText.toLowerCase()) ||
    item.content.toLowerCase().includes(searchText.toLowerCase())
  );

  const handleAccordionChange = (value: string | null) => {
    setExpandedAccordion(value);
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>
            {t('auto.page.Help') || '帮助中心'}
          </IonTitle>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/mobile/settings" />
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      
      <IonContent className="bg-[#0f172a]">
        <IonSearchbar
          value={searchText}
          onIonInput={e => setSearchText(e.detail.value!)}
          placeholder={t('auto.page.Searchh') || '搜索'}
          className="px-4 py-2"
        />
        
        <IonList lines="full">
          <IonItemGroup>
            <IonItemDivider>
              <IonLabel>
                {t('auto.page.ContactUs') || '联系客服'}
              </IonLabel>
            </IonItemDivider>
            
            <IonItem button onClick={() => router.push('/mobile/settings/help/chat')}>
              <IonIcon icon={chatbubbleOutline} slot="start" />
              <IonLabel>
                {t('auto.page.LiveCha') || '在线客服'}
              </IonLabel>
              <IonNote slot="end">
                {t('auto.page.247Sup') || '24/7 支持'}
              </IonNote>
            </IonItem>
            
            <IonItem button onClick={() => router.push('/mobile/settings/help/email')}>
              <IonIcon icon={mailOutline} slot="start" />
              <IonLabel>
                {t('auto.page.EmailSu') || '邮箱支持'}
              </IonLabel>
              <IonNote slot="end">
                {t('auto.page.support') || '支持'}
              </IonNote>
            </IonItem>
          </IonItemGroup>
          
          <IonItemGroup>
            <IonItemDivider>
              <IonLabel>
                {t('auto.page.FAQ') || '常见问题'}
              </IonLabel>
            </IonItemDivider>
            
            <IonAccordionGroup
              value={expandedAccordion}
              onIonChange={e => handleAccordionChange(e.detail.value)}
            >
              {filteredFaqItems.map((item, index) => (
                <IonAccordion key={index} value={`faq-${index}`}>
                  <IonItem slot="header">
                    <IonIcon icon={helpCircleOutline} slot="start" />
                    <IonLabel>{item.title}</IonLabel>
                    <IonIcon
                      icon={expandedAccordion === `faq-${index}` ? chevronUpOutline : chevronDownOutline}
                      slot="end"
                    />
                  </IonItem>
                  <div className="p-4 text-gray-300" slot="content">
                    {item.content}
                  </div>
                </IonAccordion>
              ))}
            </IonAccordionGroup>
          </IonItemGroup>
          
          <IonItemGroup>
            <IonItemDivider>
              <IonLabel>
                {t('auto.page.LEGAL') || '法律'}
              </IonLabel>
            </IonItemDivider>
            
            <IonItem button onClick={() => router.push('/mobile/settings/terms')}>
              <IonIcon icon={documentTextOutline} slot="start" />
              <IonLabel>
                {t('auto.page.Termsof') || '服务条款'}
              </IonLabel>
            </IonItem>
            
            <IonItem button onClick={() => router.push('/mobile/settings/privacy-policy')}>
              <IonIcon icon={documentTextOutline} slot="start" />
              <IonLabel>
                {t('auto.page.Privacy') || '隐私政策'}
              </IonLabel>
            </IonItem>
          </IonItemGroup>
        </IonList>
      </IonContent>
      
      <BottomNavBar />
    </IonPage>
  );
} 