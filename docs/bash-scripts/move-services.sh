#!/bin/bash

# 创建必要的目录
mkdir -p src/core/services/{auth,data,device,test}

# 移动认证相关服务
mv src/core/services/better-auth-service.ts src/core/services/auth/
mv src/core/services/mock-auth-service.ts src/core/services/auth/
mv src/core/services/auth-service.ts src/core/services/auth/
mv src/core/services/firebase-auth-service.ts src/core/services/auth/
mv src/core/services/auth-events.ts src/core/services/auth/
mv src/core/services/auth-provider-registry.ts src/core/services/auth/

# 移动数据相关服务
mv src/core/services/data-service.ts src/core/services/data/
mv src/core/services/mock-data-service.ts src/core/services/data/
mv src/core/services/data-service-factory.ts src/core/services/data/
mv src/core/services/data-service-interface.ts src/core/services/data/
mv src/core/services/database-service.ts src/core/services/data/
mv src/core/services/data-migration-service.ts src/core/services/data/
mv src/core/services/data-preload-service.ts src/core/services/data/
mv src/core/services/offline-storage-service.ts src/core/services/data/
mv src/core/services/storage-service.ts src/core/services/data/

# 移动设备相关服务
mv src/core/services/location-service.ts src/core/services/device/
mv src/core/services/camera-service.ts src/core/services/device/

# 移动测试相关服务
mv src/core/services/test-service.ts src/core/services/test/test-type-service.ts

# 移动其他服务
mv src/core/services/match-service.ts src/core/services/data/
mv src/core/services/message-service.ts src/core/services/data/
mv src/core/services/network-service.ts src/core/services/data/
mv src/core/services/user-service.ts src/core/services/data/
mv src/core/services/validation-service.ts src/core/services/data/
mv src/core/services/app-service.ts src/core/services/data/

echo "服务文件移动完成" 