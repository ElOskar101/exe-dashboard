import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ProtectedRoute } from '@/features/auth'
import Layout from '@/components/layout/layout'

const ExecutionsPage = lazy(
  () => import('@/features/executions/pages/executions-page'),
)
const NotFound = lazy(() => import('@/pages/not-found.tsx'))
const UnderConstruction = lazy(
  () => import('@/features/auth/pages/under-construction'),
)

export const AppRouter = () => {
  return (
    <BrowserRouter>
      <Suspense fallback={null}>
        <Routes>
          <Route path="/under-construction" element={<UnderConstruction />} />
          <Route path="/404" element={<NotFound />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<ExecutionsPage />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
