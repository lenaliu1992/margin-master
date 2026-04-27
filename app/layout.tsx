import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "餐饮团购套餐组合器",
  description: "方便计算套餐毛利率",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased h-screen flex flex-col overflow-hidden">
        {/* 促销标签 */}
        <div className="shrink-0 bg-red-600 text-white text-center py-2 px-4 relative">
          <p className="text-sm font-medium">
            🎉 黑五折扣，现在下单享受5折优惠 🎉
          </p>
          <button
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-200 text-xl leading-none"
            aria-label="关闭促销标签"
          >
            ×
          </button>
        </div>

        {/* 顶部导航 */}
        <header className="shrink-0 bg-white border-b border-gray-200">
          <div className="mx-auto flex flex-wrap items-center justify-center gap-4 px-4 py-3 sm:px-6 lg:px-8">
            <Link
              href="/about"
              className="text-sm font-medium text-gray-700 hover:text-blue-600"
            >
              About 页面
            </Link>
            <Link
              href="/blog"
              className="text-sm font-medium text-gray-700 hover:text-blue-600"
            >
              About Blog 页面
            </Link>
            <Link
              href="/"
              className="text-sm font-medium text-gray-700 hover:text-blue-600"
            >
              首页
            </Link>
          </div>
        </header>

        <main className="flex-1 min-h-0 overflow-auto">
          {children}
        </main>
      </body>
    </html>
  );
}
