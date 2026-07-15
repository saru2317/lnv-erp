import React, { useState, useEffect } from 'react'
import toast from 'react-hot-toast'

const BASE = import.meta.env.VITE_API_URL || '/api'
const tok  = () => localStorage.getItem('lnv_token') || ''
const hdr  = () => ({ 'Content-Type':'application/json', Authorization:`Bearer ${tok()}` })
const hdr2 = () => ({ Authorization:`Bearer ${tok()}` })
const inp  = { padding:'7px 9px', border:'1.5px solid #DDD', borderRadius:5, fontSize:12, outline:'none', width:'100%', boxSizing:'border-box' }
const sel  = { ...inp }
const th   = { padding:'8px 10px', fontSize:11, color:'#6E2C00', textAlign:'left', borderBottom:'2px solid #E8E0E8' }
const td   = { padding:'7px 10px', fontSize:12, borderBottom:'1px solid #F0F0F0' }
const btnPrimary   = { padding:'7px 16px', background:'#6E2C00', color:'#fff', border:'none', borderRadius:5, cursor:'pointer', fontWeight:700, fontSize:12 }
const btnSecondary = { padding:'6px 12px', background:'#fff', color:'#6E2C00', border:'1.5px solid #6E2C00', borderRadius:5, cursor:'pointer', fontWeight:700, fontSize:11 }
const btnDanger    = { padding:'4px 9px', background:'#fdecea', color:'#C0392B', border:'none', borderRadius:4, cursor:'pointer', fontSize:11 }

const emptyBlockForm = { blockName:'', type:'BOYS', wardensName:'', wardensPhone:'', floors:1 }
const emptyRoomForm  = { roomNo:'', floor:1, roomType:'DOUBLE', capacity:2, monthlyFee:'' }

