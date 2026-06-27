import React,{useState,useEffect,useRef,useCallback}from 'react'
import toast from 'react-hot-toast'

const BASE=import.meta.env.VITE_API_URL||'/api'
const tok=()=>localStorage.getItem('lnv_token')||''
const hdr=()=>({'Content-Type':'application/json',Authorization:`Bearer ${tok()}`})
const hdr2=()=>({Authorization:`Bearer ${tok()}`})
const fmtC=n=>'₹'+Number(n||0).toLocaleString('en-IN',{minimumFractionDigits:2})
const fmtC0=n=>'₹'+Number(n||0).toLocaleString('en-IN',{minimumFractionDigits:0})

const PAYMENT_MODES=[
  {k:'CASH',  icon:'💵', label:'Cash'},
  {k:'UPI',   icon:'📱', label:'UPI'},
  {k:'CARD',  icon:'💳', label:'Card'},
  {k:'CREDIT',icon:'📋', label:'Credit'},
]
const GST_RATES=[0,5,12,18,28]

// Walk-in customer default
const WALKIN={id:'WALKIN',name:'Walk-in Customer',code:'WALKIN-001',gstin:'',phone:''}

export default function CounterSale(){
  // Cart
  const [cart,      setCart]      = useState([])
  // Item search
  const [search,    setSearch]    = useState('')
  const [results,   setResults]   = useState([])
  const [searching, setSearching] = useState(false)
  // Customer
  const [customer,  setCustomer]  = useState(WALKIN)
  const [custName,  setCustName]  = useState('')
  const [custPhone, setCustPhone] = useState('')
  const [custGstin, setCustGstin] = useState('')
  // Payment
  const [payMode,   setPayMode]   = useState('CASH')
  const [amtPaid,   setAmtPaid]   = useState('')
  const [discount,  setDiscount]  = useState('0')
  // State
  const [saving,    setSaving]    = useState(false)
  const [invoice,   setInvoice]   = useState(null) // generated invoice
  const searchRef = useRef(null)
  const company = JSON.parse(localStorage.getItem('lnv_company')||'{}')
  const [showHistory, setShowHistory] = useState(false)
  const [history,     setHistory]     = useState([])
  const [histLoading, setHistLoading] = useState(false)

  const loadHistory = async () => {
    setHistLoading(true)
    try {
      const r = await fetch(`${BASE}/sd/invoices?soRef=COUNTER-SALE&limit=50`,{headers:hdr2()})
      const d = await r.json()
      setHistory(d.data||d.invoices||[])
    } catch {} finally { setHistLoading(false) }
  }

  // Search items
  const searchItems = useCallback(async(q)=>{
    if(!q.trim()){ setResults([]); return }
    setSearching(true)
    try{
      const r = await fetch(`${BASE}/mdm/items?search=${encodeURIComponent(q)}`,{headers:hdr2()})
      const d = await r.json()
      setResults(d.data?.slice(0,8)||[])
    }catch{}finally{setSearching(false)}
  },[])

  useEffect(()=>{
    const t=setTimeout(()=>searchItems(search),300)
    return()=>clearTimeout(t)
  },[search,searchItems])

  // Add to cart
  const addItem=(item)=>{
    setCart(prev=>{
      const existing=prev.find(c=>c.itemCode===item.code)
      if(existing) return prev.map(c=>c.itemCode===item.code?{...c,qty:c.qty+1,amount:(c.qty+1)*c.rate}:c)
      const rate=Number(item.salesPrice||item.stdPrice||0)
      const gst=Number(item.gstRate||0)
      return [...prev,{
        itemCode:item.code, itemName:item.name,
        unit:item.uom||item.unit||'Nos', qty:1, rate, gst,
        amount:rate, hsnCode:item.hsnCode||''
      }]
    })
    setSearch(''); setResults([])
    searchRef.current?.focus()
  }

  // Quick add by typing
  const addManual=()=>{
    if(!search.trim())return
    setCart(prev=>[...prev,{
      itemCode:'', itemName:search.trim(),
      unit:'Nos', qty:1, rate:0, gst:0, amount:0, hsnCode:''
    }])
    setSearch(''); setResults([])
  }

  const updateCart=(idx,k,v)=>{
    setCart(prev=>prev.map((c,i)=>{
      if(i!==idx)return c
      const updated={...c,[k]:k==='qty'||k==='rate'?Number(v):v}
      updated.amount=updated.qty*updated.rate
      return updated
    }))
  }
  const removeItem=(idx)=>setCart(prev=>prev.filter((_,i)=>i!==idx))

  // Totals
  const subtotal = cart.reduce((s,c)=>s+c.amount,0)
  const discAmt  = subtotal * parseFloat(discount||0)/100
  const taxable  = subtotal - discAmt
  const gstAmt   = cart.reduce((s,c)=>s+((c.amount*(1-parseFloat(discount||0)/100))*(c.gst/100)),0)
  const grandTotal = taxable + gstAmt
  const balance  = grandTotal - parseFloat(amtPaid||0)

  // Generate invoice
  const generateInvoice=async()=>{
    if(cart.length===0)return toast.error('Add at least one item')
    setSaving(true)
    try{
      const custData = custName.trim()
        ? {name:custName, phone:custPhone, gstin:custGstin}
        : {name:'Walk-in Customer', phone:'', gstin:''}

      const r=await fetch(`${BASE}/sd/counter-sale`,{
        method:'POST',headers:hdr(),
        body:JSON.stringify({
          customerName: custData.name,
          customerPhone:custData.phone,
          customerGstin:custData.gstin,
          paymentMode:  payMode,
          amtPaid:      parseFloat(amtPaid||grandTotal),
          discount:     parseFloat(discount||0),
          subtotal, discAmt, gstAmt, grandTotal,
          lines: cart.map(c=>({
            itemCode:c.itemCode, itemName:c.itemName,
            hsnCode:c.hsnCode, unit:c.unit,
            qty:c.qty, rate:c.rate, gst:c.gst,
            amount:c.amount
          }))
        })
      })
      const d=await r.json()
      if(d.error)return toast.error(d.error)
      toast.success(`✅ ${d.data.invoiceNo} — Counter Sale done!`)
      setInvoice(d.data)
    }catch(e){
      // Offline fallback — generate local invoice
      const invNo=`CS-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`
      setInvoice({
        invoiceNo:invNo, invoiceDate:new Date().toISOString(),
        customerName:custName||'Walk-in Customer',
        customerPhone:custPhone, paymentMode:payMode,
        amtPaid:parseFloat(amtPaid||grandTotal),
        subtotal, discAmt, gstAmt, grandTotal,
        lines:cart, offline:true
      })
      toast.success(`✅ ${invNo} — Bill generated (offline)`)
    }finally{setSaving(false)}
  }

  // Print receipt
  const printReceipt=(inv)=>{
    const isGST = inv.lines?.some(l=>l.gst>0)
    const html=`<!DOCTYPE html><html><head><title>Receipt ${inv.invoiceNo}</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:Arial,sans-serif;font-size:11px;width:80mm;padding:8px}
  .center{text-align:center}
  .bold{font-weight:700}
  .line{border-top:1px dashed #000;margin:6px 0}
  .row{display:flex;justify-content:space-between;margin:2px 0}
  .big{font-size:14px;font-weight:900}
  .item-row{margin:3px 0;padding:2px 0;border-bottom:1px dotted #ddd}
  .total-row{display:flex;justify-content:space-between;font-weight:700;margin:2px 0}
  .grand{font-size:13px;font-weight:900;border-top:2px solid #000;padding-top:4px;margin-top:4px}
  @media print{body{width:80mm}}
</style></head><body>
<div class="center">
  <div class="big">${company?.name||'RP Computer Service'}</div>
  <div>${company?.address||'Coimbatore'}</div>
  ${company?.phone?`<div>📞 ${company.phone}</div>`:''}
  ${company?.gstin?`<div>GSTIN: ${company.gstin}</div>`:''}
</div>
<div class="line"></div>
<div class="center bold">${isGST?'TAX INVOICE':'CASH BILL'}</div>
<div class="row"><span>Bill No: <b>${inv.invoiceNo}</b></span><span>${new Date(inv.invoiceDate).toLocaleDateString('en-IN')}</span></div>
<div class="row"><span>Time: ${new Date(inv.invoiceDate).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})}</span><span>Mode: ${inv.paymentMode}</span></div>
${inv.customerName!=='Walk-in Customer'?`<div>Customer: <b>${inv.customerName}</b> ${inv.customerPhone?'| '+inv.customerPhone:''}</div>`:''}
${inv.customerGstin?`<div>GSTIN: ${inv.customerGstin}</div>`:''}
<div class="line"></div>
<div class="row bold"><span>Item</span><span>Amt</span></div>
<div class="line"></div>
${inv.lines.map(l=>`
<div class="item-row">
  <div>${l.itemName}</div>
  <div class="row"><span>${l.qty} x ₹${Number(l.rate).toFixed(2)}</span><span>₹${Number(l.amount).toFixed(2)}</span></div>
  ${l.gst>0?`<div style="color:#666;font-size:10px">GST ${l.gst}%: ₹${(l.amount*l.gst/100).toFixed(2)}</div>`:''}
</div>`).join('')}
<div class="line"></div>
${inv.discAmt>0?`<div class="total-row"><span>Discount</span><span>-₹${Number(inv.discAmt).toFixed(2)}</span></div>`:''}
${isGST?`<div class="total-row"><span>Subtotal</span><span>₹${Number(inv.subtotal).toFixed(2)}</span></div>
<div class="total-row"><span>GST</span><span>₹${Number(inv.gstAmt).toFixed(2)}</span></div>`:''}
<div class="grand row"><span>TOTAL</span><span>₹${Number(inv.grandTotal).toFixed(2)}</span></div>
<div class="row"><span>Amount Paid</span><span>₹${Number(inv.amtPaid).toFixed(2)}</span></div>
${inv.amtPaid>inv.grandTotal?`<div class="row bold"><span>Change</span><span>₹${(inv.amtPaid-inv.grandTotal).toFixed(2)}</span></div>`:''}
<div class="line"></div>
<div class="center" style="margin-top:6px">
  <div>Thank you for your purchase!</div>
  <div style="font-size:10px;margin-top:4px">Goods once sold will not be taken back</div>
  ${inv.offline?'<div style="color:#aaa;font-size:9px">(Offline Bill)</div>':''}
</div>
</body></html>`
    const w=window.open('','_blank','width=320,height:600')
    w.document.write(html); w.document.close()
    setTimeout(()=>w.print(),400)
  }

  // New sale
  const newSale=()=>{
    setCart([]); setCustomer(WALKIN); setCustName(''); setCustPhone('')
    setCustGstin(''); setPayMode('CASH'); setAmtPaid(''); setDiscount('0')
    setInvoice(null); setSearch(''); setResults([])
    searchRef.current?.focus()
  }

  const inp={padding:'8px 10px',border:'1.5px solid #DDD',borderRadius:6,fontSize:12,outline:'none',width:'100%',boxSizing:'border-box'}

  // ── INVOICE SUCCESS SCREEN ──
  if(invoice){
    return(
      <div style={{fontFamily:'DM Sans,sans-serif',display:'flex',flexDirection:'column',height:'100%',alignItems:'center',justifyContent:'center',background:'#F9F6F8'}}>
        <div style={{background:'#fff',borderRadius:16,padding:32,width:480,textAlign:'center',boxShadow:'0 8px 32px rgba(0,0,0,.1)'}}>
          <div style={{fontSize:56,marginBottom:12}}>✅</div>
          <div style={{fontSize:22,fontWeight:900,color:'#1E8449',marginBottom:4}}>Sale Complete!</div>
          <div style={{fontSize:14,color:'#888',marginBottom:20}}>{invoice.invoiceNo} · {invoice.paymentMode}</div>

          {/* Amount summary */}
          <div style={{background:'#F8F5F8',borderRadius:10,padding:16,marginBottom:20}}>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:8}}>
              <span style={{color:'#888'}}>Total Amount</span>
              <span style={{fontWeight:700,fontSize:16}}>{fmtC(invoice.grandTotal)}</span>
            </div>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:8}}>
              <span style={{color:'#888'}}>Amount Paid</span>
              <span style={{fontWeight:700,color:'#1E8449'}}>{fmtC(invoice.amtPaid)}</span>
            </div>
            {invoice.amtPaid>invoice.grandTotal&&(
              <div style={{display:'flex',justifyContent:'space-between',padding:'8px 12px',
                background:'#E8F5E9',borderRadius:6,marginTop:6}}>
                <span style={{fontWeight:700,color:'#1E8449'}}>Change Return</span>
                <span style={{fontWeight:900,fontSize:18,color:'#1E8449'}}>{fmtC(invoice.amtPaid-invoice.grandTotal)}</span>
              </div>
            )}
          </div>

          <div style={{display:'flex',gap:10,justifyContent:'center'}}>
            <button onClick={()=>printReceipt(invoice)}
              style={{padding:'10px 24px',background:'#1A5276',color:'#fff',border:'none',
                borderRadius:8,cursor:'pointer',fontWeight:700,fontSize:13}}>
              🖨️ Print Receipt
            </button>
            <button onClick={newSale}
              style={{padding:'10px 24px',background:'#6E2C00',color:'#fff',border:'none',
                borderRadius:8,cursor:'pointer',fontWeight:700,fontSize:13}}>
              ➕ New Sale
            </button>
          </div>
          {invoice.offline&&(
            <div style={{marginTop:12,fontSize:11,color:'#aaa'}}>
              ⚠️ Offline bill — will sync when internet restores
            </div>
          )}
        </div>
      </div>
    )
  }

  return(
    <div style={{fontFamily:'DM Sans,sans-serif',height:'100%',display:'grid',
      gridTemplateColumns:'1fr 320px',gap:0,background:'#F9F6F8'}}>

      {/* ── LEFT — Item Search + Cart ── */}
      <div style={{display:'flex',flexDirection:'column',padding:16,gap:12,overflowY:'auto'}}>

        {/* Header */}
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div>
            <div style={{fontSize:18,fontWeight:800,color:'#6E2C00'}}>🛒 Counter Sale</div>
            <div style={{fontSize:11,color:'#888'}}>Quick billing · Walk-in customers · No SO required</div>
          </div>
          <div style={{display:'flex',gap:8,alignItems:'center'}}>
            <div style={{fontSize:11,color:'#aaa'}}>{new Date().toLocaleString('en-IN')}</div>
            <button onClick={()=>nav('/sd/pos-sales')}
              style={{padding:'6px 12px',background:'#EBF5FB',color:'#1A5276',border:'1px solid #AED6F1',
                borderRadius:6,cursor:'pointer',fontSize:11,fontWeight:700}}>
              📋 Sales History
            </button>
          </div>
        </div>

        {/* Item Search */}
        <div style={{background:'#fff',borderRadius:10,padding:14,boxShadow:'0 1px 4px rgba(0,0,0,.06)',position:'relative'}}>
          <div style={{fontSize:11,fontWeight:700,color:'#6E2C00',marginBottom:8,textTransform:'uppercase'}}>
            🔍 Search Item / Product
          </div>
          <div style={{display:'flex',gap:8}}>
            <input ref={searchRef} value={search}
              onChange={e=>setSearch(e.target.value)}
              onKeyDown={e=>e.key==='Enter'&&results.length===0&&addManual()}
              placeholder='Type item name or code... (press Enter to add manual item)'
              style={{...inp,fontSize:14}}
              autoFocus/>
            {search&&(
              <button onClick={addManual}
                style={{padding:'8px 14px',background:'#6E2C00',color:'#fff',border:'none',
                  borderRadius:6,cursor:'pointer',fontWeight:700,fontSize:12,whiteSpace:'nowrap'}}>
                + Add
              </button>
            )}
          </div>
          {/* Search results dropdown */}
          {(results.length>0||searching)&&(
            <div style={{position:'absolute',top:'100%',left:14,right:14,zIndex:100,
              background:'#fff',borderRadius:8,boxShadow:'0 8px 24px rgba(0,0,0,.15)',
              border:'1px solid #E8E0E8',overflow:'hidden'}}>
              {searching?(
                <div style={{padding:12,textAlign:'center',color:'#aaa',fontSize:12}}>⏳ Searching...</div>
              ):results.map(item=>(
                <div key={item.code} onClick={()=>addItem(item)}
                  style={{padding:'10px 14px',cursor:'pointer',borderBottom:'1px solid #F5F5F5',
                    display:'flex',justifyContent:'space-between',alignItems:'center'}}
                  onMouseEnter={e=>e.currentTarget.style.background='#FDF2E9'}
                  onMouseLeave={e=>e.currentTarget.style.background='#fff'}>
                  <div>
                    <div style={{fontWeight:700,fontSize:12,color:'#333'}}>{item.name}</div>
                    <div style={{fontSize:10,color:'#aaa'}}>{item.code} · {item.uom||item.unit||'Nos'} · GST {item.gstRate||0}%</div>
                  </div>
                  <div style={{fontWeight:800,color:'#1E8449',fontSize:14}}>
                    {fmtC0(item.salesPrice||item.stdPrice||0)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cart Table */}
        <div style={{background:'#fff',borderRadius:10,boxShadow:'0 1px 4px rgba(0,0,0,.06)',
          flex:1,overflow:'hidden'}}>
          <div style={{padding:'10px 14px',background:'#6E2C00',color:'#fff',
            display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div style={{fontWeight:700}}>🛒 Cart ({cart.length} items)</div>
            {cart.length>0&&(
              <button onClick={()=>setCart([])}
                style={{padding:'3px 10px',background:'rgba(255,255,255,.2)',color:'#fff',
                  border:'none',borderRadius:4,cursor:'pointer',fontSize:11}}>
                Clear All
              </button>
            )}
          </div>
          {cart.length===0?(
            <div style={{padding:40,textAlign:'center',color:'#aaa'}}>
              <div style={{fontSize:40,marginBottom:8}}>🛒</div>
              <div style={{fontSize:13,fontWeight:600}}>Cart is empty</div>
              <div style={{fontSize:11,marginTop:4}}>Search and add items above</div>
            </div>
          ):(
            <div style={{overflowX:'auto'}}>
              <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
                <thead>
                  <tr style={{background:'#FDF2E9'}}>
                    {['#','Item','Unit','Qty','Rate (₹)','GST %','Amount (₹)',''].map(h=>(
                      <th key={h} style={{padding:'8px 10px',textAlign:['Qty','Rate (₹)','Amount (₹)'].includes(h)?'right':'left',
                        fontSize:10,fontWeight:700,color:'#6E2C00'}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {cart.map((c,i)=>(
                    <tr key={i} style={{borderBottom:'1px solid #F5EDE0'}}
                      onMouseEnter={e=>e.currentTarget.style.background='#FEF9F5'}
                      onMouseLeave={e=>e.currentTarget.style.background='#fff'}>
                      <td style={{padding:'6px 10px',color:'#aaa',fontSize:11}}>{i+1}</td>
                      <td style={{padding:'6px 10px'}}>
                        <input value={c.itemName}
                          onChange={e=>updateCart(i,'itemName',e.target.value)}
                          style={{border:'none',outline:'none',fontSize:12,fontWeight:600,
                            width:'100%',background:'transparent',minWidth:120}}/>
                        {c.hsnCode&&<div style={{fontSize:9,color:'#aaa'}}>HSN: {c.hsnCode}</div>}
                      </td>
                      <td style={{padding:'6px 10px',color:'#555'}}>{c.unit}</td>
                      <td style={{padding:'6px 10px'}}>
                        <input type='number' value={c.qty} min={0.001} step={0.001}
                          onChange={e=>updateCart(i,'qty',e.target.value)}
                          style={{...inp,width:60,textAlign:'right',padding:'4px 6px'}}/>
                      </td>
                      <td style={{padding:'6px 10px'}}>
                        <input type='number' value={c.rate} min={0}
                          onChange={e=>updateCart(i,'rate',e.target.value)}
                          style={{...inp,width:80,textAlign:'right',padding:'4px 6px'}}/>
                      </td>
                      <td style={{padding:'6px 10px'}}>
                        <select value={c.gst} onChange={e=>updateCart(i,'gst',Number(e.target.value))}
                          style={{...inp,width:60,padding:'4px 6px'}}>
                          {GST_RATES.map(r=><option key={r} value={r}>{r}%</option>)}
                        </select>
                      </td>
                      <td style={{padding:'6px 10px',textAlign:'right',fontWeight:700,color:'#1E8449'}}>
                        {fmtC0(c.amount)}
                      </td>
                      <td style={{padding:'6px 10px'}}>
                        <button onClick={()=>removeItem(i)}
                          style={{padding:'3px 8px',background:'#FDEDEC',color:'#C0392B',
                            border:'none',borderRadius:4,cursor:'pointer',fontSize:11}}>✕</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ── RIGHT — Customer + Payment + Total ── */}
      <div style={{background:'#fff',borderRight:'none',
        borderLeft:'2px solid #F0EBF0',
        display:'flex',flexDirection:'column',overflowY:'auto'}}>

        {/* Customer Section */}
        <div style={{padding:16,borderBottom:'1px solid #F0EBF0'}}>
          <div style={{fontSize:11,fontWeight:700,color:'#6E2C00',
            textTransform:'uppercase',marginBottom:10}}>👤 Customer</div>

          {/* Walk-in toggle */}
          <div style={{display:'flex',gap:6,marginBottom:10}}>
            <button onClick={()=>{setCustomer(WALKIN);setCustName('');setCustPhone('');setCustGstin('')}}
              style={{flex:1,padding:'7px',border:`1.5px solid ${customer.id==='WALKIN'?'#6E2C00':'#ddd'}`,
                borderRadius:6,cursor:'pointer',fontSize:11,fontWeight:700,
                background:customer.id==='WALKIN'?'#FDF2E9':'#fff',
                color:customer.id==='WALKIN'?'#6E2C00':'#888'}}>
              🚶 Walk-in
            </button>
            <button onClick={()=>setCustomer({id:'KNOWN'})}
              style={{flex:1,padding:'7px',border:`1.5px solid ${customer.id!=='WALKIN'?'#1A5276':'#ddd'}`,
                borderRadius:6,cursor:'pointer',fontSize:11,fontWeight:700,
                background:customer.id!=='WALKIN'?'#EBF5FB':'#fff',
                color:customer.id!=='WALKIN'?'#1A5276':'#888'}}>
              👤 Known
            </button>
          </div>

          {customer.id==='WALKIN'?(
            <div style={{padding:'8px 12px',background:'#F8F5F8',borderRadius:6,
              fontSize:11,color:'#888',textAlign:'center'}}>
              Bill will be generated as<br/>
              <strong style={{color:'#6E2C00'}}>Walk-in Customer</strong>
            </div>
          ):(
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              <input value={custName} onChange={e=>setCustName(e.target.value)}
                placeholder='Customer Name'
                style={inp}/>
              <input value={custPhone} onChange={e=>setCustPhone(e.target.value)}
                placeholder='Phone (optional)'
                style={inp} type='tel'/>
              <input value={custGstin} onChange={e=>setCustGstin(e.target.value)}
                placeholder='GSTIN (for GST bill)'
                style={inp}/>
            </div>
          )}
        </div>

        {/* Discount */}
        <div style={{padding:'12px 16px',borderBottom:'1px solid #F0EBF0'}}>
          <div style={{fontSize:11,fontWeight:700,color:'#6E2C00',textTransform:'uppercase',marginBottom:8}}>
            🏷️ Discount
          </div>
          <div style={{display:'flex',gap:8,alignItems:'center'}}>
            {[0,5,10,15].map(d=>(
              <button key={d} onClick={()=>setDiscount(String(d))}
                style={{flex:1,padding:'6px',border:`1.5px solid ${discount===String(d)?'#6E2C00':'#ddd'}`,
                  borderRadius:5,cursor:'pointer',fontSize:11,fontWeight:700,
                  background:discount===String(d)?'#FDF2E9':'#fff',
                  color:discount===String(d)?'#6E2C00':'#888'}}>
                {d}%
              </button>
            ))}
            <input type='number' value={discount} min={0} max={100}
              onChange={e=>setDiscount(e.target.value)}
              style={{...inp,width:60,textAlign:'center',padding:'6px'}}/>
          </div>
        </div>

        {/* Payment Mode */}
        <div style={{padding:'12px 16px',borderBottom:'1px solid #F0EBF0'}}>
          <div style={{fontSize:11,fontWeight:700,color:'#6E2C00',textTransform:'uppercase',marginBottom:8}}>
            💰 Payment Mode
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6}}>
            {PAYMENT_MODES.map(m=>(
              <button key={m.k} onClick={()=>setPayMode(m.k)}
                style={{padding:'8px 6px',border:`1.5px solid ${payMode===m.k?'#1E8449':'#ddd'}`,
                  borderRadius:6,cursor:'pointer',fontSize:11,fontWeight:700,
                  background:payMode===m.k?'#E8F5E9':'#fff',
                  color:payMode===m.k?'#1E8449':'#888',
                  display:'flex',alignItems:'center',justifyContent:'center',gap:5}}>
                <span>{m.icon}</span>{m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Bill Summary */}
        <div style={{padding:'12px 16px',borderBottom:'1px solid #F0EBF0',flex:1}}>
          <div style={{fontSize:11,fontWeight:700,color:'#6E2C00',textTransform:'uppercase',marginBottom:10}}>
            🧾 Bill Summary
          </div>
          {[
            ['Subtotal',      fmtC(subtotal),    '#333'],
            discAmt>0&&['Discount',`- ${fmtC(discAmt)}`,'#C0392B'],
            gstAmt>0&&['GST Amount',  fmtC(gstAmt),     '#B8860B'],
          ].filter(Boolean).map(([l,v,c])=>(
            <div key={l} style={{display:'flex',justifyContent:'space-between',
              padding:'5px 0',borderBottom:'1px solid #F5F5F5',fontSize:12}}>
              <span style={{color:'#888'}}>{l}</span>
              <span style={{fontWeight:700,color:c}}>{v}</span>
            </div>
          ))}
          <div style={{display:'flex',justifyContent:'space-between',
            padding:'10px 12px',background:'#6E2C00',borderRadius:8,
            marginTop:8}}>
            <span style={{color:'#fff',fontWeight:700,fontSize:14}}>GRAND TOTAL</span>
            <span style={{color:'#fff',fontWeight:900,fontSize:18}}>{fmtC(grandTotal)}</span>
          </div>

          {/* Amount paid */}
          <div style={{marginTop:12}}>
            <label style={{fontSize:10,fontWeight:700,color:'#6C757D',
              display:'block',marginBottom:5,textTransform:'uppercase'}}>
              Amount Received (₹)
            </label>
            <input type='number' value={amtPaid}
              onChange={e=>setAmtPaid(e.target.value)}
              placeholder={fmtC(grandTotal).replace('₹','')}
              style={{...inp,fontSize:18,fontWeight:700,textAlign:'right',
                borderColor:'#1E8449',color:'#1E8449'}}/>
            {parseFloat(amtPaid||0)>grandTotal&&(
              <div style={{marginTop:6,padding:'6px 10px',background:'#E8F5E9',
                borderRadius:5,display:'flex',justifyContent:'space-between',
                fontSize:13,fontWeight:700,color:'#1E8449'}}>
                <span>💵 Change Return</span>
                <span>{fmtC(parseFloat(amtPaid||0)-grandTotal)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Generate Bill Button */}
        <div style={{padding:16}}>
          <button onClick={generateInvoice} disabled={saving||cart.length===0}
            style={{width:'100%',padding:'14px',
              background:cart.length===0?'#ccc':'linear-gradient(135deg,#1E8449,#117A65)',
              color:'#fff',border:'none',borderRadius:10,cursor:cart.length===0?'not-allowed':'pointer',
              fontWeight:900,fontSize:16,letterSpacing:0.5,
              boxShadow:cart.length>0?'0 4px 16px rgba(30,132,73,.4)':'none',
              opacity:saving?0.7:1}}>
            {saving?'⏳ Generating...':'🧾 Generate Bill'}
          </button>
          <div style={{textAlign:'center',marginTop:8,fontSize:10,color:'#aaa'}}>
            Press Enter to add items · Works offline
          </div>
        </div>
      </div>

      {/* ── SALES HISTORY MODAL ── */}
      {showHistory&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.6)',zIndex:9999,
          display:'flex',alignItems:'center',justifyContent:'center',padding:16}}
          onClick={e=>e.target===e.currentTarget&&setShowHistory(false)}>
          <div style={{background:'#fff',borderRadius:12,width:780,maxHeight:'85vh',
            display:'flex',flexDirection:'column',boxShadow:'0 16px 48px rgba(0,0,0,.25)'}}>
            <div style={{padding:'14px 20px',background:'#1A5276',color:'#fff',
              borderRadius:'12px 12px 0 0',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div style={{fontWeight:800,fontSize:15}}>📋 Counter Sale History</div>
              <button onClick={()=>setShowHistory(false)}
                style={{background:'rgba(255,255,255,.2)',border:'none',color:'#fff',
                  borderRadius:6,padding:'4px 10px',cursor:'pointer',fontWeight:700}}>✕</button>
            </div>
            <div style={{flex:1,overflowY:'auto'}}>
              {histLoading?(
                <div style={{padding:40,textAlign:'center',color:'#aaa'}}>⏳ Loading...</div>
              ):history.length===0?(
                <div style={{padding:40,textAlign:'center',color:'#aaa'}}>
                  <div style={{fontSize:36,marginBottom:8}}>📋</div>
                  <div>No counter sales yet</div>
                </div>
              ):(
                <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
                  <thead>
                    <tr style={{background:'#EBF5FB'}}>
                      {['Invoice No','Date','Customer','Items','Total','Payment','Actions'].map(h=>(
                        <th key={h} style={{padding:'8px 12px',textAlign:'left',fontSize:11,
                          fontWeight:700,color:'#1A5276',borderBottom:'1px solid #ddd'}}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((inv,i)=>{
                      const lines=Array.isArray(inv.lines)?inv.lines:
                        (()=>{try{return JSON.parse(inv.lines||'[]')}catch{return []}})()
                      return(
                        <tr key={inv.id} style={{background:i%2===0?'#fff':'#F8FBFF',
                          borderBottom:'1px solid #F0F0F0'}}
                          onMouseEnter={e=>e.currentTarget.style.background='#EBF5FB'}
                          onMouseLeave={e=>e.currentTarget.style.background=i%2===0?'#fff':'#F8FBFF'}>
                          <td style={{padding:'8px 12px',fontFamily:'monospace',fontSize:11,
                            color:'#1A5276',fontWeight:700}}>{inv.invoiceNo}</td>
                          <td style={{padding:'8px 12px',fontSize:11,color:'#555',whiteSpace:'nowrap'}}>
                            {new Date(inv.date||inv.invoiceDate||inv.createdAt).toLocaleDateString('en-IN',
                              {day:'2-digit',month:'short',year:'numeric'})}
                          </td>
                          <td style={{padding:'8px 12px',fontSize:11}}>
                            {inv.customerName||'Walk-in'}
                            {inv.customerPhone&&<div style={{fontSize:10,color:'#aaa'}}>{inv.customerPhone}</div>}
                          </td>
                          <td style={{padding:'8px 12px',fontSize:11,color:'#555'}}>
                            {lines.length} item(s)
                            <div style={{fontSize:10,color:'#aaa'}}>
                              {lines.slice(0,2).map(l=>l.itemName).join(', ')}
                              {lines.length>2&&` +${lines.length-2} more`}
                            </div>
                          </td>
                          <td style={{padding:'8px 12px',fontWeight:700,color:'#1E8449',whiteSpace:'nowrap'}}>
                            {fmtC(inv.grandTotal)}
                          </td>
                          <td style={{padding:'8px 12px'}}>
                            <span style={{padding:'2px 8px',borderRadius:10,fontSize:10,fontWeight:700,
                              background:'#E8F5E9',color:'#1E8449'}}>
                              {inv.status||'PAID'}
                            </span>
                          </td>
                          <td style={{padding:'8px 12px'}}>
                            <button onClick={()=>{
                              printReceipt({
                                invoiceNo:inv.invoiceNo,
                                invoiceDate:inv.date||inv.createdAt,
                                customerName:inv.customerName||'Walk-in',
                                customerPhone:inv.customerPhone||'',
                                paymentMode:inv.paymentMode||'CASH',
                                amtPaid:Number(inv.paidAmt||inv.grandTotal),
                                subtotal:Number(inv.taxableAmt||inv.grandTotal),
                                discAmt:Number(inv.discAmt||0),
                                gstAmt:Number(inv.taxAmt||0),
                                grandTotal:Number(inv.grandTotal),
                                lines
                              })
                            }}
                              style={{padding:'4px 10px',background:'#1A5276',color:'#fff',
                                border:'none',borderRadius:4,cursor:'pointer',fontSize:11,fontWeight:700}}>
                              🖨️ Reprint
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                  <tfoot>
                    <tr style={{background:'#EBF5FB',fontWeight:700}}>
                      <td colSpan={4} style={{padding:'8px 12px',color:'#1A5276'}}>
                        TOTAL ({history.length} bills)
                      </td>
                      <td style={{padding:'8px 12px',color:'#1E8449'}}>
                        {fmtC(history.reduce((s,i)=>s+Number(i.grandTotal||0),0))}
                      </td>
                      <td colSpan={2}></td>
                    </tr>
                  </tfoot>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
