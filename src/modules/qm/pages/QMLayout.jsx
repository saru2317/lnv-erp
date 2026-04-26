import React, { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import ModuleLayout from '@components/layout/ModuleLayout'
import PageLoader from '@components/ui/PageLoader'

const QMDashboard          = lazy(() => import('./QMDashboard'))
const InspectionList       = lazy(() => import('./InspectionList'))
const InspectionNew        = lazy(() => import('./InspectionNew'))
const NCRList              = lazy(() => import('./NCRList'))
const NCRNew               = lazy(() => import('./NCRNew'))
const CAPAList             = lazy(() => import('./CAPAList'))
const CAPANew              = lazy(() => import('./CAPANew'))
const QualityPlan          = lazy(() => import('./QualityPlan'))
const SamplingPlan         = lazy(() => import('./SamplingPlan'))
const CertificateList      = lazy(() => import('./CertificateList'))
const VendorQuality        = lazy(() => import('./VendorQuality'))
const QualityReport        = lazy(() => import('./QualityReport'))
const WhyWhyAnalysis       = lazy(() => import('./WhyWhyAnalysis'))
const SevenQCTools         = lazy(() => import('./SevenQCTools'))
const EightDList           = lazy(() => import('./EightDList'))
const EightDReport         = lazy(() => import('./EightDReport'))
const CustomerComplaintList= lazy(() => import('./CustomerComplaintList'))
const CustomerComplaintNew = lazy(() => import('./CustomerComplaintNew'))
const PPAPList             = lazy(() => import('./PPAPList'))
const PPAPNew              = lazy(() => import('./PPAPNew'))

const SIDEBAR_GROUPS = [
  { label:'Overview', icon:'📊', items:[
    { to:'/qm', label:'QM Dashboard' },
  ]},
  { label:'Inspection', icon:'🔬', items:[
    { to:'/qm/inspection',     label:'Inspection Register'     },
    { to:'/qm/inspection/new', label:'New Inspection (QA01)'   },
  ]},
  { label:'Non-Conformance', icon:'⚠️', items:[
    { to:'/qm/ncr',        label:'NCR Register'  },
    { to:'/qm/ncr/new',    label:'Raise NCR'     },
    { to:'/qm/capa',       label:'CAPA List'     },
    { to:'/qm/capa/new',   label:'New CAPA'      },
  ]},
  { label:'Customer Complaints', icon:'📞', items:[
    { to:'/qm/complaint',     label:'Complaint Register' },
    { to:'/qm/complaint/new', label:'New Complaint'      },
  ]},
  { label:'Root Cause & Analysis', icon:'🔍', items:[
    { to:'/qm/why-analysis', label:'Why-Why Analysis (5-Why)' },
    { to:'/qm/7qc',          label:'7 QC Tools'               },
    { to:'/qm/8d',           label:'8D Reports'               },
    { to:'/qm/8d/new',       label:'New 8D Report'            },
  ]},
  { label:'PPAP', icon:'🏆', items:[
    { to:'/qm/ppap',     label:'PPAP Register'       },
    { to:'/qm/ppap/new', label:'New PPAP Submission'  },
  ]},
  { label:'Planning', icon:'📋', items:[
    { to:'/qm/plan',     label:'Quality Plans'       },
    { to:'/qm/sampling', label:'Sampling Plans (AQL)' },
  ]},
  { label:'Certificates & Reports', icon:'📄', items:[
    { to:'/qm/certificates', label:'COC / Test Certificates' },
    { to:'/qm/vendor',       label:'Vendor Quality Rating'   },
    { to:'/qm/report',       label:'Quality Report'          },
  ]},
]

export default function QMLayout() {
  return (
    <ModuleLayout moduleName="QM" sidebarGroups={SIDEBAR_GROUPS}>
      <Suspense fallback={<PageLoader text="Loading QM…" />}>
        <Routes>
          <Route index                    element={<QMDashboard />}           />
          <Route path="inspection"        element={<InspectionList />}        />
          <Route path="inspection/new"    element={<InspectionNew />}         />
          <Route path="inspection/:id"    element={<InspectionNew />}         />
          <Route path="ncr"               element={<NCRList />}               />
          <Route path="ncr/new"           element={<NCRNew />}                />
          <Route path="ncr/:id"           element={<NCRNew />}                />
          <Route path="capa"              element={<CAPAList />}              />
          <Route path="capa/new"          element={<CAPANew />}               />
          <Route path="capa/:id"          element={<CAPANew />}               />
          <Route path="complaint"         element={<CustomerComplaintList />} />
          <Route path="complaint/new"     element={<CustomerComplaintNew />}  />
          <Route path="complaint/:id"     element={<CustomerComplaintNew />}  />
          <Route path="why-analysis"      element={<WhyWhyAnalysis />}        />
          <Route path="why-analysis/:id"  element={<WhyWhyAnalysis />}        />
          <Route path="7qc"               element={<SevenQCTools />}          />
          <Route path="8d"                element={<EightDList />}            />
          <Route path="8d/new"            element={<EightDReport />}          />
          <Route path="8d/:id"            element={<EightDReport />}          />
          <Route path="ppap"              element={<PPAPList />}              />
          <Route path="ppap/new"          element={<PPAPNew />}               />
          <Route path="ppap/:id"          element={<PPAPNew />}               />
          <Route path="plan"              element={<QualityPlan />}           />
          <Route path="sampling"          element={<SamplingPlan />}          />
          <Route path="certificates"      element={<CertificateList />}       />
          <Route path="vendor"            element={<VendorQuality />}         />
          <Route path="report"            element={<QualityReport />}         />
          <Route path="*"                 element={<Navigate to="/qm" replace />} />
        </Routes>
      </Suspense>
    </ModuleLayout>
  )
}
