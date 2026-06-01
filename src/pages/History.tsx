import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Icon from '../components/Icon'
import { usePersistState } from '../hooks/usePersistState'
import { api } from '../services/api'

type Tab = 'sessions' | 'medical'

type Condition = 'Hypertension' | 'Type 2 Diabetes' | 'Asthma' | 'Heart Disease' | 'Thyroid Disorder'
const conditionsList: Condition[] = ['Hypertension', 'Type 2 Diabetes', 'Asthma', 'Heart Disease', 'Thyroid Disorder']

interface Medication {
  name: string
  dosage: string
  frequency: string
}

const sessionFilters = ['All Sessions', 'Low', 'Moderate', 'High']

const severityConfig: Record<string, { severityClass: string; severityIcon: string }> = {
  Urgent: { severityClass: 'bg-error text-on-error dark:bg-red-900 dark:text-red-200', severityIcon: 'warning' },
  Moderate: { severityClass: 'bg-tertiary-fixed text-tertiary dark:bg-amber-900/40 dark:text-amber-300', severityIcon: 'info' },
  Stable: { severityClass: 'bg-secondary-container text-secondary dark:bg-slate-700 dark:text-slate-300', severityIcon: 'check_circle' },
}

const tabs: { key: Tab; label: string; icon: string }[] = [
  { key: 'sessions', label: 'Triage Sessions', icon: 'history' },
  { key: 'medical', label: 'Medical History', icon: 'assignment' },
]

interface BackendTriage {
  _id: string
  symptoms: string[]
  duration: string
  severity: 'Mild' | 'Moderate' | 'Severe'
  notes?: string
  triageStatus: { level: 'Emergency' | 'Urgent' | 'Non-Urgent' }
  actionPlan: string
  createdAt: string
}

function severityLabel(level: string): string {
  if (level === 'Emergency' || level === 'Urgent') return 'Urgent'
  if (level === 'Moderate') return 'Moderate'
  return 'Stable'
}

