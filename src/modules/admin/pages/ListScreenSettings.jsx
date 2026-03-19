import React, { useState } from 'react'
import toast from 'react-hot-toast'

// ── Master config for all list screens ──────────────────
export const LIST_SCREEN_CONFIG = {
  'SD-SOList': {
    label: 'Sales Orders List', module: 'SD', route: '/sd/orders',
    allFields: [
      { id:'soNo',       label:'SO Number',     default:true,  fixed:true  },
      { id:'date',       label:'Date',           default:true,  fixed:false },
      { id:'customer',   label:'Customer',       default:true,  fixed:false },
      { id:'items',      label:'Items',          default:true,  fixed:false },
      { id:'taxable',    label:'Taxable Amount', default:true,  fixed:false },
      { id:'gst',        label:'GST',            default:true,  fixed:false },
      { id:'total',      label:'Total Amount',   default:true,  fixed:false },
      { id:'status',     label:'Status',         default:true,  fixed:false },
      { id:'delivDate',  label:'Delivery Date',  default:false, fixed:false },
      { id:'salesExec',  label:'Sales Executive',default:false, fixed:false },
      { id:'soRef',      label:'SO Reference',   default:false, fixed:false },
      { id:'payTerms',   label:'Payment Terms',  default:false, fixed:false },
      { id:'shipTo',     label:'Ship To',        default:false, fixed:false },
    ]
  },
  'SD-InvoiceList': {
    label: 'Invoices List', module: 'SD', route: '/sd/invoices',
    allFields: [
      { id:'invNo',      label:'Invoice Number', default:true,  fixed:true  },
      { id:'date',       label:'Date',           default:true,  fixed:false },
      { id:'customer',   label:'Customer',       default:true,  fixed:false },
      { id:'soRef',      label:'SO Reference',   default:false, fixed:false },
      { id:'taxable',    label:'Taxable',        default:true,  fixed:false },
      { id:'gst',        label:'GST',            default:false, fixed:false },
      { id:'total',      label:'Total',          default:true,  fixed:false },
      { id:'dueDate',    label:'Due Date',       default:false, fixed:false },
      { id:'status',     label:'Status',         default:true,  fixed:false },
      { id:'irn',        label:'IRN / E-Invoice',default:false, fixed:false },
      { id:'ewb',        label:'E-Way Bill',     default:false, fixed:false },
    ]
  },
  'SD-QuotList': {
    label: 'Quotations List', module: 'SD', route: '/sd/quotations',
    allFields: [
      { id:'quotNo',     label:'Quotation #',    default:true,  fixed:true  },
      { id:'date',       label:'Date',           default:true,  fixed:false },
      { id:'validTill',  label:'Valid Till',     default:true,  fixed:false },
      { id:'customer',   label:'Customer',       default:true,  fixed:false },
      { id:'amount',     label:'Amount',         default:true,  fixed:false },
      { id:'status',     label:'Status',         default:true,  fixed:false },
      { id:'salesExec',  label:'Sales Exec',     default:false, fixed:false },
      { id:'cancelReason',label:'Cancel Reason', default:false, fixed:false },
    ]
  },
  'MM-POList': {
    label: 'Purchase Orders List', module: 'MM', route: '/mm/po',
    allFields: [
      { id:'poNo',       label:'PO Number',      default:true,  fixed:true  },
      { id:'date',       label:'Date',           default:true,  fixed:false },
      { id:'vendor',     label:'Vendor',         default:true,  fixed:false },
      { id:'items',      label:'Items',          default:false, fixed:false },
      { id:'taxable',    label:'Taxable',        default:false, fixed:false },
      { id:'gst',        label:'GST',            default:false, fixed:false },
      { id:'total',      label:'Total',          default:true,  fixed:false },
      { id:'delivDate',  label:'Delivery Date',  default:false, fixed:false },
      { id:'status',     label:'Status',         default:true,  fixed:false },
      { id:'prRef',      label:'PR Reference',   default:false, fixed:false },
      { id:'payTerms',   label:'Payment Terms',  default:false, fixed:false },
      { id:'approvedBy', label:'Approved By',    default:false, fixed:false },
    ]
  },
  'MM-PRList': {
    label: 'Purchase Indents List', module: 'MM', route: '/mm/pr',
    allFields: [
      { id:'prNo',       label:'PR Number',      default:true,  fixed:true  },
      { id:'date',       label:'Date',           default:true,  fixed:false },
      { id:'dept',       label:'Department',     default:true,  fixed:false },
      { id:'items',      label:'Items',          default:true,  fixed:false },
      { id:'priority',   label:'Priority',       default:true,  fixed:false },
      { id:'csReqd',     label:'CS Required',    default:false, fixed:false },
      { id:'status',     label:'Status',         default:true,  fixed:false },
      { id:'reqBy',      label:'Required By',    default:false, fixed:false },
      { id:'approvedBy', label:'Approved By',    default:false, fixed:false },
    ]
  },
  'PP-WOList': {
    label: 'Work Orders List', module: 'PP', route: '/pp/wo',
    allFields: [
      { id:'woNo',       label:'WO Number',      default:true,  fixed:true  },
      { id:'date',       label:'Date',           default:true,  fixed:false },
      { id:'product',    label:'Product',        default:true,  fixed:false },
      { id:'qty',        label:'Quantity',       default:true,  fixed:false },
      { id:'startDate',  label:'Start Date',     default:false, fixed:false },
      { id:'endDate',    label:'End Date',       default:false, fixed:false },
      { id:'machine',    label:'Machine',        default:false, fixed:false },
      { id:'status',     label:'Status',         default:true,  fixed:false },
      { id:'soRef',      label:'SO Reference',   default:false, fixed:false },
      { id:'supervisor', label:'Supervisor',     default:false, fixed:false },
    ]
  },
  'QM-InspectionList': {
    label: 'Inspections List', module: 'QM', route: '/qm/inspections',
    allFields: [
      { id:'irNo',       label:'IR Number',      default:true,  fixed:true  },
      { id:'date',       label:'Date',           default:true,  fixed:false },
      { id:'type',       label:'Inspection Type',default:true,  fixed:false },
      { id:'product',    label:'Product',        default:true,  fixed:false },
      { id:'qty',        label:'Qty',            default:false, fixed:false },
      { id:'result',     label:'Result',         default:true,  fixed:false },
      { id:'inspector',  label:'Inspector',      default:false, fixed:false },
      { id:'status',     label:'Status',         default:true,  fixed:false },
      { id:'ppm',        label:'PPM',            default:false, fixed:false },
    ]
  },
  'FI-JVList': {
    label: 'Journal Vouchers List', module: 'FI', route: '/fi/jv',
    allFields: [
      { id:'jvNo',       label:'JV Number',      default:true,  fixed:true  },
      { id:'date',       label:'Date',           default:true,  fixed:false },
      { id:'narration',  label:'Narration',      default:true,  fixed:false },
      { id:'debit',      label:'Debit',          default:true,  fixed:false },
      { id:'credit',     label:'Credit',         default:true,  fixed:false },
      { id:'status',     label:'Status',         default:true,  fixed:false },
      { id:'createdBy',  label:'Created By',     default:false, fixed:false },
      { id:'approvedBy', label:'Approved By',    default:false, fixed:false },
    ]
  },
  'HCM-EmployeeList': {
    label: 'Employee List', module: 'HCM', route: '/hcm/employees',
    allFields: [
      { id:'empCode',    label:'Emp Code',       default:true,  fixed:true  },
      { id:'name',       label:'Name',           default:true,  fixed:false },
      { id:'dept',       label:'Department',     default:true,  fixed:false },
      { id:'designation',label:'Designation',    default:true,  fixed:false },
      { id:'mobile',     label:'Mobile',         default:false, fixed:false },
      { id:'email',      label:'Email',          default:false, fixed:false },
      { id:'doj',        label:'Date of Joining',default:false, fixed:false },
      { id:'status',     label:'Status',         default:true,  fixed:false },
      { id:'salary',     label:'Salary',         default:false, fixed:false },
      { id:'pfNo',       label:'PF Number',      default:false, fixed:false },
    ]
  },
}

