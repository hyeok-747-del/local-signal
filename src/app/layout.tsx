import type { Metadata } from 'next';
import './globals.css';
import './theme.css';
export const metadata: Metadata = { title: '로컬시그널 | 우리 동네 마케팅 인사이트', description: '전국 경쟁업체의 블로그 활동과 검색 트렌드를 비교하는 로컬시그널', applicationName:'Local Signal' };
export default function RootLayout({ children }: Readonly<{children: React.ReactNode}>) { return <html lang="ko"><body>{children}</body></html>; }