export default function HostelMaster() {
  const [instId,   setInstId]   = useState(localStorage.getItem('lnv_edu_inst') || '')
  const [tab,      setTab]      = useState('blocks') // 'blocks' | 'allotment'

  const [blocks,   setBlocks]   = useState([])
  const [showBlockForm, setShowBlockForm] = useState(false)
  const [editingBlockId, setEditingBlockId] = useState(null)
  const [blockForm, setBlockForm] = useState(emptyBlockForm)
  const [roomsFor,  setRoomsFor]  = useState(null)
  const [roomForm,  setRoomForm]  = useState(emptyRoomForm)

  // Allotment tab
  const [studentSearch, setStudentSearch] = useState('')
  const [students, setStudents] = useState([])
  const [selStudent, setSelStudent] = useState(null)

  useEffect(() => {
    const onStorage = () => setInstId(localStorage.getItem('lnv_edu_inst') || '')
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const loadBlocks = () => {
    fetch(`${BASE}/edu/hostel-blocks?institutionId=${instId}`, { headers:hdr2() }).then(r=>r.json()).then(d=>setBlocks(d.data||[]))
  }
  useEffect(() => { loadBlocks() }, [instId])

  // ── Block CRUD ──
  const openNewBlock = () => { setBlockForm(emptyBlockForm); setEditingBlockId(null); setShowBlockForm(true) }
  const openEditBlock = (b) => {
    setBlockForm({ blockName:b.blockName, type:b.type, wardensName:b.wardensName||'', wardensPhone:b.wardensPhone||'', floors:b.floors })
    setEditingBlockId(b.id); setShowBlockForm(true)
  }
  const saveBlock = async () => {
    if (!blockForm.blockName) return toast.error('Block name required')
    try {
      const url = editingBlockId ? `${BASE}/edu/hostel-blocks/${editingBlockId}` : `${BASE}/edu/hostel-blocks`
      const method = editingBlockId ? 'PATCH' : 'POST'
      const body = editingBlockId ? blockForm : { ...blockForm, institutionId: instId }
      const r = await fetch(url, { method, headers:hdr(), body:JSON.stringify(body) })
      const d = await r.json()
      if (d.error) return toast.error(d.error)
      toast.success(editingBlockId ? '✅ Block updated' : '✅ Block created')
      setShowBlockForm(false); loadBlocks()
    } catch { toast.error('Save failed') }
  }
  const toggleBlockActive = async (b) => {
    await fetch(`${BASE}/edu/hostel-blocks/${b.id}`, { method:'PATCH', headers:hdr(), body:JSON.stringify({ isActive: !b.isActive }) })
    loadBlocks()
  }

  // ── Rooms ──
  const openRooms = (block) => { setRoomsFor(block); setRoomForm(emptyRoomForm) }
  const closeRooms = () => { setRoomsFor(null); loadBlocks() }
  const addRoom = async () => {
    if (!roomForm.roomNo) return toast.error('Room No required')
    try {
      const r = await fetch(`${BASE}/edu/hostel-rooms`, { method:'POST', headers:hdr(),
        body: JSON.stringify({ ...roomForm, blockId: roomsFor.id }) })
      const d = await r.json()
      if (d.error) return toast.error(d.error)
      toast.success('✅ Room added')
      const updated = await fetch(`${BASE}/edu/hostel-blocks?institutionId=${instId}`, { headers:hdr2() }).then(r=>r.json())
      setRoomsFor((updated.data||[]).find(x=>x.id===roomsFor.id))
      setBlocks(updated.data||[])
      setRoomForm(emptyRoomForm)
    } catch { toast.error('Failed to add room') }
  }

  // ── Allotment ──
  const searchStudents = async (q) => {
    setStudentSearch(q)
    if (q.length < 2) { setStudents([]); return }
    const r = await fetch(`${BASE}/edu/students?institutionId=${instId}&search=${encodeURIComponent(q)}`, { headers:hdr2() })
    const d = await r.json()
    setStudents((d.data||[]).slice(0,8))
  }
  const selectStudent = (s) => { setSelStudent(s); setStudents([]); setStudentSearch(s.name) }

  const checkIn = async (roomId) => {
    if (!selStudent) return toast.error('Select a student first')
    try {
      const r = await fetch(`${BASE}/edu/hostel-rooms/${roomId}/checkin`, { method:'POST', headers:hdr(),
        body: JSON.stringify({ studentId: selStudent.id }) })
      const d = await r.json()
      if (d.error) return toast.error(d.error)
      toast.success(d.message)
      setSelStudent(null); setStudentSearch(''); loadBlocks()
    } catch { toast.error('Check-in failed') }
  }
  const checkOut = async (studentId, studentName) => {
    try {
      const r = await fetch(`${BASE}/edu/hostel-rooms/checkout`, { method:'POST', headers:hdr(),
        body: JSON.stringify({ studentId }) })
      const d = await r.json()
      if (d.error) return toast.error(d.error)
      toast.success(d.message)
      loadBlocks()
    } catch { toast.error('Check-out failed') }
  }

  return (
    <div style={{fontFamily:'DM Sans,sans-serif'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',
        background:'#fff',borderBottom:'1px solid #E8E0E8',padding:'10px 16px',marginBottom:12,flexWrap:'wrap',gap:10}}>
        <div style={{fontSize:18,fontWeight:800,color:'#6E2C00'}}>🏠 Hostel</div>
        <div style={{display:'flex',gap:6}}>
          <button onClick={()=>setTab('blocks')}
            style={{...btnSecondary, background:tab==='blocks'?'#6E2C00':'#fff', color:tab==='blocks'?'#fff':'#6E2C00'}}>
            Blocks & Rooms
          </button>
          <button onClick={()=>setTab('allotment')}
            style={{...btnSecondary, background:tab==='allotment'?'#6E2C00':'#fff', color:tab==='allotment'?'#fff':'#6E2C00'}}>
            Allotment
          </button>
        </div>
      </div>

      {tab === 'blocks' && (
        <div style={{background:'#fff',border:'1px solid #E8E0E8',borderRadius:8,padding:16}}>
          <div style={{display:'flex',justifyContent:'flex-end',marginBottom:12}}>
            <button onClick={openNewBlock} style={btnPrimary}>+ New Block</button>
          </div>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead><tr>
              <th style={th}>Block</th><th style={th}>Type</th><th style={th}>Warden</th>
              <th style={th}>Floors</th><th style={th}>Rooms</th><th style={th}>Occupancy</th>
              <th style={th}>Status</th><th style={th}></th>
            </tr></thead>
            <tbody>
              {blocks.map(b => {
                const totalCap = (b.rooms||[]).reduce((a,r)=>a+r.capacity,0)
                const totalOcc = (b.rooms||[]).reduce((a,r)=>a+r.occupied,0)
                return (
                  <tr key={b.id}>
                    <td style={td}>{b.blockName}</td>
                    <td style={td}>{b.type}</td>
                    <td style={td}>{b.wardensName || '—'}{b.wardensPhone ? ` (${b.wardensPhone})` : ''}</td>
                    <td style={td}>{b.floors}</td>
                    <td style={td}>{(b.rooms||[]).length}</td>
                    <td style={td}>{totalOcc} / {totalCap}</td>
                    <td style={td}>
                      <span style={{color:b.isActive?'#1E8449':'#C0392B',fontWeight:700,fontSize:11}}>
                        {b.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={td}>
                      <button onClick={()=>openRooms(b)} style={{...btnSecondary,marginRight:6,padding:'4px 10px'}}>🚪 Rooms</button>
                      <button onClick={()=>openEditBlock(b)} style={{...btnSecondary,marginRight:6,padding:'4px 10px'}}>Edit</button>
                      <button onClick={()=>toggleBlockActive(b)} style={btnDanger}>{b.isActive?'Deactivate':'Activate'}</button>
                    </td>
                  </tr>
                )
              })}
              {blocks.length===0 && <tr><td colSpan={8} style={{...td,textAlign:'center',color:'#aaa'}}>No hostel blocks yet for this institution</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'allotment' && (
        <div>
          <div style={{background:'#fff',border:'1px solid #E8E0E8',borderRadius:8,padding:16,marginBottom:14}}>
            <div style={{fontSize:12,fontWeight:700,color:'#6E2C00',marginBottom:8}}>Find Student to Check In</div>
            <div style={{position:'relative',maxWidth:400}}>
              <input placeholder='Search by name or admission no...' value={studentSearch}
                onChange={e=>searchStudents(e.target.value)} style={inp} />
              {students.length>0 && (
                <div style={{position:'absolute',top:'100%',left:0,right:0,background:'#fff',
                  border:'1px solid #E8E0E8',borderRadius:5,zIndex:10,maxHeight:220,overflow:'auto',boxShadow:'0 4px 12px rgba(0,0,0,0.1)'}}>
                  {students.map(s => (
                    <div key={s.id} onClick={()=>selectStudent(s)}
                      style={{padding:'8px 12px',cursor:'pointer',borderBottom:'1px solid #F0F0F0',fontSize:12}}>
                      <b>{s.name}</b> — {s.admissionNo} {s.hostelRoomId ? <span style={{color:'#C0392B'}}> (already allotted)</span> : ''}
                    </div>
                  ))}
                </div>
              )}
            </div>
            {selStudent && (
              <div style={{marginTop:10,padding:10,background:'#FAF8FA',borderRadius:6,fontSize:12}}>
                Selected: <b>{selStudent.name}</b> ({selStudent.admissionNo}) — click "Check In" on any room below with space
              </div>
            )}
          </div>

          {blocks.map(b => (
            <div key={b.id} style={{background:'#fff',border:'1px solid #E8E0E8',borderRadius:8,padding:16,marginBottom:12}}>
              <div style={{fontSize:13,fontWeight:800,color:'#6E2C00',marginBottom:10}}>{b.blockName} ({b.type})</div>
              <table style={{width:'100%',borderCollapse:'collapse'}}>
                <thead><tr>
                  <th style={th}>Room</th><th style={th}>Type</th><th style={th}>Occupancy</th>
                  <th style={th}>Occupants</th><th style={th}></th>
                </tr></thead>
                <tbody>
                  {(b.rooms||[]).map(r => (
                    <tr key={r.id}>
                      <td style={td}>{r.roomNo} (Floor {r.floor})</td>
                      <td style={td}>{r.roomType}</td>
                      <td style={td}>{r.occupied} / {r.capacity}</td>
                      <td style={td}>{(r.students||[]).map(s => (
                        <div key={s.id} style={{display:'flex',alignItems:'center',gap:6,marginBottom:2}}>
                          {s.name}
                          <button onClick={()=>checkOut(s.id,s.name)} style={{...btnDanger,padding:'2px 6px'}}>Check Out</button>
                        </div>
                      ))}</td>
                      <td style={td}>
                        <button onClick={()=>checkIn(r.id)} disabled={!selStudent || r.occupied>=r.capacity}
                          style={{...btnPrimary,padding:'5px 12px',
                            opacity:(!selStudent||r.occupied>=r.capacity)?0.4:1,
                            cursor:(!selStudent||r.occupied>=r.capacity)?'not-allowed':'pointer'}}>
                          Check In
                        </button>
                      </td>
                    </tr>
                  ))}
                  {(b.rooms||[]).length===0 && <tr><td colSpan={5} style={{...td,textAlign:'center',color:'#aaa'}}>No rooms in this block</td></tr>}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}

      {/* New/Edit Block modal */}
      {showBlockForm && (
        <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,0.4)',
          display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000}}>
          <div style={{background:'#fff',borderRadius:8,padding:20,width:400,maxHeight:'85vh',overflow:'auto'}}>
            <div style={{fontSize:15,fontWeight:800,color:'#6E2C00',marginBottom:14}}>
              {editingBlockId ? 'Edit Block' : 'New Block'}
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:10}}>
              <div>
                <label style={{fontSize:11,color:'#888'}}>Block Name *</label>
                <input value={blockForm.blockName} onChange={e=>setBlockForm({...blockForm,blockName:e.target.value})} style={inp} />
              </div>
              <div>
                <label style={{fontSize:11,color:'#888'}}>Type</label>
                <select value={blockForm.type} onChange={e=>setBlockForm({...blockForm,type:e.target.value})} style={sel}>
                  <option value='BOYS'>Boys</option>
                  <option value='GIRLS'>Girls</option>
                  <option value='MIXED'>Mixed</option>
                </select>
              </div>
              <div style={{display:'flex',gap:8}}>
                <div style={{flex:1}}>
                  <label style={{fontSize:11,color:'#888'}}>Warden Name</label>
                  <input value={blockForm.wardensName} onChange={e=>setBlockForm({...blockForm,wardensName:e.target.value})} style={inp} />
                </div>
                <div style={{flex:1}}>
                  <label style={{fontSize:11,color:'#888'}}>Warden Phone</label>
                  <input value={blockForm.wardensPhone} onChange={e=>setBlockForm({...blockForm,wardensPhone:e.target.value})} style={inp} />
                </div>
              </div>
              <div>
                <label style={{fontSize:11,color:'#888'}}>Floors</label>
                <input type='number' min={1} value={blockForm.floors} onChange={e=>setBlockForm({...blockForm,floors:e.target.value})} style={inp} />
              </div>
            </div>
            <div style={{display:'flex',justifyContent:'flex-end',gap:8,marginTop:18}}>
              <button onClick={()=>setShowBlockForm(false)} style={btnSecondary}>Cancel</button>
              <button onClick={saveBlock} style={btnPrimary}>Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Manage Rooms modal */}
      {roomsFor && (
        <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,0.4)',
          display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000}}>
          <div style={{background:'#fff',borderRadius:8,padding:20,width:560,maxHeight:'85vh',overflow:'auto'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
              <div style={{fontSize:15,fontWeight:800,color:'#6E2C00'}}>🚪 Rooms — {roomsFor.blockName}</div>
              <button onClick={closeRooms} style={{...btnSecondary,padding:'4px 10px'}}>✕ Close</button>
            </div>
            <table style={{width:'100%',borderCollapse:'collapse',marginBottom:16}}>
              <thead><tr>
                <th style={th}>Room No</th><th style={th}>Floor</th><th style={th}>Type</th>
                <th style={th}>Capacity</th><th style={th}>Occupied</th><th style={th}>Fee/mo</th>
              </tr></thead>
              <tbody>
                {(roomsFor.rooms||[]).map(r => (
                  <tr key={r.id}>
                    <td style={td}>{r.roomNo}</td><td style={td}>{r.floor}</td><td style={td}>{r.roomType}</td>
                    <td style={td}>{r.capacity}</td><td style={td}>{r.occupied}</td><td style={td}>{r.monthlyFee||'—'}</td>
                  </tr>
                ))}
                {(roomsFor.rooms||[]).length===0 && <tr><td colSpan={6} style={{...td,textAlign:'center',color:'#aaa'}}>No rooms yet</td></tr>}
              </tbody>
            </table>
            <div style={{background:'#FAF8FA',border:'1px solid #E8E0E8',borderRadius:6,padding:12}}>
              <div style={{fontSize:12,fontWeight:700,color:'#6E2C00',marginBottom:8}}>+ Add Room</div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr 1fr',gap:8,marginBottom:8}}>
                <input placeholder='Room No' value={roomForm.roomNo} onChange={e=>setRoomForm({...roomForm,roomNo:e.target.value})} style={inp} />
                <input type='number' placeholder='Floor' value={roomForm.floor} onChange={e=>setRoomForm({...roomForm,floor:e.target.value})} style={inp} />
                <select value={roomForm.roomType} onChange={e=>setRoomForm({...roomForm,roomType:e.target.value})} style={sel}>
                  <option value='SINGLE'>Single</option>
                  <option value='DOUBLE'>Double</option>
                  <option value='TRIPLE'>Triple</option>
                  <option value='DORMITORY'>Dormitory</option>
                </select>
                <input type='number' placeholder='Capacity' value={roomForm.capacity} onChange={e=>setRoomForm({...roomForm,capacity:e.target.value})} style={inp} />
                <input placeholder='Fee ₹/mo' value={roomForm.monthlyFee} onChange={e=>setRoomForm({...roomForm,monthlyFee:e.target.value})} style={inp} />
              </div>
              <button onClick={addRoom} style={btnPrimary}>+ Add Room</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
