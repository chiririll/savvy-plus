import { useTranslation } from 'react-i18next'
import { Row } from '@tanstack/react-table'
import { formatCurrency } from '@/lib/utils'
import { Transaction } from '@/types'

export function TransactionItemsRow({ row }: { row: Row<Transaction> }) {
    const { t } = useTranslation('pages')
    const items = row.original.items
    const currency = row.original.account.currency
    if (!items || items.length === 0) {
        return null
    }

    return (
        <div className="px-4 py-3 ml-10">
            <table className="w-full text-sm">
                <thead>
                    <tr className="text-muted-foreground text-xs">
                        <th className="text-left font-medium pb-2">{t('transactions.items.item')}</th>
                        <th className="text-right font-medium pb-2 w-20">{t('transactions.items.qty')}</th>
                        <th className="text-right font-medium pb-2 w-24">{t('transactions.items.price')}</th>
                        <th className="text-right font-medium pb-2 w-24">{t('transactions.items.total')}</th>
                    </tr>
                </thead>
                <tbody>
                    {items.map((item, idx) => (
                        <tr key={item.id ?? idx} className="border-t border-border/50">
                            <td className="py-1.5">{item.name}</td>
                            <td className="py-1.5 text-right font-mono">{item.quantity}</td>
                            <td className="py-1.5 text-right font-mono">{formatCurrency(item.pricePerUnit, currency, { showSymbol: false })}</td>
                            <td className="py-1.5 text-right font-mono font-medium">{formatCurrency(item.totalPrice, currency, { showSymbol: false })}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}
