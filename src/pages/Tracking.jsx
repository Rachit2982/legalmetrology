import React, { useState, useEffect } from 'react'
import { Calendar, AlertTriangle, Clock, CheckCircle, Bell } from 'lucide-react'
import LoadingSpinner from '../components/LoadingSpinner'

const Tracking = () => {
  const [traders, setTraders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    fetchTraders()
  }, [])

  const fetchTraders = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/traders', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setTraders(data)
      } else {
        setError('Failed to fetch traders')
      }
    } catch (error) {
      setError('Error loading traders')
    } finally {
      setLoading(false)
    }
  }

  const getDaysUntilReverification = (reverificationDate) => {
    const today = new Date()
    const reverifyDate = new Date(reverificationDate)
    const diffTime = reverifyDate - today
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const categorizeTraders = () => {
    const overdue = []
    const dueSoon = []
    const dueThisMonth = []
    const upcoming = []

    traders.forEach(trader => {
      const daysUntil = getDaysUntilReverification(trader.reverificationDate)
      
      if (daysUntil < 0) {
        overdue.push(trader)
      } else if (daysUntil <= 7) {
        dueSoon.push(trader)
      } else if (daysUntil <= 30) {
        dueThisMonth.push(trader)
      } else {
        upcoming.push(trader)
      }
    })

    return { overdue, dueSoon, dueThisMonth, upcoming }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount)
  }

  const getFilteredTraders = () => {
    const categories = categorizeTraders()
    
    switch (filter) {
      case 'overdue':
        return categories.overdue
      case 'dueSoon':
        return categories.dueSoon
      case 'dueThisMonth':
        return categories.dueThisMonth
      case 'upcoming':
        return categories.upcoming
      default:
        return [...categories.overdue, ...categories.dueSoon, ...categories.dueThisMonth, ...categories.upcoming]
    }
  }

  const TraderCard = ({ trader, category }) => {
    const daysUntil = getDaysUntilReverification(trader.reverificationDate)
    
    const getCardStyle = () => {
      switch (category) {
        case 'overdue':
          return 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10'
        case 'dueSoon':
          return 'border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/10'
        case 'dueThisMonth':
          return 'border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/10'
        default:
          return 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
      }
    }

    const getIcon = () => {
      switch (category) {
        case 'overdue':
          return <AlertTriangle className="h-5 w-5 text-red-600" />
        case 'dueSoon':
          return <Bell className="h-5 w-5 text-orange-600" />
        case 'dueThisMonth':
          return <Clock className="h-5 w-5 text-yellow-600" />
        default:
          return <CheckCircle className="h-5 w-5 text-green-600" />
      }
    }

    return (
      <div className={`rounded-lg border p-4 ${getCardStyle()}`}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              {getIcon()}
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {trader.traderName}
              </h3>
            </div>
            
            <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
              <p>Trader ID: <span className="font-medium">{trader.traderId}</span></p>
              <p>Challan: <span className="font-medium">{trader.challanNumber}</span></p>
              <p>Fee: <span className="font-medium">{formatCurrency(trader.feeAmount)}</span></p>
              <p>Period: <span className="font-medium">{trader.subscriptionPeriod} year{trader.subscriptionPeriod > 1 ? 's' : ''}</span></p>
            </div>
            
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Re-verification Date:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {formatDate(trader.reverificationDate)}
                </span>
              </div>
              
              <div className="flex items-center justify-between text-sm mt-1">
                <span className="text-gray-600 dark:text-gray-400">Days remaining:</span>
                <span className={`font-bold ${
                  daysUntil < 0 ? 'text-red-600' : 
                  daysUntil <= 7 ? 'text-orange-600' : 
                  daysUntil <= 30 ? 'text-yellow-600' : 'text-green-600'
                }`}>
                  {daysUntil < 0 ? `${Math.abs(daysUntil)} days overdue` : `${daysUntil} days`}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="large" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-md">
        {error}
      </div>
    )
  }

  const categories = categorizeTraders()
  const filteredTraders = getFilteredTraders()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Tracking & Reminders</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Monitor upcoming deadlines and renewal requirements
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="h-6 w-6 text-red-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-red-700 dark:text-red-400">Overdue</p>
              <p className="text-2xl font-bold text-red-900 dark:text-red-300">{categories.overdue.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
          <div className="flex items-center">
            <Bell className="h-6 w-6 text-orange-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-orange-700 dark:text-orange-400">Due Soon (7 days)</p>
              <p className="text-2xl font-bold text-orange-900 dark:text-orange-300">{categories.dueSoon.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex items-center">
            <Clock className="h-6 w-6 text-yellow-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-yellow-700 dark:text-yellow-400">Due This Month</p>
              <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-300">{categories.dueThisMonth.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <div className="flex items-center">
            <CheckCircle className="h-6 w-6 text-green-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-green-700 dark:text-green-400">Upcoming</p>
              <p className="text-2xl font-bold text-green-900 dark:text-green-300">{categories.upcoming.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Options */}
      <div className="flex flex-wrap gap-2">
        {[
          { key: 'all', label: 'All', count: traders.length },
          { key: 'overdue', label: 'Overdue', count: categories.overdue.length },
          { key: 'dueSoon', label: 'Due Soon', count: categories.dueSoon.length },
          { key: 'dueThisMonth', label: 'Due This Month', count: categories.dueThisMonth.length },
          { key: 'upcoming', label: 'Upcoming', count: categories.upcoming.length }
        ].map(({ key, label, count }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === key
                ? 'bg-primary-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            {label} ({count})
          </button>
        ))}
      </div>

      {/* Traders List */}
      <div>
        {filteredTraders.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">No traders found for the selected filter</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredTraders.map((trader) => {
              const daysUntil = getDaysUntilReverification(trader.reverificationDate)
              let category = 'upcoming'
              
              if (daysUntil < 0) category = 'overdue'
              else if (daysUntil <= 7) category = 'dueSoon'
              else if (daysUntil <= 30) category = 'dueThisMonth'
              
              return (
                <TraderCard 
                  key={trader.id} 
                  trader={trader} 
                  category={category}
                />
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default Tracking
