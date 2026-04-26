/**
 * LNV ERP — Universal Item Code Generator
 * src/utils/itemCodeGenerator.js
 */

// React import MUST be at top — moving it from bottom fixes blank page crash
import { useState, useEffect, useCallback, useMemo } from 'react'

const BASE_URL = import.meta.env?.VITE_API_URL || 'http://localhost:3000/api'
const getToken = () => localStorage.getItem('lnv_token')

export const SEG_TYPE = {
  FIXED:'FIXED', DROPDOWN:'DROPDOWN', AUTO_INC:'AUTO_INC',
  YEAR:'YEAR', MONTH:'MONTH', USER_INPUT:'USER_INPUT', COMPUTED:'COMPUTED',
}

export const FORMULAS = {
  GEN_SEQ:  ({ generation=6, partSeq=1 }={}) => `${generation}${String(partSeq).padStart(3,'0')}`,
  YEAR2:    () => String(new Date().getFullYear()).slice(-2),
  YEAR4:    () => String(new Date().getFullYear()),
  MONTH2:   () => String(new Date().getMonth()+1).padStart(2,'0'),
}

export function padSegment(value, length, padChar='0', padDir='left') {
  const s = String(value||'')
  if (!length || s.length>=length) return s
  const pad = (padChar||'0').repeat(length-s.length)
  return padDir==='left' ? pad+s : s+pad
}

export function getNextRunning(existingCodes, prefix) {
  const norm = prefix.trim().toUpperCase()
  const nums = (existingCodes||[])
    .map(c=>String(c).trim().toUpperCase())
    .filter(c=>c.startsWith(norm))
    .map(c=>parseInt(c.slice(norm.length).trim().split(/[\s\-\/]+/)[0])||0)
    .filter(n=>n>0)
  return nums.length===0 ? 1 : Math.max(...nums)+1
}

export function assembleCode(vals, sep=' ') {
  return vals.filter(v=>v!==null&&v!==undefined&&v!=='').join(sep)
}

export function resolveSegment(seg, inputs={}, ctx={}) {
  const val = inputs[seg.pos]
  switch(seg.type) {
    case 'FIXED':      return seg.value||''
    case 'DROPDOWN':   return val ? String(val).toUpperCase() : ''
    case 'USER_INPUT': return val ? String(val).slice(0,seg.length||99).toUpperCase() : ''
    case 'YEAR':       return seg.length===4 ? FORMULAS.YEAR4() : FORMULAS.YEAR2()
    case 'MONTH':      return FORMULAS.MONTH2()
    case 'COMPUTED': { const f=FORMULAS[seg.formula]; return f?f(inputs._computed||{}):''; }
    case 'AUTO_INC': {
      const prefix=(ctx.allSegValues||[]).join(ctx.separator||' ')
      return padSegment(getNextRunning(ctx.existingCodes||[],prefix),seg.length||3,seg.padChar||'0','left')
    }
    default: return val?String(val).toUpperCase():''
  }
}

export function generateItemCode(config, inputs={}, existingCodes=[]) {
  if (!config?.segments) return {code:'',segments:[],isComplete:false,missingSegments:[]}
  const segs=[...config.segments], sep=config.separator||' ', resolved=[], missing=[]
  segs.forEach(seg=>{
    const val=resolveSegment(seg,inputs,{separator:sep,existingCodes,allSegValues:resolved.slice()})
    if(seg.required&&!val&&seg.type!=='AUTO_INC') missing.push(seg.label)
    resolved.push(val||null)
  })
  const code=assembleCode(resolved.filter(Boolean),sep)
  return {code,segments:resolved,isComplete:missing.length===0&&!!code,missingSegments:missing}
}

export async function fetchCodeConfig(itemTypeCode) {
  try {
    const res=await fetch(`${BASE_URL}/mdm/item-code-config/${itemTypeCode}`,{headers:{Authorization:`Bearer ${getToken()}`}})
    const d=await res.json(); return d.data||null
  } catch { return null }
}

export async function fetchExistingCodes(itemTypeCode) {
  try {
    const res=await fetch(`${BASE_URL}/mdm/items?itemType=${itemTypeCode}&fields=code`,{headers:{Authorization:`Bearer ${getToken()}`}})
    const d=await res.json(); return (d.data||[]).map(i=>i.code).filter(Boolean)
  } catch { return [] }
}

export function useItemCodeGen(itemTypeCode) {
  const [config,setConfig]=useState(null)
  const [existingCodes,setExistingCodes]=useState([])
  const [inputs,setInputs]=useState({})
  const [loading,setLoading]=useState(false)
  const load=useCallback(async()=>{
    if(!itemTypeCode) return
    setLoading(true)
    try {
      const [cfg,codes]=await Promise.all([fetchCodeConfig(itemTypeCode),fetchExistingCodes(itemTypeCode)])
      setConfig(cfg); setExistingCodes(codes)
      if(cfg?.segments){const a={};cfg.segments.forEach(s=>{if(s.type==='FIXED')a[s.pos]=s.value||itemTypeCode});setInputs(a)}
    } finally{setLoading(false)}
  },[itemTypeCode])
  useEffect(()=>{load()},[load])
  const setInput=useCallback((pos,val)=>setInputs(p=>({...p,[pos]:val})),[])
  const setComputed=useCallback((obj)=>setInputs(p=>({...p,_computed:{...(p._computed||{}),...obj}})),[])
  const result=useMemo(()=>config?generateItemCode(config,inputs,existingCodes):{code:'',isComplete:false,missingSegments:[]},[config,inputs,existingCodes])
  return {config,inputs,setInput,setComputed,result,loading,reload:load}
}
