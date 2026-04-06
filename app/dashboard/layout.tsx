export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-dvh overflow-x-hidden overflow-y-auto overscroll-none bg-background">
      {children}
    </div>
  );
}
