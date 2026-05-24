import Header from './header.tsx'
import { Outlet } from 'react-router-dom'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { ExecutionsSidebar } from '@/features/executions/components/executions-sidebar'

function Layout() {
  return (
    <SidebarProvider>
      <ExecutionsSidebar />
      <SidebarInset>
        <div className="flex h-screen flex-col">
          <Header />
          <div className="h-full overflow-auto">
            <div className="container mx-auto px-4 py-6 md:px-6">
              <Outlet />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

export default Layout
