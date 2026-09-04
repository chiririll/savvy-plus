import { createCrudApi } from './crud'
import { Budget } from '@/types'
import { BudgetFormData } from '@/schemas'

export const budgetsApi = createCrudApi<Budget, BudgetFormData>('/budgets')
