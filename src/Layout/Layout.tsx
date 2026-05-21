import Header from './header.tsx'
import { Outlet } from 'react-router-dom'

function Layout() {
  return (
    <div className="flex h-screen flex-col bg-background">
      <Header />
      {/* <Navbar /> */}
      <div className="h-full h-min-full overflow-auto bg-muted/40">
        <main className="container mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default Layout
