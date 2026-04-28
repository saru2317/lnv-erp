import React, { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const hdr  = () => ({ 'Content-Type':'application/json', Authorization:`Bearer ${localStorage.getItem('lnv_token')}` })
const hdr2 = () => ({ Authorization:`Bearer ${localStorage.getItem('lnv_token')}` })
const INR  = v => '\u20b9' + parseFloat(v||0).toLocaleString('en-IN',{minimumFractionDigits:0})

const LEVEL_CFG = {
  1: { label:'Level 1 — Friendly Reminder', color:'#856404', bg:'#FFF3CD', days:'1–14 days',    icon:'\uD83D\uDCE7' },
  2: { label:'Level 2 — Second Reminder',   color:'#E06F39', bg:'#FDECEA', days:'15–29 days',   icon:'\u26A0\uFE0F' },
  3: { label:'Level 3 — Final Notice',      color:'#721C24', bg:'#F8D7DA', days:'30–59 days',   icon:'\uD83D\uDED1' },
  4: { label:'Level 4 — Legal Warning',     color:'#491010', bg:'#EDACAC', days:'60+ days',     icon:'\u2696\uFE0F' },
}

export default function DunningLetters() {
  const [data,      setData]      = useState(null)
  const [loading,   setLoading]   = useState(true)
  const [levelFilter,setLevelFilter] = useState('all')
  const [selected,  setSelected]  = useState([])  // selected invoice nos
  const [sending,   setSending]   = useState(false)
  const [sendLevel, setSendLevel] = useState(1)
  const [preview,   setPreview]   = useState(null) // preview letter
  const [viewMode,  setViewMode]  = useState('invoice') // invoice | customer

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const r = await fetch(`${BASE_URL}/fi/dunning`, { headers: hdr2() })
      const d = await r.json()
      setData(d)
    } catch { toast.error('Failed to load') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const rows       = data?.data || []
  const byCust     = data?.byCustomer || []
  const filtered   = levelFilter==='all' ? rows : rows.filter(r=>r.suggestedLevel===parseInt(levelFilter))
  const selectable = filtered.filter(r=>r.canSend)

  const toggleAll  = () => setSelected(
    selected.length === selectable.length ? [] : selectable.map(r=>r.invoiceNo)
  )
  const toggle     = inv => setSelected(s => s.includes(inv) ? s.filter(x=>x!==inv) : [...s, inv])

  const send = async () => {
    if (!selected.length) return toast.error('Select at least one invoice')
    setSending(true)
    try {
      const res = await fetch(`${BASE_URL}/fi/dunning/send`, {
        method:'POST', headers: hdr(),
        body: JSON.stringify({ invoiceNos: selected, level: sendLevel })
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error)
      toast.success(d.message)
      setSelected([]); load()
    } catch (e) { toast.error(e.message) }
    finally { setSending(false) }
  }

  const previewLetter = (row) => {
    const lc = LEVEL_CFG[row.suggestedLevel] || LEVEL_CFG[1]
    setPreview({
      ...row, lc,
      subject: {1:'Payment Reminder',2:'Second Reminder — Outstanding Payment',
        3:'FINAL NOTICE — Immediate Payment Required',4:'LEGAL ACTION WARNING'}[row.suggestedLevel],
      body: {
        1: `Dear ${row.customerName},\n\nThis is a friendly reminder that invoice ${row.invoiceNo} for ${INR(row.balance)} was due on ${row.dueDate?new Date(row.dueDate).toLocaleDateString('en-IN'):'-'}.\n\nPlease arrange payment at your earliest convenience.\n\nThank you for your business.`,
        2: `Dear ${row.customerName},\n\nDespite our earlier reminder, invoice ${row.invoiceNo} for ${INR(row.balance)} remains unpaid (${row.overdueDays} days overdue).\n\nKindly arrange immediate payment to avoid further action.\n\nRegards,\nLNV Manufacturing Pvt. Ltd.`,
        3: `Dear ${row.customerName},\n\nFINAL NOTICE: Invoice ${row.invoiceNo} for ${INR(row.balance)} is ${row.overdueDays} days overdue.\n\nIf payment is not received within 7 days, we will be forced to suspend your credit account and initiate recovery proceedings.\n\nLNV Manufacturing Pvt. Ltd.`,
        4: `Dear ${row.customerName},\n\nDespite repeated reminders, invoice ${row.invoiceNo} for ${INR(row.balance)} remains unpaid.\n\nThis is formal notice that legal proceedings will be initiated if payment is not received within 3 working days.\n\nLNV Manufacturing Pvt. Ltd. — Legal Department`,
      }[row.suggestedLevel]
    })
  }

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">Dunning Letters
          <small> Automated Overdue Payment Reminders — SAP F150</small>
        </div>
        <div className="fi-lv-actions">
          <button className="btn btn-s sd-bsm" onClick={load}>Refresh</button>
          <div style={{display:'flex',gap:4}}>
            {['invoice','customer'].map(m=>(
              <button key={m} onClick={()=>setViewMode(m)} style={{
                padding:'5px 12px',borderRadius:6,fontSize:12,fontWeight:600,cursor:'pointer',
                border:'1px solid #E0D5E0',
                background:viewMode===m?'#714B67':'#fff',
                color:viewMode===m?'#fff':'#6C757D'
              }}>{m==='invoice'?'By Invoice':'By Customer'}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Level KPIs */}
      <div className="fi-kpi-grid" style={{gridTemplateColumns:'repeat(4,1fr)',marginBottom:14}}>
        {[1,2,3,4].map(l=>{
          const lc  = LEVEL_CFG[l]
          const cnt = rows.filter(r=>r.suggestedLevel===l).length
          const amt = rows.filter(r=>r.suggestedLevel===l).reduce((a,r)=>a+r.balance,0)
          return (
            <div key={l} onClick={()=>setLevelFilter(levelFilter===String(l)?'all':String(l))}
              style={{ background:levelFilter===String(l)?lc.bg:'#fff',
                border:`2px solid ${levelFilter===String(l)?lc.color:'#E0D5E0'}`,
                borderRadius:10,padding:'12px 14px',cursor:'pointer',transition:'all .15s' }}>
              <div style={{fontSize:16,marginBottom:4}}>{lc.icon}</div>
              <div style={{fontSize:10,fontWeight:700,color:lc.color,textTransform:'uppercase',marginBottom:2}}>{lc.label}</div>
              <div style={{fontFamily:'DM Mono,monospace',fontWeight:800,fontSize:18,color:lc.color}}>{cnt}</div>
              <div style={{fontSize:11,color:'#6C757D'}}>{INR(amt)} · {lc.days}</div>
            </div>
          )
        })}
      </div>

      {/* Total overdue banner */}
      {(data?.totalOverdue||0) > 0 && (
        <div style={{background:'#FFF3CD',border:'1px solid #FFEEBA',borderRadius:8,
          padding:'10px 16px',marginBottom:14,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div style={{fontWeight:700,color:'#856404'}}>Total Overdue Amount</div>
          <div style={{fontFamily:'DM Mono,monospace',fontWeight:800,fontSize:20,color:'#856404'}}>{INR(data.totalOverdue)}</div>
        </div>
      )}

      {/* Send bar */}
      {selected.length > 0 && (
        <div style={{background:'#EDE0EA',borderRadius:8,padding:'10px 16px',marginBottom:12,
          display:'flex',alignItems:'center',gap:12}}>
          <span style={{fontSize:12,fontWeight:700,color:'#714B67'}}>{selected.length} invoice(s) selected</span>
          <select style={{padding:'4px 10px',borderRadius:6,border:'1px solid #E0D5E0',fontSize:12,cursor:'pointer'}}
            value={sendLevel} onChange={e=>setSendLevel(parseInt(e.target.value))}>
            {[1,2,3,4].map(l=><option key={l} value={l}>Level {l} — {LEVEL_CFG[l].label.split('—')[1].trim()}</option>)}
          </select>
          <button className="btn btn-p sd-bsm" disabled={sending} onClick={send}
            style={{background:'#E06F39',border:'1px solid #E06F39'}}>
            {sending?'Sending...':'\uD83D\uDCE7 Send Dunning Letter'}
          </button>
          <button className="btn btn-s sd-bsm" onClick={()=>setSelected([])}>Clear</button>
        </div>
      )}

      {/* Invoice view */}
      {viewMode==='invoice' && (
        <>
          <div style={{display:'flex',gap:8,marginBottom:12}}>
            <button onClick={()=>setLevelFilter('all')} style={{
              padding:'4px 12px',borderRadius:20,fontSize:12,fontWeight:600,cursor:'pointer',
              border:'1px solid #E0D5E0',background:levelFilter==='all'?'#714B67':'#fff',
              color:levelFilter==='all'?'#fff':'#6C757D'}}>
              All ({rows.length})
            </button>
            {[1,2,3,4].map(l=>(
              <button key={l} onClick={()=>setLevelFilter(levelFilter===String(l)?'all':String(l))} style={{
                padding:'4px 12px',borderRadius:20,fontSize:12,fontWeight:600,cursor:'pointer',
                border:`1px solid ${LEVEL_CFG[l].color}`,
                background:levelFilter===String(l)?LEVEL_CFG[l].color:'#fff',
                color:levelFilter===String(l)?'#fff':LEVEL_CFG[l].color
              }}>L{l} ({rows.filter(r=>r.suggestedLevel===l).length})</button>
            ))}
          </div>

          {loading ? <div style={{padding:30,textAlign:'center',color:'#6C757D'}}>Loading...</div> : (
            <table className="fi-data-table">
              <thead><tr>
                <th style={{width:40}}>
                  <input type="checkbox" checked={selected.length===selectable.length&&selectable.length>0}
                    onChange={toggleAll}/>
                </th>
                <th>Invoice No.</th><th>Customer</th><th>Due Date</th>
                <th style={{textAlign:'right'}}>Balance</th>
                <th style={{textAlign:'center'}}>Overdue Days</th>
                <th style={{textAlign:'center'}}>Dunning Level</th>
                <th>Last Sent</th>
                <th></th>
              </tr></thead>
              <tbody>
                {filtered.length===0 ? (
                  <tr><td colSpan={9} style={{padding:40,textAlign:'center',color:'#6C757D'}}>
                    {rows.length===0?'No overdue invoices! All payments up to date.':'No invoices match filter.'}
                  </td></tr>
                ) : filtered.map((r,i)=>{
                  const lc = LEVEL_CFG[r.suggestedLevel]||LEVEL_CFG[1]
                  return (
                    <tr key={i} style={{opacity:r.canSend?1:0.6}}>
                      <td>
                        {r.canSend && (
                          <input type="checkbox" checked={selected.includes(r.invoiceNo)}
                            onChange={()=>toggle(r.invoiceNo)}/>
                        )}
                      </td>
                      <td style={{fontFamily:'DM Mono,monospace',fontWeight:700,color:'var(--odoo-purple)',fontSize:12}}>{r.invoiceNo}</td>
                      <td style={{fontWeight:600,fontSize:12}}>{r.customerName}</td>
                      <td style={{fontSize:11,color:'#DC3545',fontWeight:700}}>
                        {r.dueDate?new Date(r.dueDate).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}):'—'}
                      </td>
                      <td style={{textAlign:'right',fontFamily:'DM Mono,monospace',fontWeight:800,color:lc.color,fontSize:13}}>{INR(r.balance)}</td>
                      <td style={{textAlign:'center'}}>
                        <span style={{fontFamily:'DM Mono,monospace',fontWeight:800,fontSize:14,
                          color:r.overdueDays>60?'#491010':r.overdueDays>30?'#721C24':r.overdueDays>14?'#E06F39':'#856404'}}>
                          {r.overdueDays}d
                        </span>
                      </td>
                      <td style={{textAlign:'center'}}>
                        <span style={{background:lc.bg,color:lc.color,padding:'2px 8px',borderRadius:10,fontSize:10,fontWeight:700}}>
                          {lc.icon} L{r.suggestedLevel}
                        </span>
                      </td>
                      <td style={{fontSize:11,color:'#6C757D'}}>
                        {r.lastDunningDate?new Date(r.lastDunningDate).toLocaleDateString('en-IN',{day:'2-digit',month:'short'}):'Never'}
                      </td>
                      <td>
                        <div style={{display:'flex',gap:3}}>
                          <button className="btn-xs" onClick={()=>previewLetter(r)}>Preview</button>
                          {r.canSend&&(
                            <button className="btn-xs" style={{background:'#FFF3CD',color:'#856404',border:'1px solid #FFEEBA'}}
                              onClick={()=>{ setSelected([r.invoiceNo]); setSendLevel(r.suggestedLevel) }}>
                              Send
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </>
      )}

      {/* Customer view */}
      {viewMode==='customer' && (
        <table className="fi-data-table">
          <thead><tr>
            <th>Customer</th><th style={{textAlign:'center'}}>Invoices</th>
            <th style={{textAlign:'right'}}>Total Balance</th>
            <th style={{textAlign:'center'}}>Max Overdue</th>
            <th style={{textAlign:'center'}}>Action Level</th>
            <th></th>
          </tr></thead>
          <tbody>
            {byCust.length===0?(
              <tr><td colSpan={6} style={{padding:40,textAlign:'center',color:'#6C757D'}}>No overdue customers</td></tr>
            ):byCust.map((c,i)=>{
              const lc = LEVEL_CFG[c.maxLevel]||LEVEL_CFG[1]
              return (
                <tr key={i}>
                  <td style={{fontWeight:700,fontSize:13}}>{c.name}</td>
                  <td style={{textAlign:'center',fontFamily:'DM Mono,monospace'}}>{c.invoices.length}</td>
                  <td style={{textAlign:'right',fontFamily:'DM Mono,monospace',fontWeight:800,color:lc.color,fontSize:14}}>{INR(c.totalBalance)}</td>
                  <td style={{textAlign:'center'}}>
                    <span style={{fontFamily:'DM Mono,monospace',fontWeight:800,color:lc.color}}>{c.maxOverdue}d</span>
                  </td>
                  <td style={{textAlign:'center'}}>
                    <span style={{background:lc.bg,color:lc.color,padding:'3px 10px',borderRadius:10,fontSize:11,fontWeight:700}}>
                      {lc.icon} {lc.label.split('—')[1].trim()}
                    </span>
                  </td>
                  <td>
                    <button className="btn-xs" style={{background:'#FFF3CD',color:'#856404',border:'1px solid #FFEEBA'}}
                      onClick={()=>{
                        const invNos = c.invoices.filter(inv=>inv.canSend).map(inv=>inv.invoiceNo)
                        setSelected(invNos); setSendLevel(c.maxLevel); setViewMode('invoice')
                      }}>
                      Select All &amp; Send
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}

      {/* Preview modal */}
      {preview && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.5)',zIndex:1000,
          display:'flex',alignItems:'center',justifyContent:'center',padding:20}}>
          <div style={{background:'#fff',borderRadius:12,width:600,maxWidth:'95vw',
            boxShadow:'0 8px 40px rgba(0,0,0,.25)',overflow:'hidden'}}>
            <div style={{background:preview.lc.bg,padding:'12px 20px',
              borderBottom:`2px solid ${preview.lc.color}`,
              display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div style={{fontWeight:800,fontSize:15,color:preview.lc.color}}>
                {preview.lc.icon} {preview.lc.label}
              </div>
              <span onClick={()=>setPreview(null)} style={{cursor:'pointer',fontSize:20,color:'#6C757D'}}>&times;</span>
            </div>
            <div style={{padding:20}}>
              <div style={{marginBottom:10}}>
                <div style={{fontSize:10,fontWeight:700,color:'#6C757D',textTransform:'uppercase',marginBottom:2}}>To</div>
                <div style={{fontSize:13,fontWeight:700}}>{preview.customerName}</div>
              </div>
              <div style={{marginBottom:14}}>
                <div style={{fontSize:10,fontWeight:700,color:'#6C757D',textTransform:'uppercase',marginBottom:2}}>Subject</div>
                <div style={{fontSize:13,fontWeight:600,color:preview.lc.color}}>{preview.subject}</div>
              </div>
              <div style={{background:'#F8F9FA',borderRadius:8,padding:14,fontSize:12,
                lineHeight:1.8,fontFamily:'Georgia,serif',whiteSpace:'pre-line',marginBottom:14}}>
                {preview.body}
              </div>
              <div style={{display:'flex',gap:8}}>
                <button className="btn btn-p sd-bsm"
                  style={{background:preview.lc.color,border:`1px solid ${preview.lc.color}`}}
                  onClick={()=>{ setSelected([preview.invoiceNo]); setSendLevel(preview.suggestedLevel); setPreview(null) }}>
                  Send This Letter
                </button>
                <button className="btn btn-s sd-bsm" onClick={()=>setPreview(null)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
