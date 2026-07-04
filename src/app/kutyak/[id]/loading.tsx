export default function Loading() {
  return (
    <div className="min-h-screen bg-[#F7F8F5]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back link skeleton */}
        <div className="h-5 w-40 bg-gray-200 rounded animate-pulse mb-8" />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Photo skeleton */}
          <div>
            <div className="h-[450px] bg-gray-200 rounded-3xl animate-pulse mb-4" />
            <div className="grid grid-cols-4 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-20 bg-gray-200 rounded-xl animate-pulse" />
              ))}
            </div>
          </div>

          {/* Details skeleton */}
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/3 animate-pulse" />
            <div className="h-10 bg-gray-200 rounded w-1/2 animate-pulse" />
            <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse" />
            <div className="flex gap-2 mt-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-8 w-24 bg-gray-200 rounded-full animate-pulse" />
              ))}
            </div>
            <div className="h-20 bg-gray-200 rounded-2xl animate-pulse mt-4" />
            <div className="h-32 bg-gray-200 rounded-2xl animate-pulse" />
            <div className="h-14 bg-gray-200 rounded-2xl animate-pulse" />
            <div className="h-12 bg-gray-200 rounded-2xl animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}