const MODULE_COLORS = {
  SD:'#714B67', MM:'#1A5276', PP:'#784212', QM:'#6C3483',
  FI:'#196F3D', HCM:'#6C3483', WM:'#1F618D', PM:'#117A65',
}

// Persist config in localStorage
const STORAGE_KEY = 'lnv_list_settings'
const getSavedConfig = () => {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}') } catch { return {} }
}
const saveConfig = cfg => {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg)) } catch {}
}

export default function ListScreenSettings() {
  const saved  = getSavedConfig()
  const [configs, setConfigs] = useState(() => {
    const c = {}
    Object.entries(LIST_SCREEN_CONFIG).forEach(([key, cfg]) => {
      c[key] = saved[key] || cfg.allFields.filter(f=>f.default).map(f=>f.id)
    })
    return c
  })
  const [selected, setSelected] = useState(Object.keys(LIST_SCREEN_CONFIG)[0])
  const [search,   setSearch]   = useState('')

  const current    = LIST_SCREEN_CONFIG[selected]
  const activeFields = configs[selected] || []

  const toggle = (fieldId, isFixed) => {
    if (isFixed) return toast.error('This field is fixed and cannot be removed')
    setConfigs(c => {
      const curr = c[selected] || []
      const next = curr.includes(fieldId)
        ? curr.filter(f => f !== fieldId)
        : [...curr, fieldId]
      return { ...c, [selected]: next }
    })
  }

  const moveUp = (fieldId) => {
    setConfigs(c => {
      const arr  = [...(c[selected]||[])]
      const idx  = arr.indexOf(fieldId)
      if (idx > 0) { [arr[idx-1],arr[idx]] = [arr[idx],arr[idx-1]] }
      return { ...c, [selected]: arr }
    })
  }

  const moveDown = (fieldId) => {
    setConfigs(c => {
      const arr  = [...(c[selected]||[])]
      const idx  = arr.indexOf(fieldId)
      if (idx < arr.length-1) { [arr[idx],arr[idx+1]] = [arr[idx+1],arr[idx]] }
      return { ...c, [selected]: arr }
    })
  }

  const resetDefault = () => {
    setConfigs(c => ({
      ...c,
      [selected]: LIST_SCREEN_CONFIG[selected].allFields.filter(f=>f.default).map(f=>f.id)
    }))
    toast.success('Reset to default columns')
  }

  const saveAll = () => {
    saveConfig(configs)
    toast.success('List screen settings saved! Changes apply immediately.')
  }

  const filteredScreens = Object.entries(LIST_SCREEN_CONFIG).filter(([key, cfg]) =>
    cfg.label.toLowerCase().includes(search.toLowerCase()) ||
    cfg.module.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">
          List Screen Settings
          <small>Configure columns displayed in each list screen · Admin only</small>
        </div>
        <div className="fi-lv-actions">
          <button className="btn btn-s sd-bsm" onClick={resetDefault}>Reset Default</button>
          <button className="btn btn-p" onClick={saveAll}>Save All Settings</button>
        </div>
      </div>

      <div style={{padding:'10px 14px',background:'#FFF8E1',border:'1px solid #F5C518',
        borderRadius:6,marginBottom:16,fontSize:12,color:'#856404'}}>
        <strong>Admin Only</strong> — Configure which columns appear in each list screen.
        Changes apply immediately for all users. Fixed columns (marked with lock) cannot be removed.
        Use drag order to reorder columns.
      </div>

      <div style={{display:'grid',gridTemplateColumns:'260px 1fr',gap:16,alignItems:'start'}}>

        {/* Left: Screen selector */}
        <div style={{background:'#fff',border:'1px solid var(--odoo-border)',
          borderRadius:8,overflow:'hidden',boxShadow:'0 1px 4px rgba(0,0,0,.06)'}}>
          <div style={{padding:'10px 14px',background:'var(--odoo-purple)',
            color:'#fff',fontSize:12,fontWeight:700}}>
            List Screens ({Object.keys(LIST_SCREEN_CONFIG).length})
          </div>
          <div style={{padding:'8px'}}>
            <input placeholder="Search screens..."
              value={search} onChange={e=>setSearch(e.target.value)}
              style={{width:'100%',padding:'6px 10px',border:'1px solid var(--odoo-border)',
                borderRadius:5,fontSize:12,outline:'none',marginBottom:8}}/>
          </div>
          {filteredScreens.map(([key, cfg]) => {
            const mc = MODULE_COLORS[cfg.module]||'#555'
            const active = configs[key]?.length || 0
            const total  = cfg.allFields.length
            return (
              <div key={key} onClick={() => setSelected(key)}
                style={{padding:'10px 14px',cursor:'pointer',
                  background:selected===key?'var(--odoo-purple-lt)':'#fff',
                  borderLeft:selected===key?`3px solid var(--odoo-purple)`:'3px solid transparent',
                  borderBottom:'1px solid var(--odoo-border)',
                  transition:'all .15s'}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <div>
                    <span style={{padding:'2px 7px',borderRadius:5,fontSize:10,fontWeight:700,
                      background:mc,color:'#fff',marginRight:6}}>{cfg.module}</span>
                    <span style={{fontSize:12,fontWeight:600,
                      color:selected===key?'var(--odoo-purple)':'var(--odoo-dark)'}}>{cfg.label}</span>
                  </div>
                  <span style={{fontSize:10,color:'var(--odoo-gray)',
                    fontFamily:'DM Mono,monospace'}}>{active}/{total}</span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Right: Field config */}
        <div style={{background:'#fff',border:'1px solid var(--odoo-border)',
          borderRadius:8,overflow:'hidden',boxShadow:'0 1px 4px rgba(0,0,0,.06)'}}>
          <div style={{padding:'12px 16px',background:'var(--odoo-bg)',
            borderBottom:'1px solid var(--odoo-border)',
            display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div>
              <span style={{padding:'2px 8px',borderRadius:5,fontSize:11,fontWeight:700,
                background:MODULE_COLORS[current.module]||'#555',color:'#fff',marginRight:8}}>
                {current.module}
              </span>
              <span style={{fontWeight:700,fontSize:14,color:'var(--odoo-dark)'}}>
                {current.label}
              </span>
            </div>
            <div style={{fontSize:12,color:'var(--odoo-gray)'}}>
              <span style={{fontWeight:700,color:'var(--odoo-purple)'}}>
                {activeFields.length}
              </span> of {current.allFields.length} fields active
            </div>
          </div>

          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:0}}>
            {/* All available fields */}
            <div style={{borderRight:'1px solid var(--odoo-border)'}}>
              <div style={{padding:'8px 14px',background:'#F8F9FA',
                borderBottom:'1px solid var(--odoo-border)',
                fontSize:11,fontWeight:700,color:'var(--odoo-gray)',textTransform:'uppercase',letterSpacing:.5}}>
                All Available Fields
              </div>
              {current.allFields.map(field => {
                const isActive = activeFields.includes(field.id)
                return (
                  <div key={field.id}
                    style={{padding:'9px 14px',borderBottom:'1px solid var(--odoo-border)',
                      display:'flex',alignItems:'center',gap:10,
                      background:isActive?'var(--odoo-purple-lt)':'#fff',
                      transition:'all .15s'}}>
                    <input type="checkbox"
                      checked={isActive}
                      onChange={() => toggle(field.id, field.fixed)}
                      disabled={field.fixed}
                      style={{width:14,height:14,accentColor:'var(--odoo-purple)',cursor:field.fixed?'not-allowed':'pointer'}}/>
                    <span style={{fontSize:12,fontWeight:isActive?600:400,
                      color:isActive?'var(--odoo-purple)':'var(--odoo-dark)',flex:1}}>
                      {field.label}
                    </span>
                    {field.fixed && (
                      <span title="Fixed column — cannot be removed"
                        style={{fontSize:10,color:'#F5C518',background:'#FFF8E1',
                          padding:'1px 5px',borderRadius:4,border:'1px solid #F5C518'}}>
                        Fixed
                      </span>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Active columns in order */}
            <div>
              <div style={{padding:'8px 14px',background:'#F8F9FA',
                borderBottom:'1px solid var(--odoo-border)',
                fontSize:11,fontWeight:700,color:'var(--odoo-gray)',textTransform:'uppercase',letterSpacing:.5}}>
                Active Columns (in order)
              </div>
              {activeFields.map((fieldId, idx) => {
                const field = current.allFields.find(f=>f.id===fieldId)
                if (!field) return null
                return (
                  <div key={fieldId}
                    style={{padding:'9px 14px',borderBottom:'1px solid var(--odoo-border)',
                      display:'flex',alignItems:'center',gap:8,
                      background:'#fff',transition:'all .15s'}}>
                    {/* Order number */}
                    <span style={{width:20,height:20,borderRadius:'50%',
                      background:'var(--odoo-purple)',color:'#fff',
                      display:'flex',alignItems:'center',justifyContent:'center',
                      fontSize:10,fontWeight:700,flexShrink:0}}>
                      {idx+1}
                    </span>
                    <span style={{fontSize:12,fontWeight:600,color:'var(--odoo-dark)',flex:1}}>
                      {field.label}
                    </span>
                    {/* Move up/down */}
                    <div style={{display:'flex',gap:3}}>
                      <button onClick={() => moveUp(fieldId)} disabled={idx===0}
                        style={{padding:'2px 6px',fontSize:11,border:'1px solid var(--odoo-border)',
                          borderRadius:4,background:'#fff',cursor:idx===0?'not-allowed':'pointer',
                          color:idx===0?'#ccc':'var(--odoo-gray)'}}>
                        ↑
                      </button>
                      <button onClick={() => moveDown(fieldId)} disabled={idx===activeFields.length-1}
                        style={{padding:'2px 6px',fontSize:11,border:'1px solid var(--odoo-border)',
                          borderRadius:4,background:'#fff',cursor:idx===activeFields.length-1?'not-allowed':'pointer',
                          color:idx===activeFields.length-1?'#ccc':'var(--odoo-gray)'}}>
                        ↓
                      </button>
                      {!field.fixed && (
                        <button onClick={() => toggle(fieldId, false)}
                          style={{padding:'2px 6px',fontSize:11,border:'1px solid var(--odoo-red)',
                            borderRadius:4,background:'#FFF5F5',cursor:'pointer',
                            color:'var(--odoo-red)'}}>
                          ×
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
              {activeFields.length === 0 && (
                <div style={{padding:'20px',textAlign:'center',color:'var(--odoo-gray)',fontSize:12}}>
                  No active columns. Select fields from the left.
                </div>
              )}
            </div>
          </div>

          {/* Preview */}
          <div style={{padding:'12px 16px',background:'var(--odoo-bg)',
            borderTop:'1px solid var(--odoo-border)'}}>
            <div style={{fontSize:11,fontWeight:700,color:'var(--odoo-gray)',
              textTransform:'uppercase',letterSpacing:.5,marginBottom:8}}>
              Column Preview
            </div>
            <div style={{overflowX:'auto'}}>
              <table style={{borderCollapse:'collapse',fontSize:11}}>
                <thead>
                  <tr>
                    {activeFields.map(fid => {
                      const f = current.allFields.find(x=>x.id===fid)
                      return (
                        <th key={fid} style={{padding:'5px 12px',background:'var(--odoo-purple)',
                          color:'#fff',fontWeight:600,whiteSpace:'nowrap',borderRight:'1px solid rgba(255,255,255,.2)'}}>
                          {f?.label}
                        </th>
                      )
                    })}
                    <th style={{padding:'5px 12px',background:'var(--odoo-purple)',color:'#fff',fontWeight:600}}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    {activeFields.map(fid => (
                      <td key={fid} style={{padding:'5px 12px',borderBottom:'1px solid var(--odoo-border)',
                        color:'var(--odoo-gray)',fontSize:10,fontStyle:'italic',whiteSpace:'nowrap'}}>
                        —
                      </td>
                    ))}
                    <td style={{padding:'5px 12px',borderBottom:'1px solid var(--odoo-border)'}}>
                      <span style={{padding:'2px 6px',borderRadius:4,fontSize:10,
                        background:'var(--odoo-purple-lt)',color:'var(--odoo-purple)',fontWeight:600}}>View</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Save button bottom */}
      <div style={{marginTop:16,display:'flex',gap:10,justifyContent:'flex-end'}}>
        <button className="btn btn-s" onClick={resetDefault}>Reset This Screen</button>
        <button className="btn btn-p" onClick={saveAll}>Save All Settings</button>
      </div>
    </div>
  )
}
