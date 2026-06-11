import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ProtectedRoute } from '@/features/auth'
import {
  RequireExecutionTarget,
  RuntimeApplicationTargetGate,
} from '@/features/executions/shared/components/runtime-application-target-gate'
import Layout from '@/components/layout/layout'

const ExecutionCreatePage = lazy(() =>
  import('@/features/executions/creation').then((module) => ({ default: module.ExecutionCreatePage })),
)
const ExecutionDetailPage = lazy(() =>
  import('@/features/executions/monitoring').then((module) => ({ default: module.ExecutionDetailPage })),
)
const ExecutionsPage = lazy(() => import('@/features/executions/listing/pages/executions-page'))
const HomePage = lazy(() => import('@/features/home').then((module) => ({ default: module.HomePage })))
const RuntimesPage = lazy(() => import('@/features/runtimes').then((module) => ({ default: module.RuntimesPage })))
const SettingsPage = lazy(() => import('@/features/settings').then((module) => ({ default: module.SettingsPage })))
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
            path="/select-runtime-application"
            element={
              <ProtectedRoute>
                <RuntimeApplicationTargetGate />
              </ProtectedRoute>
            }
          />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <RequireExecutionTarget>
                  <Layout />
                </RequireExecutionTarget>
              </ProtectedRoute>
            }
          >
            <Route index element={<HomePage />} />
            <Route path="create" element={<ExecutionCreatePage />} />
            <Route path="executions" element={<ExecutionsPage />} />
            <Route path="execution/:id" element={<ExecutionDetailPage />} />
            <Route path="runtimes" element={<RuntimesPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
