'use client';

import { useState } from 'react';
import { IonContent, IonPage } from '@ionic/react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import BottomNavBar from '@/mobile/components/navigation/BottomNavBar';

export default function ProfilePage() {
  const router = useRouter();

  const handleEditProfile = () => {
    router.push('/mobile/profile/edit');
  };

  return (
    <IonPage>
      <IonContent>
        {/* Profile header with cover photo */}
        <div className="relative w-full h-64 bg-gradient-to-r from-purple-500 to-pink-500">
          <button className="absolute top-3 right-3 bg-white rounded-full p-2 shadow-md z-10">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
        
        {/* Profile avatar */}
        <div className="relative">
          <div className="absolute left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg">
              <Image 
                src="/assets/images/avatar-placeholder.jpg" 
                alt="Profile" 
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>
        
        {/* Profile content */}
        <div className="mt-16 px-4 pb-20">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold">Jessica, 26</h1>
            <p className="text-gray-600">Software Developer</p>
            <p className="text-sm text-gray-500 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              San Francisco, CA
            </p>
          </div>
          
          <button 
            onClick={handleEditProfile}
            className="w-full bg-white border border-gray-300 rounded-full py-3 font-medium mb-8"
          >
            Edit Profile
          </button>
          
          {/* About section */}
          <section className="mb-8">
            <h2 className="text-xl font-bold mb-3">About</h2>
            <p className="text-gray-700">
              Software developer with a passion for hiking and photography. Love trying new restaurants and exploring the city. Looking for someone to share adventures with!
            </p>
          </section>
          
          {/* Interests section */}
          <section className="mb-8">
            <h2 className="text-xl font-bold mb-3">Interests</h2>
            <div className="flex flex-wrap gap-2">
              <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm">Travel</span>
              <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm">Hiking</span>
              <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm">Photography</span>
              <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm">Cooking</span>
              <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm">Reading</span>
              <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm">Coffee</span>
              <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm">Movies</span>
              <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm">Tech</span>
            </div>
          </section>
          
          {/* Photos section */}
          <section className="mb-8">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-xl font-bold">Photos</h2>
              <button className="text-primary-500 text-sm font-medium">See All</button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="aspect-square rounded-lg overflow-hidden">
                  <div className="relative w-full h-full">
                    <Image 
                      src={`/assets/images/photo-placeholder-${i}.jpg`} 
                      alt={`Photo ${i}`} 
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>
          
          {/* Connections section */}
          <section className="mb-12">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-xl font-bold">Connections</h2>
              <button className="text-primary-500 text-sm font-medium">See All</button>
            </div>
            <div className="flex overflow-x-auto space-x-4 py-2">
              {['Sarah', 'Emma', 'Olivia', 'James', 'Michael'].map((name, i) => (
                <div key={name} className="flex-shrink-0 w-20">
                  <div className="relative w-16 h-16 mx-auto rounded-full overflow-hidden mb-2">
                    <Image 
                      src={`/assets/images/profile-${name.toLowerCase()}.jpg`} 
                      alt={name} 
                      fill
                      className="object-cover"
                    />
                  </div>
                  <p className="text-center text-sm truncate">{name}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </IonContent>
      
      {/* Use shared BottomNavBar component */}
      <BottomNavBar />
    </IonPage>
  );
} 