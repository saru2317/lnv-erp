// src/hooks/usePPConfig.js
// ─────────────────────────────────────────────────────────────────
// Merges _ppConfig.js (static industry library) with DB config
// (user-saved via PPConfigurator).
//
// Priority:  DB config (saved by admin) > _ppConfig.js defaults
// Fallback:  If no DB config → uses _ppConfig.js defaults
// Cache:     sessionStorage + module-level (survives re-renders)
// ─────────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react'

// ── Import EVERYTHING from existing _ppConfig.js ─────────────────
import {
  INDUSTRIES,
  PRODUCTION_TYPES,
  ITEMS,
  MOULDS,
  WORK_CENTERS,
  PP_CUSTOMERS,
  RATE_CARDS,
  JOB_CARDS,
  BATCHES,
  JOB_STEPS,
  INDUSTRY_SUBTYPES,
  DEMO_COMPANY_CONFIG,
  PRIORITY_COLORS,
  CHARGE_BASES,
  SHIFT_OPTIONS,
  WC_STATUS,
  ENTITY_TYPES,
  STEP_STATUS_COLORS,
  STEP_STATUS_TEXT,
  calcShotOutput,
  calcPlatingThickness,
} from './_ppConfig'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const getToken = () => localStorage.getItem('lnv_token')
const hdr2     = () => ({ Authorization: `Bearer ${getToken()}` })

// ── Module-level cache ────────────────────────────────────────────
let _cachedMerged    = null
let _fetchInProgress = false
let _fetchPromise    = null

// ── Parse JSON field safely ───────────────────────────────────────
const safeParse = (val, fallback = []) => {
  if (Array.isArray(val) || (val && typeof val === 'object')) return val
  try { return JSON.parse(val || JSON.stringify(fallback)) } catch { return fallback }
}

// ── Build merged config ───────────────────────────────────────────
function buildMerged(dbConfig) {
  const key      = dbConfig?.industryKey || 'surface_treatment'
  const staticInd = INDUSTRIES[key] || INDUSTRIES['surface_treatment']

  // Stages: DB custom processes OR static industry stages
  const dbProcesses   = safeParse(dbConfig?.processes, [])
  const dbWorkCenters = safeParse(dbConfig?.workCenters, [])

  const stages = dbProcesses.length > 0
    ? dbProcesses.map((p, i) => ({
        id:            p.id          || `db-${i}`,
        name:          p.name,
        machine:       p.machine     || '',
        fields:        Array.isArray(p.fields) ? p.fields : [],
        isQC:          p.isQC        || false,
        isOptional:    p.isOptional  || false,
        shotCounter:   p.shotCounter    || false,
        amperHourCalc: p.amperHourCalc  || false,
        sortOrder:     p.sortOrder   || i,
      }))
    : (staticInd?.stages || [])

  const workCenters = dbWorkCenters.length > 0 ? dbWorkCenters : WORK_CENTERS

  const industrySettings = safeParse(dbConfig?.industrySettings, {})

  return {
    // Raw DB config
    dbConfig,

    // Core identity
    industryKey:  key,
    industryName: dbConfig?.industryName || staticInd?.name || key,
    prodType:     dbConfig?.prodType     || staticInd?.prodType || 'batch',
    bizType:      dbConfig?.bizType      || 'jobwork',
    rmMethod:     dbConfig?.rmMethod     || 'push',
    sequenceType: dbConfig?.sequenceType || 'sequence',
    chargeBy:     dbConfig?.chargeBy     || 'Per Piece',
    industrySettings,

    // MO toggles
    moEnabled:    dbConfig?.moEnabled    || false,
    moAutoFromSO: dbConfig?.moAutoFromSO || false,
    moAutoWO:     dbConfig?.moAutoWO !== false,

    // Merged stages + work centers
    stages,
    processes:    stages.map(s => s.name),
    workCenters,

    // Static industry reference from _ppConfig
    industry: staticInd,

    // ── Full static library — ALL pages still work ────────────────
    INDUSTRIES,
    PRODUCTION_TYPES,
    ITEMS,
    MOULDS,
    WORK_CENTERS,         // static WC list (always available)
    PP_CUSTOMERS,
    RATE_CARDS,
    JOB_CARDS,
    BATCHES,
    JOB_STEPS,
    INDUSTRY_SUBTYPES,
    DEMO_COMPANY_CONFIG,
    PRIORITY_COLORS,
    CHARGE_BASES,
    SHIFT_OPTIONS,
    WC_STATUS,
    ENTITY_TYPES,
    STEP_STATUS_COLORS,
    STEP_STATUS_TEXT,
    calcShotOutput,
    calcPlatingThickness,
  }
}

