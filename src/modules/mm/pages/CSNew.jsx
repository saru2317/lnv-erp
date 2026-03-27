import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const N_ITEMS   = 5
const GST_RATES = [0, 0.05, 0.12, 0.18, 0.28]
const UOM_LIST  = ['Nos','Kg','Ltrs','Mtrs','Box','Set','Pair','Roll','Sheet','Pack']

const emptyItem = () => ({
  desc:'', spec:'', uom:'Nos', qty:'', rate:'', discPct:0,
  packing:0, freight:0, cutting:0, gstPct:18, loading:0,
})

const emptySupplier = (label) => ({
  label, name:'', supplyType:'Intrastate', quoteRef:'', quoteDate:'',
  deliveryTerms:'Door Delivery', paymentTerms:'Against Delivery',
  items: Array.from({length:N_ITEMS}, emptyItem),
})

const emptyPrevPurchase = () => ({
  desc:'', spec:'', uom:'Nos', qty:'', rate:'', discPct:0,
  packing:0, freight:0, cutting:0, gstPct:18,
  supplierName:'', poRef:'',
})

// ── calculations ──────────────────────────────────────
function calcItem(item) {
  const qty     = parseFloat(item.qty)     || 0
  const rate    = parseFloat(item.rate)    || 0
  const discPct = parseFloat(item.discPct) || 0
  const packing = parseFloat(item.packing) || 0
  const freight = parseFloat(item.freight) || 0
  const cutting = parseFloat(item.cutting) || 0
  const gstPct  = parseFloat(item.gstPct)  || 0
  const loading = parseFloat(item.loading) || 0

  const discAmt     = qty * rate * (discPct / 100)
  const rateAfDisc  = rate * (1 - discPct / 100)
  const basicVal    = qty * rateAfDisc
  const gstAmt      = basicVal * (gstPct / 100)
  const totalVal    = basicVal + packing + freight + cutting + gstAmt
  const totalCost   = qty > 0 ? totalVal / qty : 0
  const landingCost = qty > 0 ? (basicVal + packing + freight + cutting + loading) / qty : 0

  return { discAmt, rateAfDisc, basicVal, gstAmt, totalVal, totalCost, landingCost }
}

function fmt(n) {
  if (!n || isNaN(n)) return '—'
  return '₹' + Number(n).toLocaleString('en-IN', {minimumFractionDigits:2, maximumFractionDigits:2})
}

