import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { mmApi } from '../services/mmApi'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const getToken = () => localStorage.getItem('lnv_token')

const N_ITEMS   = 5
const GST_RATES = [0, 0.05, 0.12, 0.18, 0.28]
const UOM_LIST  = ['Nos','Kg','Ltrs','Mtrs','Box','Set','Pair','Roll','Sheet','Pack']

const emptyItem = () => ({
  desc:'', spec:'', uom:'Nos', qty:'', rate:'', discPct:0,
  packing:0, freight:0, cutting:0, gstPct:18, loading:0,
})

const emptySupplier = (label) => ({
  label, name:'', vendorCode:'', supplyType:'Intrastate',
  quoteRef:'', quoteDate:'',
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

function SupplierBlock({ sup, idx, onChange, bgHeader, bgRow, bgLight, vendors=[], quotedVendors=[] }) {
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
        <div style={{flex:1,minWidth:200}}>
          <select value={sup.name}
            onChange={e=>{
              const allV = quotedVendors.length>0 ? quotedVendors : vendors
              const found = allV.find(v=>(v.vendorName||v)===e.target.value)
              updateSup('name', e.target.value)
              if (found?.vendorCode) updateSup('vendorCode', found.vendorCode)
            }}
            style={{width:'100%',borderRadius:4,border:'none',
              fontSize:12,fontWeight:600,
              background:'rgba(255,255,255,.15)',
              color: sup.name?'#fff':'rgba(255,255,255,.6)',
              outline:'none',cursor:'pointer',padding:'3px 6px'}}>
            <option value="" style={{color:'#333'}}>-- Select Supplier --</option>
            {(quotedVendors.length>0 ? quotedVendors : vendors)
              .filter((v,i,arr)=>
                arr.findIndex(x=>(x.vendorCode||x)===(v.vendorCode||v))===i
              )
              .map((v,i)=>(
                <option key={`sup-${i}-${v.vendorCode||v}`}
                  value={v.vendorName||v}
                  style={{color:'#333'}}>
                  {v.vendorCode ? `${v.vendorCode} — ${v.vendorName}` : v}
                </option>
              ))}
          </select>
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
  const [csNo,    setCsNo]  = useState('CS-AUTO')
  const [prNo,    setPrNo]  = useState('')
  const [prs,     setPrs]   = useState([])
  const [vendorList, setVendorList] = useState([])
  const [rfqInfo,    setRfqInfo]    = useState(null)
  const [activeBlocks, setActiveBlocks] = useState(3)
  const [quotedVendors,setQuotedVendors]= useState([])
  const [date,    setDate]  = useState(new Date().toISOString().split('T')[0])
  const [prepBy,  setPrepBy]= useState(
    JSON.parse(localStorage.getItem('lnv_user')||'{}')?.name||
    localStorage.getItem('lnv_userName')||''
  )
  const [selectedSup, setSelectedSup] = useState('')
  const [reason,  setReason]  = useState('')
  const [remarks, setRemarks] = useState('')
  const [saved,   setSaved]   = useState(false)
  const [approved,setApproved]= useState(false)
  const [saving,  setSaving]  = useState(false)

  // Load PRs + generate CS number + auto-load PR/RFQ data from URL
  useEffect(()=>{
    const urlParams  = new URLSearchParams(window.location.search)
    const prIdFromUrl  = urlParams.get('pr')
    const prNoFromUrl  = urlParams.get('prNo')
    const rfqIdFromUrl = urlParams.get('rfq')

    mmApi.getPRList()
      .then(d=>setPrs(d.data||[]))
      .catch(()=>{})

    // Load vendor master for dropdowns
    mmApi.getVendors()
      .then(d=>setVendorList(d.data||[]))
      .catch(()=>{})

    fetch(`${BASE_URL}/mm/cs/next-no`,
      {headers:{Authorization:`Bearer ${getToken()}`}})
      .then(r=>r.json())
      .then(d=>setCsNo(d.csNo||'CS-2026-0001'))
      .catch(()=>{})

    // Helper: fill supplier blocks from item list
    const fillSupplierItems = (itemLines) => {
      const mapped = itemLines.slice(0,5).map(l=>({
        desc: l.itemName||'', spec: l.specification||l.spec||'',
        uom:  l.unit||'Nos', qty:  String(parseFloat(l.qty||1)),
        rate:'', discPct:0, packing:0, freight:0,
        cutting:0, gstPct:18, loading:0
      }))
      const padded = [
        ...mapped,
        ...Array.from({length:Math.max(0,5-mapped.length)},
          ()=>({desc:'',spec:'',uom:'Nos',qty:'',rate:'',
            discPct:0,packing:0,freight:0,cutting:0,gstPct:18,loading:0}))
      ]
      return padded
    }

    // ── LOAD FROM RFQ (with supplier quotes) ──────────────
    if (rfqIdFromUrl) {
      fetch(`${BASE_URL}/mm/rfq/${rfqIdFromUrl}`,
        {headers:{Authorization:`Bearer ${getToken()}`}})
        .then(r=>r.json())
        .then(d=>{
          const rfq    = d.data
          if (!rfq) return
          // Set PR no from RFQ
          if (rfq.prNo) setPrNo(rfq.prNo)

          const rfqLines  = rfq.lines||[]
          const rfqQuotes = rfq.quotes||[]

          // Fill item descriptions from RFQ lines
          const itemRows = fillSupplierItems(rfqLines)

          // Map supplier quotes into supplier blocks
          const newSuppliers = [0,1,2].map(idx=>{
            const quote = rfqQuotes[idx]
            if (quote) {
              // Parse saved quote lines
              let qLines = []
              try { qLines = JSON.parse(quote.lines||'[]') } catch {}

              // Map quote lines with actual rates to item rows
              const qItems = itemRows.map((row, rowIdx) => {
                const ql = qLines[rowIdx]
                if (!ql) return row
                return {
                  ...row,
                  rate:    ql.rate   || ql.rate   || '',
                  discPct: ql.disc   || ql.discPct|| 0,
                  packing: ql.packing|| 0,
                  freight: ql.freight|| 0,
                  cutting: ql.cutting|| 0,
                  gstPct:  ql.gst    || ql.gstRate || 18,
                }
              })

              return {
                label:  `Supplier ${['I','II','III'][idx]}`,
                name:   quote.vendorName||'',
                supplyType:'Intrastate',
                quoteRef:  quote.quoteRef||'',
                quoteDate: quote.quoteDate
                  ? new Date(quote.quoteDate).toISOString().split('T')[0]
                  : '',
                deliveryTerms:'Door Delivery',
                paymentTerms: 'Against Delivery',
                items: qItems
              }
            }
            // No quote for this slot - empty with items prefilled
            return {
              label:`Supplier ${['I','II','III'][idx]}`,
              name:'', supplyType:'Intrastate',
              quoteRef:'', quoteDate:'',
              deliveryTerms:'Door Delivery',
              paymentTerms:'Against Delivery',
              items: itemRows
            }
          })

          setSuppliers(newSuppliers)

          const qCount = rfqQuotes.length
          const quotedVendorList = rfqQuotes.map(q=>({
            vendorCode: q.vendorCode||'',
            vendorName: q.vendorName
          }))
          setQuotedVendors(quotedVendorList)
          setRfqInfo({
            rfqNo: rfq.rfqNo,
            subject: rfq.subject,
            quotesReceived: qCount,
            deadline: rfq.deadline,
            vendors: rfqQuotes.map(q=>q.vendorName)
          })
          // Show only as many supplier blocks as quotes received (min 1)
          setActiveBlocks(Math.max(1, qCount))
          if (qCount > 0) {
            toast.success(`${qCount} supplier quote(s) loaded from RFQ!`)
          } else {
            toast(`RFQ items loaded. Add supplier rates.`,
              {icon:'📋'})
          }
        })
        .catch(e=>toast.error(e.message))
      return // Don't load PR separately if RFQ loaded
    }

    // ── LOAD FROM PR directly ─────────────────────────────
    if (prIdFromUrl) {
      setPrNo(prNoFromUrl||prIdFromUrl)
      fetch(`${BASE_URL}/mm/pr/${prIdFromUrl}/items`,
        {headers:{Authorization:`Bearer ${getToken()}`}})
        .then(r=>r.json())
        .then(d=>{
          const prLines = d.data?.lines||[]
          if (prLines.length>0) {
            const itemRows = fillSupplierItems(prLines)
            setSuppliers(prev=>prev.map(sup=>({
              ...sup, items:itemRows
            })))
            toast.success(`PR ${prNoFromUrl} items loaded!`)
          }
        })
        .catch(()=>{})
    }
  },[])

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

  const handleSave = async () => {
    setSaving(true)
    try {
      const itemDesc = suppliers[0].items
        .filter(i=>i.desc).map(i=>i.desc).join(', ')
      const payload = {
        prNo, itemDesc: itemDesc||'Items as per CS',
        selectedSupplier: selectedSup,
        remarks,
        quotes: suppliers
          .slice(0, activeBlocks)
          .filter(s=>s.name)
          .map((s,idx)=>({
            supplierNo: idx+1,
            supplierName: s.name,
            unitRate: parseFloat(s.items[0]?.rate||0),
            qty: parseFloat(s.items[0]?.qty||1),
            amount: s.items.reduce((sum,item)=>sum+calcItem(item).totalVal,0),
            deliveryDays: null,
            remarks: `Payment: ${s.paymentTerms} | Delivery: ${s.deliveryTerms}`
          })),
      }
      if (!payload.quotes.length)
        return toast.error('Add at least one supplier with name!')
      const res = await mmApi.createCS(payload)
      toast.success(res.message)
      setCsNo(res.data?.csNo||csNo)
      setSaved(true)
    } catch(e){ toast.error(e.message) } finally { setSaving(false) }
  }
  const handleApprove = async () => {
    if (!selectedSup) return toast.error('Select a supplier first!')
    // Allow CS→PO without prior save (save happens via handleSave separately)
    const selIdx = ['Supplier I','Supplier II','Supplier III'].indexOf(selectedSup)
    const selSupplier = suppliers[selIdx>=0?selIdx:0]
    setSaving(true)
    try {
      toast.success('CS sent for HOD Approval!')
      setApproved(true)
      // Store for PO creation after HOD approves
      // Map CS supplier items → PONew format
      const csItems = (selSupplier?.items||[])
        .filter(i=>i.desc||i.itemName||i.rate)
        .map(i=>({
          itemName:      i.desc||i.itemName||'',
          specification: i.spec||i.specification||'',
          unit:          i.uom||i.unit||'Nos',
          qty:           parseFloat(i.qty||1),
          rate:          parseFloat(i.rate||0),
          discount:      parseFloat(i.discPct||i.discount||0),
          gstRate:       parseFloat(i.gstPct||i.gstRate||18),
          hsnCode:       i.hsnCode||'',
        }))

      sessionStorage.setItem('cs_to_po', JSON.stringify({
        csNo,
        prNo,
        selectedSup,
        reason,
        vendorName:    selSupplier?.name||'',
        vendorCode:    selSupplier?.vendorCode||'',
        paymentTerms:  selSupplier?.paymentTerms||'Net 30 Days',
        deliveryTerms: selSupplier?.deliveryTerms||'',
        quoteRef:      selSupplier?.quoteRef||'',
        supplyType:    selSupplier?.supplyType||'Intrastate',
        items:         csItems,
      }))
      setTimeout(()=>nav('/mm/po/new?from=cs'), 1200)
    } catch(e){ toast.error(e.message) } finally { setSaving(false) }
  }

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
            {saved ? ' Saved' : saving?'⏳ Saving...':saved?' Saved':' Save Draft'}
          </button>
          <button className="btn btn-p sd-bsm"
            style={{background:approved?'#155724':'var(--odoo-green)',color:'#fff'}}
            onClick={handleApprove}>
            {saving?'⏳..':approved?' Approved! Raising PO…':' HOD Approve & Raise PO'}
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
            ['PR No.',       prNo,    setPrNo,    true,'pr_select'],
            ['Date',         date,    setDate,    true,'date'],
            ['Prepared By',  prepBy,  setPrepBy,  true],
            ['Supplier Selected',selectedSup,setSelectedSup,true,'sup_select'],
          ].map(([lbl,val,setter,editable,type])=>(
            <div key={lbl}>
              <label style={{fontSize:11,fontWeight:700,
                textTransform:'uppercase',letterSpacing:.5,marginBottom:4,display:'block'}}>{lbl}</label>
              {!editable
                ? <div style={{padding:'7px 10px',background:'#F8F9FA',borderRadius:5,
                    border:'1px solid var(--odoo-border)',fontSize:12,fontWeight:700,color:'var(--odoo-purple)',fontFamily:'DM Mono,monospace'}}>{val}</div>
                : type==='pr_select'
                  ? <select value={val} onChange={e=>setter(e.target.value)}
                      style={{width:'100%',padding:'7px 10px',border:'1.5px solid var(--odoo-border)',
                        borderRadius:5,fontSize:12,outline:'none',background:'#FFFDE7',boxSizing:'border-box',cursor:'pointer'}}>
                      <option value="">-- Select PR --</option>
                      {prs.map(p=>(
                        <option key={p.prNo} value={p.prNo}>
                          {p.prNo} · {p.department}
                        </option>
                      ))}
                    </select>
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

      {/* RFQ Info Banner */}
      {rfqInfo && (
        <div style={{background:'linear-gradient(135deg,#0C5460,#155724)',
          borderRadius:8,padding:'12px 16px',marginBottom:14,
          display:'flex',gap:20,alignItems:'center',flexWrap:'wrap'}}>
          <div style={{color:'#fff'}}>
            <div style={{fontSize:10,color:'rgba(255,255,255,.7)',
              textTransform:'uppercase',letterSpacing:.5}}>Loaded from RFQ</div>
            <div style={{fontSize:14,fontWeight:800,
              fontFamily:'Syne,sans-serif'}}>{rfqInfo.rfqNo}</div>
            <div style={{fontSize:11,color:'rgba(255,255,255,.8)'}}>
              {rfqInfo.subject}
            </div>
          </div>
          <div style={{background:'rgba(255,255,255,.15)',borderRadius:8,
            padding:'8px 16px',textAlign:'center'}}>
            <div style={{fontSize:10,color:'rgba(255,255,255,.7)',
              textTransform:'uppercase'}}>Quotes Received</div>
            <div style={{fontSize:24,fontWeight:800,color:'#90EE90',
              fontFamily:'Syne,sans-serif'}}>{rfqInfo.quotesReceived}</div>
          </div>
          {rfqInfo.vendors?.length>0 && (
            <div>
              <div style={{fontSize:10,color:'rgba(255,255,255,.7)',
                textTransform:'uppercase',marginBottom:4}}>
                Suppliers Quoted
              </div>
              <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                {rfqInfo.vendors.map((v,i)=>(
                  <span key={i} style={{padding:'2px 10px',
                    background:'rgba(255,255,255,.2)',
                    border:'1px solid rgba(255,255,255,.4)',
                    borderRadius:12,fontSize:11,color:'#fff',
                    fontWeight:600}}>
                    {['I','II','III'][i]} — {v}
                  </span>
                ))}
              </div>
            </div>
          )}
          {rfqInfo.quotesReceived < 3 && (
            <div style={{background:'rgba(255,193,7,.2)',
              border:'1px solid rgba(255,193,7,.5)',
              borderRadius:6,padding:'6px 12px',fontSize:11,
              color:'#FFD700'}}>
              ⚠️ Only {rfqInfo.quotesReceived}/3 quotes received.<br/>
              Remaining supplier blocks are empty — fill manually.
            </div>
          )}
        </div>
      )}

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
      {suppliers.slice(0, activeBlocks).map((sup, idx) => (
        <SupplierBlock key={idx} sup={sup} idx={idx}
          vendors={vendorList}
          quotedVendors={quotedVendors}
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
      {activeBlocks < 3 && (
        <div style={{textAlign:'center',padding:'10px 0'}}>
          <button onClick={()=>setActiveBlocks(p=>Math.min(p+1,3))}
            style={{padding:'6px 20px',background:'#F8F4F8',
              border:'2px dashed #714B67',borderRadius:6,
              color:'#714B67',fontSize:12,cursor:'pointer',
              fontWeight:600}}>
            + Add Supplier Block
          </button>
        </div>
      )}

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
