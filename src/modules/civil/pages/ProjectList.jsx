import React from 'react'
export default function ProjectList() {
  return <div><div className="fi-lv-hdr"><div className="fi-lv-title">ProjectList</div><div className="fi-lv-actions"><button className="btn btn-s sd-bsm" onClick={()=>nav('/print/so')}>Print</button>
          <button className="btn btn-p sd-bsm">+ New</button></div></div><div style={{padding:20,color:'var(--odoo-gray)',fontSize:13}}>📋 ProjectList — Full module coming in next iteration</div></div>
}
