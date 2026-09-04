import { TransactionTypeSummary } from '../components/TransactionTypeSummary'
import { ExpensesStructureChart } from '../components/ExpensesStructureChart'
import { ExpensesDynamicsChart } from '../components/ExpensesDynamicsChart'
import { TopExpenses } from '../components/TopExpenses'
import type { ReportFilters } from '../types'

export function ExpensesTab({ filters }: { filters: ReportFilters }) {
    return (
        <div className="space-y-6">
            <TransactionTypeSummary filters={filters} type="expense" />
            <ExpensesStructureChart filters={filters} />
            <ExpensesDynamicsChart filters={filters} />
            <TopExpenses filters={filters} />
        </div>
    )
}
