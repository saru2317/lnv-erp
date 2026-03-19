/**
 * useListView — shared hook for Normal/Detail view toggle
 * and column visibility from admin settings
 */
import { useState } from 'react'

const STORAGE_KEY = 'lnv_list_settings'
const VIEW_KEY    = 'lnv_list_views'

export function useListView(screenKey) {
  // View mode: 'normal' | 'detail'
  const [viewMode, setViewMode] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(VIEW_KEY)||'{}')
      return saved[screenKey] || 'normal'
    } catch { return 'normal' }
  })

  const toggleView = (mode) => {
    setViewMode(mode)
    try {
      const saved = JSON.parse(localStorage.getItem(VIEW_KEY)||'{}')
      localStorage.setItem(VIEW_KEY, JSON.stringify({...saved, [screenKey]:mode}))
    } catch {}
  }

  // Get active columns from admin settings
  const getActiveColumns = (defaultCols) => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}')
      return saved[screenKey] || defaultCols
    } catch { return defaultCols }
  }

  return { viewMode, toggleView, getActiveColumns }
}