function SessionsView() {
  const navigate = useNavigate()
  const { sessions } = useAuth()
  const [backendSessions, setBackendSessions] = useState<BackendTriage[]>([])
  const [loadingHistory, setLoadingHistory] = useState(true)
  const [activeFilter, setActiveFilter] = useState('All Sessions')
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    api.get<{ msg: string; data: BackendTriage[] }>('/triage/list')
      .then(res => setBackendSessions(res.data || []))
      .catch(() => {/* fall back to local sessions */})
      .finally(() => setLoadingHistory(false))
  }, [])

  // Show backend records if available, otherwise fall back to local sessions
  const allSessions = backendSessions.length > 0
    ? backendSessions.map(s => ({
        id: s._id,
        condition: s.symptoms.join(', '),
        description: s.actionPlan,
        date: new Date(s.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        time: new Date(s.createdAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
        severity: severityLabel(s.triageStatus.level) as 'Urgent' | 'Moderate' | 'Stable',
        statusLabel: s.triageStatus.level,
        statusIcon: s.triageStatus.level === 'Emergency' ? 'warning' : s.triageStatus.level === 'Urgent' ? 'info' : 'check_circle',
        tags: [s.severity, `Duration: ${s.duration}`],
      }))
    : sessions

  const filteredSessions = activeFilter === 'All Sessions'
    ? allSessions
    : allSessions.filter(s => {
        if (activeFilter === 'Low') return s.severity === 'Stable'
        if (activeFilter === 'Moderate') return s.severity === 'Moderate'
        if (activeFilter === 'High') return s.severity === 'Urgent'
        return true
      })

  const urgentCount = allSessions.filter(s => s.severity === 'Urgent').length

  return (
    <section className="max-w-container-max-width w-full mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
        <div className="overflow-x-auto w-full md:w-auto">
          <div className="flex p-1 bg-surface-container-low rounded-full border border-outline-variant/30 w-max">
            {sessionFilters.map(f => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={
                  activeFilter === f
                    ? 'px-6 py-2 rounded-full font-label-md text-label-md bg-primary text-on-primary transition-all shadow-sm'
                    : 'px-6 py-2 rounded-full font-label-md text-label-md text-secondary hover:text-primary transition-all'
                }
              >
                {f}
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-4 flex-wrap">
          <div className="px-5 py-3 bg-surface-container-high dark:bg-slate-800 rounded-xl border border-outline-variant/30 flex flex-col">
            <span className="font-caption text-caption text-secondary uppercase tracking-wider">Total Triage</span>
            <span className="font-headline-md text-headline-md text-primary">{sessions.length}</span>
          </div>
          <div className="px-5 py-3 bg-error-container/30 rounded-xl border border-error/10 flex flex-col">
            <span className="font-caption text-caption text-error uppercase tracking-wider">Urgent Alerts</span>
            <span className="font-headline-md text-headline-md text-error">{urgentCount}</span>
          </div>
        </div>
      </div>

      {loadingHistory ? (
        <div className="flex justify-center py-20"><span className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /></div>
      ) : filteredSessions.length === 0 ? (
        <div className="bg-surface-container-lowest rounded-2xl border border-dashed border-outline-variant/50 p-14 text-center">
          <div className="w-20 h-20 mx-auto mb-5 bg-surface-container-low rounded-full flex items-center justify-center text-secondary">
            <Icon icon="history" className="text-4xl" />
          </div>
          <h3 className="font-headline-md text-headline-md text-on-surface mb-2">No triage history</h3>
          <p className="font-body-md text-body-md text-secondary max-w-md mx-auto mb-6">
            {activeFilter === 'All Sessions'
              ? 'Your completed triage sessions will appear here. Start a new session to begin.'
              : `No sessions match "${activeFilter}" severity.`}
          </p>
          <button onClick={() => navigate('/new-triage')} className="inline-flex items-center gap-2 bg-primary text-on-primary px-6 py-3 rounded-full font-label-md text-label-md hover:bg-primary/90 transition-colors">
            <Icon icon="add" />
            Start New Triage
          </button>
        </div>
      ) : (
        <div className="space-y-stack-md">
          {filteredSessions.map(s => {
            const config = severityConfig[s.severity] || { severityClass: 'bg-surface-container text-secondary', severityIcon: 'info' }
            return (
              <div
                key={s.id}
                className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/50 flex flex-col lg:flex-row items-start lg:items-center gap-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:shadow-black/5"
              >
                <div className="flex flex-col min-w-[120px]">
                  <span className="font-label-md text-label-md text-primary">{s.date}</span>
                  <span className="font-caption text-caption text-secondary">{s.time}</span>
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-3 mb-2">
                    <span className="px-3 py-1 bg-surface-container rounded-full text-primary font-label-md text-label-md">
                      {s.condition}
                    </span>
                    <span className={`px-3 py-1 rounded-full font-label-md text-label-md flex items-center gap-1 ${config.severityClass}`}>
                      <Icon icon={config.severityIcon} className="text-[14px]" />
                      {s.severity}
                    </span>
                  </div>
                  <p className="text-on-surface-variant font-body-md line-clamp-1">{s.description}</p>
                </div>
                <div className="flex items-center gap-4 w-full lg:w-auto">
                  <button onClick={() => navigate('/care-details')} className="flex-1 lg:flex-none px-6 py-3 border border-primary text-primary font-label-md text-label-md rounded-full hover:bg-primary-fixed transition-colors">
                    View Details
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {sessions.length > 0 && (
        <div className="mt-12 flex justify-center">
          <nav className="flex items-center gap-2">
            <button onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-surface-container transition-colors text-secondary">
              <Icon icon="chevron_left" />
            </button>
            {[1, 2, 3].map(p => (
              <button
                key={p}
                onClick={() => setCurrentPage(p)}
                className={
                  currentPage === p
                    ? 'w-10 h-10 flex items-center justify-center rounded-lg bg-primary text-on-primary font-label-md text-label-md'
                    : 'w-10 h-10 flex items-center justify-center rounded-lg hover:bg-surface-container transition-colors font-label-md text-label-md'
                }
              >
                {p}
              </button>
            ))}
            <button onClick={() => setCurrentPage(Math.min(3, currentPage + 1))} className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-surface-container transition-colors text-secondary">
              <Icon icon="chevron_right" />
            </button>
          </nav>
        </div>
      )}
    </section>
  )
}

function MedicalForm() {
  const navigate = useNavigate()
  const [selectedConditions, setSelectedConditions] = usePersistState<Condition[]>('doctarr_conditions', [])
  const [customConditions, setCustomConditions] = usePersistState<string[]>('doctarr_custom_conditions', [])
  const [allergies, setAllergies] = usePersistState<string[]>('doctarr_allergies', [])
  const [allergyInput, setAllergyInput] = useState('')
  const [medications, setMedications] = usePersistState<Medication[]>('doctarr_medications', [])
  const [emergencyContact, setEmergencyContact] = usePersistState('doctarr_emergency_contact', '')
  const [pastSurgeries, setPastSurgeries] = usePersistState('doctarr_surgeries', '')
  const [dob, setDob] = usePersistState('doctarr_dob', '')
  const [bloodType, setBloodType] = usePersistState('doctarr_blood_type', '')
  const [showCustomCondition, setShowCustomCondition] = useState(false)
  const [customConditionInput, setCustomConditionInput] = useState('')
  const [saved, setSaved] = useState(false)

  const toggleCondition = (condition: Condition) => {
    setSelectedConditions(prev =>
      prev.includes(condition) ? prev.filter(c => c !== condition) : [...prev, condition]
    )
  }

  const addCustomCondition = () => {
    const t = customConditionInput.trim()
    if (t && !customConditions.includes(t)) {
      setCustomConditions([...customConditions, t])
      setCustomConditionInput('')
      setShowCustomCondition(false)
    }
  }

  const removeCustomCondition = (c: string) => {
    setCustomConditions(customConditions.filter(x => x !== c))
  }

  const addAllergy = () => {
    const trimmed = allergyInput.trim()
    if (trimmed && !allergies.includes(trimmed)) {
      setAllergies([...allergies, trimmed])
      setAllergyInput('')
    }
  }

  const removeAllergy = (allergy: string) => {
    setAllergies(allergies.filter(a => a !== allergy))
  }

  const updateMedication = (index: number, field: keyof Medication, value: string) => {
    setMedications(prev => prev.map((m, i) => i === index ? { ...m, [field]: value } : m))
  }

  const addMedication = () => {
    setMedications(prev => [...prev, { name: '', dosage: '', frequency: '' }])
  }

  const removeMedication = (index: number) => {
    setMedications(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <section className="max-w-container-max-width w-full mx-auto">
      {saved && (
        <div className="mb-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 flex items-center gap-3">
          <Icon icon="check_circle" className="text-green-600 dark:text-green-400 icon-fill" />
          <p className="font-body-md text-green-800 dark:text-green-200">Your medical history has been saved successfully.</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 shadow-[0px_4px_20px_rgba(0,0,0,0.03)] overflow-hidden">
        <div className="p-6 md:p-8 space-y-12">
          <section>
            <div className="flex items-center gap-3 mb-6 border-b border-outline-variant/20 pb-4">
              <div className="w-8 h-8 rounded-full bg-primary-fixed flex items-center justify-center text-primary">
                <Icon icon="badge" className="text-sm" />
              </div>
              <h3 className="font-headline-md text-headline-md text-on-surface">Personal Information</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block font-label-md text-label-md text-on-surface-variant mb-2" htmlFor="hist-dob">
                  Date of Birth <span className="text-error">*</span>
                </label>
                <input className="w-full bg-surface-container-low border border-outline-variant/50 rounded-lg px-4 py-3 font-body-md text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none" id="hist-dob" type="date" value={dob} onChange={e => setDob(e.target.value)} required />
              </div>
              <div>
                <label className="block font-label-md text-label-md text-on-surface-variant mb-2" htmlFor="hist-blood">Blood Type</label>
                <select className="w-full bg-surface-container-low border border-outline-variant/50 rounded-lg px-4 py-3 font-body-md text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none appearance-none" id="hist-blood" value={bloodType} onChange={e => setBloodType(e.target.value)}>
                  <option value="">Select Blood Type</option>
                  <option value="a+">A+</option>
                  <option value="a-">A-</option>
                  <option value="b+">B+</option>
                  <option value="b-">B-</option>
                  <option value="ab+">AB+</option>
                  <option value="ab-">AB-</option>
                  <option value="o+">O+</option>
                  <option value="o-">O-</option>
                  <option value="unknown">Unknown</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block font-label-md text-label-md text-error mb-2" htmlFor="hist-emergency">
                  Emergency Contact Number <span className="text-error">*</span>
                </label>
                <input className="w-full bg-error-container/20 border border-error rounded-lg px-4 py-3 font-body-md text-on-surface focus:border-error focus:ring-2 focus:ring-error/20 transition-all outline-none" id="hist-emergency" type="tel" placeholder="(555) 000-0000" value={emergencyContact} onChange={e => setEmergencyContact(e.target.value)} />
                {!emergencyContact && (
                  <p className="font-caption text-caption text-error mt-1 flex items-center gap-1">
                    <Icon icon="error" className="text-[14px]" />
                    This field is recommended.
                  </p>
                )}
              </div>
            </div>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-6 border-b border-outline-variant/20 pb-4">
              <div className="w-8 h-8 rounded-full bg-primary-fixed flex items-center justify-center text-primary">
                <Icon icon="vital_signs" className="text-sm" />
              </div>
              <h3 className="font-headline-md text-headline-md text-on-surface">Existing Conditions</h3>
            </div>
            <p className="font-body-md text-on-surface-variant mb-4">Select all chronic conditions that apply.</p>
            <div className="flex flex-wrap gap-3">
              {conditionsList.map(condition => (
                <button
                  key={condition}
                  type="button"
                  onClick={() => toggleCondition(condition)}
                  className={`px-4 py-2 rounded-full font-label-md text-label-md transition-all cursor-pointer ${
                    selectedConditions.includes(condition)
                      ? 'border border-primary bg-primary text-white'
                      : 'border border-outline-variant bg-surface-container-low text-on-surface-variant hover:bg-surface-variant'
                  }`}
                >
                  {condition}
                </button>
              ))}
              {customConditions.map(c => (
                <span key={c} className="px-4 py-2 rounded-full border border-primary bg-primary/10 text-primary font-label-md text-label-md flex items-center gap-2">
                  {c}
                  <button type="button" onClick={() => removeCustomCondition(c)} className="hover:text-error transition-colors">
                    <Icon icon="close" className="text-[14px]" />
                  </button>
                </span>
              ))}
              {!showCustomCondition ? (
                <button onClick={() => setShowCustomCondition(true)} className="px-4 py-2 rounded-full border border-dashed border-primary text-primary font-label-md text-label-md flex items-center gap-1 hover:bg-primary-fixed/30 transition-colors" type="button">
                  <Icon icon="add" className="text-sm" /> Add Other
                </button>
              ) : (
                <div className="flex gap-2 items-center flex-wrap">
                  <input className="bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 font-body-md outline-none focus:border-primary min-w-0 flex-1" placeholder="Condition name" value={customConditionInput} onChange={e => setCustomConditionInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustomCondition() } }} />
                  <button onClick={addCustomCondition} className="bg-primary text-white px-3 py-2 rounded-lg font-label-md text-sm" type="button">Add</button>
                  <button onClick={() => { setShowCustomCondition(false); setCustomConditionInput('') }} className="text-secondary px-2 py-2 text-sm" type="button">Cancel</button>
                </div>
              )}
            </div>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-6 border-b border-outline-variant/20 pb-4">
              <div className="w-8 h-8 rounded-full bg-error-container/30 flex items-center justify-center text-error">
                <Icon icon="warning" className="text-sm" />
              </div>
              <h3 className="font-headline-md text-headline-md text-on-surface">Allergies</h3>
            </div>
            <div className="flex flex-wrap gap-3 mb-4">
              {allergies.map(allergy => (
                <div key={allergy} className="px-4 py-2 rounded-full border border-error/50 bg-error-container text-on-error-container font-label-md text-label-md flex items-center gap-2">
                  {allergy}
                  <button aria-label={`Remove ${allergy}`} className="hover:text-error transition-colors" type="button" onClick={() => removeAllergy(allergy)}>
                    <Icon icon="close" className="text-[16px]" />
                  </button>
                </div>
              ))}
              {allergies.length === 0 && <p className="font-body-md text-secondary text-sm">No allergies listed.</p>}
            </div>
            <div className="flex gap-2 max-w-full">
              <input className="flex-1 min-w-0 bg-surface-container-low border border-outline-variant/50 rounded-lg px-4 py-2 font-body-md text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none" placeholder="Type allergy to add..." type="text" value={allergyInput} onChange={e => setAllergyInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addAllergy() } }} />
              <button className="bg-surface-container-high text-on-surface px-4 py-2 rounded-lg font-label-md hover:bg-surface-variant transition-colors" type="button" onClick={addAllergy}>Add</button>
            </div>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-6 border-b border-outline-variant/20 pb-4">
              <div className="w-8 h-8 rounded-full bg-primary-fixed flex items-center justify-center text-primary">
                <Icon icon="prescriptions" className="text-sm" />
              </div>
              <h3 className="font-headline-md text-headline-md text-on-surface">Current Medications</h3>
            </div>
            <div className="overflow-x-auto rounded-xl border border-outline-variant/30 mb-4">
              <table className="w-full text-left border-collapse">
                <thead className="bg-surface-container-low border-b border-outline-variant/30">
                  <tr>
                    <th className="py-3 px-4 font-label-md text-label-md text-on-surface-variant font-semibold">Medication Name</th>
                    <th className="py-3 px-4 font-label-md text-label-md text-on-surface-variant font-semibold">Dosage</th>
                    <th className="py-3 px-4 font-label-md text-label-md text-on-surface-variant font-semibold">Frequency</th>
                    <th className="py-3 px-4 w-16" />
                  </tr>
                </thead>
                <tbody>
                  {medications.length === 0 ? (
                    <tr><td colSpan={4} className="py-8 text-center text-secondary font-body-md">No medications added yet.</td></tr>
                  ) : (
                    medications.map((med, i) => (
                      <tr key={i} className="border-b border-outline-variant/20 hover:bg-surface-container-lowest/50 transition-colors">
                        <td className="py-2 px-4">
                          <input className="w-full bg-transparent border-b border-dashed border-outline-variant focus:border-primary outline-none font-body-md py-2" placeholder="Medication name" value={med.name} onChange={e => updateMedication(i, 'name', e.target.value)} />
                        </td>
                        <td className="py-2 px-4">
                          <input className="w-full bg-transparent border-b border-dashed border-outline-variant focus:border-primary outline-none font-body-md py-2" placeholder="e.g. 10mg" value={med.dosage} onChange={e => updateMedication(i, 'dosage', e.target.value)} />
                        </td>
                        <td className="py-2 px-4">
                          <input className="w-full bg-transparent border-b border-dashed border-outline-variant focus:border-primary outline-none font-body-md py-2" placeholder="e.g. Once daily" value={med.frequency} onChange={e => updateMedication(i, 'frequency', e.target.value)} />
                        </td>
                        <td className="py-2 px-4 text-right">
                          <button onClick={() => removeMedication(i)} aria-label="Delete row" className="text-secondary hover:text-error transition-colors" type="button">
                            <Icon icon="delete" className="text-[20px]" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <button onClick={addMedication} className="px-4 py-2 rounded-full border border-primary text-primary font-label-md text-label-md flex items-center gap-1 hover:bg-primary-fixed/30 transition-colors" type="button">
              <Icon icon="add" className="text-sm" /> Add Medication
            </button>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-6 border-b border-outline-variant/20 pb-4">
              <div className="w-8 h-8 rounded-full bg-primary-fixed flex items-center justify-center text-primary">
                <Icon icon="content_cut" className="text-sm" />
              </div>
              <h3 className="font-headline-md text-headline-md text-on-surface">Past Surgeries</h3>
            </div>
            <textarea className="w-full bg-surface-container-low border border-outline-variant/50 rounded-lg px-4 py-3 font-body-md text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none resize-y" placeholder="List any past surgeries and approximate dates..." rows={4} value={pastSurgeries} onChange={e => setPastSurgeries(e.target.value)} />
          </section>
        </div>

        <div className="bg-surface-container-low p-6 md:p-8 border-t border-outline-variant/30 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2 text-on-surface-variant">
            <Icon icon="lock" className="text-primary" />
            <p className="font-caption text-caption">Your data is HIPAA compliant and securely encrypted.</p>
          </div>
          <div className="flex gap-4 w-full sm:w-auto">
            <button className="flex-1 sm:flex-none px-8 py-3 rounded-full bg-primary text-white font-label-md text-label-md hover:bg-primary/90 shadow-sm transition-all text-center" type="submit">
              Save Medical History
            </button>
          </div>
        </div>
      </form>
    </section>
  )
}

export default function History() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const initialTab = searchParams.get('tab') === 'medical' ? 'medical' : 'sessions'
  const [activeTab, setActiveTab] = useState<Tab>(initialTab)

  return (
    <main className="h-screen flex flex-col bg-surface p-4 md:p-6 overflow-x-hidden">
      <header className="flex justify-between items-center w-full mb-8 flex-shrink-0">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-on-surface">History</h2>
          <p className="font-body-md text-secondary">View your triage sessions or update your medical profile.</p>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/notifications')} className="hover:bg-surface-variant rounded-full p-2 transition-all text-secondary">
            <Icon icon="notifications" />
          </button>
        </div>
      </header>

      <div className="overflow-x-auto mb-8 flex-shrink-0">
        <div className="flex p-1 bg-surface-container-low rounded-full border border-outline-variant/30 w-max">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={
                activeTab === tab.key
                  ? 'px-4 md:px-6 py-2 rounded-full font-label-md text-label-md bg-primary text-on-primary transition-all shadow-sm flex items-center gap-2 whitespace-nowrap'
                  : 'px-4 md:px-6 py-2 rounded-full font-label-md text-label-md text-secondary hover:text-primary transition-all flex items-center gap-2 whitespace-nowrap'
              }
            >
              <Icon icon={tab.icon} className="text-[18px]" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0">
        {activeTab === 'sessions' ? <SessionsView /> : <MedicalForm />}
      </div>
    </main>
  )
}
