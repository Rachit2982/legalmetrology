import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Search, Filter, Download, Edit, Trash2, Eye, Calendar, DollarSign } from 'lucide-react'
import LoadingSpinner from '../components/LoadingSpinner'

const TraderList = () => {
  const [traders, setTraders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState('desc')
  const [filterPeriod, setFilterPeriod] = useState('all')

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

  const handleDelete = async (traderId) => {
    if (!window.confirm('Are you sure you want to delete this trader?')) {
      return
    }

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/traders/${traderId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        setTraders(traders.filter(t => t.id !== traderId))
      } else {
        setError('Failed to delete trader')
      }
    } catch (error) {
      setError('Error deleting trader')
    }
  }

  const filteredAndSortedTraders = traders
    .filter(trader => {
      const matchesSearch = trader.traderName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           trader.traderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           trader.challanNumber.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesPeriod = filterPeriod === 'all' || 
                           trader.subscriptionPeriod.toString() === filterPeriod
      
      return matchesSearch && matchesPeriod
    })
    .sort((a, b) => {
      let aValue = a[sortBy]
      let bValue = b[sortBy]
      
      if (sortBy === 'feeAmount') {
        aValue = parseFloat(aValue)
        bValue = parseFloat(bValue)
      } else if (sortBy.includes('Date')) {
        aValue = new Date(aValue)
        bValue = new Date(bValue)
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN')
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount)
  }

  const getDaysUntilReverification = (reverificationDate) => {
    const today = new Date()
    const reverifyDate = new Date(reverificationDate)
    const diffTime = reverifyDate - today
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const getStatusColor = (daysUntil) => {
    if (daysUntil < 0) return 'text-red-600 bg-red-100'
    if (daysUntil <= 7) return 'text-orange-600 bg-orange-100'
    if (daysUntil <= 30) return 'text-yellow-600 bg-yellow-100'
    return 'text-green-600 bg-green-100'
  }

  const getStatusText = (daysUntil) => {
    if (daysUntil < 0) return 'Overdue'
    if (daysUntil <= 7) return 'Due Soon'
    if (daysUntil <= 30) return 'Due This Month'
    return 'Active'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="large" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Trader List</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Manage and view all registered traders
          </p>
        </div>
        <Link
          to="/trader-entry"
          className="btn-primary mt-4 sm:mt-0"
        >
          Add New Trader
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {/* Filters and Search */}
      <div className="card">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search traders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-10 w-full sm:w-64"
              />
            </div>
            
            <select
              value={filterPeriod}
              onChange={(e) => setFilterPeriod(e.target.value)}
              className="input-field w-full sm:w-auto"
            >
              <option value="all">All Periods</option>
              <option value="1">1 Year</option>
              <option value="2">2 Years</option>
            </select>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('-')
                setSortBy(field)
                setSortOrder(order)
              }}
              className="input-field w-full sm:w-auto"
            >
              <option value="createdAt-desc">Newest First</option>
              <option value="createdAt-asc">Oldest First</option>
              <option value="traderName-asc">Name A-Z</option>
              <option value="traderName-desc">Name Z-A</option>
              <option value="reverificationDate-asc">Reverification Date (Soon)</option>
              <option value="reverificationDate-desc">Reverification Date (Later)</option>
              <option value="feeAmount-desc">Fee Amount (High-Low)</option>
              <option value="feeAmount-asc">Fee Amount (Low-High)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Eye className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">{filteredAndSortedTraders.length}</p>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Fees</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {formatCurrency(filteredAndSortedTraders.reduce((sum, trader) => sum + trader.feeAmount, 0))}
              </p>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
              <Calendar className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Due Soon</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {filteredAndSortedTraders.filter(t => getDaysUntilReverification(t.reverificationDate) <= 7 && getDaysUntilReverification(t.reverificationDate) >= 0).length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
              <Calendar className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Overdue</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {filteredAndSortedTraders.filter(t => getDaysUntilReverification(t.reverificationDate) < 0).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Traders Table */}
      <div className="card overflow-hidden">
        {filteredAndSortedTraders.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">No traders found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Trader
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Fee Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Dates
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Files
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredAndSortedTraders.map((trader) => {
                  const daysUntil = getDaysUntilReverification(trader.reverificationDate)
                  const statusColor = getStatusColor(daysUntil)
                  const statusText = getStatusText(daysUntil)
                  
                  return (
                    <tr key={trader.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {trader.traderName}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            ID: {trader.traderId} | Challan: {trader.challanNumber}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {formatCurrency(trader.feeAmount)}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {trader.subscriptionPeriod} year{trader.subscriptionPeriod > 1 ? 's' : ''}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm text-gray-900 dark:text-white">
                            Submitted: {formatDate(trader.feeSubmissionDate)}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            Reverify: {formatDate(trader.reverificationDate)}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColor}`}>
                          {statusText}
                        </span>
                        {daysUntil >= 0 && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {daysUntil} days left
                          </div>
                        )}
                        {daysUntil < 0 && (
                          <div className="text-xs text-red-600 dark:text-red-400 mt-1">
                            {Math.abs(daysUntil)} days overdue
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col space-y-1">
                          {trader.certificateFile && (
                            <a
                              href={`/api/uploads/${trader.certificateFile}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 flex items-center"
                            >
                              <Download className="h-3 w-3 mr-1" />
                              Certificate
                            </a>
                          )}
                          {trader.indentFile && (
                            <a
                              href={`/api/uploads/${trader.indentFile}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 flex items-center"
                            >
                              <Download className="h-3 w-3 mr-1" />
                              Indent
                            </a>
                          )}
                          {!trader.certificateFile && !trader.indentFile && (
                            <span className="text-xs text-gray-400">No files</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleDelete(trader.id)}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default TraderList
