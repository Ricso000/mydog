export default function Loading() {
  return (
    <div className="min-h-screen bg-[#F7F8F5]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="lg:w-72 shrink-0">
            <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 h-96 animate-pulse" />
          </aside>
          <div className="flex-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {Array.from({ length: 12 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl overflow-hidden border border-[#E2E8F0] animate-pulse"
                >
                  <div className="h-48 bg-gray-200" />
                  <div className="p-4 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                    <div className="h-8 bg-gray-200 rounded-xl mt-3" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
