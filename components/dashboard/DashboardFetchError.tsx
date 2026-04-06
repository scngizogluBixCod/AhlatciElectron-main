export function DashboardFetchError({ message }: { message: string }) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 bg-background px-6 py-12 text-center">
      <p className="text-lg font-semibold text-foreground">Veri yüklenemedi</p>
      <p className="max-w-md text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
