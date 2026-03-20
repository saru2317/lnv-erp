import React,{lazy,Suspense} from 'react'
import {Routes,Route,Navigate} from 'react-router-dom'
import ModuleLayout from '@components/layout/ModuleLayout'
import PageLoader from '@components/ui/PageLoader'
const VMDashboard=lazy(()=>import('./VMDashboard'))
const VisitorEntry=lazy(()=>import('./VisitorEntry'))
const VisitorLog=lazy(()=>import('./VisitorLog'))
const GatePass=lazy(()=>import('./GatePass'))
const NAV_ITEMS=[{to:'/vm',label:' Home'},{to:'/vm/new',label:'🪪 New Visitor'},{to:'/vm/log',label:' Visitor Log'},{to:'/vm/gatepass',label:' Gate Pass'}]
const SIDEBAR_GROUPS=[{label:'Visitor Management',icon:'🪪',items:[{to:'/vm',label:'Dashboard'},{to:'/vm/new',label:'New Visitor Entry'},{to:'/vm/log',label:'Visitor Log'},{to:'/vm/gatepass',label:'Gate Pass / Material'},{to:'/vm/badges',label:'Badge Management'}]}]
export default function VMLayout(){return(<ModuleLayout moduleName="VM" navItems={NAV_ITEMS} sidebarGroups={SIDEBAR_GROUPS}><Suspense fallback={<PageLoader text="Loading VM…"/>}><Routes><Route index element={<VMDashboard/>}/><Route path="new" element={<VisitorEntry/>}/><Route path="log" element={<VisitorLog/>}/><Route path="gatepass" element={<GatePass/>}/><Route path="*" element={<Navigate to="/vm" replace/>}/></Routes></Suspense></ModuleLayout>)}
