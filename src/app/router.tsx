import { BrowserRouter, Routes, Route } from 'react-router-dom'
import UnderConstruction from '../pages/under-construction.tsx'
import NotFound from '../pages/not-found.tsx'
import { ProtectedRoute } from '@/features/auth'
import { Home } from '@/features/home'
import Layout from '@/components/layout/layout'

export const AppRouter = () => {
  return (
    <BrowserRouter>
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
          <Route index element={<Home />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
