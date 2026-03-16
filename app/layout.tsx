import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MarginMaster - 餐饮团购毛利测算系统",
  description: "静小静菜品毛利计算系统",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
