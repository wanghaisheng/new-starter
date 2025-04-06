'use client';

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
  IonItemDivider,
  IonItemGroup,
  IonNote
} from '@ionic/react';
import { documentTextOutline } from 'ionicons/icons';
import BottomNavBar from '@/mobile/components/navigation/BottomNavBar';

export default function PrivacyPolicySettingsPage() {
  const router = useRouter();
  const lastUpdated = '2024-03-20';

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Privacy Policy</IonTitle>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/mobile/settings" />
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      
      <IonContent className="bg-[#0f172a]">
        <div className="p-4">
          <p className="text-gray-400 text-sm mb-4">
            Last updated: {lastUpdated}
          </p>
          
          <div className="space-y-6 text-gray-300">
            <section>
              <h2 className="text-xl font-bold text-white mb-2">1. Introduction</h2>
              <p>
                At HeyTCM, we take your privacy seriously. This Privacy Policy explains how we collect,
                use, disclose, and safeguard your information when you use our mobile application.
                Please read this privacy policy carefully. If you do not agree with the terms of this
                privacy policy, please do not access the app.
              </p>
            </section>
            
            <section>
              <h2 className="text-xl font-bold text-white mb-2">2. Information We Collect</h2>
              <p className="mb-2">We collect information that you provide directly to us, including:</p>
              <ul className="list-disc pl-4 space-y-1">
                <li>Personal identification information (name, email address, phone number)</li>
                <li>Profile information (photos, bio, interests)</li>
                <li>Location data</li>
                <li>Communication preferences</li>
                <li>Payment information (if applicable)</li>
              </ul>
            </section>
            
            <section>
              <h2 className="text-xl font-bold text-white mb-2">3. How We Use Your Information</h2>
              <p className="mb-2">We use the information we collect to:</p>
              <ul className="list-disc pl-4 space-y-1">
                <li>Provide and maintain our service</li>
                <li>Notify you about changes to our service</li>
                <li>Provide customer support</li>
                <li>Monitor the usage of our service</li>
                <li>Detect, prevent and address technical issues</li>
                <li>Provide you with news, special offers and general information</li>
              </ul>
            </section>
            
            <section>
              <h2 className="text-xl font-bold text-white mb-2">4. Data Security</h2>
              <p>
                The security of your data is important to us but remember that no method of
                transmission over the Internet or method of electronic storage is 100% secure.
                While we strive to use commercially acceptable means to protect your personal data,
                we cannot guarantee its absolute security.
              </p>
            </section>
            
            <section>
              <h2 className="text-xl font-bold text-white mb-2">5. Your Data Protection Rights</h2>
              <p className="mb-2">You have the following data protection rights:</p>
              <ul className="list-disc pl-4 space-y-1">
                <li>The right to access, update or delete your information</li>
                <li>The right of rectification</li>
                <li>The right to object</li>
                <li>The right of restriction</li>
                <li>The right to data portability</li>
                <li>The right to withdraw consent</li>
              </ul>
            </section>
            
            <section>
              <h2 className="text-xl font-bold text-white mb-2">6. Children's Privacy</h2>
              <p>
                Our service does not address anyone under the age of 18. We do not knowingly
                collect personally identifiable information from anyone under the age of 18.
                If you are a parent or guardian and you are aware that your child has provided
                us with personal data, please contact us.
              </p>
            </section>
            
            <section>
              <h2 className="text-xl font-bold text-white mb-2">7. Changes to This Privacy Policy</h2>
              <p>
                We may update our Privacy Policy from time to time. We will notify you of any
                changes by posting the new Privacy Policy on this page and updating the
                "Last updated" date at the top of this Privacy Policy.
              </p>
            </section>
            
            <section>
              <h2 className="text-xl font-bold text-white mb-2">8. Contact Us</h2>
              <p>
                If you have any questions about this Privacy Policy, please contact us:
              </p>
              <ul className="list-none pl-4 mt-2 space-y-1">
                <li>By email: privacy@heytcm.com</li>
                <li>By phone: +1 (555) 123-4567</li>
                <li>By mail: 123 Privacy Street, Security City, 12345</li>
              </ul>
            </section>
          </div>
          
          <div className="mt-8 text-center">
            <button
              onClick={() => router.push('/mobile/settings')}
              className="px-6 py-2 bg-pink-500 text-white rounded-full hover:bg-pink-600 transition-colors"
            >
              Back to Settings
            </button>
          </div>
        </div>
      </IonContent>
      
      <BottomNavBar />
    </IonPage>
  );
} 