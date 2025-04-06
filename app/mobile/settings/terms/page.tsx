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

export default function TermsSettingsPage() {
  const router = useRouter();
  const lastUpdated = '2024-03-20';

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Terms of Service</IonTitle>
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
              <h2 className="text-xl font-bold text-white mb-2">1. Acceptance of Terms</h2>
              <p>
                By accessing and using HeyTCM, you agree to be bound by these Terms of Service
                and all applicable laws and regulations. If you do not agree with any of these terms,
                you are prohibited from using or accessing this app.
              </p>
            </section>
            
            <section>
              <h2 className="text-xl font-bold text-white mb-2">2. Use License</h2>
              <p>
                Permission is granted to temporarily download one copy of the app for personal,
                non-commercial transitory viewing only. This is the grant of a license, not a transfer
                of title, and under this license you may not:
              </p>
              <ul className="list-disc pl-4 mt-2 space-y-1">
                <li>Modify or copy the materials</li>
                <li>Use the materials for any commercial purpose</li>
                <li>Attempt to decompile or reverse engineer any software contained in the app</li>
                <li>Remove any copyright or other proprietary notations from the materials</li>
                <li>Transfer the materials to another person or "mirror" the materials on any other server</li>
              </ul>
            </section>
            
            <section>
              <h2 className="text-xl font-bold text-white mb-2">3. User Account</h2>
              <p>
                To access certain features of the app, you may be required to create an account.
                You are responsible for maintaining the confidentiality of your account information
                and for all activities that occur under your account.
              </p>
            </section>
            
            <section>
              <h2 className="text-xl font-bold text-white mb-2">4. Privacy Policy</h2>
              <p>
                Your use of HeyTCM is also governed by our Privacy Policy. Please review our
                Privacy Policy, which also governs the app and informs users of our data collection
                practices.
              </p>
            </section>
            
            <section>
              <h2 className="text-xl font-bold text-white mb-2">5. Disclaimer</h2>
              <p>
                The materials on HeyTCM are provided on an 'as is' basis. HeyTCM makes no
                warranties, expressed or implied, and hereby disclaims and negates all other
                warranties including, without limitation, implied warranties or conditions of
                merchantability, fitness for a particular purpose, or non-infringement of
                intellectual property or other violation of rights.
              </p>
            </section>
            
            <section>
              <h2 className="text-xl font-bold text-white mb-2">6. Limitations</h2>
              <p>
                In no event shall HeyTCM or its suppliers be liable for any damages (including,
                without limitation, damages for loss of data or profit, or due to business
                interruption) arising out of the use or inability to use the app.
              </p>
            </section>
            
            <section>
              <h2 className="text-xl font-bold text-white mb-2">7. Revisions</h2>
              <p>
                HeyTCM may revise these terms of service at any time without notice. By using
                this app, you are agreeing to be bound by the then current version of these
                terms of service.
              </p>
            </section>
            
            <section>
              <h2 className="text-xl font-bold text-white mb-2">8. Governing Law</h2>
              <p>
                These terms and conditions are governed by and construed in accordance with the
                laws of your country and you irrevocably submit to the exclusive jurisdiction
                of the courts in that location.
              </p>
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