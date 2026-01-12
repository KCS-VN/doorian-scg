// import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter } from "react-router"
import { RouterProvider } from "react-router/dom"
import StickClimberGamePage from './pages/stick-climber-page/stick-climber-page.tsx'
import './index.css'

const router = createBrowserRouter([
    {
        path: "/",
        element: <StickClimberGamePage />,
    },
])

createRoot(document.getElementById('root')!).render(
    // <StrictMode>
    <RouterProvider router={router} />
    // </StrictMode>,
)
