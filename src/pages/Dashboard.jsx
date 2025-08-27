import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Users, Clock, AlertTriangle, DollarSign, UserPlus, Download } from 'lucide-react'
import LoadingSpinner from '../components/LoadingSpinner'

const Dashboard = () => {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/dashboard/stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setStats(data)
      } else {
        setError('Failed to fetch dashboard stats')
      }
    } catch (error) {
      setError('Error loading dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/export', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        // Create a simple CSV export for now
        const csvContent = [
          ['Trader ID', 'Challan Number', 'Trader Name', 'Fee Amount', 'Subscription Period', 'Fee Submission Date', 'Re-verification Date'].join(','),
          ...data.map(trader => [
            trader.traderId,
            trader.challanNumber,
            trader.traderName,
            trader.feeAmount,
            trader.subscriptionPeriod,
            trader.feeSubmissionDate,
            trader.reverificationDate
          ].join(','))
        ].join('\n')

        const blob = new Blob([csvContent], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.style.display = 'none'
        a.href = url
        a.download = `traders-export-${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error('Export failed:', error)
    }
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

  const statCards = [
    {
      title: 'Total Traders',
      value: stats?.totalTraders || 0,
      icon: Users,
      color: 'bg-blue-500',
      link: '/trader-list'
    },
    {
      title: 'Upcoming Re-verifications',
      value: stats?.upcomingReverifications || 0,
      icon: Clock,
      color: 'bg-yellow-500',
      link: '/tracking'
    },
    {
      title: 'Expiring Soon',
      value: stats?.expiringSoon || 0,
      icon: AlertTriangle,
      color: 'bg-red-500',
      link: '/tracking'
    },
    {
      title: 'Total Fee Amount',
      value: `₹${(stats?.totalFeeAmount || 0).toLocaleString()}`,
      icon: DollarSign,
      color: 'bg-green-500',
      link: '/trader-list'
    }
  ]

  const quickActions = [
    {
      title: 'Add New Trader',
      description: 'Register a new trader with all required details',
      icon: UserPlus,
      link: '/trader-entry',
      color: 'bg-primary-600 hover:bg-primary-700'
    },
    {
      title: 'View All Traders',
      description: 'Browse and manage existing trader records',
      icon: Users,
      link: '/trader-list',
      color: 'bg-purple-600 hover:bg-purple-700'
    },
    {
      title: 'Tracking & Reminders',
      description: 'Monitor upcoming deadlines and renewals',
      icon: Clock,
      link: '/tracking',
      color: 'bg-orange-600 hover:bg-orange-700'
    },
    {
      title: 'Export Data',
      description: 'Download trader data and documents',
      icon: Download,
      action: handleExport,
      color: 'bg-green-600 hover:bg-green-700'
    }
  ]

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-lg shadow-sm">
        <div className="px-6 py-8 text-white">
          <h1 className="text-3xl font-bold mb-2">Welcome to Legal Metrology System</h1>
          <p className="text-primary-100">
            Manage trader registrations, track renewals, and maintain compliance records efficiently.
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon
          const CardComponent = stat.link ? Link : 'div'
          
          return (
            <CardComponent
              key={index}
              to={stat.link}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow duration-200"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-lg ${stat.color}`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardComponent>
          )
        })}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {quickActions.map((action, index) => {
            const Icon = action.icon
            const ActionComponent = action.link ? Link : 'button'
            
            return (
              <ActionComponent
                key={index}
                to={action.link}
                onClick={action.action}
                className={`${action.color} text-white rounded-lg p-6 text-left hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500`}
              >
                <Icon className="h-8 w-8 mb-4" />
                <h3 className="text-lg font-semibold mb-2">{action.title}</h3>
                <p className="text-sm opacity-90">{action.description}</p>
              </ActionComponent>
            )
          })}
        </div>
      </div>

      {/* Recent Activity or Tips */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">System Information</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Key Features</h3>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li>• Trader registration and management</li>
              <li>• Automatic deadline tracking</li>
              <li>• Document upload and storage</li>
              <li>• Data export functionality</li>
              <li>• Dark/Light theme support</li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Subscription Periods</h3>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li>• 1-year subscription available</li>
              <li>• 2-year subscription available</li>
              <li>• Automatic renewal reminders</li>
              <li>• Certificate and indent tracking</li>
            </ul>
          </div>
          <div className="hidden xl:block">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Quick Tips</h3>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li>• Use filters to find traders quickly</li>
              <li>• Export data regularly for backup</li>
              <li>• Monitor expiring certificates</li>
              <li>• Update trader information as needed</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
