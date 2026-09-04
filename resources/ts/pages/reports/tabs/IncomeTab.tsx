import { TransactionTypeSummary } from '../components/TransactionTypeSummary'
import { IncomeStructureChart } from '../components/IncomeStructureChart'
import { IncomeDynamicsChart } from '../components/IncomeDynamicsChart'
import { TopIncome } from '../components/TopIncome'
import type { ReportFilters } from '../types'

export function IncomeTab({ filters }: { filters: ReportFilters }) {
    return (
        <div className="space-y-6">
            <TransactionTypeSummary filters={filters} type="income" />
            <IncomeStructureChart filters={filters} />
            <IncomeDynamicsChart filters={filters} />
            <TopIncome filters={filters} />
        </div>
    )
}
