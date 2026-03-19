import React, { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import Badge from '@components/ui/Badge'
import toast from 'react-hot-toast'

const STATES = [
  {name:'Tamil Nadu',code:'33'},{name:'Karnataka',code:'29'},
  {name:'Maharashtra',code:'27'},{name:'Andhra Pradesh',code:'37'},
  {name:'Telangana',code:'36'},{name:'Gujarat',code:'24'},
  {name:'Rajasthan',code:'08'},{name:'Delhi',code:'07'},
  {name:'Kerala',code:'32'},{name:'Other',code:'99'},
]

// Sample full customer data
const CUSTOMER_DATA = {
  id:'C-001', code:'C-001',
  name:'Sri Lakshmi Mills Pvt Ltd', type:'Manufacturing',
  mobile:'9876543210', email:'accounts@srilakshmi.com', website:'www.srilakshmi.com',
  salesExec:'Admin', jobWork:false, status:'active',
  gstin:'33AABCS1429B1Z5', pan:'AABCS1429B', gstType:'Regular',
  currency:'INR — Indian Rupee', priceList:'Standard Price List',
  creditLimit:'500000', creditDays:'30', paymentTerms:'Net 30',
  billAddrs:[{
    label:'Head Office', attn:'Mr. Rajan', addr1:'14, Industrial Area',
    addr2:'Near SIDCO Gate', city:'Coimbatore', district:'Coimbatore',
    state:'Tamil Nadu', stateCode:'33', pincode:'641021',
    gstin:'', phone:'0422-2345678', isPrimary:true,
  }],
  shipAddrs:[{
    label:'Factory / Plant 1', attn:'Mr. Suresh', addr1:'Plot 14, SIDCO Estate',
    addr2:'', city:'Coimbatore', district:'Coimbatore',
    state:'Tamil Nadu', stateCode:'33', pincode:'641021',
    gstin:'', phone:'9876543210', isDefault:true,
  }],
}

const TXNS = [
  {doc:'INV-0124', type:'Invoice',     amount:'₹3,91,780', status:'paid'      },
  {doc:'SO-0124',  type:'Sales Order', amount:'₹3,91,780', status:'confirmed' },
  {doc:'PMT-0041', type:'Payment',     amount:'₹3,91,780', status:'paid'      },
]

export default function CustomerView() {
  const navigate    = useNavigate()
  const [params]    = useSearchParams()
  const [editMode,  setEditMode]  = useState(params.get('edit') === 'true')
  const [activeTab, setActiveTab] = useState('basic')
  const [activeBill,setActiveBill]= useState(0)
  const [activeShip,setActiveShip]= useState(0)

  const [form, setForm]     = useState({...CUSTOMER_DATA})
  const [billAddrs, setBill]= useState(CUSTOMER_DATA.billAddrs)
  const [shipAddrs, setShip]= useState(CUSTOMER_DATA.shipAddrs)

  const F = f => ({ value:form[f]||'', onChange:e=>setForm(p=>({...p,[f]:e.target.value})) })
  const setBillF = (i,f,v) => setBill(bs=>bs.map((b,bi)=>bi===i?{...b,[f]:v}:b))
  const setShipF = (i,f,v) => setShip(ss=>ss.map((s,si)=>si===i?{...s,[f]:v}:s))
  const stateCode = s => STATES.find(x=>x.name===s)?.code||'99'

  const addBill = () => { setBill(bs=>[...bs,{label:`Branch ${bs.length+1}`,attn:'',addr1:'',addr2:'',city:'',district:'',state:'Tamil Nadu',stateCode:'33',pincode:'',gstin:'',phone:'',isPrimary:false}]); setActiveBill(billAddrs.length) }
  const addShip = () => { setShip(ss=>[...ss,{label:`Plant ${ss.length+1}`,attn:'',addr1:'',addr2:'',city:'',district:'',state:'Tamil Nadu',stateCode:'33',pincode:'',gstin:'',phone:'',isDefault:false}]); setActiveShip(shipAddrs.length) }

  const saveEdit = () => {
    setForm(p => ({...p, billAddrs, shipAddrs}))
    toast.success('Customer updated successfully!')
    setEditMode(false)
  }

  const toggleStatus = () => {
    const next = form.status==='inactive' ? 'active' : 'inactive'
    setForm(p => ({...p, status:next}))
    toast.success(`Customer marked as ${next.charAt(0).toUpperCase()+next.slice(1)}`)
  }

  const TABS = [
    {id:'basic',   label:'Basic Info'},
    {id:'gst',     label:'GST & Tax'},
    {id:'billing', label:`Bill To (${billAddrs.length})`},
    {id:'shipping',label:`Ship To (${shipAddrs.length})`},
    {id:'credit',  label:'Credit & Payment'},
  ]

  const statusColor = {
    active:  {bg:'#D4EDDA',c:'#155724'},
    inactive:{bg:'#F5F5F5',c:'#666'},
    overdue: {bg:'#F8D7DA',c:'#721C24'},
    blocked: {bg:'#F8D7DA',c:'#721C24'},
  }[form.status] || {bg:'#eee',c:'#555'}

  // ── VIEW MODE ──
  if (!editMode) {
    return (
      <div>
        <div className="lv-hdr">
          <div className="lv-ttl">{form.name} <small>{form.id} · Profile</small></div>
          <div className="lv-acts">
            <button className="btn btn-s" onClick={() => navigate('/sd/customers')}>Back</button>
            <button className="btn btn-s" onClick={() => { setEditMode(true); setActiveTab('basic') }}
              style={{border:'1px solid #714B67',color:'#714B67',background:'#EDE0EA'}}>
              Edit
            </button>
            <button style={{padding:'6px 14px',fontSize:'12px',fontWeight:'700',borderRadius:'6px',
              border:'none',cursor:'pointer',
              background:form.status==='inactive'?'#00A09D':'#6C757D',color:'#fff'}}
              onClick={toggleStatus}>
              {form.status==='inactive'?'Activate':'Deactivate'}
            </button>
            <button className="btn btn-p" onClick={() => navigate('/sd/invoices/new')}>New Invoice</button>
            <button className="btn btn-s" onClick={() => navigate('/sd/orders/new')}>New Order</button>
          </div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
          <div className="sd-fc">
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
              <div className="sd-stt" style={{marginBottom:0}}>Customer Info</div>
              <span style={{padding:'3px 12px',borderRadius:10,fontSize:11,fontWeight:700,
                background:statusColor.bg,color:statusColor.c}}>
                {form.status.toUpperCase()}
              </span>
            </div>
            <table style={{width:'100%',fontSize:'12px'}}>
              <tbody>
                {[
                  ['Customer Code',   form.code],
                  ['Customer Type',   form.type],
                  ['GSTIN',           form.gstin],
                  ['PAN',             form.pan],
                  ['Mobile',          form.mobile],
                  ['Email',           form.email],
                  ['Website',         form.website||'—'],
                  ['GST Type',        form.gstType],
                  ['Credit Limit',    '₹'+Number(form.creditLimit||0).toLocaleString('en-IN')],
                  ['Credit Days',     form.creditDays+' days'],
                  ['Payment Terms',   form.paymentTerms],
                  ['Outstanding',     '₹3,91,680'],
                  ['Price List',      form.priceList],
                  ['Sales Executive', form.salesExec],
                  ['Job Work Cust.',  form.jobWork?'Yes':'No'],
                ].map(([k,v])=>(
                  <tr key={k} style={{borderBottom:'1px solid #F0EEEB'}}>
                    <td style={{padding:'6px 4px',color:'#6C757D',width:'45%',fontWeight:500}}>{k}</td>
                    <td style={{padding:'6px 4px',fontWeight:600,fontFamily:['GSTIN','PAN'].includes(k)?'DM Mono,monospace':'inherit'}}>{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {/* Bill To summary */}
            <div style={{marginTop:12}}>
              <div className="sd-stt" style={{marginBottom:6}}>Bill To Addresses</div>
              {billAddrs.map((b,i)=>(
                <div key={i} style={{padding:'7px 10px',background:'#F8F3F7',borderRadius:5,
                  border:'1px solid #EDE0EA',marginBottom:6,fontSize:11}}>
                  <div style={{fontWeight:700,color:'#714B67',marginBottom:2}}>
                    {b.label} {b.isPrimary&&<span style={{background:'#F5C518',color:'#1C1C1C',padding:'1px 6px',borderRadius:8,fontSize:9,fontWeight:700}}>PRIMARY</span>}
                  </div>
                  <div style={{color:'#555'}}>{b.addr1}{b.addr2?', '+b.addr2:''}, {b.city} — {b.pincode}</div>
                  {b.phone&&<div style={{color:'#888'}}>{b.phone}</div>}
                </div>
              ))}
            </div>
            {/* Ship To summary */}
            <div style={{marginTop:8}}>
              <div className="sd-stt" style={{marginBottom:6}}>Ship To Addresses</div>
              {shipAddrs.map((s,i)=>(
                <div key={i} style={{padding:'7px 10px',background:'#E6F7F7',borderRadius:5,
                  border:'1px solid #B8EBEA',marginBottom:6,fontSize:11}}>
                  <div style={{fontWeight:700,color:'#00A09D',marginBottom:2}}>
                    {s.label} {s.isDefault&&<span style={{background:'#F5C518',color:'#1C1C1C',padding:'1px 6px',borderRadius:8,fontSize:9,fontWeight:700}}>DEFAULT</span>}
                  </div>
                  <div style={{color:'#555'}}>{s.addr1}, {s.city} — {s.pincode}</div>
                  {s.attn&&<div style={{color:'#888'}}>Contact: {s.attn}</div>}
                </div>
              ))}
            </div>
          </div>
          <div className="sd-fc">
            <div className="sd-stt">Transaction Summary</div>
            <table className="sd-tbl">
              <thead><tr><th>DOC #</th><th>TYPE</th><th>AMOUNT</th><th>STATUS</th></tr></thead>
              <tbody>
                {TXNS.map(t=>(
                  <tr key={t.doc}>
                    <td style={{fontFamily:'DM Mono,monospace',fontWeight:700,color:'#714B67'}}>{t.doc}</td>
                    <td>{t.type}</td>
                    <td><strong>{t.amount}</strong></td>
                    <td><Badge status={t.status}>{t.status.toUpperCase()}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )
  }

  // ── EDIT MODE — Full form like CustomerNew ──
  return (
    <div>
      <div className="lv-hdr">
        <div className="lv-ttl">{form.name} <small>{form.id} · Edit</small></div>
        <div className="lv-acts">
          <button className="btn btn-s" onClick={() => setEditMode(false)}>Cancel</button>
          <button className="btn btn-p" onClick={saveEdit}>Save Changes</button>
        </div>
      </div>

      <div className="sd-fc">
        {/* Status flow */}
        <div className="sd-fsb">
          {['Draft','Active','Blocked'].map((s,i)=>(
            <div key={s} className={`sd-ss ${s.toLowerCase()===form.status?'act':''}`}>
              <div className="sd-sd"></div>{s}
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{display:'flex',gap:0,borderBottom:'2px solid var(--odoo-border)',marginBottom:16,overflowX:'auto'}}>
          {TABS.map(t=>(
            <button key={t.id} onClick={()=>setActiveTab(t.id)}
              style={{padding:'9px 18px',fontSize:12,fontWeight:600,cursor:'pointer',
                border:'none',background:'transparent',whiteSpace:'nowrap',
                borderBottom:activeTab===t.id?'2px solid var(--odoo-purple)':'2px solid transparent',
                color:activeTab===t.id?'var(--odoo-purple)':'var(--odoo-gray)',marginBottom:-2}}>
              {t.label}
            </button>
          ))}
        </div>

        {/* BASIC INFO */}
        {activeTab==='basic'&&(
          <div className="sd-sec">
            <div className="sd-stt">Basic Information</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'10px 16px'}}>
              <div className="sd-fg"><label>Customer Name <span className="req">*</span></label><input className="sd-fi" {...F('name')}/></div>
              <div className="sd-fg"><label>Customer Code</label><input className="sd-fi" value={form.code} disabled/></div>
              <div className="sd-fg"><label>Customer Type</label>
                <select className="sd-fis" {...F('type')}>
                  <option>Manufacturing</option><option>Trading</option><option>Textile</option><option>Auto Components</option><option>Retail</option><option>Government</option>
                </select>
              </div>
              <div className="sd-fg"><label>Mobile <span className="req">*</span></label><input className="sd-fi" {...F('mobile')}/></div>
              <div className="sd-fg"><label>Email</label><input className="sd-fi" {...F('email')}/></div>
              <div className="sd-fg"><label>Website</label><input className="sd-fi" {...F('website')}/></div>
              <div className="sd-fg"><label>Sales Executive</label>
                <select className="sd-fis" {...F('salesExec')}>
                  <option>Admin</option><option>Sales Team 1</option><option>Sales Team 2</option>
                </select>
              </div>
              <div className="sd-fg"><label>Status</label>
                <select className="sd-fis" {...F('status')}>
                  <option value="active">Active</option><option value="inactive">Inactive</option><option value="blocked">Blocked</option>
                </select>
              </div>
            </div>
            <div style={{marginTop:14,padding:'10px 14px',background:'#FFF8F0',border:'1px solid #F5C518',borderRadius:6}}>
              <label style={{display:'flex',alignItems:'center',gap:10,cursor:'pointer',fontSize:13}}>
                <input type="checkbox" checked={form.jobWork||false}
                  onChange={e=>setForm(p=>({...p,jobWork:e.target.checked}))}
                  style={{width:16,height:16,accentColor:'var(--odoo-purple)'}}/>
                <div>
                  <div style={{fontWeight:700}}>Job Work / Labour Process Customer</div>
                  <div style={{fontSize:11,color:'var(--odoo-gray)',marginTop:2}}>Enable if customer sends raw material for processing</div>
                </div>
              </label>
            </div>
          </div>
        )}

        {/* GST */}
        {activeTab==='gst'&&(
          <div className="sd-sec">
            <div className="sd-stt">GST & Tax Information</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'10px 16px'}}>
              <div className="sd-fg"><label>GSTIN <span className="req">*</span></label><input className="sd-fi" {...F('gstin')} style={{fontFamily:'DM Mono,monospace',letterSpacing:1}}/></div>
              <div className="sd-fg"><label>PAN Number</label><input className="sd-fi" {...F('pan')} style={{fontFamily:'DM Mono,monospace',letterSpacing:1}}/></div>
              <div className="sd-fg"><label>GST Registration Type</label>
                <select className="sd-fis" {...F('gstType')}>
                  <option>Regular</option><option>Composition</option><option>Unregistered / Consumer</option><option>SEZ Unit</option><option>Deemed Export</option>
                </select>
              </div>
              <div className="sd-fg"><label>Currency</label>
                <select className="sd-fis" {...F('currency')}>
                  <option>INR — Indian Rupee</option><option>USD — US Dollar</option><option>EUR — Euro</option>
                </select>
              </div>
              <div className="sd-fg"><label>Price List</label>
                <select className="sd-fis" {...F('priceList')}>
                  <option>Standard Price List</option><option>Wholesale Price List</option><option>Special Rate</option><option>Export Price List</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* BILL TO */}
        {activeTab==='billing'&&(
          <div>
            <div style={{display:'flex',gap:8,marginBottom:14,flexWrap:'wrap',alignItems:'center'}}>
              {billAddrs.map((b,i)=>(
                <button key={i} onClick={()=>setActiveBill(i)}
                  style={{padding:'6px 14px',borderRadius:20,fontSize:12,fontWeight:600,cursor:'pointer',
                    border:'1px solid var(--odoo-border)',
                    background:activeBill===i?'var(--odoo-purple)':'#fff',
                    color:activeBill===i?'#fff':'var(--odoo-gray)',
                    display:'flex',alignItems:'center',gap:6}}>
                  {b.isPrimary&&<span style={{fontSize:9,background:'#F5C518',color:'#1C1C1C',padding:'1px 5px',borderRadius:8,fontWeight:700}}>PRIMARY</span>}
                  {b.label||`Bill To ${i+1}`}
                </button>
              ))}
              <button onClick={addBill}
                style={{padding:'6px 14px',borderRadius:20,fontSize:12,fontWeight:600,cursor:'pointer',
                  border:'1px dashed var(--odoo-purple)',background:'var(--odoo-purple-lt)',color:'var(--odoo-purple)'}}>
                + Add Bill To
              </button>
            </div>
            {billAddrs.map((b,i)=>i!==activeBill?null:(
              <div key={i} className="sd-sec">
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'10px 16px'}}>
                  <div className="sd-fg"><label>Address Label</label><input className="sd-fi" placeholder="e.g. Head Office" value={b.label} onChange={e=>setBillF(i,'label',e.target.value)}/></div>
                  <div className="sd-fg"><label>Attention / Contact</label><input className="sd-fi" placeholder="Mr. Rajan" value={b.attn} onChange={e=>setBillF(i,'attn',e.target.value)}/></div>
                  <div className="sd-fg"><label>Phone</label><input className="sd-fi" value={b.phone} onChange={e=>setBillF(i,'phone',e.target.value)}/></div>
                  <div className="sd-fg" style={{gridColumn:'1 / -1'}}><label>Address Line 1 <span className="req">*</span></label><input className="sd-fi" placeholder="Door No, Street" value={b.addr1} onChange={e=>setBillF(i,'addr1',e.target.value)}/></div>
                  <div className="sd-fg" style={{gridColumn:'1 / -1'}}><label>Address Line 2</label><input className="sd-fi" placeholder="Landmark" value={b.addr2} onChange={e=>setBillF(i,'addr2',e.target.value)}/></div>
                  <div className="sd-fg"><label>City <span className="req">*</span></label><input className="sd-fi" value={b.city} onChange={e=>setBillF(i,'city',e.target.value)}/></div>
                  <div className="sd-fg"><label>District</label><input className="sd-fi" value={b.district} onChange={e=>setBillF(i,'district',e.target.value)}/></div>
                  <div className="sd-fg"><label>PIN Code</label><input className="sd-fi" maxLength={6} value={b.pincode} onChange={e=>setBillF(i,'pincode',e.target.value)} style={{fontFamily:'DM Mono,monospace'}}/></div>
                  <div className="sd-fg"><label>State <span className="req">*</span></label>
                    <select className="sd-fis" value={b.state} onChange={e=>{setBillF(i,'state',e.target.value);setBillF(i,'stateCode',stateCode(e.target.value))}}>
                      {STATES.map(s=><option key={s.name}>{s.name}</option>)}
                    </select>
                  </div>
                  <div className="sd-fg"><label>State Code</label><input className="sd-fi" value={b.stateCode} disabled style={{fontFamily:'DM Mono,monospace'}}/></div>
                  <div className="sd-fg"><label>GSTIN (if different)</label><input className="sd-fi" placeholder="Branch GSTIN" value={b.gstin} onChange={e=>setBillF(i,'gstin',e.target.value)} style={{fontFamily:'DM Mono,monospace'}}/></div>
                </div>
                <div style={{display:'flex',gap:8,marginTop:10}}>
                  {!b.isPrimary&&<button onClick={()=>setBill(bs=>bs.map((x,xi)=>({...x,isPrimary:xi===i})))}
                    style={{padding:'4px 12px',fontSize:11,fontWeight:600,borderRadius:6,border:'1px solid #F5C518',background:'#FFF8E1',color:'#856404',cursor:'pointer'}}>Set as Primary</button>}
                  {billAddrs.length>1&&<button onClick={()=>{setBill(bs=>bs.filter((_,bi)=>bi!==i));setActiveBill(0)}}
                    style={{padding:'4px 12px',fontSize:11,fontWeight:600,borderRadius:6,border:'1px solid var(--odoo-red)',background:'#FFF5F5',color:'var(--odoo-red)',cursor:'pointer'}}>Remove</button>}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* SHIP TO */}
        {activeTab==='shipping'&&(
          <div>
            <div style={{padding:'8px 12px',background:'#E6F7F7',border:'1px solid #00A09D',borderRadius:6,marginBottom:12,fontSize:12,color:'#005A58'}}>
              Multiple Ship To addresses — used in Sales Orders and Job Work delivery
            </div>
            <div style={{display:'flex',gap:8,marginBottom:14,flexWrap:'wrap',alignItems:'center'}}>
              {shipAddrs.map((s,i)=>(
                <button key={i} onClick={()=>setActiveShip(i)}
                  style={{padding:'6px 14px',borderRadius:20,fontSize:12,fontWeight:600,cursor:'pointer',
                    border:'1px solid var(--odoo-border)',
                    background:activeShip===i?'#00A09D':'#fff',
                    color:activeShip===i?'#fff':'var(--odoo-gray)',
                    display:'flex',alignItems:'center',gap:6}}>
                  {s.isDefault&&<span style={{fontSize:9,background:'#F5C518',color:'#1C1C1C',padding:'1px 5px',borderRadius:8,fontWeight:700}}>DEFAULT</span>}
                  {s.label||`Ship To ${i+1}`}
                </button>
              ))}
              <button onClick={addShip}
                style={{padding:'6px 14px',borderRadius:20,fontSize:12,fontWeight:600,cursor:'pointer',
                  border:'1px dashed #00A09D',background:'#E6F7F7',color:'#00A09D'}}>
                + Add Ship To
              </button>
            </div>
            {shipAddrs.map((s,i)=>i!==activeShip?null:(
              <div key={i} className="sd-sec">
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'10px 16px'}}>
                  <div className="sd-fg"><label>Location Label <span className="req">*</span></label><input className="sd-fi" placeholder="Plant 1 / Factory" value={s.label} onChange={e=>setShipF(i,'label',e.target.value)}/></div>
                  <div className="sd-fg"><label>Contact Person</label><input className="sd-fi" placeholder="Store In-Charge" value={s.attn} onChange={e=>setShipF(i,'attn',e.target.value)}/></div>
                  <div className="sd-fg"><label>Phone</label><input className="sd-fi" value={s.phone} onChange={e=>setShipF(i,'phone',e.target.value)}/></div>
                  <div className="sd-fg" style={{gridColumn:'1 / -1'}}><label>Address Line 1 <span className="req">*</span></label><input className="sd-fi" placeholder="Plot No, Industrial Area" value={s.addr1} onChange={e=>setShipF(i,'addr1',e.target.value)}/></div>
                  <div className="sd-fg" style={{gridColumn:'1 / -1'}}><label>Address Line 2</label><input className="sd-fi" placeholder="Landmark" value={s.addr2} onChange={e=>setShipF(i,'addr2',e.target.value)}/></div>
                  <div className="sd-fg"><label>City <span className="req">*</span></label><input className="sd-fi" value={s.city} onChange={e=>setShipF(i,'city',e.target.value)}/></div>
                  <div className="sd-fg"><label>District</label><input className="sd-fi" value={s.district} onChange={e=>setShipF(i,'district',e.target.value)}/></div>
                  <div className="sd-fg"><label>PIN Code</label><input className="sd-fi" maxLength={6} value={s.pincode} onChange={e=>setShipF(i,'pincode',e.target.value)} style={{fontFamily:'DM Mono,monospace'}}/></div>
                  <div className="sd-fg"><label>State</label>
                    <select className="sd-fis" value={s.state} onChange={e=>{setShipF(i,'state',e.target.value);setShipF(i,'stateCode',stateCode(e.target.value))}}>
                      {STATES.map(st=><option key={st.name}>{st.name}</option>)}
                    </select>
                  </div>
                  <div className="sd-fg"><label>State Code</label><input className="sd-fi" value={s.stateCode} disabled style={{fontFamily:'DM Mono,monospace'}}/></div>
                  <div className="sd-fg"><label>GSTIN (if different)</label><input className="sd-fi" value={s.gstin} onChange={e=>setShipF(i,'gstin',e.target.value)} style={{fontFamily:'DM Mono,monospace'}}/></div>
                </div>
                <div style={{display:'flex',gap:8,marginTop:10}}>
                  {!s.isDefault&&<button onClick={()=>setShip(ss=>ss.map((x,xi)=>({...x,isDefault:xi===i})))}
                    style={{padding:'4px 12px',fontSize:11,fontWeight:600,borderRadius:6,border:'1px solid #F5C518',background:'#FFF8E1',color:'#856404',cursor:'pointer'}}>Set as Default</button>}
                  {shipAddrs.length>1&&<button onClick={()=>{setShip(ss=>ss.filter((_,si)=>si!==i));setActiveShip(0)}}
                    style={{padding:'4px 12px',fontSize:11,fontWeight:600,borderRadius:6,border:'1px solid var(--odoo-red)',background:'#FFF5F5',color:'var(--odoo-red)',cursor:'pointer'}}>Remove</button>}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* CREDIT */}
        {activeTab==='credit'&&(
          <div className="sd-sec">
            <div className="sd-stt">Credit & Payment Terms</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'10px 16px'}}>
              <div className="sd-fg"><label>Credit Limit (Rs.)</label><input className="sd-fi" type="number" {...F('creditLimit')}/></div>
              <div className="sd-fg"><label>Credit Days</label><input className="sd-fi" type="number" {...F('creditDays')}/></div>
              <div className="sd-fg"><label>Payment Terms</label>
                <select className="sd-fis" {...F('paymentTerms')}>
                  <option>Immediate</option><option>Advance</option><option>Net 15</option><option>Net 30</option><option>Net 45</option><option>Net 60</option><option>Net 90</option>
                </select>
              </div>
              <div className="sd-fg"><label>Currency</label>
                <select className="sd-fis" {...F('currency')}>
                  <option>INR — Indian Rupee</option><option>USD</option><option>EUR</option>
                </select>
              </div>
              <div className="sd-fg"><label>Price List</label>
                <select className="sd-fis" {...F('priceList')}>
                  <option>Standard Price List</option><option>Wholesale Price List</option><option>Special Rate</option><option>Export Price List</option>
                </select>
              </div>
              <div className="sd-fg"><label>Sales Executive</label>
                <select className="sd-fis" {...F('salesExec')}>
                  <option>Admin</option><option>Sales Team 1</option><option>Sales Team 2</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Bottom save */}
        <div style={{display:'flex',gap:10,padding:'14px 0',borderTop:'1px solid var(--odoo-border)',marginTop:16}}>
          <button className="btn btn-p" onClick={saveEdit}>Save Changes</button>
          <button className="btn btn-s" onClick={()=>setEditMode(false)}>Cancel</button>
        </div>
      </div>
    </div>
  )
}
