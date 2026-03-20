/**
 * ListViewContext — stores per-module list view settings
 * Admin can configure which columns show in each list screen
 */
import React, { createContext, useContext, useState } from 'react'

// Default column configs per module list
export const DEFAULT_CONFIGS = {
  'SD_CUSTOMERS': {
    label: 'Customer List',
    module: 'SD',
    allColumns: [
      { key:'id',          label:'Code',           width:80,  visible:true,  detail:false, type:'mono'   },
      { key:'name',        label:'Customer Name',  width:200, visible:true,  detail:false, type:'bold'   },
      { key:'gstin',       label:'GSTIN',          width:140, visible:true,  detail:false, type:'mono'   },
      { key:'mobile',      label:'Mobile',         width:110, visible:false, detail:false, type:'text'   },
      { key:'email',       label:'Email',          width:160, visible:false, detail:true,  type:'text'   },
      { key:'city',        label:'City',           width:130, visible:true,  detail:false, type:'text'   },
      { key:'state',       label:'State',          width:100, visible:false, detail:true,  type:'text'   },
      { key:'type',        label:'Type',           width:110, visible:false, detail:true,  type:'badge'  },
      { key:'gstType',     label:'GST Type',       width:110, visible:false, detail:true,  type:'badge'  },
      { key:'creditLimit', label:'Credit Limit',   width:110, visible:true,  detail:false, type:'amount' },
      { key:'creditDays',  label:'Credit Days',    width:90,  visible:false, detail:true,  type:'text'   },
      { key:'paymentTerms',label:'Pay Terms',      width:100, visible:false, detail:true,  type:'text'   },
      { key:'outstanding', label:'Outstanding',    width:110, visible:true,  detail:false, type:'amount' },
      { key:'priceList',   label:'Price List',     width:130, visible:false, detail:true,  type:'text'   },
      { key:'salesExec',   label:'Sales Exec',     width:100, visible:false, detail:true,  type:'text'   },
      { key:'status',      label:'Status',         width:90,  visible:true,  detail:false, type:'status' },
      { key:'jobWork',     label:'Job Work',       width:80,  visible:false, detail:true,  type:'bool'   },
    ]
  },
  'SD_ORDERS': {
    label: 'Sales Orders',
    module: 'SD',
    allColumns: [
      { key:'soNo',        label:'SO Number',      width:110, visible:true,  detail:false, type:'mono'   },
      { key:'date',        label:'Date',           width:100, visible:true,  detail:false, type:'date'   },
      { key:'customer',    label:'Customer',       width:170, visible:true,  detail:false, type:'bold'   },
      { key:'items',       label:'Items',          width:80,  visible:true,  detail:false, type:'text'   },
      { key:'delivDate',   label:'Delivery Date',  width:110, visible:false, detail:true,  type:'date'   },
      { key:'shipTo',      label:'Ship To',        width:130, visible:false, detail:true,  type:'text'   },
      { key:'salesExec',   label:'Sales Exec',     width:100, visible:false, detail:true,  type:'text'   },
      { key:'taxable',     label:'Taxable',        width:110, visible:true,  detail:false, type:'amount' },
      { key:'gst',         label:'GST',            width:90,  visible:true,  detail:false, type:'amount' },
      { key:'total',       label:'Total',          width:110, visible:true,  detail:false, type:'amount' },
      { key:'payTerms',    label:'Pay Terms',      width:100, visible:false, detail:true,  type:'text'   },
      { key:'soRef',       label:'Ref',            width:100, visible:false, detail:true,  type:'mono'   },
      { key:'status',      label:'Status',         width:100, visible:true,  detail:false, type:'status' },
    ]
  },
  'SD_INVOICES': {
    label: 'Invoices',
    module: 'SD',
    allColumns: [
      { key:'invNo',       label:'Invoice No',     width:110, visible:true,  detail:false, type:'mono'   },
      { key:'date',        label:'Date',           width:100, visible:true,  detail:false, type:'date'   },
      { key:'due',         label:'Due Date',       width:100, visible:false, detail:true,  type:'date'   },
      { key:'customer',    label:'Customer',       width:170, visible:true,  detail:false, type:'bold'   },
      { key:'soRef',       label:'SO Ref',         width:100, visible:false, detail:true,  type:'mono'   },
      { key:'hsn',         label:'HSN',            width:90,  visible:false, detail:true,  type:'mono'   },
      { key:'taxable',     label:'Taxable',        width:110, visible:true,  detail:false, type:'amount' },
      { key:'cgst',        label:'CGST',           width:90,  visible:false, detail:true,  type:'amount' },
      { key:'sgst',        label:'SGST',           width:90,  visible:false, detail:true,  type:'amount' },
      { key:'total',       label:'Total',          width:110, visible:true,  detail:false, type:'amount' },
      { key:'irn',         label:'IRN',            width:120, visible:false, detail:true,  type:'mono'   },
      { key:'ewb',         label:'E-Way Bill',     width:120, visible:false, detail:true,  type:'mono'   },
      { key:'status',      label:'Status',         width:100, visible:true,  detail:false, type:'status' },
    ]
  },
  'MM_PO': {
    label: 'Purchase Orders',
    module: 'MM',
    allColumns: [
      { key:'poNo',        label:'PO Number',      width:110, visible:true,  detail:false, type:'mono'   },
      { key:'date',        label:'Date',           width:100, visible:true,  detail:false, type:'date'   },
      { key:'vendor',      label:'Vendor',         width:170, visible:true,  detail:false, type:'bold'   },
      { key:'prRef',       label:'PR Ref',         width:100, visible:false, detail:true,  type:'mono'   },
      { key:'delivBy',     label:'Deliver By',     width:100, visible:false, detail:true,  type:'date'   },
      { key:'payTerms',    label:'Pay Terms',      width:100, visible:false, detail:true,  type:'text'   },
      { key:'taxable',     label:'Taxable',        width:110, visible:false, detail:true,  type:'amount' },
      { key:'gst',         label:'GST',            width:90,  visible:false, detail:true,  type:'amount' },
      { key:'total',       label:'Total',          width:110, visible:true,  detail:false, type:'amount' },
      { key:'grn',         label:'GRN Done',       width:80,  visible:false, detail:true,  type:'bool'   },
      { key:'status',      label:'Status',         width:100, visible:true,  detail:false, type:'status' },
    ]
  },
  'PP_JOBS': {
    label: 'Job Cards / Work Orders',
    module: 'PP',
    allColumns: [
      { key:'joNo',        label:'JO Number',      width:110, visible:true,  detail:false, type:'mono'   },
      { key:'date',        label:'Date',           width:100, visible:true,  detail:false, type:'date'   },
      { key:'soRef',       label:'SO Ref',         width:100, visible:true,  detail:false, type:'mono'   },
      { key:'customer',    label:'Customer',       width:160, visible:true,  detail:false, type:'bold'   },
      { key:'process',     label:'Process',        width:160, visible:false, detail:true,  type:'text'   },
      { key:'machine',     label:'Machine',        width:130, visible:false, detail:true,  type:'text'   },
      { key:'startDate',   label:'Start Date',     width:100, visible:false, detail:true,  type:'date'   },
      { key:'endDate',     label:'End Date',       width:100, visible:false, detail:true,  type:'date'   },
      { key:'qty',         label:'Qty',            width:80,  visible:true,  detail:false, type:'text'   },
      { key:'shift',       label:'Shift',          width:90,  visible:false, detail:true,  type:'text'   },
      { key:'status',      label:'Status',         width:100, visible:true,  detail:false, type:'status' },
    ]
  },
  'QM_INSPECTIONS': {
    label: 'Inspection List',
    module: 'QM',
    allColumns: [
      { key:'irNo',        label:'IR Number',      width:110, visible:true,  detail:false, type:'mono'   },
      { key:'date',        label:'Date',           width:100, visible:true,  detail:false, type:'date'   },
      { key:'type',        label:'Type',           width:100, visible:true,  detail:false, type:'badge'  },
      { key:'product',     label:'Product',        width:160, visible:true,  detail:false, type:'bold'   },
      { key:'batch',       label:'Batch',          width:110, visible:false, detail:true,  type:'mono'   },
      { key:'customer',    label:'Customer',       width:150, visible:false, detail:true,  type:'text'   },
      { key:'inspector',   label:'Inspector',      width:130, visible:false, detail:true,  type:'text'   },
      { key:'qty',         label:'Qty',            width:70,  visible:true,  detail:false, type:'text'   },
      { key:'qtyOk',       label:'Accepted',       width:80,  visible:false, detail:true,  type:'text'   },
      { key:'qtyRej',      label:'Rejected',       width:80,  visible:false, detail:true,  type:'text'   },
      { key:'ppm',         label:'PPM',            width:80,  visible:false, detail:true,  type:'text'   },
      { key:'verdict',     label:'Verdict',        width:100, visible:true,  detail:false, type:'status' },
    ]
  },
}

const ListViewContext = createContext(null)

export function ListViewProvider({ children }) {
  const [configs, setConfigs] = useState(DEFAULT_CONFIGS)
  const [viewModes, setViewModes] = useState({}) // 'list' | 'detail' per screen

  const getConfig  = key => configs[key] || DEFAULT_CONFIGS[key]
  const getMode    = key => viewModes[key] || 'list'
  const setMode    = (key, mode) => setViewModes(p => ({ ...p, [key]: mode }))
  const saveConfig = (key, cols) => setConfigs(p => ({ ...p, [key]: { ...p[key], allColumns: cols } }))

  // Get visible columns for current mode
  const getVisibleCols = (key, mode) => {
    const cfg  = getConfig(key)
    if (!cfg) return []
    const m = mode || getMode(key)
    return cfg.allColumns.filter(c => m === 'detail' ? (c.visible || c.detail) : c.visible)
  }

  return (
    <ListViewContext.Provider value={{ configs, getConfig, getMode, setMode, saveConfig, getVisibleCols }}>
      {children}
    </ListViewContext.Provider>
  )
}

export const useListView = () => useContext(ListViewContext)
