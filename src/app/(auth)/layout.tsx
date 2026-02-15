export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight">Crew</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Sailboat crew management
          </p>
        </div>
        {children}
      </div>
    </div>
  )
}
