import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { mmApi } from '../services/mmApi'

const STATUS = {
  DRAFT:    { label:'Draft',       bg:'#E2E3E5', color:'#383D41' },
  PENDING:  { label:'Pending HOD', bg:'#FFF3CD', color:'#856404' },
  APPROVED: { label:'Approved',    bg:'#D4EDDA', color:'#155724' },
}

export default function CSList() {
  const nav = useNavigate()
  const [csList,  setCsList]  = useState([])
  const [loading, setLoading] = useState(true)
  const [search,  setSearch]  = useState('')
  const [error,   setError]   = useState('')

  const fetchCS = useCallback(async () => {
    setLoading(true)
    try {
      const data = await mmApi.getCSList()
      setCsList(data.data||[])
    } catch(e){
      setError(e.message)
      toast.error(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(()=>{ fetchCS() }, [])

  const filtered = csList.filter(cs =>
    !search ||
    cs.csNo?.toLowerCase().includes(search.toLowerCase()) ||
    cs.prNo?.toLowerCase().includes(search.toLowerCase()) ||
    cs.itemDesc?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div className="lv-hdr">
        <div className="lv-ttl">
          Comparative Statements <small>CS Register</small>
        </div>
        <div className="lv-acts">
          <input placeholder="Search CS No., PR No..."
            value={search} onChange={e=>setSearch(e.target.value)}
            style={{ padding:'6px 12px', border:'1px solid #E0D5E0',
              borderRadius:5, fontSize:12, width:180 }} />
          <button className="btn btn-p sd-bsm"
            onClick={()=>nav('/mm/cs/new')}>+ New CS</button>
        </div>
      </div>

      {/* KPI */}
      <div style={{ display:'grid',
        gridTemplateColumns:'repeat(4,1fr)',
        gap:10, marginBottom:14 }}>
        {[
          { cls:'purple', l:'Total CS',    v:csList.length,
            s:'This month' },
          { cls:'orange', l:'Pending HOD',
            v:csList.filter(c=>c.status==='PENDING').length,
            s:'Awaiting approval' },
          { cls:'green',  l:'Approved',
            v:csList.filter(c=>c.status==='APPROVED').length,
            s:'PO can be raised' },
          { cls:'blue',   l:'PO Raised',
            v:csList.filter(c=>c.poNo).length,
            s:'Completed' },
        ].map(k=>(
          <div key={k.l} style={{ borderRadius:8, padding:'10px 14px',
            border:'1px solid #E0D5E0', background:'#fff' }}>
            <div style={{ fontSize:10, color:'#6C757D',
              fontWeight:700, textTransform:'uppercase' }}>
              {k.l}
            </div>
            <div style={{ fontSize:24, fontWeight:800,
              color:'#714B67', fontFamily:'Syne,sans-serif' }}>
              {k.v}
            </div>
            <div style={{ fontSize:11, color:'#6C757D' }}>{k.s}</div>
          </div>
        ))}
      </div>

      {error && (
        <div style={{ padding:12, background:'#F8D7DA', color:'#721C24',
          borderRadius:8, marginBottom:12, fontSize:12 }}>
          ❌ Error: {error} — Check backend is running
        </div>
      )}
      {loading ? (
        <div style={{ padding:40, textAlign:'center', color:'#6C757D' }}>
          ⏳ Loading...
        </div>
      ) : filtered.length===0 ? (
        <div style={{ padding:60, textAlign:'center', color:'#6C757D',
          background:'#fff', borderRadius:8,
          border:'2px dashed #E0D5E0' }}>
          <div style={{ fontSize:32, marginBottom:12 }}>📊</div>
          <div style={{ fontWeight:700 }}>No comparative statements</div>
          <button className="btn btn-p sd-bsm"
            style={{ marginTop:12 }}
            onClick={()=>nav('/mm/cs/new')}>
            + New CS
          </button>
        </div>
      ) : (
        <div style={{ border:'1px solid #E0D5E0', borderRadius:8,
          overflow:'hidden' }}>
          <table style={{ width:'100%', borderCollapse:'collapse',
            fontSize:12 }}>
            <thead style={{ background:'#F8F4F8',
              position:'sticky', top:0 }}>
              <tr style={{ borderBottom:'2px solid #E0D5E0' }}>
                {['#','CS No.','Date','PR No.','Items',
                  'Supplier I','Supplier II','Supplier III',
                  'L1 Cost','Selected','Status','PO No.',
                  'Actions'].map(h=>(
                  <th key={h} style={{ padding:'8px 10px',
                    fontSize:10, fontWeight:700, color:'#6C757D',
                    textAlign:'left', textTransform:'uppercase',
                    letterSpacing:.3, whiteSpace:'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((cs,i)=>{
                const st = STATUS[cs.status?.toUpperCase()]||STATUS.DRAFT
                const quotes = cs.quotes||[]
                const rates = quotes
                  .map(q=>parseFloat(q.unitRate||0))
                  .filter(v=>v>0)
                const l1 = rates.length>0?Math.min(...rates):0
                return (
                  <tr key={cs.id}
                    style={{ borderBottom:'1px solid #F0EEF0',
                      background:i%2===0?'#fff':'#FDFBFD' }}>
                    <td style={{ padding:'8px 10px',
                      color:'#6C757D', textAlign:'center',
                      fontSize:11 }}>{i+1}</td>
                    <td style={{ padding:'8px 10px' }}>
                      <strong style={{ color:'#714B67',
                        fontFamily:'DM Mono,monospace',
                        fontSize:12, cursor:'pointer' }}
                        onClick={()=>nav('/mm/cs/new')}>
                        {cs.csNo}
                      </strong>
                    </td>
                    <td style={{ padding:'8px 10px', fontSize:11,
                      color:'#6C757D' }}>
                      {new Date(cs.csDate||cs.createdAt)
                        .toLocaleDateString('en-IN')}
                    </td>
                    <td style={{ padding:'8px 10px',
                      fontFamily:'DM Mono,monospace',
                      fontSize:11, color:'#6C757D' }}>
                      {cs.prNo||'—'}
                    </td>
                    <td style={{ padding:'8px 10px', fontSize:11 }}>
                      {cs.itemDesc?.slice(0,30)}{cs.itemDesc?.length>30?'...':''}
                    </td>
                    {[0,1,2].map(si=>(
                      <td key={si} style={{ padding:'8px 10px',
                        fontSize:11, color:'#495057' }}>
                        {quotes[si]?.supplierName||'—'}
                      </td>
                    ))}
                    <td style={{ padding:'8px 10px',
                      fontFamily:'DM Mono,monospace',
                      fontSize:12, fontWeight:700,
                      color:'#155724' }}>
                      {l1>0?'₹'+l1.toLocaleString('en-IN'):'—'}
                    </td>
                    <td style={{ padding:'8px 10px' }}>
                      {cs.selectedSupplier && (
                        <span style={{ padding:'2px 8px',
                          borderRadius:10, fontSize:11,
                          fontWeight:600, background:'#EDE0EA',
                          color:'#714B67' }}>
                          {cs.selectedSupplier}
                        </span>
                      )}
                    </td>
                    <td style={{ padding:'8px 10px' }}>
                      <span style={{ padding:'2px 8px',
                        borderRadius:10, fontSize:11,
                        fontWeight:700,
                        background:st.bg, color:st.color }}>
                        {st.label}
                      </span>
                    </td>
                    <td style={{ padding:'8px 10px',
                      fontFamily:'DM Mono,monospace',
                      fontSize:11, color:'#155724' }}>
                      {cs.poNo||<span style={{color:'#aaa'}}>—</span>}
                    </td>
                    <td style={{ padding:'8px 10px' }}
                      onClick={e=>e.stopPropagation()}>
                      <div style={{ display:'flex', gap:4 }}>
                        <button className="btn-xs"
                          onClick={()=>nav('/mm/cs/new')}>
                          ✏️ Edit
                        </button>
                        {cs.status?.toUpperCase()==='APPROVED'&&!cs.poNo&&(
                          <button className="btn-xs pri"
                            style={{ background:'#155724',
                              color:'#fff' }}
                            onClick={()=>nav('/mm/po/new?from=cs')}>
                            🛒 PO
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
