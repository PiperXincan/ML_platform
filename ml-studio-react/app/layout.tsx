import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ML Studio · 零代码机器学习训练',
  description: '面向机器学习初学者的零代码训练与模型比较工作台。',
};

export const viewport: Viewport = {
  themeColor: '#f4f7fb',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
