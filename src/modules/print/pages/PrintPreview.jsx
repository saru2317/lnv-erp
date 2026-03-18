import React, { Suspense, lazy } from 'react'
import { useParams, useNavigate } from 'react-router-dom'

// SD
const InvoicePrint        = lazy(() => import('@components/print/InvoicePrint'))
const SalesOrderPrint     = lazy(() => import('@components/print/SalesOrderPrint'))
const DeliveryChallanPrint= lazy(() => import('@components/print/DeliveryChallanPrint'))
const QuotationPrint      = lazy(() => import('@components/print/QuotationPrint'))
// MM
const POPrint             = lazy(() => import('@components/print/POPrint'))
const CSPrint             = lazy(() => import('@components/print/CSPrint'))
const PRPrint             = lazy(() => import('@components/print/PRPrint'))
const GRNPrint            = lazy(() => import('@components/print/GRNPrint'))
// PP
const JobOrderPrint       = lazy(() => import('@components/print/JobOrderPrint'))
const BOMPrint            = lazy(() => import('@components/print/BOMPrint'))
const LabourCardPrint     = lazy(() => import('@components/print/LabourCardPrint'))
// WM
const StockTransferPrint  = lazy(() => import('@components/print/StockTransferPrint'))
const MaterialIssuePrint  = lazy(() => import('@components/print/MaterialIssuePrint'))
// FI
const PaymentVoucherPrint = lazy(() => import('@components/print/PaymentVoucherPrint'))
const ReceiptVoucherPrint = lazy(() => import('@components/print/ReceiptVoucherPrint'))
const JournalEntryPrint   = lazy(() => import('@components/print/JournalEntryPrint'))
// QM
const InspectionReportPrint = lazy(() => import('@components/print/InspectionReportPrint'))
const NCRPrint            = lazy(() => import('@components/print/NCRPrint'))
// PM
const MaintenanceWOPrint  = lazy(() => import('@components/print/MaintenanceWOPrint'))
const BreakdownReportPrint= lazy(() => import('@components/print/BreakdownReportPrint'))
// HCM
const PaySlipPrint        = lazy(() => import('@components/print/PaySlipPrint'))
// TM
const TripSheetPrint      = lazy(() => import('@components/print/TripSheetPrint'))
const FuelLogReportPrint  = lazy(() => import('@components/print/FuelLogReportPrint'))

const PRINT_MAP = {
  // SD
  'invoice':      InvoicePrint,
  'so':           SalesOrderPrint,
  'dc':           DeliveryChallanPrint,
  'quotation':    QuotationPrint,
  // MM
  'po':           POPrint,
  'cs':           CSPrint,
  'pr':           PRPrint,
  'grn':          GRNPrint,
  // PP
  'jo':           JobOrderPrint,
  'bom':          BOMPrint,
  'labourcard':   LabourCardPrint,
  // WM
  'stn':          StockTransferPrint,
  'mis':          MaterialIssuePrint,
  // FI
  'pv':           PaymentVoucherPrint,
  'rv':           ReceiptVoucherPrint,
  'jv':           JournalEntryPrint,
  // QM
  'ir':           InspectionReportPrint,
  'ncr':          NCRPrint,
  // PM
  'wo':           MaintenanceWOPrint,
  'breakdown':    BreakdownReportPrint,
  // HCM
  'payslip':      PaySlipPrint,
  // TM
  'tripsheet':    TripSheetPrint,
  'fuellog':      FuelLogReportPrint,
}

