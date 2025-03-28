import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-8">
        Capacitor-Next.js 15 + Ionic + Tailwind 全栈启动项目
      </h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
        <Link 
          href="/dashboard" 
          className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30"
        >
          <h2 className="mb-3 text-2xl font-semibold">
            Web版 <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">→</span>
          </h2>
          <p className="m-0 max-w-[30ch] text-sm opacity-50">
            访问Web版仪表盘
          </p>
        </Link>

        <Link
          href="/mobile/home" 
          className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30"
        >
          <h2 className="mb-3 text-2xl font-semibold">
            移动版 <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">→</span>
          </h2>
          <p className="m-0 max-w-[30ch] text-sm opacity-50">
            访问移动版应用
          </p>
        </Link>
      </div>
    </main>
  );
}
