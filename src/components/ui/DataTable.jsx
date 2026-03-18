/**
 * DataTable — Reusable table with sort, search, pagination
 * Used across ALL list pages
 */
import React, { useState, useMemo } from 'react'
import styles from './DataTable.module.css'

export default function DataTable({
  columns = [],   // [{ key, label, render, sortable, width }]
  data = [],
  loading = false,
  emptyText = 'No records found',
  onRowClick,
  rowKey = 'id',
}) {
  const [sortKey, setSortKey]   = useState(null)
  const [sortDir, setSortDir]   = useState('asc')
  const [selected, setSelected] = useState(new Set())

  const sorted = useMemo(() => {
    if (!sortKey) return data
    return [...data].sort((a, b) => {
      const va = a[sortKey], vb = b[sortKey]
      if (va < vb) return sortDir === 'asc' ? -1 : 1
      if (va > vb) return sortDir === 'asc' ?  1 : -1
      return 0
    })
  }, [data, sortKey, sortDir])

  const handleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }

  const toggleAll = (e) => {
    setSelected(e.target.checked ? new Set(data.map(r => r[rowKey])) : new Set())
  }
  const toggleRow = (id) => {
    const s = new Set(selected)
    s.has(id) ? s.delete(id) : s.add(id)
    setSelected(s)
  }

  if (loading) return <div className={styles.loader}>Loading…</div>

  return (
    <div className={styles.wrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th style={{ width: 36 }}>
              <input type="checkbox" onChange={toggleAll} checked={selected.size === data.length && data.length > 0} />
            </th>
            {columns.map(col => (
              <th
                key={col.key}
                style={{ width: col.width }}
                className={col.sortable ? styles.sortable : ''}
                onClick={col.sortable ? () => handleSort(col.key) : undefined}
              >
                {col.label}
                {col.sortable && sortKey === col.key && (
                  <span className={styles.sortIcon}>{sortDir === 'asc' ? ' ↑' : ' ↓'}</span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.length === 0 ? (
            <tr><td colSpan={columns.length + 1} className={styles.empty}>{emptyText}</td></tr>
          ) : sorted.map(row => (
            <tr
              key={row[rowKey]}
              className={`${styles.row} ${onRowClick ? styles.clickable : ''} ${selected.has(row[rowKey]) ? styles.selected : ''}`}
              onClick={() => onRowClick?.(row)}
            >
              <td onClick={e => e.stopPropagation()}>
                <input type="checkbox" checked={selected.has(row[rowKey])} onChange={() => toggleRow(row[rowKey])} />
              </td>
              {columns.map(col => (
                <td key={col.key}>
                  {col.render ? col.render(row[col.key], row) : (row[col.key] ?? '—')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
