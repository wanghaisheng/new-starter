# 移动应用打包指南

本文档提供了使用Capacitor打包Next.js应用为本地移动应用的完整指南。

## 准备工作

### 环境要求

- **Node.js**: v16+
- **npm** 或 **yarn**
- **Android开发**:
  - Android Studio
  - Java Development Kit (JDK) 11+
  - Android SDK 平台和构建工具
- **iOS开发**:
  - macOS
  - Xcode 13+
  - CocoaPods

### 项目配置

确保项目中有以下Capacitor相关配置文件：

1. **capacitor.config.ts**:
   ```typescript
   import { CapacitorConfig } from '@capacitor/cli';

   const config: CapacitorConfig = {
     appId: 'com.yourcompany.datingapp',
     appName: 'Dating App',
     webDir: 'dist',
     bundledWebRuntime: false,
     plugins: {
       SplashScreen: {
         launchShowDuration: 3000,
         backgroundColor: '#121212',
         androidSplashResourceName: 'splash',
         androidScaleType: 'CENTER_CROP',
         showSpinner: true,
         androidSpinnerStyle: 'large',
         iosSpinnerStyle: 'small',
         spinnerColor: '#e91e63',
       },
     },
   };

   export default config;
   ```

2. **package.json 添加脚本**:
   ```json
   {
     "scripts": {
       "build:next": "next build && next export",
       "build:capacitor": "npm run build:next && cap copy",
       "build:android": "npm run build:capacitor && cap open android",
       "build:ios": "npm run build:capacitor && cap open ios"
     }
   }
   ```

## 安装和配置Capacitor

### 初始安装

```bash
# 安装Capacitor核心和CLI
npm install @capacitor/core @capacitor/cli

# 安装平台特定包
npm install @capacitor/android @capacitor/ios

# 安装常用插件
npm install @capacitor/camera @capacitor/storage @capacitor/preferences @capacitor/push-notifications @capacitor/splash-screen @capacitor/status-bar @capacitor/geolocation
```

### 初始化Capacitor项目

```bash
npx cap init "Dating App" "com.yourcompany.datingapp" --web-dir dist
```

### 添加平台

```bash
# 添加Android平台
npx cap add android

# 添加iOS平台
npx cap add ios
```

## 构建Web应用

Next.js应用需要先构建和导出为静态文件：

```bash
# 构建Next.js应用
npm run build:next
```

这将使用Next.js的export功能生成静态HTML文件，这些文件会被复制到Capacitor的平台项目中。

## 自定义原生功能

### 配置权限

#### Android权限

编辑`android/app/src/main/AndroidManifest.xml`添加必要权限：

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <!-- 相机权限 -->
    <uses-permission android:name="android.permission.CAMERA" />
    
    <!-- 相册权限 -->
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE"/>
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
    
    <!-- 网络权限 -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    
    <!-- 位置权限 -->
    <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
    
    <!-- 推送通知权限 -->
    <uses-permission android:name="android.permission.VIBRATE" />
    <uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED"/>
    
    <!-- 应用内容 -->
</manifest>
```

#### iOS权限

编辑`ios/App/App/Info.plist`添加必要权限：

```xml
<dict>
    <!-- 相机权限 -->
    <key>NSCameraUsageDescription</key>
    <string>需要访问相机以拍摄照片更新您的个人资料</string>
    
    <!-- 相册权限 -->
    <key>NSPhotoLibraryUsageDescription</key>
    <string>需要访问照片库以选择照片更新您的个人资料</string>
    
    <!-- 位置权限 -->
    <key>NSLocationWhenInUseUsageDescription</key>
    <string>需要访问您的位置以显示附近的匹配用户</string>
    
    <!-- 通知权限 -->
    <key>NSLocationAlwaysUsageDescription</key>
    <string>需要在后台访问您的位置以推荐附近的匹配用户</string>
    
    <!-- 其他应用配置 -->
</dict>
```

### 自定义原生代码

#### Android自定义

创建或修改`android/app/src/main/java/com/yourcompany/datingapp/MainActivity.java`：

```java
package com.yourcompany.datingapp;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.Plugin;
import java.util.ArrayList;