// ── MAIN HOOK ─────────────────────────────────────────────────────
export default function usePPConfig() {
  const [merged,  setMerged]  = useState(_cachedMerged)
  const [loading, setLoading] = useState(!_cachedMerged)

  useEffect(() => {
    if (_cachedMerged) { setMerged(_cachedMerged); setLoading(false); return }

    if (_fetchInProgress && _fetchPromise) {
      _fetchPromise.then(m => { setMerged(m); setLoading(false) })
      return
    }

    _fetchInProgress = true
    _fetchPromise = fetch(`${BASE_URL}/pp/config`, { headers: hdr2() })
      .then(r => r.json())
      .then(d  => {
        const m = buildMerged(d.data || null)
        _cachedMerged = m
        // Lightweight snapshot for sidebar + non-hook usage
        try {
          sessionStorage.setItem('pp_config', JSON.stringify({
            industryKey:  m.industryKey,
            industryName: m.industryName,
            prodType:     m.prodType,
            bizType:      m.bizType,
            moEnabled:    m.moEnabled,
            moAutoFromSO: m.moAutoFromSO,
            sequenceType: m.sequenceType,
            rmMethod:     m.rmMethod,
          }))
        } catch {}
        return m
      })
      .catch(() => {
        // API down → fall back to _ppConfig defaults silently
        const m = buildMerged(null)
        _cachedMerged = m
        return m
      })
      .finally(() => { _fetchInProgress = false })

    _fetchPromise.then(m => { setMerged(m); setLoading(false) })
  }, [])

  // ── Derived helpers ─────────────────────────────────────────────
  const cfg = merged

  return {
    // State
    config:  cfg,
    loading,
    dbConfig: cfg?.dbConfig || null,

    // Core fields
    industryKey:  cfg?.industryKey  || 'surface_treatment',
    industryName: cfg?.industryName || 'Surface Treatment',
    prodType:     cfg?.prodType     || 'batch',
    bizType:      cfg?.bizType      || 'jobwork',
    rmMethod:     cfg?.rmMethod     || 'push',
    sequenceType: cfg?.sequenceType || 'sequence',
    chargeBy:     cfg?.chargeBy     || 'Per Piece',

    // MO flags
    moEnabled:    cfg?.moEnabled    || false,
    moAutoFromSO: cfg?.moAutoFromSO || false,
    moAutoWO:     cfg?.moAutoWO !== false,

    // Merged dynamic data
    stages:      cfg?.stages      || [],
    processes:   cfg?.processes   || [],
    workCenters: cfg?.workCenters || WORK_CENTERS,
    industry:    cfg?.industry    || INDUSTRIES['surface_treatment'],

    // ── Full static library (backward compatible) ─────────────────
    INDUSTRIES,
    PRODUCTION_TYPES,
    ITEMS,
    MOULDS,
    WORK_CENTERS,
    PP_CUSTOMERS,
    RATE_CARDS,
    JOB_CARDS,
    BATCHES,
    JOB_STEPS,
    INDUSTRY_SUBTYPES,
    DEMO_COMPANY_CONFIG,
    PRIORITY_COLORS,
    CHARGE_BASES,
    SHIFT_OPTIONS,
    WC_STATUS,
    ENTITY_TYPES,
    STEP_STATUS_COLORS,
    STEP_STATUS_TEXT,
    calcShotOutput,
    calcPlatingThickness,

    // ── Derived helpers ───────────────────────────────────────────
    isMOEnabled:       () => !!cfg?.moEnabled,
    isBatchType:       () => cfg?.prodType === 'batch',
    isMouldType:       () => cfg?.prodType === 'mould',
    isJobWork:         () => ['jobwork','hybrid'].includes(cfg?.bizType),
    isSequence:        () => cfg?.sequenceType === 'sequence',
    hasShotCounter:    () => cfg?.stages?.some(s => s.shotCounter)    || cfg?.industrySettings?.shotCounter    || false,
    hasAmperHourCalc:  () => cfg?.stages?.some(s => s.amperHourCalc)  || cfg?.industrySettings?.amperHourCalc  || false,
    hasMouldConcept:   () => cfg?.industrySettings?.mouldConcept      || cfg?.prodType === 'mould'              || false,
    hasBatchConcept:   () => cfg?.industrySettings?.batchConcept      || cfg?.prodType === 'batch'              || false,

    getStages:       () => cfg?.stages      || [],
    getProcesses:    () => cfg?.processes   || [],
    getWorkCenters:  () => cfg?.workCenters || WORK_CENTERS,
    getIndustry:     () => cfg?.industry    || INDUSTRIES['surface_treatment'],
    getStage:        (name) => cfg?.stages?.find(s => s.name === name) || null,
    getStageFields:  (name) => cfg?.stages?.find(s => s.name === name)?.fields || [],
  }
}

// ── Non-hook helper — sidebar, PPLayout (no React) ────────────────
export function getPPConfigFromSession() {
  try { return JSON.parse(sessionStorage.getItem('pp_config') || '{}') } catch { return {} }
}

// ── Re-export everything from _ppConfig (backward compat) ─────────
export {
  INDUSTRIES,
  PRODUCTION_TYPES,
  ITEMS,
  MOULDS,
  WORK_CENTERS,
  PP_CUSTOMERS,
  RATE_CARDS,
  JOB_CARDS,
  BATCHES,
  JOB_STEPS,
  INDUSTRY_SUBTYPES,
  DEMO_COMPANY_CONFIG,
  PRIORITY_COLORS,
  CHARGE_BASES,
  SHIFT_OPTIONS,
  WC_STATUS,
  ENTITY_TYPES,
  STEP_STATUS_COLORS,
  STEP_STATUS_TEXT,
  calcShotOutput,
  calcPlatingThickness,
}
