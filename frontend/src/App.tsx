import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './context/AuthContext'
import Layout from './components/layout/Layout'
import HomePage from './pages/HomePage'
import CreateEventPage from './pages/CreateEventPage'
import EventPage from './pages/EventPage'
import UploadPage from './pages/UploadPage'
import SearchFacePage from './pages/SearchFacePage'
import MyEventsPage from './pages/MyEventsPage'
import AccessCodePage from './pages/AccessCodePage'
import NotFoundPage from './pages/NotFoundPage'

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<HomePage />} />
              <Route path="create" element={<CreateEventPage />} />
              <Route path="access-code" element={<AccessCodePage />} />
              <Route path="events/:eventId" element={<EventPage />} />
              <Route path="events/:eventId/upload" element={<UploadPage />} />
              <Route path="events/:eventId/search" element={<SearchFacePage />} />
              <Route path="my-events" element={<MyEventsPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App

