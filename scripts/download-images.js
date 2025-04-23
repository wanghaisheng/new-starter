const fs = require('fs');
const path = require('path');
const https = require('https');
const { promisify } = require('util');

const readFileAsync = promisify(fs.readFile);
const writeFileAsync = promisify(fs.writeFile);
const mkdirAsync = promisify(fs.mkdir);

// 目标目录
const DIRS = {
  profiles: path.join(__dirname, 'public/assets/images/profiles'),
  backgrounds: path.join(__dirname, 'public/assets/images/backgrounds'),
  icons: path.join(__dirname, 'public/assets/images/icons')
};

// 确保目录存在
async function ensureDirsExist() {
  for (const dir of Object.values(DIRS)) {
    try {
      await mkdirAsync(dir, { recursive: true });
      console.log(`目录创建成功: ${dir}`);
    } catch (error) {
      if (error.code !== 'EEXIST') {
        console.error(`创建目录失败: ${dir}`, error);
      }
    }
  }
}

// 提取图片URL
async function extractImageUrls() {
  const prototypeFile = path.join(__dirname, 'docs/product-research/prototype.html');
  const html = await readFileAsync(prototypeFile, 'utf8');
  
  // 提取RandomUser头像URL
  const profileRegex = /https:\/\/randomuser\.me\/api\/portraits\/[a-z]+\/\d+\.jpg/g;
  const profileUrls = [...new Set(html.match(profileRegex) || [])];
  
  // 提取Unsplash背景图片URL
  const backgroundRegex = /https:\/\/images\.unsplash\.com\/photo-[a-zA-Z0-9-]+/g;
  const backgroundUrls = [...new Set(html.match(backgroundRegex) || [])];
  
  return {
    profiles: profileUrls,
    backgrounds: backgroundUrls
  };
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
    
    const urls = await extractImageUrls();
    console.log(`找到 ${urls.profiles.length} 个头像和 ${urls.backgrounds.length} 个背景图片`);
    
    // 下载头像
    for (const [index, url] of urls.profiles.entries()) {
      const filename = url.split('/').pop(); // 提取文件名，例如 32.jpg
      const gender = url.includes('women') ? 'women' : 'men';
      const destPath = path.join(DIRS.profiles, `profile-${gender}-${filename}`);
      
      console.log(`下载头像 (${index + 1}/${urls.profiles.length}): ${url}`);
      try {
        await downloadImage(url, destPath);
        console.log(`✓ 保存到: ${destPath}`);
      } catch (error) {
        console.error(`× 下载失败: ${url}`, error);
      }
    }
    
    // 下载背景图片
    for (const [index, url] of urls.backgrounds.entries()) {
      const uniqueId = url.split('photo-')[1]; // 提取ID部分
      const destPath = path.join(DIRS.backgrounds, `background-${uniqueId}.jpg`);
      
      console.log(`下载背景图片 (${index + 1}/${urls.backgrounds.length}): ${url}`);
      try {
        await downloadImage(url, destPath);
        console.log(`✓ 保存到: ${destPath}`);
      } catch (error) {
        console.error(`× 下载失败: ${url}`, error);
      }
    }
    
    // 创建默认图片和占位图
    const placeholders = [
      { name: 'default-avatar.jpg', url: 'https://randomuser.me/api/portraits/lego/1.jpg' },
      { name: 'avatar-placeholder.jpg', url: 'https://randomuser.me/api/portraits/lego/2.jpg' },
      { name: 'profile-placeholder.jpg', url: 'https://randomuser.me/api/portraits/lego/3.jpg' }
    ];
    
    for (const placeholder of placeholders) {
      const destPath = path.join(DIRS.profiles, placeholder.name);
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
      const destPath = path.join(DIRS.profiles, `photo-placeholder-${i}.jpg`);
      console.log(`下载照片占位图 ${i}: ${url}`);
      try {
        await downloadImage(url, destPath);
        console.log(`✓ 保存到: ${destPath}`);
      } catch (error) {
        console.error(`× 下载失败: ${url}`, error);
      }
    }
    
    console.log('所有图片下载完成');
  } catch (error) {
    console.error('发生错误:', error);
  }
}

main(); 