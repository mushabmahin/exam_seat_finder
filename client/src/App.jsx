import React, { useState } from 'react'

export default function App() {
  const [branch, setBranch] = useState('')
  const [year, setYear] = useState('')
  const [roll, setRoll] = useState('')
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  async function searchSeat(e) {
    e && e.preventDefault()
    setError(null)
    setResult(null)

    if (!branch || !year || !roll) {
      alert('Please fill all fields')
      return
    }

    setLoading(true)
    try {
      const res = await fetch(
        `/api/seats/search?roll=${encodeURIComponent(roll.toUpperCase())}&branch=${encodeURIComponent(branch)}&year=${encodeURIComponent(year)}`
      )
      const data = await res.json()
      if (res.status === 404) {
        setError('Seat not found')
      } else {
        setResult(data)
      }
    } catch (err) {
      setError('Network error')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 font-sans">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-blue-600 text-white text-center px-6 py-8">
          <h1 className="text-2xl font-bold">Exam Seating</h1>
          <p className="text-blue-100 text-sm mt-1">Find your classroom instantly</p>
        </div>

        <form className="p-8" onSubmit={searchSeat}>
          <p className="text-center text-xs text-slate-400 mb-4">Connected to Live Database</p>

          <label className="block text-sm font-semibold text-slate-700 mb-2">Select Branch</label>
          <select value={branch} onChange={e => setBranch(e.target.value)} className="w-full mb-4 bg-slate-50 border border-slate-300 rounded-lg px-4 py-3">
            <option value="">Choose Branch</option>
            <option value="AIDS">AI & DS</option>
            <option value="CSE-A">CSE-A</option>
            <option value="CSE-B">CSE-B</option>
            <option value="CS-AI">CS-AI</option>
            <option value="ECE">ECE</option>
            <option value="EEE">EEE</option>
            <option value="ME">Mechanical</option>
            <option value="CE">Civil</option>
          </select>

          <label className="block text-sm font-semibold text-slate-700 mb-2">Select Year</label>
          <select value={year} onChange={e => setYear(e.target.value)} className="w-full mb-4 bg-slate-50 border border-slate-300 rounded-lg px-4 py-3">
            <option value="">Choose Year</option>
            <option value="1">1st Year</option>
            <option value="2">2nd Year</option>
            <option value="3">3rd Year</option>
            <option value="4">4th Year</option>
          </select>

          <label className="block text-sm font-semibold text-slate-700 mb-2">Roll Number</label>
          <input value={roll} onChange={e => setRoll(e.target.value)} placeholder="E.G. 23 or 102" className="w-full mb-4 bg-slate-50 border border-slate-300 rounded-lg px-4 py-3 uppercase" />

          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg shadow-lg transition">
            {loading ? 'Searching...' : 'Find My Seat'}
          </button>

          <div className="mt-6 text-center">
            {error && (
              <div className="text-red-600 font-semibold">{error}</div>
            )}

            {result && (
              <div>
                <p className="text-sm text-slate-500 uppercase tracking-wide">Allocated Classroom</p>
                <p className="text-4xl font-bold text-blue-700 mt-2">{result.room}</p>
                <p className="text-blue-600 font-medium mt-1">{result.location}</p>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
