import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { isPlatform } from '@ionic/react';

export class CameraService {
  private static instance: CameraService;
  
  private constructor() {}
  
  public static getInstance(): CameraService {
    if (!CameraService.instance) {
      CameraService.instance = new CameraService();
    }
    return CameraService.instance;
  }
  
  async takePicture() {
    if (!isPlatform('capacitor')) {
      console.warn('Camera is only available on native platforms');
      return null;
    }
    
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: true,
        resultType: CameraResultType.Uri,
        source: CameraSource.Prompt
      });
      
      return image.webPath;
    } catch (error) {
      console.error('Error taking picture:', error);
      return null;
    }
  }
} 