import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "رَه | Study OS",
  description: "سیستم شخصی مدیریت مطالعه برای مسیر MBA",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fa" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