public class MainActivity extends BridgeActivity {
  @Override
  public void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    
    // 注册自定义插件
    // registerPlugin(MyCustomPlugin.class);
  }
}
```

#### iOS自定义

修改`ios/App/App/AppDelegate.swift`：

```swift
import UIKit
import Capacitor

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {
    var window: UIWindow?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        // 配置自定义初始化逻辑
        return true
    }
    
    // 其他AppDelegate方法...
}
```

## 处理深度链接

### Android配置

在`android/app/src/main/AndroidManifest.xml`中添加：

```xml
<intent-filter>
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />
    <data android:scheme="datingapp" />
</intent-filter>
```

### iOS配置

在`ios/App/App/Info.plist`中添加：

```xml
<key>CFBundleURLTypes</key>
<array>
  <dict>
    <key>CFBundleURLSchemes</key>
    <array>
      <string>datingapp</string>
    </array>
  </dict>
</array>
```

## 应用图标和启动屏幕

### Android图标

1. 生成不同尺寸的图标，保存到`android/app/src/main/res/`目录对应的文件夹中
2. 推荐使用在线工具如Android Asset Studio生成所有需要的尺寸

### iOS图标

1. 在Xcode中打开项目
2. 选择Assets.xcassets
3. 添加AppIcon图标集
4. 拖放不同尺寸的图标到对应位置

### 启动屏幕

使用Capacitor的SplashScreen插件：

```typescript
// 导入插件
import { SplashScreen } from '@capacitor/splash-screen';

// 应用启动时
SplashScreen.show({
  showDuration: 2000,
  autoHide: true,
});

// 手动隐藏
SplashScreen.hide();
```

## 构建和发布

### Android构建

```bash
# 复制Web资源到Android项目
npx cap copy android

# 同步插件和依赖
npx cap sync android

# 打开Android Studio
npx cap open android
```

在Android Studio中:
1. 选择Build > Generate Signed Bundle / APK
2. 按照向导创建一个签名密钥
3. 选择Build Type为Release
4. 完成构建生成APK或AAB文件

### iOS构建

```bash
# 复制Web资源到iOS项目
npx cap copy ios

# 同步插件和依赖
npx cap sync ios

# 打开Xcode
npx cap open ios
```

在Xcode中:
1. 选择Generic iOS Device作为目标设备
2. 设置正确的Team和Bundle Identifier
3. 选择Product > Archive创建归档文件
4. 使用Xcode的Organizer上传到App Store

## 测试和调试

### 使用Chrome进行调试

在Android中，可以使用Chrome DevTools进行调试：

1. 将设备连接到计算机
2. 在设备上运行应用
3. 在Chrome中访问 `chrome://inspect`
4. 点击应用下的"inspect"链接

### 使用Safari调试iOS应用

1. 在iOS设备上的设置中启用Web检查器
2. 将设备连接到Mac
3. 在Mac上打开Safari
4. 在Safari的"开发"菜单中选择设备和应用

## 常见问题排查

### Android构建问题

1. **Gradle同步失败**
   - 问题：Gradle同步或构建失败
   - 解决方案：更新Gradle版本，检查`build.gradle`文件

2. **资源文件不存在**
   - 问题：找不到某些图标或资源文件
   - 解决方案：确保资源文件放在正确的目录

### iOS构建问题

1. **证书问题**
   - 问题：无法签名应用
   - 解决方案：检查开发者账号和证书设置

2. **CocoaPods错误**
   - 问题：CocoaPods安装或更新失败
   - 解决方案：尝试更新CocoaPods或重新安装

3. **构建时架构错误**
   - 问题：与特定架构相关的错误
   - 解决方案：检查项目设置中的Build Settings和Architectures

## 进阶配置

### 推送通知

```typescript
import { PushNotifications } from '@capacitor/push-notifications';

// 请求权限
const requestPermissions = async () => {
  const result = await PushNotifications.requestPermissions();
  if (result.granted) {
    await PushNotifications.register();
  }
};

// 监听通知
PushNotifications.addListener('pushNotificationReceived', (notification) => {
  console.log('推送通知收到', notification);
});

PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
  console.log('推送通知操作执行', notification);
});
```

### 自定义平台代码

如果需要创建自定义Capacitor插件：

```bash
# 生成插件模板
npx @capacitor/cli plugin:generate
```

## 小结

这个指南覆盖了使用Capacitor将Next.js应用打包为移动应用的完整流程，包括配置、构建、调试和发布。通过遵循这些步骤，可以创建原生的移动应用体验，同时保持Web端的开发流程和代码复用。 