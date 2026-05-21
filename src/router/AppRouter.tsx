import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "./ProtectedRoute.tsx";
import UnderConstruction from "../pages/UnderConstruction.tsx";
import NotFound from "../pages/NotFound.tsx";
import Home from "../Home/Home.tsx";
import Layout from "../Layout/Layout.tsx";

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
  );
};
