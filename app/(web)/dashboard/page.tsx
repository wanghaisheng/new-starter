import Link from 'next/link';

export default function Dashboard() {
  return (
    <div className="flex min-h-screen flex-col p-6">
      <header className="flex justify-between items-center mb-8 border-b pb-4">
        <h1 className="text-2xl font-bold">
  {t('auto.page.Web')}
</h1>
        <Link href="/" className="text-blue-500 hover:text-blue-700">
          返回首页
        </Link>
      </header>
      
      <main className="flex-grow">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 统计卡片 */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">
  {t('auto.page.')}
</h2>
            <p className="text-3xl font-bold">1,234</p>
            <p className="text-green-500 mt-2">
  {t('auto.page.12')}
</p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">
  {t('auto.page.')}
</h2>
            <p className="text-3xl font-bold">¥9,876</p>
            <p className="text-green-500 mt-2">
  {t('auto.page.8')}
</p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">
  {t('auto.page.')}
</h2>
            <p className="text-3xl font-bold">87%</p>
            <p className="text-red-500 mt-2">
  {t('auto.page.3')}
</p>
          </div>
          
          {/* 最近活动 */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md md:col-span-3">
            <h2 className="text-xl font-semibold mb-4">
  {t('auto.page.')}
</h2>
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center border-b pb-2">
                  <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 mr-4"></div>
                  <div>
                    <p className="font-medium">用户 {i} 完成了操作</p>
                    <p className="text-sm text-gray-500">{i}分钟前</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
      
      <footer className="mt-8 pt-4 border-t text-center text-gray-500">
        <p>
  {t('auto.page.2023C')}
</p>
      </footer>
    </div>
  );
}
