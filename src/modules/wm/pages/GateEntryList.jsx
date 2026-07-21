import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const getToken = () => localStorage.getItem('lnv_token')
const authHdrs = () => ({ 'Content-Type':'application/json',
  Authorization:`Bearer ${getToken()}` })
const authHdrs2= () => ({ Authorization:`Bearer ${getToken()}` })

const STATUS = {
  IN:       { bg:'#D4EDDA', color:'#155724', label:'Inside',   icon:'🔵' },
  OUT:      { bg:'#E9ECEF', color:'#6C757D', label:'Exited',   icon:'⚪' },
  GRN_DONE: { bg:'#EDE0EA', color:'#714B67', label:'GRN Done', icon:'✅' },
  RETURNED: { bg:'#FFF3CD', color:'#856404', label:'Returned', icon:'↩️' },
}

// ── Gate Pass Print ────────────────────────────────────────
function GatePassModal({ entry, onClose }) {
  return (
    <div style={{ position:'fixed', inset:0,
      background:'rgba(0,0,0,.55)', display:'flex',
      alignItems:'center', justifyContent:'center', zIndex:9999 }}>
      <div style={{ background:'#fff', borderRadius:10,
        width:480, boxShadow:'0 20px 60px rgba(0,0,0,.3)' }}>
        <div style={{ background:'#155724', padding:'12px 20px',
          display:'flex', justifyContent:'space-between',
          alignItems:'center', borderRadius:'10px 10px 0 0' }}>
          <h3 style={{ color:'#fff', margin:0, fontSize:15,
            fontWeight:700 }}>🎫 Gate Pass</h3>
          <span onClick={onClose}
            style={{ color:'#fff', cursor:'pointer',
              fontSize:20 }}>✕</span>
        </div>
        <div style={{ padding:20 }} id="gate-pass-print">
          {/* Gate Pass content */}
          <div style={{ border:'3px solid #155724',
            borderRadius:8, padding:16, textAlign:'center',
            marginBottom:14 }}>
            <div style={{ fontSize:11, color:'#6C757D',
              marginBottom:4 }}>LNV MANUFACTURING PVT. LTD.</div>
            <div style={{ fontSize:20, fontWeight:900,
              color:'#155724', fontFamily:'Syne,sans-serif',
              letterSpacing:1 }}>GATE PASS</div>
            <div style={{ fontSize:16, fontWeight:800,
              color:'#714B67', fontFamily:'DM Mono,monospace',
              marginTop:4 }}>{entry.gatePassNo}</div>
          </div>
          <div style={{ display:'grid',
            gridTemplateColumns:'1fr 1fr', gap:8, fontSize:12 }}>
            {[
              ['Gate Entry No', entry.gateNo],
              ['Date',          new Date(entry.entryDate)
                                  .toLocaleDateString('en-IN')],
              ['Entry Time',    entry.entryTime||'—'],
              ['Purpose',       entry.purpose],
              ['Vehicle No.',   entry.vehicleNo],
              ['Vehicle Type',  entry.vehicleType],
              ['Driver Name',   entry.driverName||'—'],
              ['Driver Phone',  entry.driverPhone||'—'],
              [entry.partyType==='CUSTOMER'?'Customer':'Vendor',
                entry.partyType==='CUSTOMER'?entry.customerName:entry.vendorName],
              ['DC No.',        entry.dcNo||'—'],
              ['PO No.',        entry.poNo||'—'],
              ['Material',      entry.materialDesc||'—'],
              ['Packages',      entry.noOfPackages||'—'],
              ['Gross Wt.',     entry.grossWeight
                                  ?`${entry.grossWeight} ${entry.weightUnit}`:'—'],
            ].map(([l,v])=>(
              <div key={l} style={{ background:'#F8F7FA',
                padding:'6px 10px', borderRadius:5 }}>
                <div style={{ fontSize:9, color:'#6C757D',
                  fontWeight:700, textTransform:'uppercase' }}>
                  {l}
                </div>
                <div style={{ fontWeight:700, marginTop:1 }}>{v}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop:14, display:'flex',
            justifyContent:'space-between',
            borderTop:'1px dashed #E0D5E0', paddingTop:12,
            fontSize:11, color:'#6C757D' }}>
            <div>Security: {entry.securityName||'—'}</div>
            <div>Exit Time: ___________</div>
          </div>
        </div>
        <div style={{ padding:'12px 20px',
          borderTop:'1px solid #E0D5E0',
          display:'flex', justifyContent:'flex-end',
          gap:10, background:'#F8F7FA',
          borderRadius:'0 0 10px 10px' }}>
          <button onClick={onClose}
            style={{ padding:'8px 20px', background:'#fff',
              color:'#6C757D', border:'1.5px solid #E0D5E0',
              borderRadius:6, fontSize:13, cursor:'pointer' }}>
            Close
          </button>
          <button onClick={()=>window.print()}
            style={{ padding:'8px 24px', background:'#155724',
              color:'#fff', border:'none', borderRadius:6,
              fontSize:13, fontWeight:700, cursor:'pointer' }}>
            🖨️ Print Gate Pass
          </button>
        </div>
      </div>
    </div>
  )
}

// ── MAIN GATE ENTRY LIST ───────────────────────────────────
export default function GateEntryList() {
  const nav = useNavigate()
  const [entries, setEntries]  = useState([])
  const [loading, setLoading]  = useState(true)
  const [showPass,setShowPass] = useState(null)
  const [search,  setSearch]   = useState('')
  const [chip,    setChip]     = useState('all')
  const [partyF,  setPartyF]   = useState('all')
  const [dateFrom,setDateFrom] = useState('')
  const [dateTo,  setDateTo]   = useState('')

  const fetchEntries = useCallback(async () => {
    setLoading(true)
    try {
      const res  = await fetch(`${BASE_URL}/wm/gate-entry`,
        { headers:authHdrs2() })
      const data = await res.json()
      setEntries(data.data||[])
    } catch(e){ toast.error(e.message) } finally { setLoading(false) }
  }, [])

  useEffect(()=>{ fetchEntries() }, [])

  const recordExit = async (entry) => {
    try {
      const res  = await fetch(
        `${BASE_URL}/wm/gate-entry/${entry.id}/exit`,
        { method:'PATCH', headers:authHdrs(),
          body:'{}' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success('Vehicle exit recorded!')
      fetchEntries()
    } catch(e){ toast.error(e.message) }
  }

  const filtered = entries.filter(e => {
    const matchChip = chip==='all' || e.status===chip
    const matchParty = partyF==='all' || e.partyType===partyF
    const matchSearch = !search ||
      e.gateNo?.toLowerCase().includes(search.toLowerCase()) ||
      e.vehicleNo?.toLowerCase().includes(search.toLowerCase()) ||
      e.vendorName?.toLowerCase().includes(search.toLowerCase()) ||
      e.customerName?.toLowerCase().includes(search.toLowerCase()) ||
      e.poNo?.toLowerCase().includes(search.toLowerCase())
    const entryDate = (e.date || e.createdAt || '').slice(0,10)
    const matchFrom = !dateFrom || entryDate >= dateFrom
    const matchTo   = !dateTo   || entryDate <= dateTo
    return matchChip && matchParty && matchSearch && matchFrom && matchTo
  })

  const inside = entries.filter(e=>e.status==='IN').length

  return (
    <div>
      <div className="lv-hdr">
        <div className="lv-ttl">
          Gate Entry Register
          {inside > 0 && (
            <span style={{ marginLeft:10, padding:'3px 10px',
              borderRadius:10, fontSize:12, fontWeight:700,
              background:'#D4EDDA', color:'#155724' }}>
              🔵 {inside} vehicle(s) inside
            </span>
          )}
        </div>
        <div className="lv-acts">
          <input placeholder="Search Gate No., Vehicle, Vendor, Customer..."
            value={search}
            onChange={e=>setSearch(e.target.value)}
            style={{ padding:'6px 12px',
              border:'1px solid #E0D5E0',
              borderRadius:5, fontSize:12, width:200 }} />
          <button className="btn btn-p sd-bsm"
            onClick={()=>nav('/wm/gate-entry/new')}>
            + Gate Entry
          </button>
        </div>
      </div>

      {/* KPI */}
      <div style={{ display:'grid',
        gridTemplateColumns:'repeat(4,1fr)',
        gap:10, marginBottom:14 }}>
        {[
          { l:'Total Today',
            v:entries.filter(e=>{
              const d=new Date(e.createdAt)
              const t=new Date()
              return d.toDateString()===t.toDateString()
            }).length,
            c:'#714B67', bg:'#EDE0EA' },
          { l:'Currently Inside',
            v:inside,
            c:'#155724', bg:'#D4EDDA' },
          { l:'Exited',
            v:entries.filter(e=>e.status==='OUT').length,
            c:'#6C757D', bg:'#E9ECEF' },
          { l:'GRN Pending',
            v:entries.filter(e=>
              e.status==='IN'&&e.purpose==='Material Receipt').length,
            c:'#856404', bg:'#FFF3CD' },
        ].map(k=>(
          <div key={k.l} style={{ background:k.bg,
            borderRadius:8, padding:'10px 14px',
            border:`1px solid ${k.c}22` }}>
            <div style={{ fontSize:10, color:k.c,
              fontWeight:700, textTransform:'uppercase' }}>
              {k.l}
            </div>
            <div style={{ fontSize:24, fontWeight:800,
              color:k.c, fontFamily:'Syne,sans-serif' }}>
              {k.v}
            </div>
          </div>
        ))}
      </div>

      {/* Chips */}
      <div className="mm-chips" style={{ marginBottom:12 }}>
        {[['all','All'],['IN','Inside'],
          ['OUT','Exited'],['GRN_DONE','GRN Done']].map(([k,l])=>(
          <div key={k} className={`mm-chip${chip===k?' on':''}`}
            onClick={()=>setChip(k)}>
            {l} <strong style={{ marginLeft:4 }}>
              {k==='all'?entries.length
                :entries.filter(e=>e.status===k).length}
            </strong>
          </div>
        ))}
      </div>

      {/* Party + Date filters */}
      <div style={{ display:'flex', flexWrap:'wrap', gap:10,
        alignItems:'center', marginBottom:14 }}>
        <div className="mm-chips">
          {[['all','All Parties'],['SUPPLIER','Supplier'],
            ['CUSTOMER','Customer']].map(([k,l])=>(
            <div key={k} className={`mm-chip${partyF===k?' on':''}`}
              onClick={()=>setPartyF(k)}>
              {l} <strong style={{ marginLeft:4 }}>
                {k==='all'?entries.length
                  :entries.filter(e=>e.partyType===k).length}
              </strong>
            </div>
          ))}
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          <label style={{ fontSize:11, color:'#6C757D', fontWeight:700 }}>From</label>
          <input type="date" value={dateFrom}
            onChange={e=>setDateFrom(e.target.value)}
            style={{ padding:'5px 8px', border:'1px solid #E0D5E0',
              borderRadius:5, fontSize:12 }} />
          <label style={{ fontSize:11, color:'#6C757D', fontWeight:700 }}>To</label>
          <input type="date" value={dateTo}
            onChange={e=>setDateTo(e.target.value)}
            style={{ padding:'5px 8px', border:'1px solid #E0D5E0',
              borderRadius:5, fontSize:12 }} />
          {(dateFrom || dateTo || partyF!=='all') && (
            <button onClick={()=>{ setDateFrom(''); setDateTo(''); setPartyF('all') }}
              style={{ padding:'5px 10px', background:'#fff',
                border:'1px solid #E0D5E0', borderRadius:5,
                fontSize:11, color:'#6C757D', cursor:'pointer' }}>
              ✕ Clear
            </button>
          )}
        </div>
        <div style={{ marginLeft:'auto', fontSize:11, color:'#6C757D' }}>
          {filtered.length} of {entries.length} entries
        </div>
      </div>

      {loading ? (
        <div style={{ padding:40, textAlign:'center',
          color:'#6C757D' }}>⏳ Loading...</div>
      ) : filtered.length===0 ? (
        <div style={{ padding:60, textAlign:'center',
          color:'#6C757D', background:'#fff', borderRadius:8,
          border:'2px dashed #E0D5E0' }}>
          <div style={{ fontSize:32, marginBottom:12 }}>🚛</div>
          <div style={{ fontWeight:700 }}>No gate entries</div>
          <button className="btn btn-p sd-bsm"
            style={{ marginTop:12 }}
            onClick={()=>nav('/wm/gate-entry/new')}>
            + New Gate Entry
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
                {['Gate No.','Date/Time','Vehicle',
                  'Driver','Vendor / Customer','PO Ref',
                  'Purpose','DC No.','Status',
                  'Actions'].map(h=>(
                  <th key={h} style={{ padding:'8px 10px',
                    fontSize:10, fontWeight:700,
                    color:'#6C757D', textAlign:'left',
                    textTransform:'uppercase', letterSpacing:.3,
                    whiteSpace:'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((e,i)=>{
                const sc = STATUS[e.status]||STATUS.IN
                const isIn = e.status==='IN'
                return (
                  <tr key={e.id} style={{
                    borderBottom:'1px solid #F0EEF0',
                    background: isIn
                      ? '#F0FFF4'
                      : i%2===0?'#fff':'#FDFBFD' }}>
                    <td style={{ padding:'8px 10px' }}>
                      <strong style={{ color:'#714B67',
                        fontFamily:'DM Mono,monospace',
                        fontSize:12 }}>{e.gateNo}</strong>
                      <div style={{ fontSize:9,
                        color:'#aaa',
                        fontFamily:'DM Mono,monospace' }}>
                        {e.gatePassNo}
                      </div>
                    </td>
                    <td style={{ padding:'8px 10px',
                      fontSize:11, color:'#6C757D' }}>
                      <div>
                        {new Date(e.date)
                          .toLocaleDateString('en-IN')}
                      </div>
                      <div style={{ fontWeight:700,
                        color: isIn?'#155724':'#6C757D' }}>
                        IN: {e.entryTime||'—'}
                        {e.exitTime &&
                          ` | OUT: ${e.exitTime}`}
                      </div>
                    </td>
                    <td style={{ padding:'8px 10px' }}>
                      <div style={{ fontWeight:700,
                        fontFamily:'DM Mono,monospace',
                        fontSize:13, letterSpacing:.5 }}>
                        {e.vehicleNo}
                      </div>
                      <div style={{ fontSize:10,
                        color:'#6C757D' }}>
                        {e.vehicleType}
                      </div>
                    </td>
                    <td style={{ padding:'8px 10px',
                      fontSize:11 }}>
                      <div>{e.driverName||'—'}</div>
                      <div style={{ color:'#6C757D',
                        fontSize:10 }}>
                        {e.driverPhone||''}
                      </div>
                    </td>
                    <td style={{ padding:'8px 10px',
                      fontWeight:600 }}>
                      {e.partyType==='CUSTOMER' ? e.customerName : e.vendorName}
                      {e.partyType && (
                        <div style={{ fontSize:9, color:'#ADB5BD', fontWeight:400 }}>
                          {e.partyType==='CUSTOMER'?'Customer':'Supplier'}
                        </div>
                      )}
                    </td>
                    <td style={{ padding:'8px 10px',
                      fontFamily:'DM Mono,monospace',
                      fontSize:11, color:'#714B67' }}>
                      {e.poNo||'—'}
                    </td>
                    <td style={{ padding:'8px 10px',
                      fontSize:11 }}>
                      <span style={{ padding:'2px 8px',
                        borderRadius:8, fontSize:10,
                        fontWeight:600,
                        background:e.purpose==='Material Receipt'
                          ?'#D1ECF1':'#F8F9FA',
                        color:e.purpose==='Material Receipt'
                          ?'#0C5460':'#6C757D' }}>
                        {e.purpose}
                      </span>
                    </td>
                    <td style={{ padding:'8px 10px',
                      fontSize:11, color:'#6C757D',
                      fontFamily:'DM Mono,monospace' }}>
                      {e.dcNo||'—'}
                    </td>
                    <td style={{ padding:'8px 10px' }}>
                      <span style={{ padding:'2px 8px',
                        borderRadius:10, fontSize:11,
                        fontWeight:700,
                        background:sc.bg,
                        color:sc.color }}>
                        {sc.icon} {sc.label}
                      </span>
                    </td>
                    <td style={{ padding:'8px 10px' }}
                      onClick={ev=>ev.stopPropagation()}>
                      <div style={{ display:'flex', gap:4 }}>
                        <button className="btn-xs"
                          onClick={()=>setShowPass(e)}>
                          🎫 Pass
                        </button>
                        {isIn && (
                          <button className="btn-xs"
                            style={{ background:'#6C757D',
                              color:'#fff' }}
                            onClick={()=>recordExit(e)}>
                            OUT ↗
                          </button>
                        )}
                        {isIn &&
                          ['Material Receipt','Subcontract Material Return'].includes(e.purpose) && (
                          <button className="btn-xs pri"
                            onClick={()=>nav(`/wm/grn/new?ge=${e.id}`)}>
                            GRN
                          </button>
                        )}
                        {isIn && e.purpose==='General Material Receipt' && e.partyType==='SUPPLIER' && (
                          <button className="btn-xs pri"
                            onClick={()=>nav(`/wm/grn/new?ge=${e.id}`)}>
                            GRN
                          </button>
                        )}
                        {isIn && e.purpose==='General Material Receipt' && e.partyType==='CUSTOMER' && (
                          <button className="btn-xs pri"
                            onClick={async ()=>{
                              try {
                                const res = await fetch(`${BASE_URL}/wm/gate-entry/${e.id}/general-receipt`,
                                  { method:'POST', headers:authHdrs() })
                                const d = await res.json()
                                if (!res.ok) throw new Error(d.error)
                                toast.success(d.message)
                                fetchEntries()
                              } catch(err){ toast.error(err.message) }
                            }}>
                            ✅ Receive
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

      {showPass && (
        <GatePassModal
          entry={showPass}
          onClose={()=>setShowPass(null)} />
      )}
    </div>
  )
}
