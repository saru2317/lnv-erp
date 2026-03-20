import React, { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import ModuleLayout from '@components/layout/ModuleLayout'
import PageLoader from '@components/ui/PageLoader'

const SDDashboard  = lazy(() => import('./SDDashboard'))
const CustomerList = lazy(() => import('./CustomerList'))
const CustomerNew  = lazy(() => import('./CustomerNew'))
const CustomerView = lazy(() => import('./CustomerView'))
const QuotList     = lazy(() => import('./QuotList'))
const QuotNew      = lazy(() => import('./QuotNew'))
const QuotView     = lazy(() => import('./QuotView'))
const ItemLedger   = lazy(() => import('./ItemLedger'))
const SOList       = lazy(() => import('./SOList'))
const SONew        = lazy(() => import('./SONew'))
const InvoiceList  = lazy(() => import('./InvoiceList'))
const InvoiceNew   = lazy(() => import('./InvoiceNew'))
const PaymentList  = lazy(() => import('./PaymentList'))
const PaymentNew   = lazy(() => import('./PaymentNew'))
const ReturnList   = lazy(() => import('./ReturnList'))
const ReturnNew          = lazy(() => import('./ReturnNew'))
const PricingConditions  = lazy(() => import('./PricingConditions'))
const PriceBook          = lazy(() => import('./PriceBook'))

const NAV = [
  { to: '/sd',             label: ' Home' },
  { to: '/sd/customers',   label: ' Customers' },
  { to: '/sd/quotations',  label: ' Quotations' },
  { to: '/sd/orders',      label: ' Sales Orders' },
  { to: '/sd/invoices',    label: ' Invoices' },
  { to: '/sd/payments',    label: ' Payments' },
  { to: '/sd/returns',     label: '↩ Returns' },
]

const SIDEBAR = [
  { label: 'Master Data', icon: '', items: [
    { to: '/sd/customers',        label: 'Customer Master' },
    { to: '/sd/customers/new',    label: 'New Customer' },
    { to: '/sd/item-ledger',      label: 'Item Ledger' },
    { to: '/sd/pricing',          label: 'Pricing Conditions' },
    { to: '/sd/pricebook',        label: 'Price Book' },
  ]},
  { label: 'Transactions', icon: '', items: [
    { to: '/sd/quotations',       label: 'Quotations (VA21)' },
    { to: '/sd/quotations/new',   label: 'New Quotation' },
    { to: '/sd/orders',           label: 'Sales Orders (VA05)' },
    { to: '/sd/orders/new',       label: 'New Sales Order (VA01)' },
    { to: '/sd/invoices',         label: 'Invoices (VF05)' },
    { to: '/sd/invoices/new',     label: 'New Invoice (VF01)' },
    { to: '/sd/payments',         label: 'Payment Receipts (F-28)' },
    { to: '/sd/returns',          label: 'Returns / Credit Note' },
  ]},
  { label: 'Reports', icon: '', items: [
    { to: '/sd/reports/summary',  label: 'Sales Summary' },
    { to: '/sd/reports/ledger',   label: 'Customer Ledger' },
    { to: '/sd/reports/aging',    label: 'Receivables Aging' },
    { to: '/sd/reports/revenue',  label: 'Revenue Analysis' },
  ]},
]

export default function SDLayout() {
  return (
    <ModuleLayout navItems={NAV} sidebarGroups={SIDEBAR}>
      <Suspense fallback={<PageLoader text="Loading SD page…" />}>
        <Routes>
          <Route index                  element={<SDDashboard />} />
          <Route path="customers"       element={<CustomerList />} />
          <Route path="customers/new"   element={<CustomerNew />} />
          <Route path="customers/:id"   element={<CustomerView />} />
          <Route path="quotations"      element={<QuotList />} />
          <Route path="quotations/new"  element={<QuotNew />} />
          <Route path="quotations/:id"  element={<QuotView />} />
          <Route path="orders"          element={<SOList />} />
          <Route path="orders/new"      element={<SONew />} />
          <Route path="orders/:id"      element={<SONew />} />
          <Route path="invoices"        element={<InvoiceList />} />
          <Route path="invoices/new"    element={<InvoiceNew />} />
          <Route path="invoices/:id"    element={<InvoiceNew />} />
          <Route path="payments"        element={<PaymentList />} />
          <Route path="payments/new"    element={<PaymentNew />} />
          <Route path="returns"         element={<ReturnList />} />
          <Route path="returns/new"     element={<ReturnNew />} />
          <Route path="item-ledger"     element={<ItemLedger />} />
          <Route path="pricing"         element={<PricingConditions />} />
          <Route path="pricebook"       element={<PriceBook />} />
          <Route path="*"               element={<Navigate to="/sd" replace />} />
        </Routes>
      </Suspense>
    </ModuleLayout>
  )
}
