import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import ModuleLayout from '@components/layout/ModuleLayout'
import styles from '../../mm/pages/Stub.module.css'

const NAV_ITEMS = [
  { to: '/sd', label: '🏠 Home' },
  { to: '/sd/orders', label: '📦 Orders' },
  { to: '/sd/customers', label: '🤝 Customers' },
  { to: '/sd/invoices', label: '🧾 Invoices' },
  { to: '/sd/report', label: '📊 Reports' },
]

const SIDEBAR_GROUPS = [
  { label: 'Sales Orders', icon: '📦',
    items: [
      { to: '/sd/orders', label: 'Order List (VA05)' },
      { to: '/sd/orders/new', label: 'Create Order (VA01)' },
      { to: '/sd/quotations', label: 'Quotations (VA21)' },
    ]
  },
  { label: 'Customer', icon: '🤝',
    items: [
      { to: '/sd/customers', label: 'Customer List' },
      { to: '/sd/customers/new', label: 'New Customer' },
    ]
  },
  { label: 'Billing', icon: '🧾',
    items: [
      { to: '/sd/invoices', label: 'Invoice List (VF05)' },
      { to: '/sd/invoices/new', label: 'Create Invoice' },
      { to: '/sd/receipts', label: 'Customer Receipts' },
    ]
  },
]

function SDDashboard() {
  return (
    <div className={styles.page}>
      <div className={styles.badge}>SD Module</div>
      <h2>Sales & Distribution</h2>
      <p className={styles.note}>Orders, quotations, customer invoices — ready to build.</p>
    </div>
  )
}

export default function SDLayout() {
  return (
    <ModuleLayout moduleName="SD" navItems={NAV_ITEMS} sidebarGroups={SIDEBAR_GROUPS}>
      <Routes>
        <Route index element={<SDDashboard />} />
        <Route path="*" element={<Navigate to="/sd" replace />} />
      </Routes>
    </ModuleLayout>
  )
}
