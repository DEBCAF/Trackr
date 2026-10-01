'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase_client'

interface Transaction {
  id: string
  created_at: string
  title: string
  amount: number
  category: string
  type: 'allowance' | 'expense' | 'manual'
}

export default function BudgetDashboard() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('Food')
  const [transType, setTransType] = useState<'expense' | 'manual'>('expense')
  const [saveError, setSaveError] = useState('')

  useEffect(() => {
    fetchTransactions()
  }, [])

  async function fetchTransactions() {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: false })

    if (data) setTransactions(data)
  }

  async function handleAddTransaction(e: React.FormEvent) {
    e.preventDefault()
    setSaveError('')
    const numericAmount = parseFloat(amount)
    if (isNaN(numericAmount)) return

    try {
      const supabase = createClient()

      // Expenses are stored as negative numbers; manual top-ups/income as positive
      const finalAmount = transType === 'expense' ? -Math.abs(numericAmount) : Math.abs(numericAmount)

      const { error } = await supabase.from('transactions').insert({
        title,
        amount: finalAmount,
        category,
        type: transType,
      })

      if (error) {
        setSaveError(error.message)
        return
      }

      setTitle('')
      setAmount('')
      fetchTransactions()
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Could not save transaction.')
    }
  }

  async function handleDelete(id: string) {
    const supabase = createClient()
    await supabase.from('transactions').delete().eq('id', id)
    fetchTransactions()
  }

  // Calculate Central Balance
  const currentBalance = transactions.reduce((acc, curr) => acc + Number(curr.amount), 0)

  // Summary Metrics
  const todayStr = new Date().toISOString().split('T')[0]
  const totalSpentToday = transactions
    .filter((t) => t.type === 'expense' && t.created_at.startsWith(todayStr))
    .reduce((acc, curr) => acc + Math.abs(Number(curr.amount)), 0)

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const totalSpentThisWeek = transactions
    .filter((t) => t.type === 'expense' && new Date(t.created_at) >= sevenDaysAgo)
    .reduce((acc, curr) => acc + Math.abs(Number(curr.amount)), 0)

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Central Balance Display */}
        <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl border shadow-sm text-center">
          <h2 className="text-sm uppercase tracking-wide text-gray-500 dark:text-gray-400 font-semibold mb-2">
            Current Balance
          </h2>
          <div className={`text-5xl font-extrabold ${currentBalance >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
            £{currentBalance.toFixed(2)}
          </div>
        </div>

        {/* Summary Metric Cards */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border shadow-sm">
            <p className="text-sm text-gray-500">Spent Today</p>
            <p className="text-2xl font-bold text-rose-500">£{totalSpentToday.toFixed(2)}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border shadow-sm">
            <p className="text-sm text-gray-500">Spent This Week</p>
            <p className="text-2xl font-bold text-rose-500">£{totalSpentThisWeek.toFixed(2)}</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* New Transaction Form */}
          <form onSubmit={handleAddTransaction} className="bg-white dark:bg-gray-800 p-6 rounded-xl border shadow-sm space-y-4">
            <h3 className="text-lg font-bold">Log Transaction</h3>
            
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="type"
                  checked={transType === 'expense'}
                  onChange={() => setTransType('expense')}
                />
                Expense
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="type"
                  checked={transType === 'manual'}
                  onChange={() => setTransType('manual')}
                />
                Manual Top-up
              </label>
            </div>

            <div>
              <label className="block text-sm mb-1">Description</label>
              <input
                type="text"
                required
                className="w-full border dark:border-gray-700 bg-transparent p-2 rounded"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm mb-1">Amount (£)</label>
              <input
                type="number"
                step="0.01"
                required
                className="w-full border dark:border-gray-700 bg-transparent p-2 rounded"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm mb-1">Category</label>
              <select
                className="w-full border dark:border-gray-700 bg-transparent p-2 rounded"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="Food">Food</option>
                <option value="Transport">Transport</option>
                <option value="Entertainment">Entertainment</option>
                <option value="Bills">Bills</option>
                <option value="General">General</option>
              </select>
            </div>

            <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded font-medium hover:bg-blue-700">
              Save Transaction
            </button>
            {saveError && <p role="alert" className="text-sm text-red-600">{saveError}</p>}
          </form>

          {/* Transaction History List */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border shadow-sm">
            <h3 className="text-lg font-bold mb-4">Recent Activity</h3>
            <div className="space-y-3 max-h-[350px] overflow-y-auto">
              {transactions.map((t) => {
                const isPositive = Number(t.amount) >= 0
                return (
                  <div key={t.id} className="flex justify-between items-center p-3 border dark:border-gray-700 rounded-lg">
                    <div>
                      <p className="font-semibold">{t.title}</p>
                      <p className="text-xs text-gray-500">
                        {t.category} • {new Date(t.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`font-bold ${isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {isPositive ? '+' : ''}£{Math.abs(Number(t.amount)).toFixed(2)}
                      </span>
                      {t.type !== 'allowance' && (
                        <button onClick={() => handleDelete(t.id)} className="text-xs text-red-500 hover:underline">
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

      </div>
    </main>
  )
}
