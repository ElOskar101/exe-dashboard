import Header from './header.tsx'
import { Outlet } from 'react-router-dom'

function Layout() {
  return (
    <div className="flex h-screen flex-col">
      <Header />
      {/* <Navbar /> */}
      <div className="h-full h-min-full overflow-auto">
        <main className="container mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default Layout
