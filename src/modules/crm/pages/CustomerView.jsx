import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const hdr2 = () => ({ Authorization:`Bearer ${localStorage.getItem('lnv_token')}` })
const fmt  = n => n ? `₹${parseFloat(n).toLocaleString('en-IN',{maximumFractionDigits:0})}` : '₹0'
const fmtD = d => d ? new Date(d).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}) : '—'

const STAGE_CLR = {
  Won:'#D4EDDA', Lost:'#F8D7DA', New:'#E3F2FD',
  'Requirement Understanding':'#FFF3E0','Proposal Sent':'#E8F5E9','Negotiation':'#F3E5F5'
}
const STAGE_TXT = {
  Won:'#155724', Lost:'#721C24', New:'#1565C0',
  'Requirement Understanding':'#E65100','Proposal Sent':'#2E7D32','Negotiation':'#6A1B9A'
}

export default function CustomerView() {
  const nav = useNavigate()
  const { id } = useParams()
  const [cust,   setCust]   = useState(null)
  const [opps,   setOpps]   = useState([])
  const [quotes, setQuotes] = useState([])
  const [invoices,setInvoices]=useState([])
  const [loading, setLoading]= useState(true)
  const [tab,    setTab]    = useState('overview')

  useEffect(() => {
    if (!id) return
    setLoading(true)
    // Load customer detail (includes invoices from SD)
    fetch(`${BASE_URL}/sd/customers/${id}`, { headers:hdr2() })
      .then(r=>r.json())
      .then(d=>{
        setCust(d.data||d)
        setInvoices(d.invoices||[])
      }).catch(()=>toast.error('Failed to load customer'))

    // Load opportunities for this specific customer
    fetch(`${BASE_URL}/crm/opportunities?customerId=${id}&limit=50`, { headers:hdr2() })
      .then(r=>r.json()).then(d=>setOpps(d.data||[])).catch(()=>{})

    // Load ALL quotations for this customer (both CRM and SD)
    fetch(`${BASE_URL}/sd/quotations?customerId=${id}&limit=50`, { headers:hdr2() })
      .then(r=>r.json()).then(d=>{
        const sdQuotes = d.data||[]
        // Also load CRM quotations
        fetch(`${BASE_URL}/crm/quotations?customerId=${id}&limit=50`, { headers:hdr2() })
          .then(r=>r.json()).then(d2=>{
            const crmQuotes = (d2.data||[]).map(q=>({...q, _source:'CRM'}))
            setQuotes([...sdQuotes, ...crmQuotes].sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)))
          }).catch(()=>setQuotes(sdQuotes))
      }).catch(()=>{})

    setLoading(false)
  }, [id])

  if (loading || !cust) return <div style={{padding:40,textAlign:'center',color:'#6C757D'}}>Loading customer…</div>

  const contacts    = Array.isArray(cust.contacts) ? cust.contacts : []
  const totalBiz    = invoices.reduce((s,i)=>s+parseFloat(i.grandTotal||0),0)
  const outstanding = invoices.filter(i=>i.status!=='PAID').reduce((s,i)=>s+parseFloat(i.grandTotal||0),0)
  const wonOpps     = opps.filter(o=>o.stage==='Won').reduce((s,o)=>s+parseFloat(o.dealValue||0),0)

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">
          <button style={{background:'none',border:'none',cursor:'pointer',color:'#714B67',marginRight:6}}
            onClick={()=>nav('/crm/customers')}>← Customers</button>
          {cust.name}
          <span style={{marginLeft:8,fontSize:11,background:'#EDE0EA',color:'#714B67',
            padding:'2px 8px',borderRadius:6,fontWeight:700}}>{cust.code}</span>
        </div>
        <div className="fi-lv-actions">
          <button className="btn btn-s sd-bsm"
            onClick={()=>nav(`/crm/opportunities/new?customerId=${cust.id}&customerName=${encodeURIComponent(cust.name)}`)}>
            + New Opportunity
          </button>
          <button className="btn btn-p btn-s"
            onClick={()=>nav(`/crm/quotations/new?customerId=${cust.id}&customerName=${encodeURIComponent(cust.name)}`)}>
            + New Quotation
          </button>
        </div>
      </div>

      {/* Profile Header */}
      <div className="fi-panel" style={{marginBottom:14}}>
        <div className="fi-panel-body">
          <div style={{display:'flex',gap:16,alignItems:'center'}}>
            <div style={{width:60,height:60,borderRadius:'50%',background:'#714B67',flexShrink:0,
              display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:20,fontWeight:800}}>
              {cust.name.split(' ').map(w=>w[0]).slice(0,2).join('')}
            </div>
            <div style={{flex:1}}>
              <div style={{fontSize:20,fontWeight:800,fontFamily:'Syne,sans-serif',color:'#714B67'}}>{cust.name}</div>
              <div style={{fontSize:12,color:'#6C757D',marginTop:2}}>
                {cust.city||''}{cust.state?`, ${cust.state}`:''} · {cust.phone||''} · {cust.email||''}
              </div>
              {cust.gstin&&<div style={{fontSize:11,fontFamily:'DM Mono,monospace',color:'#1A5276',marginTop:2}}>GSTIN: {cust.gstin}</div>}
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:16,textAlign:'center'}}>
              {[
                ['Total Business',  fmt(totalBiz),    '#2E7D32'],
                ['Outstanding',     fmt(outstanding),  '#C62828'],
                ['Won Deals',       fmt(wonOpps),      '#714B67'],
                ['Credit Limit',    fmt(cust.creditLimit),'#1565C0'],
              ].map(([l,v,c])=>(
                <div key={l}>
                  <div style={{fontSize:16,fontWeight:800,fontFamily:'Syne,sans-serif',color:c}}>{v}</div>
                  <div style={{fontSize:10,color:'#6C757D',fontWeight:700,textTransform:'uppercase'}}>{l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{display:'flex',gap:0,marginBottom:14,borderBottom:'2px solid var(--odoo-border)'}}>
        {[['overview','Overview'],['opportunities',`Opportunities (${opps.length})`],
          ['quotations',`Quotations (${quotes.length})`],['contacts',`Contacts (${contacts.length})`],
          ['invoices',`Invoices (${invoices.length})`]].map(([k,l])=>(
          <button key={k} onClick={()=>setTab(k)}
            style={{padding:'8px 16px',border:'none',cursor:'pointer',fontSize:12,fontWeight:700,
              borderBottom:tab===k?'2px solid #714B67':'2px solid transparent',
              background:'none',color:tab===k?'#714B67':'#6C757D',marginBottom:-2}}>
            {l}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW ── */}
      {tab==='overview' && (
        <div style={{display:'grid',gridTemplateColumns:'2fr 1fr',gap:14}}>
          <div className="fi-panel">
            <div className="fi-panel-hdr"><h3>Company Details</h3></div>
            <div className="fi-panel-body">
              <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:8}}>
                {[
                  ['Customer Code', cust.code],
                  ['Type',          `Type ${cust.type||'B'}`],
                  ['City',          cust.city||'—'],
                  ['State',         cust.state||'—'],
                  ['Pincode',       cust.pincode||'—'],
                  ['Phone',         cust.phone||'—'],
                  ['Email',         cust.email||'—'],
                  ['GSTIN',         cust.gstin||'—'],
                  ['Credit Limit',  fmt(cust.creditLimit)],
                  ['Address',       cust.address||'—'],
                ].map(([k,v])=>(
                  <div key={k} style={{padding:'8px 10px',background:'#F8F9FA',borderRadius:6}}>
                    <div style={{fontSize:10,color:'#6C757D',fontWeight:700,textTransform:'uppercase',marginBottom:2}}>{k}</div>
                    <div style={{fontSize:12,fontWeight:600}}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div>
            {/* Recent invoices summary */}
            <div className="fi-panel" style={{marginBottom:14}}>
              <div className="fi-panel-hdr"><h3>Recent Invoices</h3></div>
              <div className="fi-panel-body">
                {invoices.slice(0,5).length===0?(
                  <div style={{fontSize:12,color:'#6C757D',textAlign:'center',padding:16}}>No invoices yet</div>
                ):invoices.slice(0,5).map(inv=>(
                  <div key={inv.invoiceNo} style={{display:'flex',justifyContent:'space-between',
                    padding:'6px 0',borderBottom:'1px solid #F0EEEB',fontSize:12}}>
                    <div>
                      <div style={{fontWeight:700,color:'#714B67'}}>{inv.invoiceNo}</div>
                      <div style={{fontSize:10,color:'#6C757D'}}>{fmtD(inv.date)}</div>
                    </div>
                    <div style={{textAlign:'right'}}>
                      <div style={{fontWeight:700}}>{fmt(inv.grandTotal)}</div>
                      <span style={{fontSize:10,padding:'1px 6px',borderRadius:4,
                        background:inv.status==='PAID'?'#D4EDDA':'#FFF3CD',
                        color:inv.status==='PAID'?'#155724':'#856404'}}>{inv.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── OPPORTUNITIES ── */}
      {tab==='opportunities' && (
        <div>
          <div style={{marginBottom:10,display:'flex',justifyContent:'flex-end'}}>
            <button className="btn btn-p btn-s"
              onClick={()=>nav(`/crm/opportunities/new?customerId=${cust.id}&customerName=${encodeURIComponent(cust.name)}`)}>
              + New Opportunity
            </button>
          </div>
          <div style={{background:'#fff',borderRadius:8,border:'1px solid var(--odoo-border)',overflow:'hidden'}}>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead>
                <tr style={{background:'#714B67'}}>
                  {['Lead No','Company','Requirements','Deal Value','Stage','Assigned To','Expected Close'].map(h=>(
                    <th key={h} style={{padding:'10px 12px',textAlign:'left',fontSize:11,fontWeight:700,color:'#fff',textTransform:'uppercase'}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {opps.length===0?(
                  <tr><td colSpan={7} style={{padding:30,textAlign:'center',color:'#6C757D'}}>
                    No opportunities yet — <span style={{color:'#714B67',cursor:'pointer',fontWeight:700}}
                      onClick={()=>nav(`/crm/opportunities/new?customerId=${cust.id}&customerName=${encodeURIComponent(cust.name)}`)}>
                      + Create one
                    </span>
                  </td></tr>
                ):opps.map((o,i)=>(
                  <tr key={o.id} onClick={()=>nav(`/crm/leads/${o.id}`)}
                    style={{borderBottom:'1px solid #F0EEEB',background:i%2===0?'#fff':'#FAFAFA',cursor:'pointer'}}
                    onMouseEnter={e=>e.currentTarget.style.background='#EDE0EA'}
                    onMouseLeave={e=>e.currentTarget.style.background=i%2===0?'#fff':'#FAFAFA'}>
                    <td style={{padding:'10px 12px'}}>
                      <code style={{fontWeight:700,color:'#714B67',fontSize:11}}>{o.leadNo}</code>
                    </td>
                    <td style={{padding:'10px 12px',fontSize:12,fontWeight:600}}>{o.companyName}</td>
                    <td style={{padding:'10px 12px',fontSize:11,color:'#6C757D',maxWidth:200}}>{(o.requirements||'—').slice(0,60)}</td>
                    <td style={{padding:'10px 12px',fontWeight:700,color:'#2E7D32',fontSize:12}}>{fmt(o.dealValue)}</td>
                    <td style={{padding:'10px 12px'}}>
                      <span style={{padding:'2px 8px',borderRadius:6,fontSize:11,fontWeight:700,
                        background:STAGE_CLR[o.stage]||'#F0EEEB',color:STAGE_TXT[o.stage]||'#1C1C1C'}}>
                        {o.stage}
                      </span>
                    </td>
                    <td style={{padding:'10px 12px',fontSize:11}}>{o.assignedTo||'—'}</td>
                    <td style={{padding:'10px 12px',fontSize:11}}>{fmtD(o.expectedCloseDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── QUOTATIONS ── */}
      {tab==='quotations' && (
        <div>
          <div style={{marginBottom:10,display:'flex',justifyContent:'flex-end'}}>
            <button className="btn btn-p btn-s"
              onClick={()=>nav(`/crm/quotations/new?customerId=${cust.id}&customerName=${encodeURIComponent(cust.name)}`)}>
              + New Quotation
            </button>
          </div>
          <div style={{background:'#fff',borderRadius:8,border:'1px solid var(--odoo-border)',overflow:'hidden'}}>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead>
                <tr style={{background:'#714B67'}}>
                  {['Quotation No','Customer','Amount','Valid Till','Status','Date',''].map(h=>(
                    <th key={h} style={{padding:'10px 12px',textAlign:'left',fontSize:11,fontWeight:700,color:'#fff',textTransform:'uppercase'}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {quotes.length===0?(
                  <tr><td colSpan={7} style={{padding:30,textAlign:'center',color:'#6C757D'}}>
                    No quotations yet — <span style={{color:'#714B67',cursor:'pointer',fontWeight:700}}
                      onClick={()=>nav(`/crm/quotations/new?customerId=${cust.id}&customerName=${encodeURIComponent(cust.name)}`)}>
                      + Create one
                    </span>
                  </td></tr>
                ):quotes.map((q,i)=>(
                  <tr key={q.id} onClick={()=>nav(q.source==='SD' ? `/sd/quotations/${q.id}` : `/crm/quotations/${q.id}`)}
                    style={{borderBottom:'1px solid #F0EEEB',background:i%2===0?'#fff':'#FAFAFA',cursor:'pointer'}}
                    onMouseEnter={e=>e.currentTarget.style.background='#EDE0EA'}
                    onMouseLeave={e=>e.currentTarget.style.background=i%2===0?'#fff':'#FAFAFA'}>
                    <td style={{padding:'10px 12px'}}>
                      <div style={{display:'flex',alignItems:'center',gap:6}}>
                        <code style={{fontWeight:700,color:'#714B67',fontSize:11}}>{q.quotNo||q.quotationNo}</code>
                        <span style={{fontSize:9,padding:'1px 5px',borderRadius:3,fontWeight:700,
                          background:q.source==='SD'?'#E3F2FD':'#EDE0EA',
                          color:q.source==='SD'?'#1565C0':'#714B67'}}>
                          {q.source||'CRM'}
                        </span>
                      </div>
                    </td>
                    <td style={{padding:'10px 12px',fontSize:12,fontWeight:600}}>{q.customerName}</td>
                    <td style={{padding:'10px 12px',fontWeight:700,fontSize:12}}>{fmt(q.totalAmount||q.grandTotal)}</td>
                    <td style={{padding:'10px 12px',fontSize:11}}>{fmtD(q.validTill)}</td>
                    <td style={{padding:'10px 12px'}}>
                      <span style={{padding:'2px 8px',borderRadius:6,fontSize:11,fontWeight:700,
                        background:q.status==='APPROVED'?'#D4EDDA':q.status==='REJECTED'?'#F8D7DA':'#FFF3CD',
                        color:q.status==='APPROVED'?'#155724':q.status==='REJECTED'?'#721C24':'#856404'}}>
                        {q.status}
                      </span>
                    </td>
                    <td style={{padding:'10px 12px',fontSize:11}}>{fmtD(q.date||q.createdAt)}</td>
                    <td style={{padding:'10px 12px'}}>
                      <button onClick={e=>{e.stopPropagation();nav(q.source==='SD'?`/sd/quotations/${q.id}`:`/crm/quotations/${q.id}`)}}
                        style={{padding:'3px 10px',borderRadius:5,border:'1px solid var(--odoo-border)',background:'#fff',fontSize:11,cursor:'pointer'}}>
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── CONTACTS ── */}
      {tab==='contacts' && (
        <div style={{background:'#fff',borderRadius:8,border:'1px solid var(--odoo-border)',overflow:'hidden'}}>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead>
              <tr style={{background:'#714B67'}}>
                {['Name','Designation','Phone','Mobile','Email','Department'].map(h=>(
                  <th key={h} style={{padding:'10px 12px',textAlign:'left',fontSize:11,fontWeight:700,color:'#fff',textTransform:'uppercase'}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {contacts.length===0?(
                <tr><td colSpan={6} style={{padding:30,textAlign:'center',color:'#6C757D'}}>
                  No contacts — add them in MDM → Customer Master
                </td></tr>
              ):contacts.map((c,i)=>(
                <tr key={i} style={{borderBottom:'1px solid #F0EEEB',background:i%2===0?'#fff':'#FAFAFA'}}>
                  <td style={{padding:'10px 12px',fontWeight:700,fontSize:12}}>{c.name||c.contactName||'—'}</td>
                  <td style={{padding:'10px 12px',fontSize:11,color:'#6C757D'}}>{c.designation||'—'}</td>
                  <td style={{padding:'10px 12px',fontSize:11,fontFamily:'DM Mono,monospace'}}>{c.phone||'—'}</td>
                  <td style={{padding:'10px 12px',fontSize:11,fontFamily:'DM Mono,monospace'}}>{c.mobile||'—'}</td>
                  <td style={{padding:'10px 12px',fontSize:11}}>{c.email||'—'}</td>
                  <td style={{padding:'10px 12px',fontSize:11,color:'#6C757D'}}>{c.department||'—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── INVOICES ── */}
      {tab==='invoices' && (
        <div style={{background:'#fff',borderRadius:8,border:'1px solid var(--odoo-border)',overflow:'hidden'}}>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead>
              <tr style={{background:'#714B67'}}>
                {['Invoice No','Date','Amount','Due Date','Status'].map(h=>(
                  <th key={h} style={{padding:'10px 12px',textAlign:'left',fontSize:11,fontWeight:700,color:'#fff',textTransform:'uppercase'}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {invoices.length===0?(
                <tr><td colSpan={5} style={{padding:30,textAlign:'center',color:'#6C757D'}}>No invoices found</td></tr>
              ):invoices.map((inv,i)=>(
                <tr key={inv.invoiceNo} onClick={()=>nav(`/sd/invoices/${inv.id||inv.invoiceNo}`)}
                  style={{borderBottom:'1px solid #F0EEEB',background:i%2===0?'#fff':'#FAFAFA',cursor:'pointer'}}
                  onMouseEnter={e=>e.currentTarget.style.background='#EDE0EA'}
                  onMouseLeave={e=>e.currentTarget.style.background=i%2===0?'#fff':'#FAFAFA'}>
                  <td style={{padding:'10px 12px'}}>
                    <code style={{fontWeight:700,color:'#714B67',fontSize:11}}>{inv.invoiceNo}</code>
                  </td>
                  <td style={{padding:'10px 12px',fontSize:11}}>{fmtD(inv.date)}</td>
                  <td style={{padding:'10px 12px',fontWeight:700,fontSize:12}}>{fmt(inv.grandTotal)}</td>
                  <td style={{padding:'10px 12px',fontSize:11}}>{fmtD(inv.dueDate)}</td>
                  <td style={{padding:'10px 12px'}}>
                    <span style={{padding:'2px 8px',borderRadius:6,fontSize:11,fontWeight:700,
                      background:inv.status==='PAID'?'#D4EDDA':inv.status==='OVERDUE'?'#F8D7DA':'#FFF3CD',
                      color:inv.status==='PAID'?'#155724':inv.status==='OVERDUE'?'#721C24':'#856404'}}>
                      {inv.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
