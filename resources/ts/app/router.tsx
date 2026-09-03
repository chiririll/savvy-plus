import { lazy, Suspense } from 'react'
import { createBrowserRouter } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { AuthProvider } from '@/components/providers/AuthProvider'
import { ErrorBoundary } from '@/components/shared/ErrorBoundary'

// Auth pages
const LoginPage = lazy(() => import('@/pages/auth/login'))
const SetupPage = lazy(() => import('@/pages/auth/setup'))
const Setup2FAPage = lazy(() => import('@/pages/auth/setup-2fa'))
const SsoCallbackPage = lazy(() => import('@/pages/auth/sso-callback'))
const SetPasswordPage = lazy(() => import('@/pages/auth/set-password'))

// Protected pages
const DashboardPage = lazy(() => import('@/pages/dashboard'))
const TransactionsPage = lazy(() => import('@/pages/transactions'))
const AccountsPage = lazy(() => import('@/pages/accounts'))
const CategoriesPage = lazy(() => import('@/pages/categories'))
const CategoryCreatePage = lazy(() => import('@/pages/categories/create'))
const CategoryEditPage = lazy(() => import('@/pages/categories/[id]/edit'))
const CurrenciesPage = lazy(() => import('@/pages/currencies'))
const BudgetsPage = lazy(() => import('@/pages/budgets'))
const TagsPage = lazy(() => import('@/pages/tags'))
const TagCreatePage = lazy(() => import('@/pages/tags/create'))
const TagEditPage = lazy(() => import('@/pages/tags/[id]/edit'))
const DebtsPage = lazy(() => import('@/pages/debts'))
const RecurringPage = lazy(() => import('@/pages/recurring'))
const AutomationPage = lazy(() => import('@/pages/automation'))
const AutomationCreatePage = lazy(() => import('@/pages/automation/create'))
const AutomationEditPage = lazy(() => import('@/pages/automation/[id]/edit'))
const AutomationLogsPage = lazy(() => import('@/pages/automation/[id]/logs'))
const UsersPage = lazy(() => import('@/pages/users'))
const ReportsPage = lazy(() => import('@/pages/reports'))
const MonitoringPage = lazy(() => import('@/pages/settings/monitoring'))
const SystemSettingsPage = lazy(() => import('@/pages/settings/system'))
const SecuritySettingsPage = lazy(() => import('@/pages/settings/security'))
const ImportSettingsPage = lazy(() => import('@/pages/settings/import'))
const BackupsSettingsPage = lazy(() => import('@/pages/settings/backups'))
const ProvidersPage = lazy(() => import('@/pages/settings/providers'))
const ProviderCreatePage = lazy(() => import('@/pages/settings/providers/create'))
const ProviderEditPage = lazy(() => import('@/pages/settings/providers/[id]/edit'))
const NotFoundPage = lazy(() => import('@/pages/not-found'))

const withSuspense = (Component: React.LazyExoticComponent<() => React.JSX.Element>) => (
    <ErrorBoundary>
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-[200px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
        }>
            <Component />
        </Suspense>
    </ErrorBoundary>
)

export const router = createBrowserRouter([
    // Public routes
    {
        path: '/login',
        element: withSuspense(LoginPage),
    },
    {
        path: '/setup',
        element: withSuspense(SetupPage),
    },
    {
        path: '/setup-2fa',
        element: withSuspense(Setup2FAPage),
    },
    {
        path: '/auth/sso/callback',
        element: withSuspense(SsoCallbackPage),
    },
    {
        path: '/set-password/:token',
        element: withSuspense(SetPasswordPage),
    },

    // Protected routes
    {
        element: <AuthProvider />,
        children: [
            {
                path: '/',
                element: <AppLayout />,
                children: [
                    { index: true, element: withSuspense(DashboardPage) },
                    { path: 'transactions', element: withSuspense(TransactionsPage) },
                    { path: 'accounts', element: withSuspense(AccountsPage) },
                    { path: 'categories', element: withSuspense(CategoriesPage) },
                    { path: 'categories/create', element: withSuspense(CategoryCreatePage) },
                    { path: 'categories/:id/edit', element: withSuspense(CategoryEditPage) },
                    { path: 'currencies', element: withSuspense(CurrenciesPage) },
                    { path: 'budgets', element: withSuspense(BudgetsPage) },
                    { path: 'tags', element: withSuspense(TagsPage) },
                    { path: 'tags/create', element: withSuspense(TagCreatePage) },
                    { path: 'tags/:id/edit', element: withSuspense(TagEditPage) },
                    { path: 'debts', element: withSuspense(DebtsPage) },
                    { path: 'recurring', element: withSuspense(RecurringPage) },
                    { path: 'automation', element: withSuspense(AutomationPage) },
                    { path: 'automation/create', element: withSuspense(AutomationCreatePage) },
                    { path: 'automation/:id/edit', element: withSuspense(AutomationEditPage) },
                    { path: 'automation/:id/logs', element: withSuspense(AutomationLogsPage) },
                    { path: 'users', element: withSuspense(UsersPage) },
                    { path: 'reports', element: withSuspense(ReportsPage) },
                    { path: 'settings/system', element: withSuspense(SystemSettingsPage) },
                    { path: 'settings/monitoring', element: withSuspense(MonitoringPage) },
                    { path: 'settings/security', element: withSuspense(SecuritySettingsPage) },
                    { path: 'settings/import', element: withSuspense(ImportSettingsPage) },
                    { path: 'settings/backups', element: withSuspense(BackupsSettingsPage) },
                    { path: 'settings/providers', element: withSuspense(ProvidersPage) },
                    { path: 'settings/providers/create', element: withSuspense(ProviderCreatePage) },
                    { path: 'settings/providers/:id/edit', element: withSuspense(ProviderEditPage) },
                ],
            },
        ],
    },

    // 404
    { path: '*', element: withSuspense(NotFoundPage) },
])
