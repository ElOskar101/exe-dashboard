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
          <div className="h-full h-min-full overflow-auto px-4 md:px-6">
            <div className="container mx-auto">
              <Outlet />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

export default Layout
