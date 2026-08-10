import type { Metadata } from "next";
import { AppProviders } from "@/components/providers/AppProviders";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "BreadTrans — Luyện thi TOEIC",
  description:
    "Nền tảng luyện thi TOEIC 4 kỹ năng tích hợp AI — Khóa luận tốt nghiệp",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className="min-h-screen antialiased">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
