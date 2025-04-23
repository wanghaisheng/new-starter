const fs = require('fs');
const path = require('path');
const https = require('https');
const { promisify } = require('util');

const writeFileAsync = promisify(fs.writeFile);
const mkdirAsync = promisify(fs.mkdir);

// 目标目录
const PROFILES_DIR = path.join(__dirname, 'public/assets/images/profiles');

// 确保目录存在
async function ensureDirsExist() {
  try {
    await mkdirAsync(PROFILES_DIR, { recursive: true });
    console.log(`目录创建成功: ${PROFILES_DIR}`);
  } catch (error) {
    if (error.code !== 'EEXIST') {
      console.error(`创建目录失败: ${PROFILES_DIR}`, error);
    }
  }
}

// 下载图片
function downloadImage(url, destPath) {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`下载失败，状态码: ${response.statusCode}`));
        return;
      }
      
      const file = fs.createWriteStream(destPath);
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        resolve();
      });
      
      file.on('error', (err) => {
        fs.unlink(destPath, () => {}); // 删除部分下载的文件
        reject(err);
      });
    }).on('error', reject);
  });
}

// 主函数
async function main() {
  try {
    await ensureDirsExist();
    
    // 创建默认图片和占位图
    const placeholders = [
      { name: 'default-avatar.jpg', url: 'https://randomuser.me/api/portraits/lego/1.jpg' },
      { name: 'avatar-placeholder.jpg', url: 'https://randomuser.me/api/portraits/lego/2.jpg' },
      { name: 'profile-placeholder.jpg', url: 'https://randomuser.me/api/portraits/lego/3.jpg' }
    ];
    
    for (const placeholder of placeholders) {
      const destPath = path.join(PROFILES_DIR, placeholder.name);
      console.log(`下载占位图: ${placeholder.url}`);
      try {
        await downloadImage(placeholder.url, destPath);
        console.log(`✓ 保存到: ${destPath}`);
      } catch (error) {
        console.error(`× 下载失败: ${placeholder.url}`, error);
      }
    }
    
    // 创建照片占位图
    for (let i = 1; i <= 4; i++) {
      const url = `https://randomuser.me/api/portraits/lego/${i + 3}.jpg`;
      const destPath = path.join(PROFILES_DIR, `photo-placeholder-${i}.jpg`);
      console.log(`下载照片占位图 ${i}: ${url}`);
      try {
        await downloadImage(url, destPath);
        console.log(`✓ 保存到: ${destPath}`);
      } catch (error) {
        console.error(`× 下载失败: ${url}`, error);
      }
    }
    
    console.log('所有占位图下载完成');
  } catch (error) {
    console.error('发生错误:', error);
  }
}

main(); 