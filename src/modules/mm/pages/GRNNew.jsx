import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { mmApi } from '../services/mmApi'

const inp = { padding:'7px 10px', border:'1.5px solid #E0D5E0',
  borderRadius:5, fontSize:12, outline:'none', width:'100%',
  boxSizing:'border-box', fontFamily:'DM Sans,sans-serif' }

export default function GRNNew() {
  const nav = useNavigate()
  const [params] = useSearchParams()
  const [pos,     setPOs]    = useState([])
  const [selPO,   setSelPO]  = useState(null)
  const [saving,  setSaving] = useState(false)
  const [lines,   setLines]  = useState([])
  const [hdr,     setHdr]    = useState({
    poId:'', poNo:'', vendorName:'', grnDate: new Date().toISOString().split('T')[0],
    dcNo:'', vehicleNo:'', receivedAt:'Ranipet Main Store', remarks:''
  })

  useEffect(()=>{
    mmApi.getPOList()  // load all POs, filter relevant ones
      .then(d=>setPOs(d.data||[]))
      .catch(()=>{})
    // If PO pre-selected from POList
    const prePoId = params.get('po')
    if (prePoId) loadPO(parseInt(prePoId))
  }, [])

  const loadPO = async (id) => {
    try {
      const data = await mmApi.getPO(id)
      const po   = data.data
      setSelPO(po)
      setHdr(p=>({ ...p, poId:po.id, poNo:po.poNo, vendorName:po.vendorName }))
      setLines(po.lines.map((l,i)=>({
        lineNo:i+1, poLineId:l.id,
        itemCode:l.itemCode||'', itemName:l.itemName,
        orderedQty:parseFloat(l.qty||0),
        alreadyRecv:parseFloat(l.receivedQty||0),
        receivedQty:parseFloat(l.pendingQty||0),
        unit:l.unit||'Nos',
        quality:'Accepted', binLocation:'', remarks:''
      })))
    } catch(e){ toast.error(e.message) }
  }

  const onPOChange = e => {
    const po = pos.find(p=>p.id===parseInt(e.target.value))
    if (po) loadPO(po.id)
  }

  const updateLine = (i, field, val) =>
    setLines(prev=>prev.map((l,idx)=>idx===i?{...l,[field]:val}:l))

  const save = async (status='POSTED') => {
    if (!hdr.vendorName) return toast.error('Select a PO first!')
    if (!lines.length)   return toast.error('No items to receive!')
    setSaving(true)
    try {
      const data = await mmApi.createGRN({
        ...hdr,
        status,
        lines: lines.map(l=>({
          lineNo:l.lineNo, poLineId:l.poLineId||null,
          itemCode:l.itemCode, itemName:l.itemName,
          orderedQty:l.orderedQty, receivedQty:l.receivedQty,
          unit:l.unit, quality:l.quality,
          binLocation:l.binLocation, remarks:l.remarks
        }))
      })
      toast.success(data.message)
      nav('/mm/grn')
    } catch(e){ toast.error(e.message) } finally { setSaving(false) }
  }

  return (
    <div>
      <div className="lv-hdr">
        <div className="lv-ttl">Record Goods Receipt <small>MIGO · GRN Entry</small></div>
        <div className="lv-acts">
          <button className="btn btn-s sd-bsm"
            onClick={()=>nav('/mm/grn')}>✕ Cancel</button>
          <button className="btn btn-s sd-bsm"
            disabled={saving} onClick={()=>save('DRAFT')}>
            💾 Save Draft
          </button>
          <button className="btn btn-p sd-bsm"
            disabled={saving} onClick={()=>save('POSTED')}>
            {saving?'⏳ Posting...':'📦 Post GRN'}
          </button>
        </div>
      </div>

      {/* GRN Header */}
      <div className="mm-fs">
        <div className="mm-fsh">GRN Header — Link to Purchase Order</div>
        <div className="mm-fsb">
          <div className="mm-fr3">
            <div className="mm-fg"><label>GRN Number</label>
              <input style={inp} readOnly value="Auto-generated on save" /></div>
            <div className="mm-fg"><label>GRN Date *</label>
              <input type="date" style={inp} value={hdr.grnDate}
                onChange={e=>setHdr(p=>({...p,grnDate:e.target.value}))} /></div>
            <div className="mm-fg"><label>Reference PO *</label>
              <select style={{ ...inp, cursor:'pointer' }}
                value={hdr.poId}
                onChange={onPOChange}>
                <option value="">-- Select PO --</option>
                {pos.map(p=>(
                  <option key={p.id} value={p.id}>
                    {p.poNo} · {p.vendorName} · ₹{Number(p.totalAmount||0).toLocaleString('en-IN')}
                  </option>
                ))}
              </select></div>
          </div>
          <div className="mm-fr3">
            <div className="mm-fg"><label>Vendor Name</label>
              <input style={inp} readOnly value={hdr.vendorName} /></div>
            <div className="mm-fg"><label>Delivery Challan No.</label>
              <input style={inp} value={hdr.dcNo}
                onChange={e=>setHdr(p=>({...p,dcNo:e.target.value}))}
                placeholder="DC / Challan No." /></div>
            <div className="mm-fg"><label>Vehicle No.</label>
              <input style={inp} value={hdr.vehicleNo}
                onChange={e=>setHdr(p=>({...p,vehicleNo:e.target.value}))}
                placeholder="TN 01 AB 1234" /></div>
          </div>
          <div className="mm-fr3">
            <div className="mm-fg"><label>Received at Location</label>
              <select style={inp}
                onChange={e=>setHdr(p=>({...p,receivedAt:e.target.value}))}>
                {['Ranipet Main Store','Warehouse B','Production Floor'].map(l=>(
                  <option key={l}>{l}</option>
                ))}
              </select></div>
            <div className="mm-fg"><label>Remarks</label>
              <input style={inp} value={hdr.remarks}
                onChange={e=>setHdr(p=>({...p,remarks:e.target.value}))}
                placeholder="Any notes..." /></div>
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="mm-fs">
        <div className="mm-fsh">Items Received</div>
        <div className="mm-fsb" style={{ padding:0 }}>
          {lines.length===0 ? (
            <div style={{ padding:30, textAlign:'center', color:'#6C757D' }}>
              Select a PO above to load items
            </div>
          ) : (
            <div className="mm-lt-wrap">
              <table className="mm-lt">
                <thead>
                  <tr>
                    <th>#</th><th>Material</th><th>PO Qty</th>
                    <th>Already Recv.</th><th>Recv. Qty</th>
                    <th>Unit</th><th>Quality</th>
                    <th>Bin / Loc.</th><th>Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {lines.map((l,i)=>(
                    <tr key={i}>
                      <td>{i+1}</td>
                      <td style={{ fontWeight:600 }}>{l.itemName}</td>
                      <td style={{ color:'#6C757D', textAlign:'center' }}>
                        {l.orderedQty} {l.unit}</td>
                      <td style={{ color:'#856404', textAlign:'center' }}>
                        {l.alreadyRecv} {l.unit}</td>
                      <td>
                        <input type="number"
                          value={l.receivedQty} min={0}
                          max={l.orderedQty-l.alreadyRecv}
                          style={{ width:70, fontSize:11,
                            border:'1px solid #E0D5E0', borderRadius:4,
                            padding:'3px 5px' }}
                          onChange={e=>updateLine(i,'receivedQty',e.target.value)} />
                      </td>
                      <td>{l.unit}</td>
                      <td>
                        <select style={{ width:115, fontSize:11,
                          border:'1px solid #E0D5E0', borderRadius:4,
                          padding:'3px' }}
                          value={l.quality}
                          onChange={e=>updateLine(i,'quality',e.target.value)}>
                          <option>Accepted</option>
                          <option>Rejected</option>
                          <option value="QC_Pending">⏳ QC Pending</option>
                        </select>
                      </td>
                      <td>
                        <input value={l.binLocation}
                          style={{ width:80, fontSize:11,
                            border:'1px solid #E0D5E0', borderRadius:4,
                            padding:'3px' }}
                          placeholder="BIN-A01"
                          onChange={e=>updateLine(i,'binLocation',e.target.value)} />
                      </td>
                      <td>
                        <input value={l.remarks}
                          style={{ width:110, fontSize:11,
                            border:'1px solid #E0D5E0', borderRadius:4,
                            padding:'3px' }}
                          placeholder="Remarks..."
                          onChange={e=>updateLine(i,'remarks',e.target.value)} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
