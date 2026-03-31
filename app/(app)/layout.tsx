export default function AppAreaLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <section className="min-h-screen bg-bg-light">{children}</section>;
}
