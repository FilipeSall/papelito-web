export default function Loading() {
  return (
    <main aria-busy="true" className="min-h-screen bg-white px-6 py-12">
      <div className="mx-auto w-full max-w-5xl animate-pulse">
        <div className="mb-4 h-10 w-56 rounded-xl bg-neutral-200" />
        <div className="h-4 w-96 rounded-full bg-neutral-200" />
      </div>
    </main>
  );
}
