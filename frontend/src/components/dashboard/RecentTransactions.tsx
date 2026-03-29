import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'

import { Alert, AlertDescription, AlertTitle } from '#/components/ui/alert'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '#/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '#/components/ui/table'
import {
  formatCurrency,
  getTransactionAmountColor,
  getTransactionTypeLabel,
} from '#/lib/finance'

interface RecentTransactionItem {
  id: string
  transactionDate: string
  description: string
  category?: { name: string } | null
  type: string
  amount: number | string
  transferAccount?: { name: string } | null
}

interface RecentTransactionsProps {
  transactions: RecentTransactionItem[]
  accountName: string
  activePeriodLabel: string
  currency: string
}

export function RecentTransactions({
  transactions,
  accountName,
  activePeriodLabel,
  currency,
}: RecentTransactionsProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Last Records Overview</CardTitle>
          <CardDescription>
            Latest activity for {accountName} in {activePeriodLabel}.
          </CardDescription>
        </div>
        <Button asChild variant="ghost" size="sm">
          <Link to="/transactions">
            View all <ArrowRight className="ml-1 h-3 w-3" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <Alert>
            <AlertTitle>No transactions recorded</AlertTitle>
            <AlertDescription>
              Visit the management page to add transactions.
            </AlertDescription>
          </Alert>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    {new Date(tx.transactionDate).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </TableCell>
                  <TableCell className="font-medium">
                    {tx.description}
                  </TableCell>
                  <TableCell>
                    {tx.category?.name ??
                      (tx.type === 'TRANSFER' ? (
                        'Transfer'
                      ) : (
                        <span className="text-muted-foreground">
                          Uncategorized
                        </span>
                      ))}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {getTransactionTypeLabel(tx.type)}
                    </Badge>
                  </TableCell>
                  <TableCell
                    className={`text-right font-medium ${getTransactionAmountColor(tx.type)}`}
                  >
                    {tx.type === 'EXPENSE' ? '-' : ''}
                    {formatCurrency(Number(tx.amount), currency)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
