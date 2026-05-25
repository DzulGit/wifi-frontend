// ── Admin Root Layout (tanpa sidebar, hanya untuk /admin/login)
// Route authenticated (/admin/(authenticated)/*) akan override layout ini
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}