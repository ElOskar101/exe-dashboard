import React, { ReactElement, useState } from 'react'
import Header from './header.tsx'
import Navbar from './navbar.tsx'
import { Outlet } from 'react-router-dom'

function Layout(props: { children?: ReactElement }) {
  return (
    <div className="flex flex-col h-screen bg-white dark:bg-black">
      <Header />
      {/* <Navbar /> */}
      <div className="bg-[var(--primary-50)]/80 h-full h-min-full overflow-auto">
        <main className="container mx-auto ">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default Layout