const ALL_PRINTS = [
  { group:'SD — Sales', color:'#714B67', docs:[
    {type:'so',      label:'Sales Order'},
    {type:'invoice', label:'Tax Invoice'},
    {type:'dc',      label:'Delivery Challan'},
    {type:'quotation',label:'Quotation'},
  ]},
  { group:'MM — Purchase', color:'#1A5276', docs:[
    {type:'pr',  label:'Purchase Indent'},
    {type:'po',  label:'Purchase Order'},
    {type:'cs',  label:'Comparative Statement'},
    {type:'grn', label:'Goods Receipt Note'},
  ]},
  { group:'PP — Production', color:'#784212', docs:[
    {type:'jo',        label:'Job / Work Order'},
    {type:'bom',       label:'Bill of Materials'},
    {type:'labourcard',label:'Labour Card'},
  ]},
  { group:'WM — Warehouse', color:'#1F618D', docs:[
    {type:'stn',label:'Stock Transfer Note'},
    {type:'mis',label:'Material Issue Slip'},
  ]},
  { group:'FI — Finance', color:'#196F3D', docs:[
    {type:'pv',label:'Payment Voucher'},
    {type:'rv',label:'Receipt Voucher'},
    {type:'jv',label:'Journal Entry'},
  ]},
  { group:'QM — Quality', color:'#6C3483', docs:[
    {type:'ir', label:'Inspection Report'},
    {type:'ncr',label:'NCR'},
  ]},
  { group:'PM — Maintenance', color:'#117A65', docs:[
    {type:'wo',       label:'Maintenance Work Order'},
    {type:'breakdown',label:'Breakdown Report'},
  ]},
  { group:'HCM — HR', color:'#6C3483', docs:[
    {type:'payslip',label:'Pay Slip'},
  ]},
  { group:'TM — Transport', color:'#E06F39', docs:[
    {type:'tripsheet',label:'Trip Sheet'},
    {type:'fuellog',  label:'Fuel Log Report'},
  ]},
]

export default function PrintPreview() {
  const { type } = useParams()
  const navigate  = useNavigate()
  const onClose   = () => navigate(-1)

  const Component = type ? PRINT_MAP[type] : null

  // No type — show print menu
  if (!type || !Component) {
    return (
      <div style={{ background:'#1C1C1C', minHeight:'100vh', padding:0 }}>
        {/* Header */}
        <div style={{ background:'#714B67', padding:'14px 24px',
          display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ fontFamily:'Syne,sans-serif', fontSize:18,
            fontWeight:800, color:'#F5C518' }}>
            🖨️ LNV ERP — Print Center
          </div>
          <button onClick={() => navigate(-1)}
            style={{ padding:'7px 16px', background:'rgba(255,255,255,.15)',
              color:'#fff', border:'1px solid rgba(255,255,255,.3)', borderRadius:6,
              cursor:'pointer', fontFamily:'DM Sans,sans-serif', fontSize:12 }}>
            Close
          </button>
        </div>
        {/* Grid of all printable documents */}
        <div style={{ padding:24 }}>
          {ALL_PRINTS.map(grp => (
            <div key={grp.group} style={{ marginBottom:20 }}>
              <div style={{ fontFamily:'Syne,sans-serif', fontSize:13, fontWeight:700,
                color:'#fff', marginBottom:10, paddingBottom:6,
                borderBottom:`2px solid ${grp.color}` }}>
                {grp.group}
              </div>
              <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
                {grp.docs.map(doc => (
                  <div key={doc.type}
                    onClick={() => navigate(`/print/${doc.type}`)}
                    style={{
                      padding:'12px 18px', borderRadius:7, cursor:'pointer',
                      background:'#2C2C2C', border:`2px solid ${grp.color}44`,
                      transition:'all .15s', minWidth:160, textAlign:'center',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background=`${grp.color}33`
                      e.currentTarget.style.borderColor=grp.color
                      e.currentTarget.style.transform='translateY(-2px)'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background='#2C2C2C'
                      e.currentTarget.style.borderColor=`${grp.color}44`
                      e.currentTarget.style.transform=''
                    }}>
                    <div style={{ fontSize:24, marginBottom:6 }}>📄</div>
                    <div style={{ fontSize:12, fontWeight:600, color:'#fff' }}>
                      {doc.label}
                    </div>
                    <div style={{ fontSize:10, color:'#666', marginTop:3,
                      fontFamily:'DM Mono,monospace' }}>
                      /print/{doc.type}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <Suspense fallback={
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center',
        height:'100vh', fontFamily:'DM Sans,sans-serif', fontSize:14, color:'#555' }}>
        Loading template…
      </div>
    }>
      <Component onClose={onClose} />
    </Suspense>
  )
}
