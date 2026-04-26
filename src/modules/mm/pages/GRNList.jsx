import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useListView } from '@hooks/useListView'
import ListViewToggle from '@components/ui/ListViewToggle'
import toast from 'react-hot-toast'
import { mmApi } from '../services/mmApi'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const getToken = () => localStorage.getItem('lnv_token')
const fmtC = n => '₹'+Number(n||0).toLocaleString('en-IN',
  {minimumFractionDigits:2,maximumFractionDigits:2})

const STATUS = {
  DRAFT:      { bg:'#E9ECEF', color:'#383D41', label:'Draft'      },
  POSTED:     { bg:'#D4EDDA', color:'#155724', label:'Posted'      },
  QC_PENDING: { bg:'#FFF3CD', color:'#856404', label:'QC Pending'  },
  ACCEPTED:   { bg:'#D1ECF1', color:'#0C5460', label:'Accepted'    },
  REJECTED:   { bg:'#F8D7DA', color:'#721C24', label:'Rejected'    },
}

// ── GRN Detail Modal ───────────────────────────────────────
function GRNDetailModal({ grn, onClose }) {
  const nav = useNavigate()

  const qualColor = q => ({
    Accepted:   { bg:'#D4EDDA', color:'#155724' },
    Rejected:   { bg:'#F8D7DA', color:'#721C24' },
    QC_Pending: { bg:'#FFF3CD', color:'#856404' },
  }[q]||{ bg:'#E9ECEF', color:'#6C757D' })

  return (
    <div style={{ position:'fixed', inset:0,
      background:'rgba(0,0,0,.55)', display:'flex',
      alignItems:'center', justifyContent:'center', zIndex:9999 }}>
      <div style={{ background:'#fff', borderRadius:10,
        width:'90%', maxWidth:900, maxHeight:'90vh',
        display:'flex', flexDirection:'column',
        boxShadow:'0 20px 60px rgba(0,0,0,.3)' }}>

        {/* Header */}
        <div style={{ background:'linear-gradient(135deg,#714B67,#4A3050)',
          padding:'14px 20px', flexShrink:0,
          display:'flex', justifyContent:'space-between',
          alignItems:'center', borderRadius:'10px 10px 0 0' }}>
          <div>
            <h3 style={{ color:'#fff', margin:0,
              fontFamily:'Syne,sans-serif',
              fontSize:16, fontWeight:800 }}>
              📦 {grn.grnNo}
            </h3>
            <p style={{ color:'rgba(255,255,255,.7)',
              margin:'3px 0 0', fontSize:12 }}>
              PO: {grn.poNo||'—'} · {grn.vendorName} ·{' '}
              {new Date(grn.grnDate||grn.createdAt)
                .toLocaleDateString('en-IN')}
            </p>
          </div>
          <span onClick={onClose}
            style={{ color:'#fff', cursor:'pointer',
              fontSize:22 }}>✕</span>
        </div>

        <div style={{ overflowY:'auto', flex:1, padding:16 }}>
          {/* Info cards */}
          <div style={{ display:'grid',
            gridTemplateColumns:'1fr 1fr 1fr',
            gap:12, marginBottom:16 }}>
            {[
              ['Vendor',        grn.vendorName,   '🏢'],
              ['PO Reference',  grn.poNo||'—',    '📋'],
              ['DC / Challan',  grn.dcNo||'—',    '📄'],
              ['Vehicle No.',   grn.vehicleNo||'—','🚛'],
              ['Location',      grn.receivedAt||'—','📍'],
              ['GRN Status',
                STATUS[grn.status]?.label||grn.status, '📊'],
            ].map(([l,v,ic])=>(
              <div key={l} style={{ background:'#F8F7FA',
                borderRadius:8, padding:'10px 14px',
                border:'1px solid #E0D5E0' }}>
                <div style={{ fontSize:10, color:'#6C757D',
                  fontWeight:700, textTransform:'uppercase',
                  marginBottom:4 }}>
                  {ic} {l}
                </div>
                <div style={{ fontSize:13, fontWeight:700,
                  color:'#1C1C1C' }}>{v}</div>
              </div>
            ))}
          </div>

          {/* Items table */}
          <div style={{ border:'2px solid #714B67',
            borderRadius:8, overflow:'hidden',
            marginBottom:14 }}>
            <div style={{ background:'linear-gradient(135deg,#714B67,#4A3050)',
              padding:'8px 14px' }}>
              <span style={{ color:'#fff', fontSize:13,
                fontWeight:700 }}>
                📦 Items Received ({grn.lines?.length||0})
              </span>
            </div>
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%',
                borderCollapse:'collapse', fontSize:12 }}>
                <thead style={{ background:'#F8F4F8' }}>
                  <tr style={{ borderBottom:'2px solid #E0D5E0' }}>
                    {['#','Material','Ordered',
                      'Already Recv.','Received',
                      'Unit','Quality',
                      'Bin/Location','Remarks'].map(h=>(
                      <th key={h} style={{ padding:'8px 10px',
                        fontSize:10, fontWeight:700,
                        color:'#6C757D', textAlign:'left',
                        textTransform:'uppercase',
                        letterSpacing:.3,
                        whiteSpace:'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(grn.lines||[]).map((l,i)=>{
                    const qc = qualColor(l.quality)
                    return (
                      <tr key={i} style={{
                        borderBottom:'1px solid #F0EEF0',
                        background:i%2===0?'#fff':'#FDFBFD' }}>
                        <td style={{ padding:'8px 10px',
                          color:'#6C757D', fontWeight:700,
                          textAlign:'center' }}>
                          {i+1}
                        </td>
                        <td style={{ padding:'8px 10px',
                          fontWeight:600 }}>
                          {l.itemName}
                        </td>
                        <td style={{ padding:'8px 10px',
                          color:'#6C757D', textAlign:'right',
                          fontFamily:'DM Mono,monospace' }}>
                          {parseFloat(l.orderedQty||0)}
                        </td>
                        <td style={{ padding:'8px 10px',
                          color:'#856404', textAlign:'right',
                          fontFamily:'DM Mono,monospace' }}>
                          {parseFloat(l.orderedQty||0) -
                           parseFloat(l.receivedQty||0)}
                        </td>
                        <td style={{ padding:'8px 10px',
                          textAlign:'right', fontWeight:800,
                          color:'#155724',
                          fontFamily:'DM Mono,monospace' }}>
                          {parseFloat(l.receivedQty||0)}
                        </td>
                        <td style={{ padding:'8px 10px',
                          textAlign:'center' }}>
                          {l.unit}
                        </td>
                        <td style={{ padding:'8px 10px' }}>
                          <span style={{ padding:'2px 8px',
                            borderRadius:8, fontSize:11,
                            fontWeight:700,
                            background:qc.bg,
                            color:qc.color }}>
                            {l.quality}
                          </span>
                        </td>
                        <td style={{ padding:'8px 10px',
                          fontFamily:'DM Mono,monospace',
                          fontSize:11, color:'#6C757D' }}>
                          {l.binLocation||'—'}
                        </td>
                        <td style={{ padding:'8px 10px',
                          fontSize:11, color:'#6C757D' }}>
                          {l.remarks||'—'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                {/* Summary row */}
                <tfoot style={{ background:'#F8F4F8',
                  borderTop:'2px solid #714B67' }}>
                  <tr>
                    <td colSpan={3} style={{ padding:'8px 10px',
                      fontWeight:800, fontSize:12,
                      color:'#714B67' }}>
                      Total Items Received
                    </td>
                    <td colSpan={6} style={{ padding:'8px 10px',
                      textAlign:'left', fontSize:12 }}>
                      <span style={{ fontWeight:800,
                        color:'#155724',
                        fontFamily:'DM Mono,monospace' }}>
                        {(grn.lines||[]).reduce((s,l)=>
                          s+parseFloat(l.receivedQty||0),0)} units
                      </span>
                      {' '}across {grn.lines?.length||0} item(s)
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Remarks */}
          {grn.remarks && (
            <div style={{ background:'#FFF3CD',
              borderRadius:8, padding:'10px 14px',
              border:'1px solid #FFE69C', fontSize:12,
              color:'#856404' }}>
              📝 {grn.remarks}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding:'12px 20px',
          borderTop:'1px solid #E0D5E0', flexShrink:0,
          display:'flex', justifyContent:'space-between',
          alignItems:'center', background:'#F8F7FA',
          borderRadius:'0 0 10px 10px' }}>
          <div style={{ fontSize:11, color:'#6C757D' }}>
            Posted by system ·{' '}
            {new Date(grn.createdAt||Date.now())
              .toLocaleString('en-IN')}
          </div>
          <div style={{ display:'flex', gap:10 }}>
            <button onClick={()=>window.print()}
              style={{ padding:'8px 16px',
                background:'#fff', color:'#714B67',
                border:'1.5px solid #714B67',
                borderRadius:6, fontSize:12,
                cursor:'pointer', fontWeight:600 }}>
              🖨️ Print GRN
            </button>
            <button onClick={onClose}
              style={{ padding:'8px 24px',
                background:'#714B67', color:'#fff',
                border:'none', borderRadius:6,
                fontSize:13, fontWeight:700,
                cursor:'pointer' }}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── MAIN GRN LIST ──────────────────────────────────────────
export default function GRNList() {
  const nav = useNavigate()
  const { viewMode, toggleView } = useListView('MM-GRNList')
  const [grns,   setGRNs]  = useState([])
  const [loading,setLoad]  = useState(true)
  const [search, setSearch]= useState('')
  const [selGRN, setSelGRN]= useState(null)

  const fetchGRNs = useCallback(async () => {
    setLoad(true)
    try {
      const data = await mmApi.getGRNList()
      setGRNs(data.data||[])
    } catch(e){ toast.error(e.message) } finally { setLoad(false) }
  }, [])

  useEffect(()=>{ fetchGRNs() }, [])

  // Open GRN detail — fetch full with lines
  const openDetail = async (grn) => {
    try {
      const res  = await fetch(`${BASE_URL}/mm/grn/${grn.id}`,
        { headers:{ Authorization:`Bearer ${getToken()}` }})
      const data = await res.json()
      setSelGRN(data.data||grn)
    } catch { setSelGRN(grn) }
  }

  const filtered = grns.filter(g =>
    !search ||
    g.grnNo?.toLowerCase().includes(search.toLowerCase()) ||
    g.poNo?.toLowerCase().includes(search.toLowerCase()) ||
    g.vendorName?.toLowerCase().includes(search.toLowerCase()))

  return (
    <div>
      <div className="lv-hdr">
        <div className="lv-ttl">
          Goods Receipt Notes <small>MB51</small>
        </div>
        <div className="lv-acts">
          <ListViewToggle viewMode={viewMode} onToggle={toggleView} />
          <button className="btn btn-s sd-bsm">Export</button>
          <button className="btn btn-p sd-bsm"
            onClick={()=>nav('/mm/grn/new')}>
            + Record GRN
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display:'grid',
        gridTemplateColumns:'repeat(4,1fr)',
        gap:10, marginBottom:14 }}>
        {[
          { l:'Total GRNs',  v:grns.length,
            c:'#714B67', bg:'#EDE0EA' },
          { l:'Posted',
            v:grns.filter(g=>g.status==='POSTED').length,
            c:'#155724', bg:'#D4EDDA' },
          { l:'QC Pending',
            v:grns.filter(g=>g.status==='QC_PENDING').length,
            c:'#856404', bg:'#FFF3CD' },
          { l:'Draft',
            v:grns.filter(g=>g.status==='DRAFT').length,
            c:'#6C757D', bg:'#E9ECEF' },
        ].map(k=>(
          <div key={k.l} style={{ background:k.bg,
            borderRadius:8, padding:'10px 14px',
            border:`1px solid ${k.c}22` }}>
            <div style={{ fontSize:10, color:k.c,
              fontWeight:700, textTransform:'uppercase' }}>
              {k.l}
            </div>
            <div style={{ fontSize:22, fontWeight:800,
              color:k.c, fontFamily:'Syne,sans-serif' }}>
              {k.v}
            </div>
          </div>
        ))}
      </div>

      <div className="mm-filt">
        <div className="mm-fs-input">
          <input
            placeholder="Search GRN No., PO No., Vendor..."
            value={search}
            onChange={e=>setSearch(e.target.value)} />
        </div>
      </div>

      {loading ? (
        <div style={{ padding:40, textAlign:'center',
          color:'#6C757D' }}>⏳ Loading...</div>
      ) : filtered.length===0 ? (
        <div style={{ padding:60, textAlign:'center',
          color:'#6C757D', background:'#fff',
          borderRadius:8, border:'2px dashed #E0D5E0' }}>
          <div style={{ fontSize:32, marginBottom:12 }}>📦</div>
          <div style={{ fontWeight:700 }}>No GRN records</div>
          <button className="btn btn-p sd-bsm"
            style={{ marginTop:12 }}
            onClick={()=>nav('/mm/grn/new')}>
            + Record First GRN
          </button>
        </div>
      ) : (
        <div style={{ border:'1px solid #E0D5E0',
          borderRadius:8, overflow:'hidden' }}>
          <table style={{ width:'100%',
            borderCollapse:'collapse', fontSize:12 }}>
            <thead style={{ background:'#F8F4F8',
              position:'sticky', top:0 }}>
              <tr style={{ borderBottom:'2px solid #E0D5E0' }}>
                {['','GRN No.','PO No.','Vendor',
                  'Date','Items','DC No.',
                  'Status','Actions'].map(h=>(
                  <th key={h} style={{ padding:'8px 10px',
                    fontSize:10, fontWeight:700,
                    color:'#6C757D', textAlign:'left',
                    textTransform:'uppercase',
                    letterSpacing:.3,
                    whiteSpace:'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((g,i)=>{
                const sc = STATUS[g.status]||STATUS.POSTED
                return (
                  <tr key={g.id}
                    style={{ borderBottom:'1px solid #F0EEF0',
                      background:i%2===0?'#fff':'#FDFBFD',
                      cursor:'pointer' }}
                    onClick={()=>openDetail(g)}>
                    <td style={{ padding:'8px 10px',
                      width:30 }}>
                      <input type="checkbox"
                        onClick={e=>e.stopPropagation()} />
                    </td>
                    <td style={{ padding:'8px 10px' }}>
                      <strong style={{ color:'#714B67',
                        fontFamily:'DM Mono,monospace',
                        fontSize:12 }}>
                        {g.grnNo}
                      </strong>
                    </td>
                    <td style={{ padding:'8px 10px',
                      fontSize:11, color:'#714B67',
                      fontFamily:'DM Mono,monospace' }}>
                      {g.poNo||'—'}
                    </td>
                    <td style={{ padding:'8px 10px',
                      fontWeight:600 }}>
                      {g.vendorName}
                    </td>
                    <td style={{ padding:'8px 10px',
                      fontSize:11, color:'#6C757D' }}>
                      {new Date(g.grnDate||g.createdAt)
                        .toLocaleDateString('en-IN')}
                    </td>
                    <td style={{ padding:'8px 10px',
                      textAlign:'center', fontWeight:700,
                      color:'#714B67' }}>
                      {g.lines?.length||0} item(s)
                    </td>
                    <td style={{ padding:'8px 10px',
                      fontFamily:'DM Mono,monospace',
                      fontSize:11, color:'#6C757D' }}>
                      {g.dcNo||'—'}
                    </td>
                    <td style={{ padding:'8px 10px' }}>
                      <span style={{ padding:'2px 8px',
                        borderRadius:10, fontSize:11,
                        fontWeight:700,
                        background:sc.bg, color:sc.color }}>
                        {sc.label}
                      </span>
                    </td>
                    <td style={{ padding:'8px 10px' }}
                      onClick={e=>e.stopPropagation()}>
                      <div style={{ display:'flex', gap:4 }}>
                        <button className="btn-xs"
                          onClick={()=>openDetail(g)}>
                          👁 View
                        </button>
                        <button className="btn-xs"
                          onClick={()=>window.print()}>
                          Print
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {selGRN && (
        <GRNDetailModal grn={selGRN}
          onClose={()=>setSelGRN(null)} />
      )}
    </div>
  )
}
