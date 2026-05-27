import Header from './header.tsx'
import { Outlet } from 'react-router-dom'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { ExecutionsSidebar } from '@/features/executions/listing'

function Layout() {
  return (
    <SidebarProvider>
      <ExecutionsSidebar />
      <SidebarInset>
        <div className="flex h-screen flex-col">
          <Header />
          <div className="min-h-0 flex-1 overflow-auto">
            <div className="container mx-auto flex min-h-full flex-col px-4 py-6 md:px-6">
              <Outlet />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

export default Layout
