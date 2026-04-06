import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Giriş",
  description: "Oturum aç",
};

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center p-4 sm:p-6 md:p-10">
      <div className="w-full min-w-0 max-w-sm md:max-w-4xl">{children}</div>
    </div>
  );
}
