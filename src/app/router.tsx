import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ProtectedRoute } from '@/features/auth'
import Layout from '@/components/layout/layout'

const ExecutionCreatePage = lazy(() =>
  import('@/features/executions/creation').then((module) => ({ default: module.ExecutionCreatePage })),
)
const ExecutionDetailPage = lazy(() =>
  import('@/features/executions/monitoring').then((module) => ({ default: module.ExecutionDetailPage })),
)
const ExecutionsPage = lazy(() => import('@/features/executions/listing/pages/executions-page'))
const NotFound = lazy(() => import('@/pages/not-found.tsx'))
const UnderConstruction = lazy(() => import('@/features/auth/pages/under-construction'))

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
            <Route index element={<ExecutionCreatePage />} />
            <Route path="executions" element={<ExecutionsPage />} />
            <Route path="execution/:id" element={<ExecutionDetailPage />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
