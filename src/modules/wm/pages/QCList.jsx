import React from 'react'
import { useNavigate } from 'react-router-dom'

export default function QCList() {
  const nav = useNavigate()
  return (
    <div>
      <div className="lv-hdr">
        <div className="lv-ttl">QC Inspection Register <small>Incoming Quality</small></div>
        <div className="lv-acts">
          <button className="btn btn-p sd-bsm"
            onClick={()=>nav('/wm/qc/new')}>
            + New Inspection
          </button>
        </div>
      </div>
      <div style={{ padding:60, textAlign:'center', color:'#6C757D',
        background:'#fff', borderRadius:8, border:'2px dashed #E0D5E0',
        marginTop:20 }}>
        <div style={{ fontSize:40, marginBottom:16 }}>🔬</div>
        <div style={{ fontSize:16, fontWeight:700, marginBottom:8 }}>
          QC Inspection Module
        </div>
        <div style={{ fontSize:13, color:'#aaa' }}>
          Full enterprise QC build — coming in morning session!
        </div>
      </div>
    </div>
  )
}
