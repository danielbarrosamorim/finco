import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Layout } from '@/components/Layout'
import { DashboardPage } from '@/pages/DashboardPage'
import { ExpensesPage } from '@/pages/ExpensesPage'
import { ExpenseFormPage } from '@/pages/ExpenseFormPage'
import { CategoriesPage } from '@/pages/CategoriesPage'
import { RulesPage } from '@/pages/RulesPage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<DashboardPage />} />
            <Route path="expenses" element={<ExpensesPage />} />
            <Route path="expenses/new" element={<ExpenseFormPage />} />
            <Route path="expenses/:id" element={<ExpenseFormPage />} />
            <Route path="categories" element={<CategoriesPage />} />
            <Route path="rules" element={<RulesPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
