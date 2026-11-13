import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: '로컬인사이트 | 경쟁업체 마케팅 분석', description: '전국 자영업자를 위한 지역 경쟁업체 마케팅 분석 플랫폼' };
export default function RootLayout({ children }: Readonly<{children: React.ReactNode}>) { return <html lang="ko"><body>{children}</body></html>; }
