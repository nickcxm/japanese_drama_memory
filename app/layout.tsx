import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "日本的记忆 · A personal archive",
  description: "记录日剧、日本旅行与画面之外的历史。",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
