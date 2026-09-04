import { createCrudApi } from './crud'
import { Budget, BudgetFormData } from '@/types'

export const budgetsApi = createCrudApi<Budget, BudgetFormData>('/budgets')
