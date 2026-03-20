/**
 * PrintWrapper — wraps any print template with
 * a screen preview + print/download button bar
 */
import React from 'react'

export function usePrint() {
  const print = () => window.print()
  return { print }
}

export default function PrintWrapper({ title, children, onClose }) {
  return (
    <>
      {/* Screen-only toolbar — hidden when printing */}
      <div style={{
        position:'fixed', top:0, left:0, right:0, zIndex:9999,
        background:'#1C1C1C', padding:'8px 20px',
        display:'flex', alignItems:'center', gap:12,
      }} className="no-print">
        <span style={{ fontFamily:'Syne,sans-serif', fontSize:13,
          fontWeight:700, color:'#fff', flex:1 }}>
           {title}
        </span>
        <button onClick={() => window.print()}
          style={{ padding:'7px 20px', background:'#714B67', color:'#fff',
            border:'none', borderRadius:6, fontWeight:700, fontSize:13,
            cursor:'pointer', fontFamily:'DM Sans,sans-serif' }}>
           Print / Save PDF
        </button>
        {onClose && (
          <button onClick={onClose}
            style={{ padding:'7px 16px', background:'#444', color:'#fff',
              border:'none', borderRadius:6, fontWeight:600, fontSize:13,
              cursor:'pointer', fontFamily:'DM Sans,sans-serif' }}>
             Close
          </button>
        )}
      </div>

      {/* Print content area */}
      <div style={{ paddingTop:52, background:'#E0E0E0', minHeight:'100vh' }}
        className="print-bg">
        {children}
      </div>

      {/* Global print styles */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-bg  { background: #fff !important; padding: 0 !important; }
          body { margin: 0; }
          @page { size: A4; margin: 10mm; }
        }
        .print-page {
          width: 210mm;
          min-height: 297mm;
          background: #fff;
          margin: 20px auto;
          padding: 14mm;
          box-shadow: 0 4px 20px rgba(0,0,0,.15);
          box-sizing: border-box;
          font-family: 'DM Sans', Arial, sans-serif;
          font-size: 11px;
          color: #1C1C1C;
          position: relative;
        }
        @media print {
          .print-page {
            margin: 0;
            box-shadow: none;
            padding: 10mm;
            width: 100%;
          }
        }
      `}</style>
    </>
  )
}
