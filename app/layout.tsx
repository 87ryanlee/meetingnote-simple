import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "회의록 정리기",
  description: "녹취 파일을 받아쓰고 핵심 회의록으로 정리합니다.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
