export default function ProfileSectionsLoading() {
  return (
    <>
      <section aria-busy="true" className="w-full bg-brand-dark">
        <div className="mx-auto flex w-full max-w-391 items-center gap-6 px-4 py-6 sm:px-6 lg:px-8 max-[500px]:min-h-[176px]">
          <div className="h-[72px] w-[72px] animate-pulse rounded-full bg-white/15" />
          <div className="flex-1 space-y-3">
            <div className="h-8 w-48 animate-pulse rounded-md bg-white/20" />
            <div className="h-5 w-64 animate-pulse rounded-md bg-white/15" />
            <div className="h-6 w-52 animate-pulse rounded-full bg-white/20" />
          </div>
        </div>
      </section>

      <section aria-busy="true" className="relative z-10 mx-auto w-full max-w-391 px-4 py-6 sm:px-6 md:py-7 lg:px-8 lg:py-8 max-[500px]:mt-4">
        <div className="flex flex-col gap-6 lg:flex-row">
          <aside className="w-full overflow-hidden rounded-2xl bg-white shadow-sm lg:w-72 lg:shrink-0 xl:w-80">
            <div className="p-4">
              <div className="h-6 w-28 animate-pulse rounded bg-gray-200" />
            </div>
            <div className="space-y-0 border-t border-gray-100">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  className="flex h-[53px] items-center justify-between border-b border-bg-light px-5 py-4"
                  key={`profile-loading-item-${index}`}
                >
                  <div className="h-5 w-36 animate-pulse rounded bg-gray-200" />
                  <div className="h-3.5 w-3.5 animate-pulse rounded-full bg-gray-200" />
                </div>
              ))}
            </div>
          </aside>

          <div className="flex-1 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="mb-6 h-8 w-44 animate-pulse rounded bg-gray-200" />
            <div className="grid grid-cols-2 gap-6">
              {Array.from({ length: 6 }).map((_, index) => (
                <div className="space-y-2" key={`profile-loading-field-${index}`}>
                  <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
                  <div className="h-11 w-full animate-pulse rounded-xl bg-gray-100" />
                </div>
              ))}
            </div>
            <div className="mt-8 h-12 w-56 animate-pulse rounded-full bg-gray-200" />
          </div>
        </div>
      </section>
    </>
  );
}
