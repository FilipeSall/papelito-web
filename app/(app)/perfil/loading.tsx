export default function ProfileSectionsLoading() {
  return (
    <section
      aria-busy="true"
      className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
    >
      <div className="mb-6 h-8 w-44 animate-pulse rounded bg-gray-200" />
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {Array.from({ length: 6 }).map((_, index) => (
          <div className="space-y-2" key={`profile-loading-field-${index}`}>
            <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
            <div className="h-11 w-full animate-pulse rounded-xl bg-gray-100" />
          </div>
        ))}
      </div>
      <div className="mt-8 h-12 w-56 animate-pulse rounded-full bg-gray-200" />
    </section>
  );
}
