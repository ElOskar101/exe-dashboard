import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ProtectedRoute } from './protected-route.tsx'
import UnderConstruction from '../pages/under-construction.tsx'
import NotFound from '../pages/not-found.tsx'
import Home from '../home/home.tsx'
import Layout from '../layout/layout.tsx'

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
