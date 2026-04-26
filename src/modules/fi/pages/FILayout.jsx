import React, { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import ModuleLayout from '@components/layout/ModuleLayout'
import PageLoader from '@components/ui/PageLoader'

const FIDashboard        = lazy(() => import('./FIDashboard'))
const JVList             = lazy(() => import('./JVList'))
const JVNew              = lazy(() => import('./JVNew'))
const VoucherEntry       = lazy(() => import('./VoucherEntry'))
const GeneralLedger      = lazy(() => import('./GeneralLedger'))
const TrialBalance       = lazy(() => import('./TrialBalance'))
const PLReport           = lazy(() => import('./PLReport'))
const BalanceSheet       = lazy(() => import('./BalanceSheet'))
const CashFlow           = lazy(() => import('./CashFlow'))
const GSTR1              = lazy(() => import('./GSTR1'))
const GSTR2B             = lazy(() => import('./GSTR2B'))
const GSTR3B             = lazy(() => import('./GSTR3B'))
const GSTR9              = lazy(() => import('./GSTR9'))
const ITCRegister        = lazy(() => import('./ITCRegister'))
const ITCReconciliation  = lazy(() => import('./ITCReconciliation'))
const GSTPayment         = lazy(() => import('./GSTPayment'))
const EInvoice           = lazy(() => import('./EInvoice'))
const EWayBill           = lazy(() => import('./EWayBill'))
const RCMRegister        = lazy(() => import('./RCMRegister'))
const HSNSummary         = lazy(() => import('./HSNSummary'))
const ARaging            = lazy(() => import('./ARaging'))
const APAging            = lazy(() => import('./APAging'))
const CustomerReceipts   = lazy(() => import('./CustomerReceipts'))
const VendorPayments     = lazy(() => import('./VendorPayments'))
const BankRecon          = lazy(() => import('./BankRecon'))
const ChartOfAccounts    = lazy(() => import('./ChartOfAccounts'))
const COGMReport         = lazy(() => import('./COGMReport'))
const CostCenterLedger   = lazy(() => import('./CostCenterLedger'))
const FixedAssetRegister = lazy(() => import('./FixedAssetRegister'))
const TDSRegister        = lazy(() => import('./TDSRegister'))
const Form26Q            = lazy(() => import('./Form26Q'))
const Form26AS           = lazy(() => import('./Form26AS'))
const AdvanceRegister    = lazy(() => import('./AdvanceRegister'))
const CreditNoteList     = lazy(() => import('./CreditNoteList'))
const ProfitabilityReport= lazy(() => import('./ProfitabilityReport'))
const BudgetVsActual     = lazy(() => import('./BudgetVsActual'))
const InterModuleJournals= lazy(() => import('./InterModuleJournals'))
const DayBook            = lazy(() => import('./DayBook'))
const ITCLossRegister    = lazy(() => import('./ITCLossRegister'))
const CreditLimitDashboard = lazy(() => import('./CreditLimitDashboard'))
const PDCRegister          = lazy(() => import('./PDCRegister'))

const NAV_ITEMS = [
  { to: '/fi',           label: 'Home'      },
  { to: '/fi/jv',        label: 'Journals'  },
  { to: '/fi/voucher',   label: 'Vouchers'  },
  { to: '/fi/daybook',   label: 'Day Book'  },
  { to: '/fi/gstr3b',    label: 'GST'       },
  { to: '/fi/ar-aging',  label: 'AR/AP'     },
  { to: '/fi/pl',        label: 'Reports'   },
]

const SIDEBAR_GROUPS = [
  {
    label: 'Voucher Entry', icon: '',
    items: [
      { to: '/fi/voucher',      label: 'Voucher Entry (PV/RV/Contra)' },
      { to: '/fi/jv/new',       label: 'New Journal (FB50)'           },
      { to: '/fi/daybook',      label: 'Day Book'                     },
      { to: '/fi/jv',           label: 'Journal List (FB03)'          },
      { to: '/fi/inter-module', label: 'Auto Journals'                },
    ],
  },
  {
    label: 'General Ledger', icon: '',
    items: [
      { to: '/fi/coa',    label: 'Chart of Accounts'    },
      { to: '/fi/ledger', label: 'General Ledger (GL)'  },
      { to: '/fi/trial',  label: 'Trial Balance'        },
    ],
  },
  {
    label: 'Financial Reports', icon: '',
    items: [
      { to: '/fi/pl',            label: 'Profit & Loss'         },
      { to: '/fi/bs',            label: 'Balance Sheet'         },
      { to: '/fi/cashflow',      label: 'Cash Flow'             },
      { to: '/fi/cogm',          label: 'COGM Report (PP)'      },
      { to: '/fi/profitability', label: 'Profitability Analysis' },
      { to: '/fi/budget',        label: 'Budget vs Actual'      },
      { to: '/fi/cost-center',   label: 'Cost Center Ledger'    },
    ],
  },
  {
    label: 'AR / AP / Bank', icon: '',
    items: [
      { to: '/fi/credit-limit',  label: 'Credit Limit Dashboard' },
      { to: '/fi/pdc',           label: 'PDC Register'           },
      { to: '/fi/ar-aging',     label: 'AR Aging (Customers)'  },
      { to: '/fi/receipts',     label: 'Customer Receipts (RV)'},
      { to: '/fi/ap-aging',     label: 'AP Aging (Vendors)'    },
      { to: '/fi/payments',     label: 'Vendor Payments (PV)'  },
      { to: '/fi/bank-recon',   label: 'Bank Reconciliation'   },
      { to: '/fi/advances',     label: 'Advance Register'      },
      { to: '/fi/credit-notes', label: 'Credit / Debit Notes'  },
    ],
  },
  {
    label: 'GST Compliance', icon: '',
    items: [
      { to: '/fi/gstr1',       label: 'GSTR-1 (Sales)'         },
      { to: '/fi/gstr2b',      label: 'GSTR-2B (Purchase)'     },
      { to: '/fi/gstr3b',      label: 'GSTR-3B (Monthly)'      },
      { to: '/fi/gstr9',       label: 'GSTR-9 (Annual)'        },
      { to: '/fi/itc',         label: 'ITC Register'           },
      { to: '/fi/itc-recon',   label: 'ITC Reconciliation'     },
      { to: '/fi/itc-loss',    label: 'ITC Loss Register'         },
      { to: '/fi/gst-pay',     label: 'GST Payment'            },
      { to: '/fi/e-invoice',   label: 'E-Invoice (IRN/QR)'     },
      { to: '/fi/eway-bill',   label: 'E-Way Bill'             },
      { to: '/fi/rcm',         label: 'RCM Register'           },
      { to: '/fi/hsn-summary', label: 'HSN / SAC Summary'      },
    ],
  },
  {
    label: 'Compliance & Assets', icon: '',
    items: [
      { to: '/fi/tds',          label: 'TDS Register'        },
      { to: '/fi/tds/26q',      label: 'Form 26Q (Quarterly)' },
      { to: '/fi/tds/26as',     label: 'Form 26AS Reconciliation' },
      { to: '/fi/fixed-assets', label: 'Fixed Asset Register'},
    ],
  },
]

export default function FILayout() {
  return (
    <ModuleLayout moduleName="FI" navItems={NAV_ITEMS} sidebarGroups={SIDEBAR_GROUPS}>
      <Suspense fallback={<PageLoader text="Loading FI page…" />}>
        <Routes>
          <Route index                element={<FIDashboard />}         />

          {/* Voucher Entry */}
          <Route path="voucher"       element={<VoucherEntry />}        />
          <Route path="jv"            element={<JVList />}              />
          <Route path="jv/new"        element={<JVNew />}               />
          <Route path="daybook"       element={<DayBook />}             />
          <Route path="inter-module"  element={<InterModuleJournals />} />

          {/* GL */}
          <Route path="coa"           element={<ChartOfAccounts />}     />
          <Route path="ledger"        element={<GeneralLedger />}       />
          <Route path="trial"         element={<TrialBalance />}        />

          {/* Reports */}
          <Route path="pl"            element={<PLReport />}            />
          <Route path="bs"            element={<BalanceSheet />}        />
          <Route path="cashflow"      element={<CashFlow />}            />
          <Route path="cogm"          element={<COGMReport />}          />
          <Route path="profitability" element={<ProfitabilityReport />} />
          <Route path="budget"        element={<BudgetVsActual />}      />
          <Route path="cost-center"   element={<CostCenterLedger />}    />

          {/* AR / AP */}
          <Route path="credit-limit"   element={<CreditLimitDashboard />} />
          <Route path="pdc"            element={<PDCRegister />}          />
          <Route path="ar-aging"       element={<ARaging />}              />
          <Route path="receipts"      element={<CustomerReceipts />}    />
          <Route path="ap-aging"      element={<APAging />}             />
          <Route path="payments"      element={<VendorPayments />}      />
          <Route path="bank-recon"    element={<BankRecon />}           />
          <Route path="advances"      element={<AdvanceRegister />}     />
          <Route path="credit-notes"  element={<CreditNoteList />}      />

          {/* GST */}
          <Route path="gstr1"         element={<GSTR1 />}               />
          <Route path="gstr2b"        element={<GSTR2B />}              />
          <Route path="gstr3b"        element={<GSTR3B />}              />
          <Route path="gstr9"         element={<GSTR9 />}               />
          <Route path="itc"           element={<ITCRegister />}         />
          <Route path="itc-recon"     element={<ITCReconciliation />}   />
          <Route path="gst-pay"       element={<GSTPayment />}          />
          <Route path="e-invoice"     element={<EInvoice />}            />
          <Route path="eway-bill"     element={<EWayBill />}            />
          <Route path="rcm"           element={<RCMRegister />}         />
          <Route path="hsn-summary"   element={<HSNSummary />}          />

          {/* Compliance */}
          <Route path="tds"           element={<TDSRegister />}         />
          <Route path="tds/26q"       element={<Form26Q />}             />
          <Route path="tds/26as"      element={<Form26AS />}            />
          <Route path="fixed-assets"  element={<FixedAssetRegister />}  />

          <Route path="*"             element={<Navigate to="/fi" replace />} />
        </Routes>
      </Suspense>
    </ModuleLayout>
  )
}
