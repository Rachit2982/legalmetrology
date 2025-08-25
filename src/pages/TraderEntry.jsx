import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Upload, Save, Calendar, DollarSign } from 'lucide-react'
import LoadingSpinner from '../components/LoadingSpinner'

const TraderEntry = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  const [formData, setFormData] = useState({
    traderId: '',
    challanNumber: '',
    traderName: '',
    feeAmount: '',
    subscriptionPeriod: '1',
    feeSubmissionDate: '',
    reverificationDate: ''
  })
  
  const [files, setFiles] = useState({
    certificate: null,
    indent: null
  })

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    // Auto-calculate re-verification date when fee submission date changes
    if (name === 'feeSubmissionDate' && value) {
      const submissionDate = new Date(value)
      const period = parseInt(formData.subscriptionPeriod)
      submissionDate.setFullYear(submissionDate.getFullYear() + period)
      setFormData(prev => ({
        ...prev,
        reverificationDate: submissionDate.toISOString().split('T')[0]
      }))
    }
    
    // Update re-verification date when subscription period changes
    if (name === 'subscriptionPeriod' && formData.feeSubmissionDate) {
      const submissionDate = new Date(formData.feeSubmissionDate)
      const period = parseInt(value)
      submissionDate.setFullYear(submissionDate.getFullYear() + period)
      setFormData(prev => ({
        ...prev,
        reverificationDate: submissionDate.toISOString().split('T')[0]
      }))
    }
  }

  const handleFileChange = (e) => {
    const { name, files: fileList } = e.target
    setFiles(prev => ({
      ...prev,
      [name]: fileList[0] || null
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const submitData = new FormData()
      
      // Add form fields
      Object.keys(formData).forEach(key => {
        submitData.append(key, formData[key])
      })
      
      // Add files
      if (files.certificate) {
        submitData.append('certificate', files.certificate)
      }
      if (files.indent) {
        submitData.append('indent', files.indent)
      }

      const token = localStorage.getItem('token')
      const response = await fetch('/api/traders', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: submitData
      })

      if (response.ok) {
        setSuccess('Trader added successfully!')
        setTimeout(() => {
          navigate('/trader-list')
        }, 2000)
      } else {
        const errorData = await response.json()
        setError(errorData.message || 'Failed to add trader')
      }
    } catch (error) {
      setError('Error adding trader. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Add New Trader</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Enter trader information and upload required documents
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-md">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 px-4 py-3 rounded-md">
              {success}
            </div>
          )}

          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="label-text">Trader ID</label>
                <input
                  type="text"
                  name="traderId"
                  value={formData.traderId}
                  onChange={handleInputChange}
                  className="input-field"
                  required
                  placeholder="Enter trader ID"
                />
              </div>
              
              <div>
                <label className="label-text">Challan Number</label>
                <input
                  type="text"
                  name="challanNumber"
                  value={formData.challanNumber}
                  onChange={handleInputChange}
                  className="input-field"
                  required
                  placeholder="Enter challan number"
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="label-text">Trader Name</label>
                <input
                  type="text"
                  name="traderName"
                  value={formData.traderName}
                  onChange={handleInputChange}
                  className="input-field"
                  required
                  placeholder="Enter trader name"
                />
              </div>
            </div>
          </div>

          {/* Fee Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Fee Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="label-text">Fee Amount (₹)</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="number"
                    name="feeAmount"
                    value={formData.feeAmount}
                    onChange={handleInputChange}
                    className="input-field pl-10"
                    required
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                  />
                </div>
              </div>
              
              <div>
                <label className="label-text">Subscription Period</label>
                <select
                  name="subscriptionPeriod"
                  value={formData.subscriptionPeriod}
                  onChange={handleInputChange}
                  className="input-field"
                  required
                >
                  <option value="1">1 Year</option>
                  <option value="2">2 Years</option>
                </select>
              </div>
            </div>
          </div>

          {/* Date Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Important Dates</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="label-text">Fee Submission Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="date"
                    name="feeSubmissionDate"
                    value={formData.feeSubmissionDate}
                    onChange={handleInputChange}
                    className="input-field pl-10"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="label-text">Re-verification Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="date"
                    name="reverificationDate"
                    value={formData.reverificationDate}
                    onChange={handleInputChange}
                    className="input-field pl-10"
                    required
                    readOnly
                  />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Automatically calculated based on submission date and period
                </p>
              </div>
            </div>
          </div>

          {/* File Uploads */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Document Uploads</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="label-text">Certificate</label>
                <div className="relative">
                  <Upload className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="file"
                    name="certificate"
                    onChange={handleFileChange}
                    className="input-field pl-10"
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  />
                </div>
              </div>
              
              <div>
                <label className="label-text">Indent</label>
                <div className="relative">
                  <Upload className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="file"
                    name="indent"
                    onChange={handleFileChange}
                    className="input-field pl-10"
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  />
                </div>
              </div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Accepted formats: PDF, DOC, DOCX, JPG, JPEG, PNG (Max size: 10MB)
            </p>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => navigate('/trader-list')}
              className="btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary flex items-center"
              disabled={loading}
            >
              {loading ? (
                <LoadingSpinner size="small" />
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Add Trader
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default TraderEntry
