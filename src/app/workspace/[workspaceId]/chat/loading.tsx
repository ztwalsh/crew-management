export default function ChatLoading() {
  return (
    <div className="flex h-screen bg-[#0a0f1e]">
      {/* Sidebar skeleton */}
      <div className="hidden md:flex w-64 flex-col border-r border-white/[0.06] p-4">
        <div className="h-8 w-32 rounded-lg bg-white/[0.04] animate-pulse mb-8" />
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 rounded-lg bg-white/[0.04] animate-pulse" />
          ))}
        </div>
      </div>

      {/* Chat area skeleton */}
      <div className="flex-1 flex flex-col">
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="size-10 rounded-full bg-white/[0.06] animate-pulse" />
            <div className="h-4 w-48 rounded bg-white/[0.04] animate-pulse" />
          </div>
        </div>

        {/* Input skeleton */}
        <div className="p-4 pb-6">
          <div className="max-w-2xl mx-auto">
            <div className="h-12 rounded-full bg-white/[0.04] animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  )
}