function SupplierBlock({ sup, idx, onChange, bgHeader, bgRow, bgLight }) {
  const updateSup = (field, val) => onChange({...sup, [field]:val})
  const updateItem = (i, field, val) => {
    const items = [...sup.items]
    items[i] = {...items[i], [field]:val}
    onChange({...sup, items})
  }

  // totals
  const totals = sup.items.reduce((acc, item) => {
    const c = calcItem(item)
    return {
      basicVal:    acc.basicVal    + c.basicVal,
      packing:     acc.packing     + (parseFloat(item.packing)||0),
      freight:     acc.freight     + (parseFloat(item.freight)||0),
      cutting:     acc.cutting     + (parseFloat(item.cutting)||0),
      gstAmt:      acc.gstAmt      + c.gstAmt,
      totalVal:    acc.totalVal    + c.totalVal,
    }
  }, {basicVal:0, packing:0, freight:0, cutting:0, gstAmt:0, totalVal:0})

  const numInp = (val, setter, small=false) => (
    <input type="number" value={val}
      onChange={e => setter(e.target.value)}
      style={{width:'100%', padding: small?'4px 5px':'5px 7px',
        border:'1px solid var(--odoo-border)', borderRadius:4,
        fontSize:11, textAlign:'right', fontFamily:'DM Mono,monospace',
        background:'#FFFDE7', outline:'none', boxSizing:'border-box'}} />
  )
  const txtInp = (val, setter, ph='') => (
    <input type="text" value={val} placeholder={ph}
      onChange={e => setter(e.target.value)}
      style={{width:'100%', 
        border:'1px solid var(--odoo-border)', borderRadius:4,
        fontSize:11, background:'#FFFDE7', outline:'none', boxSizing:'border-box'}} />
  )

  return (
    <div style={{marginBottom:20,borderRadius:8,overflow:'hidden',
      border:`2px solid ${bgHeader}`,boxShadow:'0 2px 8px rgba(0,0,0,.06)'}}>
      {/* Supplier header */}
      <div style={{background:bgHeader,padding:'10px 16px',
        display:'flex',gap:12,alignItems:'center',flexWrap:'wrap'}}>
        <div style={{fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:13,
          minWidth:100}}>Supplier {['I','II','III'][idx]}</div>
        <div style={{flex:1,minWidth:180}}>
          <input value={sup.name} placeholder="Supplier / Vendor Name"
            onChange={e=>updateSup('name',e.target.value)}
            style={{width:'100%',borderRadius:4,border:'none',
              fontSize:12,fontWeight:600,background:'rgba(255,255,255,.2)',color:'#fff',outline:'none','::placeholder':{color:'rgba(255,255,255,.6)'}}} />
        </div>
        <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
          {[['Supply Type',sup.supplyType,v=>updateSup('supplyType',v),
              ['Intrastate','Interstate','Import'],'select'],
            ['Quote Ref', sup.quoteRef, v=>updateSup('quoteRef',v),'','text'],
            ['Quote Date',sup.quoteDate,v=>updateSup('quoteDate',v),'','date'],
          ].map(([lbl,val,setter,opts,type])=>(
            <div key={lbl} style={{display:'flex',alignItems:'center',gap:4}}>
              <span style={{fontSize:10,color:'rgba(255,255,255,.7)',whiteSpace:'nowrap'}}>{lbl}:</span>
              {type==='select'
                ? <select value={val} onChange={e=>setter(e.target.value)}
                    style={{padding:'3px 6px',borderRadius:3,border:'none',fontSize:11,
                      background:'rgba(255,255,255,.2)',outline:'none'}}>
                    {opts.map(o=><option key={o} style={{color:'#000'}}>{o}</option>)}
                  </select>
                : <input type={type} value={val} onChange={e=>setter(e.target.value)}
                    style={{padding:'3px 8px',borderRadius:3,border:'none',fontSize:11,
                      background:'rgba(255,255,255,.2)',color:'#fff',outline:'none',width:type==='date'?120:100}} />
              }
            </div>
          ))}
        </div>
      </div>

      {/* Items table */}
      <div style={{overflowX:'auto',background:'#fff'}}>
        <table style={{width:'100%',borderCollapse:'collapse',minWidth:1100}}>
          <thead>
            <tr style={{background:bgLight}}>
              {['#','Item Description','Spec','UOM','Qty',
                'Rate/UOM','Disc%','Disc Amt','Rate Aft.Disc','Basic Value',
                'Packing','Freight','Cutting','GST%','GST Amt',
                'Total Value','Loading','Cost/Unit','Land.Cost WO GST'
              ].map(h=>(
                <th key={h} style={{padding:'7px 8px',fontSize:10,fontWeight:700,
                  textAlign:'center',
                  border:'1px solid var(--odoo-border)',whiteSpace:'nowrap'}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sup.items.map((item, i)=>{
              const c = calcItem(item)
              const isBlank = !item.desc && !item.rate
              return (
                <tr key={i} style={{background:i%2===0?'#fff':bgRow+'22'}}>
                  <td style={{textAlign:'center',padding:'4px 6px',fontWeight:700,color:'var(--odoo-gray)',border:'1px solid var(--odoo-border)',fontSize:11}}>{i+1}</td>
                  {/* Description - 2 cols wide */}
                  <td style={{border:'1px solid var(--odoo-border)',minWidth:160}}>
                    {txtInp(item.desc, v=>updateItem(i,'desc',v), 'Item description')}
                  </td>
                  <td style={{padding:'3px 5px',border:'1px solid var(--odoo-border)',minWidth:80}}>
                    {txtInp(item.spec, v=>updateItem(i,'spec',v), 'Brand/spec')}
                  </td>
                  <td style={{padding:'3px 5px',border:'1px solid var(--odoo-border)',minWidth:70}}>
                    <select value={item.uom} onChange={e=>updateItem(i,'uom',e.target.value)}
                      style={{width:'100%',padding:'4px 4px',border:'1px solid var(--odoo-border)',
                        borderRadius:4,fontSize:11,background:'#FFFDE7',outline:'none'}}>
                      {UOM_LIST.map(u=><option key={u}>{u}</option>)}
                    </select>
                  </td>
                  <td style={{border:'1px solid var(--odoo-border)',minWidth:65}}>
                    {numInp(item.qty, v=>updateItem(i,'qty',v))}
                  </td>
                  <td style={{padding:'3px 5px',border:'1px solid var(--odoo-border)',minWidth:90}}>
                    {numInp(item.rate, v=>updateItem(i,'rate',v))}
                  </td>
                  <td style={{padding:'3px 5px',border:'1px solid var(--odoo-border)',minWidth:60}}>
                    {numInp(item.discPct, v=>updateItem(i,'discPct',v))}
                  </td>
                  {/* Calculated fields */}
                  {[c.discAmt, c.rateAfDisc, c.basicVal].map((v,ci)=>(
                    <td key={ci} style={{padding:'4px 8px',textAlign:'right',
                      border:'1px solid var(--odoo-border)',fontFamily:'DM Mono,monospace',
                      fontSize:11,background:'#F8F9FA',color:isBlank?'#ccc':'var(--odoo-dark)'}}>
                      {isBlank?'—':fmt(v)}
                    </td>
                  ))}
                  <td style={{padding:'3px 5px',border:'1px solid var(--odoo-border)',minWidth:70}}>
                    {numInp(item.packing, v=>updateItem(i,'packing',v))}
                  </td>
                  <td style={{padding:'3px 5px',border:'1px solid var(--odoo-border)',minWidth:70}}>
                    {numInp(item.freight, v=>updateItem(i,'freight',v))}
                  </td>
                  <td style={{padding:'3px 5px',border:'1px solid var(--odoo-border)',minWidth:65}}>
                    {numInp(item.cutting, v=>updateItem(i,'cutting',v))}
                  </td>
                  <td style={{padding:'3px 5px',border:'1px solid var(--odoo-border)',minWidth:65}}>
                    <select value={item.gstPct} onChange={e=>updateItem(i,'gstPct',e.target.value)}
                      style={{width:'100%',padding:'4px 4px',border:'1px solid var(--odoo-border)',
                        borderRadius:4,fontSize:11,background:'#FFFDE7',outline:'none'}}>
                      {[0,5,12,18,28].map(g=><option key={g} value={g}>{g}%</option>)}
                    </select>
                  </td>
                  {/* GST Amt */}
                  <td style={{textAlign:'right',
                    border:'1px solid var(--odoo-border)',fontFamily:'DM Mono,monospace',
                    fontSize:11,background:'#FEF8E6',color:isBlank?'#ccc':'var(--odoo-orange)'}}>
                    {isBlank?'—':fmt(c.gstAmt)}
                  </td>
                  {/* Total Value */}
                  <td style={{padding:'4px 8px',textAlign:'right',
                    border:'1px solid var(--odoo-border)',fontFamily:'DM Mono,monospace',
                    fontSize:12,fontWeight:700,background:'#EDE0EA',color:isBlank?'#ccc':'var(--odoo-purple)'}}>
                    {isBlank?'—':fmt(c.totalVal)}
                  </td>
                  <td style={{padding:'3px 5px',border:'1px solid var(--odoo-border)',minWidth:65}}>
                    {numInp(item.loading, v=>updateItem(i,'loading',v))}
                  </td>
                  {/* Cost/Unit */}
                  <td style={{padding:'4px 8px',textAlign:'right',
                    border:'1px solid var(--odoo-border)',fontFamily:'DM Mono,monospace',
                    fontSize:11,fontWeight:700,background:'#E6F7F7',color:isBlank?'#ccc':'#155724'}}>
                    {isBlank?'—':fmt(c.totalCost)}
                  </td>
                  {/* Landing Cost WO GST */}
                  <td style={{padding:'4px 8px',textAlign:'right',
                    border:'1px solid var(--odoo-border)',fontFamily:'DM Mono,monospace',
                    fontSize:11,fontWeight:700,background:'#E6F7F7',color:isBlank?'#ccc':'#155724'}}>
                    {isBlank?'—':fmt(c.landingCost)}
                  </td>
                </tr>
              )
            })}
          </tbody>
          {/* Totals row */}
          <tfoot>
            <tr style={{background:'#EDE0EA',fontWeight:700}}>
              <td colSpan={9} style={{padding:'8px 12px',fontFamily:'Syne,sans-serif',
                fontSize:12,border:'1px solid var(--odoo-border)'}}>
                Delivery: &nbsp;
                <input value={sup.deliveryTerms} onChange={e=>updateSup('deliveryTerms',e.target.value)}
                  style={{background:'transparent',border:'1px dashed var(--odoo-border)',padding:'2px 6px',borderRadius:3,fontSize:11,outline:'none',width:160}} />
                &nbsp;&nbsp; Payment: &nbsp;
                <input value={sup.paymentTerms} onChange={e=>updateSup('paymentTerms',e.target.value)}
                  style={{background:'transparent',border:'1px dashed var(--odoo-border)',
                    borderRadius:3,fontSize:11,outline:'none',width:160}} />
              </td>
              <td style={{padding:'8px 10px',textAlign:'right',fontFamily:'DM Mono,monospace',
                border:'1px solid var(--odoo-border)'}}>{fmt(totals.basicVal)}</td>
              <td style={{padding:'8px 10px',textAlign:'right',fontFamily:'DM Mono,monospace',
                border:'1px solid var(--odoo-border)'}}>{fmt(totals.packing)}</td>
              <td style={{padding:'8px 10px',textAlign:'right',fontFamily:'DM Mono,monospace',
                border:'1px solid var(--odoo-border)'}}>{fmt(totals.freight)}</td>
              <td style={{padding:'8px 10px',textAlign:'right',fontFamily:'DM Mono,monospace',
                border:'1px solid var(--odoo-border)'}}>{fmt(totals.cutting)}</td>
              <td style={{border:'1px solid var(--odoo-border)'}}></td>
              <td style={{padding:'8px 10px',textAlign:'right',fontFamily:'DM Mono,monospace',
                border:'1px solid var(--odoo-border)',color:'var(--odoo-orange)'}}>{fmt(totals.gstAmt)}</td>
              <td style={{padding:'8px 10px',textAlign:'right',fontFamily:'DM Mono,monospace',
                fontSize:13,border:'1px solid var(--odoo-border)',fontWeight:800}}>
                {fmt(totals.totalVal)}
              </td>
              <td colSpan={3} style={{border:'1px solid var(--odoo-border)'}}></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}

export default function CSNew() {
  const nav = useNavigate()
  const [csNo]    = useState('CS-2026-0019')
  const [prNo, setPrNo]     = useState('PR-2026-0041')
  const [date, setDate]     = useState(new Date().toISOString().split('T')[0])
  const [prepBy, setPrepBy] = useState('')
  const [selectedSup, setSelectedSup] = useState('')
  const [reason, setReason] = useState('')
  const [remarks, setRemarks] = useState('')
  const [saved, setSaved]   = useState(false)
  const [approved, setApproved] = useState(false)

  const [suppliers, setSuppliers] = useState([
    emptySupplier('Supplier I'),
    emptySupplier('Supplier II'),
    emptySupplier('Supplier III'),
  ])

  const [prevPurchases, setPrevPurchases] = useState(
    Array.from({length:3}, emptyPrevPurchase)
  )

  const updatePrev = (i, field, val) => {
    const copy = [...prevPurchases]
    copy[i] = {...copy[i], [field]:val}
    setPrevPurchases(copy)
  }

  // Find lowest cost supplier for each item
  const getLowest = (itemIdx) => {
    const costs = suppliers.map((s,si) => ({
      si,
      cost: calcItem(s.items[itemIdx]).landingCost
    })).filter(x => x.cost > 0)
    if (!costs.length) return -1
    return costs.reduce((min,x) => x.cost < min.cost ? x : min, costs[0]).si
  }

  const handleSave = () => { setSaved(true) }
  const handleApprove = () => { setApproved(true); setTimeout(()=>nav('/mm/po/new'),1000) }

  return (
    <div style={{maxWidth:1400}}>
      {/* Header */}
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">
          Comparative Statement
          <small>{csNo}</small>
        </div>
        <div className="fi-lv-actions">
          <button className="btn btn-s sd-bsm" onClick={()=>nav('/mm/pr')}>← Back to PR</button>
          <button className="btn btn-s sd-bsm" onClick={()=>nav('/mm/cs/view')}> Print View</button>
          <button className="btn btn-s sd-bsm" onClick={handleSave}>
            {saved ? ' Saved' : ' Save Draft'}
          </button>
          <button className="btn btn-p sd-bsm"
            style={{background:approved?'#155724':'var(--odoo-green)',color:'#fff'}}
            onClick={handleApprove}>
            {approved ? ' Approved! Raising PO…' : ' HOD Approve & Raise PO'}
          </button>
        </div>
      </div>

      {/* CS Info header */}
      <div style={{borderRadius:8,border:'1px solid var(--odoo-border)',padding:16,marginBottom:16,boxShadow:'0 1px 4px rgba(0,0,0,.06)'}}>

        {/* Company banner */}
        <div style={{background:'linear-gradient(135deg,#4A3050,#714B67)',borderRadius:6,
          marginBottom:16,
          display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div>
            <div style={{fontFamily:'Syne,sans-serif',fontSize:16,fontWeight:800,color:'#F5C518'}}>P C S</div>
            <div style={{fontSize:11,color:'rgba(255,255,255,.7)'}}>Auto Coats · Purchase Department</div>
          </div>
          <div style={{textAlign:'center'}}>
            <div style={{fontFamily:'Syne,sans-serif',fontSize:15,fontWeight:700,letterSpacing:2}}>
              COMPARATIVE STATEMENT
            </div>
            <div style={{fontFamily:'Syne,sans-serif',fontSize:13,fontWeight:600,color:'#F5C518'}}>{csNo}</div>
          </div>
          <div style={{textAlign:'right',fontSize:11,color:'rgba(255,255,255,.7)'}}>
            Date: <strong style={{color:'#fff'}}>{date}</strong>
          </div>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:12}}>
          {[
            ['CS No.',       csNo,    null,       false],
            ['PR No.',       prNo,    setPrNo,    true],
            ['Date',         date,    setDate,    true,'date'],
            ['Prepared By',  prepBy,  setPrepBy,  true],
            ['Supplier Selected',selectedSup,setSelectedSup,true],
          ].map(([lbl,val,setter,editable,type])=>(
            <div key={lbl}>
              <label style={{fontSize:11,fontWeight:700,
                textTransform:'uppercase',letterSpacing:.5,marginBottom:4,display:'block'}}>{lbl}</label>
              {!editable
                ? <div style={{padding:'7px 10px',background:'#F8F9FA',borderRadius:5,
                    border:'1px solid var(--odoo-border)',fontSize:12,fontWeight:700,color:'var(--odoo-purple)',fontFamily:'DM Mono,monospace'}}>{val}</div>
                : <input type={type||'text'} value={val} onChange={e=>setter(e.target.value)}
                    style={{width:'100%',padding:'7px 10px',border:'1.5px solid var(--odoo-border)',
                      borderRadius:5,fontSize:12,outline:'none',background:'#FFFDE7',boxSizing:'border-box'}} />
              }
            </div>
          ))}
        </div>

        {selectedSup && (
          <div style={{marginTop:12}}>
            <label style={{fontSize:11,fontWeight:700,
              textTransform:'uppercase',letterSpacing:.5,marginBottom:4,display:'block'}}>
              Reason for Selection
            </label>
            <input value={reason} onChange={e=>setReason(e.target.value)}
              placeholder="Reason for selecting this vendor (e.g. L1 price, quality, delivery terms…)"
              style={{width:'100%',border:'1.5px solid var(--odoo-border)',
                borderRadius:5,fontSize:12,outline:'none',background:'#FFFDE7',boxSizing:'border-box'}} />
          </div>
        )}
      </div>

      {/* Legend */}
      <div style={{display:'flex',gap:12,marginBottom:12,flexWrap:'wrap'}}>
        {[
          ['#FFFDE7','User Input (Blue)'],
          ['#F8F9FA','Auto Calculated'],
          ['#EDE0EA','Sub Total'],
          ['#E6F7F7','Landing Cost (Lowest = Best)'],
        ].map(([bg,lbl])=>(
          <div key={lbl} style={{display:'flex',alignItems:'center',gap:6,fontSize:11,color:'var(--odoo-gray)'}}>
            <div style={{width:14,height:14,borderRadius:3,background:bg,border:'1px solid var(--odoo-border)'}} />
            {lbl}
          </div>
        ))}
      </div>

      {/* Supplier blocks */}
      {suppliers.map((sup, idx) => (
        <SupplierBlock key={idx} sup={sup} idx={idx}
          onChange={updated => {
            const copy = [...suppliers]
            copy[idx] = updated
            setSuppliers(copy)
          }}
          bgHeader={idx===0?'#714B67':idx===1?'#00A09D':'#017E84'}
          bgRow={idx===0?'#EDE0EA':idx===1?'#E6F7F7':'#D1ECF1'}
          bgLight={idx===0?'#F0E8EF':idx===1?'#EBF7EB':'#E8F4F8'}
        />
      ))}

      {/* Comparison summary — auto highlight lowest */}
      {suppliers.some(s=>s.items.some(i=>parseFloat(i.rate)>0)) && (
        <div style={{borderRadius:8,border:'2px solid var(--odoo-purple)',padding:18,marginBottom:16,boxShadow:'0 2px 8px rgba(0,0,0,.08)'}}>
          <div style={{fontFamily:'Syne,sans-serif',fontSize:14,fontWeight:800,
            marginBottom:14,display:'flex',gap:10,alignItems:'center'}}>
             Landing Cost Comparison (WO GST)
            <span style={{fontSize:11,fontWeight:400,color:'var(--odoo-gray)'}}>
              Green = Lowest cost (L1)
            </span>
          </div>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead>
              <tr style={{background:'#F8F9FA'}}>
                <th style={{fontSize:11,fontWeight:700,textAlign:'left',
                  border:'1px solid var(--odoo-border)'}}>Item</th>
                {suppliers.map((s,si)=>(
                  <th key={si} style={{padding:'8px 12px',fontSize:11,fontWeight:700,textAlign:'center',
                    border:'1px solid var(--odoo-border)',background:si===0?'#EDE0EA':si===1?'#E6F7F7':'#D1ECF1',
                    color:si===0?'var(--odoo-purple)':si===1?'#155724':'#0C5460'}}>
                    {s.name || `Supplier ${['I','II','III'][si]}`}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {suppliers[0].items.map((item, itemIdx)=>{
                const hasData = suppliers.some(s=>parseFloat(s.items[itemIdx]?.rate)>0)
                if (!hasData) return null
                const lowest = getLowest(itemIdx)
                return (
                  <tr key={itemIdx}>
                    <td style={{padding:'8px 12px',fontSize:12,border:'1px solid var(--odoo-border)',
                      fontWeight:600,color:'var(--odoo-dark)'}}>
                      {item.desc || `Item ${itemIdx+1}`}
                      <div style={{fontSize:10,color:'var(--odoo-gray)'}}>{item.uom}</div>
                    </td>
                    {suppliers.map((s,si)=>{
                      const c = calcItem(s.items[itemIdx])
                      const isLowest = si === lowest && c.landingCost > 0
                      return (
                        <td key={si} style={{padding:'8px 12px',textAlign:'center',
                          border:'1px solid var(--odoo-border)',
                          background: isLowest ? '#D4EDDA' : '#fff',
                          fontFamily:'DM Mono,monospace',fontSize:13,
                          fontWeight: isLowest ? 800 : 400,
                          color: isLowest ? '#155724' : 'var(--odoo-dark)'}}>
                          {c.landingCost > 0 ? fmt(c.landingCost) : '—'}
                          {isLowest && <div style={{fontSize:10,fontWeight:700}}> L1</div>}
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Previous purchases */}
      <div style={{borderRadius:8,border:'1px solid #E0C070',
        overflow:'hidden',marginBottom:16,boxShadow:'0 1px 4px rgba(0,0,0,.06)'}}>
        <div style={{background:'#856404',padding:'10px 16px',
          fontFamily:'Syne,sans-serif',fontSize:13,fontWeight:800,color:'#fff'}}>
           Previous Purchase Reference
        </div>
        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse',minWidth:900}}>
            <thead>
              <tr style={{background:'#FFF3CD'}}>
                {['#','Item Description','Spec','UOM','Qty','Rate','Disc%',
                  'Basic Value','GST%','GST Amt','Landing Cost\nWO GST','Supplier Name','PO Ref'].map(h=>(
                  <th key={h} style={{fontSize:10,fontWeight:700,
                    textAlign:'center',border:'1px solid #FAD7A0',whiteSpace:'nowrap'}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {prevPurchases.map((pp, i)=>{
                const qty = parseFloat(pp.qty)||0
                const rate = parseFloat(pp.rate)||0
                const disc = parseFloat(pp.discPct)||0
                const gst  = parseFloat(pp.gstPct)||0
                const packing = parseFloat(pp.packing)||0
                const freight = parseFloat(pp.freight)||0
                const basic = qty * rate * (1-disc/100)
                const gstAmt = basic * gst/100
                const landing = qty>0 ? (basic+packing+freight)/qty : 0
                return (
                  <tr key={i} style={{background:i%2===0?'#fff':'#FFFDE7'}}>
                    <td style={{padding:'4px 8px',textAlign:'center',fontWeight:700,border:'1px solid #FAD7A0',fontSize:11}}>{i+1}</td>
                    {[['desc','text',180,'Item description'],['spec','text',90,'Brand'],
                      ['uom','select',65],['qty','number',65],['rate','number',80],
                      ['discPct','number',55]].map(([f,t,w,ph])=>(
                      <td key={f} style={{padding:'3px 5px',border:'1px solid #FAD7A0',width:w}}>
                        {f==='uom'
                          ? <select value={pp.uom} onChange={e=>updatePrev(i,'uom',e.target.value)}
                              style={{width:'100%',padding:'4px',border:'1px solid #FAD7A0',
                                borderRadius:3,fontSize:11,background:'#FFFDE7',outline:'none'}}>
                              {UOM_LIST.map(u=><option key={u}>{u}</option>)}
                            </select>
                          : <input type={t} value={pp[f]} placeholder={ph}
                              onChange={e=>updatePrev(i,f,e.target.value)}
                              style={{width:'100%',border:'1px solid #FAD7A0',
                                borderRadius:3,fontSize:11,background:'#FFFDE7',outline:'none',
                                textAlign:t==='number'?'right':'left'}} />
                        }
                      </td>
                    ))}
                    <td style={{padding:'4px 8px',textAlign:'right',fontFamily:'DM Mono,monospace',
                      fontSize:11,border:'1px solid #FAD7A0',background:'#FFF8E6'}}>{fmt(basic)}</td>
                    <td style={{padding:'3px 5px',border:'1px solid #FAD7A0',width:55}}>
                      <select value={pp.gstPct} onChange={e=>updatePrev(i,'gstPct',e.target.value)}
                        style={{width:'100%',padding:'4px',border:'1px solid #FAD7A0',
                          borderRadius:3,fontSize:11,background:'#FFFDE7',outline:'none'}}>
                        {[0,5,12,18,28].map(g=><option key={g} value={g}>{g}%</option>)}
                      </select>
                    </td>
                    <td style={{textAlign:'right',fontFamily:'DM Mono,monospace',
                      fontSize:11,border:'1px solid #FAD7A0',color:'var(--odoo-orange)'}}>{fmt(gstAmt)}</td>
                    <td style={{padding:'4px 8px',textAlign:'right',fontFamily:'DM Mono,monospace',
                      fontSize:12,fontWeight:700,border:'1px solid #FAD7A0',color:'#856404'}}>{fmt(landing)}</td>
                    {[['supplierName','text',130,'Supplier name'],['poRef','text',110,'PO No. & Date']].map(([f,t,w,ph])=>(
                      <td key={f} style={{padding:'3px 5px',border:'1px solid #FAD7A0',width:w}}>
                        <input type={t} value={pp[f]} placeholder={ph}
                          onChange={e=>updatePrev(i,f,e.target.value)}
                          style={{width:'100%',padding:'4px 6px',border:'1px solid #FAD7A0',
                            borderRadius:3,fontSize:11,background:'#FFFDE7',outline:'none'}} />
                      </td>
                    ))}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Remarks + Approval */}
      <div style={{borderRadius:8,border:'1px solid var(--odoo-border)',
        padding:20,boxShadow:'0 1px 4px rgba(0,0,0,.06)'}}>
        <div style={{marginBottom:16}}>
          <label style={{fontSize:11,fontWeight:700,
            textTransform:'uppercase',letterSpacing:.5,marginBottom:6,display:'block'}}>
            Remarks / Notes
          </label>
          <textarea value={remarks} onChange={e=>setRemarks(e.target.value)} rows={3}
            style={{width:'100%',border:'1.5px solid var(--odoo-border)',
              borderRadius:5,fontSize:12,outline:'none',background:'#FFFDE7',
              fontFamily:'DM Sans,sans-serif',resize:'vertical',boxSizing:'border-box'}} />
        </div>
        <div style={{fontFamily:'Syne,sans-serif',fontSize:13,fontWeight:700,color:'var(--odoo-dark)',marginBottom:14}}>Approval Signatures</div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:12}}>
          {['Prepared By\n(Purchase)','Checked By','HOD Approval\n& Vendor Selection','GM Approval','MD / Director'].map(s=>(
            <div key={s} style={{border:'1px solid var(--odoo-border)',borderRadius:6,overflow:'hidden'}}>
              <div style={{background:'var(--odoo-purple)',padding:'7px 10px',
                fontSize:11,fontWeight:700,textAlign:'center',
                whiteSpace:'pre-line',lineHeight:1.3}}>{s}</div>
              <div style={{height:50,background:'#F8F9FA'}} />
              <div style={{background:'#F0EEEB',padding:'5px',
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
