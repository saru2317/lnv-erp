import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const DEPARTMENTS = ['Production','Maintenance','Quality','Admin','Stores','HR','Finance','IT']
const PRIORITIES  = ['Normal','Urgent','Low']
const UOM_LIST    = ['Nos','Kg','Ltrs','Mtrs','Box','Set','Pair','Roll','Sheet','Pack']

const EMPTY_ITEM  = { desc:'', spec:'', uom:'Nos', qty:'', estRate:'', purpose:'', vendorSug:'', budgetCode:'' }

export default function PRNew() {
  const nav = useNavigate()
  const [prNo]         = useState('PR-2026-0042')
  const [date, setDate]= useState(new Date().toISOString().split('T')[0])
  const [dept, setDept]= useState('Production')
  const [reqBy, setReqBy] = useState('')
  const [authBy, setAuthBy]= useState('')
  const [reqDate, setReqDate]= useState('')
  const [priority, setPriority]= useState('Normal')
  const [csReqd, setCsReqd]= useState(true)
  const [remarks, setRemarks]= useState('')
  const [items, setItems]= useState([{...EMPTY_ITEM},{...EMPTY_ITEM},{...EMPTY_ITEM}])
  const [saved, setSaved]= useState(false)

  const updateItem = (i, field, val) => {
    const copy = [...items]
    copy[i] = {...copy[i], [field]: val}
    setItems(copy)
  }
  const addItem    = () => setItems([...items, {...EMPTY_ITEM}])
  const removeItem = i  => setItems(items.filter((_,idx)=>idx!==i))

  const handleSave = () => {
    setSaved(true)
    setTimeout(()=>{ if(csReqd) nav('/mm/cs/new'); else nav('/mm/pr'); }, 1200)
  }

  const inp = {
    padding:'7px 10px', border:'1.5px solid var(--odoo-border)', borderRadius:5,
    fontFamily:'DM Sans,sans-serif', fontSize:12, color:'var(--odoo-dark)',
    outline:'none', background:'#fff', width:'100%', boxSizing:'border-box',
  }
  const lbl = { fontSize:11, fontWeight:700, color:'var(--odoo-gray)',
    textTransform:'uppercase', letterSpacing:.5, marginBottom:4, display:'block' }

  return (
    <div style={{maxWidth:1200}}>
      {/* Header */}
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">New Purchase Indent <small>{prNo}</small></div>
        <div className="fi-lv-actions">
          <button className="btn btn-s sd-bsm" onClick={()=>nav('/mm/pr')}>← Back</button>
          <button className="btn btn-s sd-bsm">🖨️ Print</button>
          <button className="btn btn-p sd-bsm" onClick={handleSave}>
            {saved ? '✅ Saved!' : '💾 Save & Submit'}
          </button>
        </div>
      </div>

      {saved && (
        <div style={{background:'#D4EDDA',border:'1px solid #C3E6CB',borderRadius:6,
          padding:'10px 16px',marginBottom:16,fontSize:13,color:'#155724',fontWeight:600}}>
          ✅ PR {prNo} saved! {csReqd ? 'Redirecting to Comparative Statement entry…' : 'Redirecting to PR list…'}
        </div>
      )}

      {/* Form header */}
      <div style={{background:'#fff',borderRadius:8,border:'1px solid var(--odoo-border)',
        padding:20,marginBottom:16,boxShadow:'0 1px 4px rgba(0,0,0,.06)'}}>

        {/* Company banner */}
        <div style={{background:'linear-gradient(135deg,#4A3050,#714B67)',borderRadius:6,
          padding:'12px 20px',marginBottom:20,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div>
            <div style={{fontFamily:'Syne,sans-serif',fontSize:16,fontWeight:800,color:'#F5C518'}}>P C S</div>
            <div style={{fontSize:11,color:'rgba(255,255,255,.7)',marginTop:2}}>Auto Coats · Purchase Department</div>
          </div>
          <div style={{textAlign:'center'}}>
            <div style={{fontFamily:'Syne,sans-serif',fontSize:14,fontWeight:700,color:'#fff'}}>PURCHASE INDENT</div>
            <div style={{fontFamily:'Syne,sans-serif',fontSize:13,fontWeight:600,color:'#F5C518'}}>{prNo}</div>
          </div>
          <div style={{textAlign:'right',fontSize:11,color:'rgba(255,255,255,.7)'}}>
            <div>Date: <strong style={{color:'#fff'}}>{date}</strong></div>
          </div>
        </div>

        {/* Fields grid */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:14,marginBottom:16}}>
          {[
            ['PR No.',       prNo,    null,         false],
            ['Date',         date,    setDate,      true, 'date'],
            ['Department',   dept,    null,         true, 'select', DEPARTMENTS],
            ['Priority',     priority,setPriority,  true, 'select', PRIORITIES],
            ['Requested By', reqBy,   setReqBy,     true],
            ['Required By Date', reqDate, setReqDate, true, 'date'],
            ['Authorised By',authBy,  setAuthBy,    true],
          ].map(([label, val, setter, editable, type, opts])=>(
            <div key={label}>
              <label style={lbl}>{label}</label>
              {!editable
                ? <div style={{...inp, background:'#F8F9FA', color:'var(--odoo-purple)', fontWeight:700}}>{val}</div>
                : type==='select'
                  ? <select style={inp} value={val} onChange={e=>setter(e.target.value)}>
                      {opts.map(o=><option key={o}>{o}</option>)}
                    </select>
                  : <input style={inp} type={type||'text'} value={val} onChange={e=>setter(e.target.value)} />
              }
            </div>
          ))}
          {/* CS Required toggle */}
          <div>
            <label style={lbl}>Comparative Statement?</label>
            <div style={{display:'flex',gap:8,marginTop:4}}>
              {[true,false].map(v=>(
                <div key={String(v)} onClick={()=>setCsReqd(v)}
                  style={{flex:1,padding:'7px',textAlign:'center',borderRadius:5,cursor:'pointer',
                    fontWeight:700,fontSize:12,transition:'all .15s',
                    background: csReqd===v ? (v?'#EDE0EA':'#D4EDDA') : '#F8F9FA',
                    color: csReqd===v ? (v?'var(--odoo-purple)':'#155724') : 'var(--odoo-gray)',
                    border:`1.5px solid ${csReqd===v?(v?'var(--odoo-purple)':'#C3E6CB'):'var(--odoo-border)'}`}}>
                  {v ? '📊 Yes — CS Required' : '📋 No — Direct PO'}
                </div>
              ))}
            </div>
          </div>
        </div>

        {csReqd && (
          <div style={{background:'#EDE0EA',border:'1px solid var(--odoo-border)',borderRadius:6,
            padding:'8px 14px',fontSize:12,color:'var(--odoo-purple)',fontWeight:600,marginBottom:14}}>
            📊 Comparative Statement workflow will be triggered after saving this PR.
            Purchase team must collect quotes from minimum 3 vendors before HOD approval.
          </div>
        )}

        {/* Items table */}
        <div style={{fontFamily:'Syne,sans-serif',fontSize:13,fontWeight:700,color:'var(--odoo-dark)',
          marginBottom:12,paddingBottom:8,borderBottom:'2px solid var(--odoo-border)',
          display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <span>📦 Item Details</span>
          <button onClick={addItem}
            style={{padding:'4px 12px',borderRadius:5,fontSize:11,fontWeight:700,
              background:'var(--odoo-purple)',color:'#fff',border:'none',cursor:'pointer'}}>
            + Add Row
          </button>
        </div>

        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse',minWidth:900}}>
            <thead>
              <tr>
                {['S.No','Item Description','Specification','UOM','Qty Required',
                  'Purpose / Remarks','Est. Rate (₹)','Budget Code','Vendor Suggestion',''].map(h=>(
                  <th key={h} style={{padding:'8px 10px',background:'var(--odoo-purple)',
                    color:'#fff',fontSize:11,fontWeight:700,textAlign:'center',
                    border:'1px solid rgba(255,255,255,.2)',whiteSpace:'nowrap'}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx)=>(
                <tr key={idx} style={{background:idx%2===0?'#fff':'#F8F9FA'}}>
                  <td style={{padding:'6px 10px',textAlign:'center',fontWeight:700,
                    color:'var(--odoo-gray)',border:'1px solid var(--odoo-border)',width:40}}>{idx+1}</td>
                  {[
                    ['desc','text',220,'Item name (e.g. Battery 12V 65AH)'],
                    ['spec','text',120,'Brand / Make'],
                    ['uom','select',70,null],
                    ['qty','number',70,'0'],
                    ['purpose','text',160,'Reason for purchase'],
                    ['estRate','number',90,'0.00'],
                    ['budgetCode','text',90,'Budget code'],
                    ['vendorSug','text',130,'Preferred vendor'],
                  ].map(([field,type,w,ph])=>(
                    <td key={field} style={{padding:'4px 6px',border:'1px solid var(--odoo-border)',width:w}}>
                      {field==='uom'
                        ? <select value={item.uom} onChange={e=>updateItem(idx,'uom',e.target.value)}
                            style={{...inp,padding:'5px 6px',width:'100%'}}>
                            {UOM_LIST.map(u=><option key={u}>{u}</option>)}
                          </select>
                        : <input type={type} value={item[field]} placeholder={ph}
                            onChange={e=>updateItem(idx,field,e.target.value)}
                            style={{...inp,padding:'5px 8px',width:'100%'}} />
                      }
                    </td>
                  ))}
                  <td style={{padding:'4px 6px',textAlign:'center',border:'1px solid var(--odoo-border)'}}>
                    {items.length>1 &&
                      <button onClick={()=>removeItem(idx)}
                        style={{background:'#F8D7DA',color:'#721C24',border:'none',
                          borderRadius:4,padding:'3px 8px',cursor:'pointer',fontSize:12}}>✕</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Remarks */}
        <div style={{marginTop:16}}>
          <label style={lbl}>Remarks / Special Instructions</label>
          <textarea value={remarks} onChange={e=>setRemarks(e.target.value)}
            rows={3} style={{...inp,resize:'vertical'}}
            placeholder="Any special requirements, urgency notes, technical specifications…" />
        </div>
      </div>

      {/* Signature block */}
      <div style={{background:'#fff',borderRadius:8,border:'1px solid var(--odoo-border)',
        padding:20,boxShadow:'0 1px 4px rgba(0,0,0,.06)'}}>
        <div style={{fontFamily:'Syne,sans-serif',fontSize:13,fontWeight:700,
          color:'var(--odoo-dark)',marginBottom:14}}>Approval Signatures</div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:12}}>
          {['Requested By','Checked By','HOD Approval','Purchase Manager','GM / MD Approval'].map(s=>(
            <div key={s} style={{border:'1px solid var(--odoo-border)',borderRadius:6,overflow:'hidden'}}>
              <div style={{background:'var(--odoo-purple)',padding:'6px 10px',
                fontSize:11,fontWeight:700,color:'#fff',textAlign:'center'}}>{s}</div>
              <div style={{height:50,background:'#F8F9FA'}} />
              <div style={{background:'#F0EEEB',padding:'5px 10px',
                fontSize:10,color:'var(--odoo-gray)',textAlign:'center'}}>
                Date: ___________
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
