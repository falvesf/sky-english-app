"use client"

import { useState, useEffect } from "react"
import { Settings, Printer, ArrowLeft, ArrowRight, LogOut, User, X, Plus, Menu, ChevronUp, ChevronDown } from "lucide-react"
import { format, addWeeks, subWeeks, startOfWeek, addDays } from "date-fns"
import ManageDataModal from "./ManageDataModal"
import { getGrades, getStudents, getWeeklyRecord, updateWeeklyRecord, updateEvaluation, getSkills, createSkill, updateEvaluationObs } from "@/actions"

export default function MainApp({ teacherName, onSignOut }: { teacherName: string, onSignOut: () => void }) {
  const [currentWeek, setCurrentWeek] = useState(startOfWeek(new Date(), { weekStartsOn: 1 })) // Monday start
  const [grades, setGrades] = useState<any[]>([])
  const [selectedGradeId, setSelectedGradeId] = useState<string>("")
  const [availableSkills, setAvailableSkills] = useState<any[]>([])
  
  const [students, setStudents] = useState<any[]>([])
  const [record, setRecord] = useState<any>(null)
  const [evaluations, setEvaluations] = useState<Record<string, any>>({})
  const [activity, setActivity] = useState("")
  const [skill, setSkill] = useState("")
  const [skillsList, setSkillsList] = useState<string[]>([""])
  const [editingSkills, setEditingSkills] = useState<Record<number, boolean>>({})

  const [isManageModalOpen, setIsManageModalOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isHeaderCollapsed, setIsHeaderCollapsed] = useState(false)
  const [imageTimestamp, setImageTimestamp] = useState(Date.now())

  const fetchData = async () => {
    const fetchedGrades = await getGrades()
    setGrades(fetchedGrades)
    if (fetchedGrades.length > 0 && !selectedGradeId) {
      setSelectedGradeId(fetchedGrades[0].id)
    }
    const fetchedSkills = await getSkills()
    setAvailableSkills(fetchedSkills)
  }

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (!selectedGradeId) return

    const loadGradeData = async () => {
      const st = await getStudents(selectedGradeId)
      setStudents(st)

      const rec = await getWeeklyRecord(selectedGradeId, currentWeek)
      setRecord(rec)
      setActivity(rec.activity || "")
      setSkill(rec.skill || "")
      setSkillsList(rec.skill ? rec.skill.split(" | ") : [""])
      setEditingSkills({})
      
      const evalMap: Record<string, any> = {}
      rec.evaluations.forEach((e: any) => {
        evalMap[e.studentId] = e
      })
      setEvaluations(evalMap)
    }

    loadGradeData()
  }, [selectedGradeId, currentWeek])

  const handleWeekChange = (direction: 1 | -1) => {
    setCurrentWeek(prev => direction === 1 ? addWeeks(prev, 1) : subWeeks(prev, 1))
  }

  const handleGradeChange = (direction: 1 | -1) => {
    if (grades.length === 0) return
    const currentIndex = grades.findIndex(g => g.id === selectedGradeId)
    let newIndex = currentIndex + direction
    if (newIndex < 0) newIndex = grades.length - 1
    if (newIndex >= grades.length) newIndex = 0
    setSelectedGradeId(grades[newIndex].id)
  }

  const handleActivityBlur = async () => {
    if (!record) return
    if (activity !== record.activity || skill !== record.skill) {
      await updateWeeklyRecord(record.id, activity, skill)
    }
  }

  const handleSkillRowChange = async (index: number, val: string, isCustomSubmit: boolean = false) => {
    const newList = [...skillsList]
    newList[index] = val
    setSkillsList(newList)
    
    const joined = newList.filter(s => s.trim() !== "").join(" | ")
    setSkill(joined)
    
    if (record) {
      await updateWeeklyRecord(record.id, activity, joined)
      if (isCustomSubmit && val.trim() !== "") {
        if (!availableSkills.find(s => s.name.toLowerCase() === val.trim().toLowerCase())) {
          await createSkill(val.trim())
          fetchData()
        }
      }
    }
  }

  const handleRemoveSkillRow = async (index: number) => {
    let newList = skillsList.filter((_, i) => i !== index)
    if (newList.length === 0) newList = [""]
    setSkillsList(newList)
    
    const joined = newList.filter(s => s.trim() !== "").join(" | ")
    setSkill(joined)
    
    if (record) {
      await updateWeeklyRecord(record.id, activity, joined)
    }
  }

  const handleEvalChange = async (studentId: string, day: string, valStr: string) => {
    if (!record) return
    const val = valStr === "" ? null : parseInt(valStr, 10)
    if (val !== null && (val < 1 || val > 5)) return

    setEvaluations(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [day]: val
      }
    }))

    await updateEvaluation(record.id, studentId, day, val)
  }

  const handleObsChange = async (studentId: string, day: string, obs: string) => {
    if (!record) return

    const obsField = `${day}Obs`
    setEvaluations(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [obsField]: obs
      }
    }))

    await updateEvaluationObs(record.id, studentId, day, obs)
  }

  const days = ["monday", "tuesday", "wednesday", "thursday", "friday"]

  const getBgColor = (val: number | null | undefined) => {
    if (val === 1) return '#CC0000'
    if (val === 2) return '#F6B26B'
    if (val === 3) return '#FFD966'
    if (val === 4) return '#93C47D'
    if (val === 5) return '#6FA8DC'
    return 'transparent'
  }

  const getTextColor = (val: number | null | undefined) => {
    if (val === 1 || val === 4 || val === 5) return '#FFFFFF'
    if (val === 2 || val === 3) return '#000000'
    return 'inherit'
  }

  return (
    <div className="app-layout">
      
      {/* Sidebar Menu (Hidden when printing) */}
      <aside className="sidebar no-print">
        <div className="sidebar-header">
          <h1 style={{ fontSize: '24px', color: 'var(--primary)', textAlign: 'center' }}>Sky English</h1>
          <button 
            className="mobile-menu-btn" 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        <div className={`sidebar-content ${isMobileMenuOpen ? 'open' : ''}`}>
          <div style={{ background: 'var(--bg-color)', padding: '16px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ background: 'var(--primary)', color: 'white', padding: '8px', borderRadius: '50%' }}>
              <User size={20} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Teacher</span>
              <span style={{ fontWeight: 600, fontSize: '15px' }}>{teacherName}</span>
              <button 
                onClick={onSignOut} 
                style={{ 
                  color: 'var(--danger)', 
                  fontSize: '12px', 
                  textAlign: 'left', 
                  marginTop: '4px', 
                  textDecoration: 'underline', 
                  padding: 0,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                Sign Out
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button className="btn-primary" onClick={() => setIsManageModalOpen(true)} style={{ width: '100%', justifyContent: 'flex-start' }}>
              <Settings size={18} /> Manage System Data
            </button>
            <button className="btn-primary" style={{ background: 'var(--text-muted)', width: '100%', justifyContent: 'flex-start' }} onClick={() => window.print()}>
              <Printer size={18} /> Print Plans
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        
        {/* Main visual header for screen */}
        <div className={`header-banner no-print ${isHeaderCollapsed ? 'collapsed' : ''}`} style={{ backgroundImage: isHeaderCollapsed ? 'none' : `url('/header.jpg?t=${imageTimestamp}')`, borderRadius: '8px', marginBottom: '24px', flexShrink: 0, position: 'relative' }}>
          
          <button 
            onClick={() => setIsHeaderCollapsed(!isHeaderCollapsed)}
            className="btn-icon"
            style={{ position: 'absolute', bottom: '8px', right: '8px', background: 'rgba(255,255,255,0.8)', padding: '4px', borderRadius: '4px', zIndex: 10 }}
            title={isHeaderCollapsed ? "Expandir cabeçalho" : "Ocultar cabeçalho"}
          >
            {isHeaderCollapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
          </button>

          <div className={`header-inputs ${isHeaderCollapsed ? 'collapsed' : ''}`}>
            
            <div style={{ display: 'flex', flexDirection: isHeaderCollapsed ? 'row' : 'column', alignItems: isHeaderCollapsed ? 'center' : 'stretch', gap: '8px' }}>
              <span style={{ fontWeight: 600, fontSize: '13px', minWidth: isHeaderCollapsed ? '60px' : 'auto', paddingTop: isHeaderCollapsed ? '0' : '4px' }}>Skills:</span>
              <div style={{ display: 'flex', flexDirection: isHeaderCollapsed ? 'row' : 'column', gap: '8px', flex: 1, alignItems: isHeaderCollapsed ? 'center' : 'stretch', overflowX: isHeaderCollapsed ? 'auto' : 'visible' }}>
                {skillsList.map((sk, idx) => {
                  const isEditing = availableSkills.length === 0 || editingSkills[idx];
                  const selectValue = availableSkills.find(s => s.name === sk) ? sk : (sk ? "OTHER" : "");

                  return (
                    <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'center', minWidth: isHeaderCollapsed ? '200px' : 'auto' }}>
                      {isEditing ? (
                        <input 
                          type="text" 
                          value={sk} 
                          onChange={e => handleSkillRowChange(idx, e.target.value)} 
                          onBlur={() => {
                            setEditingSkills(prev => ({...prev, [idx]: false}))
                            handleSkillRowChange(idx, sk, true)
                          }}
                          placeholder="Enter skill name..."
                          style={{ flex: 1 }}
                        />
                      ) : (
                        <select 
                          value={selectValue}
                          onChange={(e) => {
                            if (e.target.value === "OTHER") {
                              setEditingSkills(prev => ({...prev, [idx]: true}))
                              handleSkillRowChange(idx, "")
                            } else {
                              handleSkillRowChange(idx, e.target.value, true)
                            }
                          }}
                          style={{ flex: 1, padding: '6px', borderRadius: '4px', border: '1px solid #ccc', background: 'white' }}
                        >
                          <option value="" disabled>Select a skill</option>
                          {availableSkills.map((s: any) => <option key={s.id} value={s.name}>{s.name}</option>)}
                          {selectValue === "OTHER" && sk !== "" && <option value="OTHER">{sk}</option>}
                          <option value="OTHER">+ Other (Type manually...)</option>
                        </select>
                      )}
                      
                      {skillsList.length > 1 && (
                        <button onClick={() => handleRemoveSkillRow(idx)} className="btn-icon" style={{ color: 'var(--danger)', background: 'white', borderRadius: '4px', padding: '4px' }}>
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  )
                })}
                <button 
                  onClick={() => setSkillsList([...skillsList, ""])} 
                  style={{ alignSelf: 'center', background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}
                >
                  <Plus size={12} /> Add Skill
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: isHeaderCollapsed ? 'row' : 'column', alignItems: isHeaderCollapsed ? 'center' : 'stretch', gap: '8px' }}>
              <span style={{ fontWeight: 600, fontSize: '13px', minWidth: isHeaderCollapsed ? '60px' : 'auto' }}>Activity:</span>
              <input 
                type="text" 
                value={activity} 
                onChange={e => setActivity(e.target.value)} 
                onBlur={handleActivityBlur} 
                placeholder="Enter activities..."
                style={{ flex: 1 }}
              />
            </div>

          </div>
        </div>

        {/* Print Header Container (With absolute positioning for texts) */}
        <div className="print-only" style={{ display: 'none', position: 'relative', marginBottom: '24px', width: '100%' }}>
          <img src={`/header.jpg?t=${imageTimestamp}`} alt="Header" style={{ width: '100%', height: 'auto', display: 'block', borderRadius: '8px' }} />
          <div style={{ 
            position: 'absolute', 
            top: '50%', 
            transform: 'translateY(-50%)', 
            left: '24px', 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '8px', 
            maxWidth: '55%', 
            maxHeight: '90%',
            overflow: 'hidden',
            background: 'rgba(255, 255, 255, 0.85)', 
            padding: '12px', 
            borderRadius: '8px' 
          }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
              <strong style={{ fontSize: '14px', whiteSpace: 'nowrap' }}>Skill:</strong> 
              <span style={{ fontSize: '14px', flex: 1, fontWeight: 500, wordBreak: 'break-word', overflowWrap: 'anywhere' }}>{skill}</span>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
              <strong style={{ fontSize: '14px', whiteSpace: 'nowrap' }}>Activity:</strong> 
              <span style={{ fontSize: '14px', flex: 1, fontWeight: 500, wordBreak: 'break-word', overflowWrap: 'anywhere' }}>{activity}</span>
            </div>
          </div>
        </div>

        {/* Table Container - This is the only part that scrolls! */}
        <div className="document-container" style={{ flex: 1, maxWidth: '100%', width: '100%', margin: '0', borderRadius: '12px', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'white' }}>
          <div className="table-responsive">
            <table className="main-table">
              <thead style={{ position: 'sticky', top: 0, zIndex: 20, background: 'white', boxShadow: '0 2px 0 0 white, 0 3px 0 0 black' }}>
                <tr>
                  <th colSpan={6} className="title-cell" style={{ background: 'white', borderTop: 'none' }}>
                    Atividades de avaliação formativa
                  </th>
                </tr>
                <tr>
                  <th colSpan={6} className="nav-cell" style={{ background: 'white' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button onClick={() => handleWeekChange(-1)} className="btn-icon no-print"><ArrowLeft size={16}/></button>
                        <span>Week of {format(currentWeek, "MMM d, yyyy")}</span>
                        <button onClick={() => handleWeekChange(1)} className="btn-icon no-print"><ArrowRight size={16}/></button>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button onClick={() => handleGradeChange(-1)} className="btn-icon no-print"><ArrowLeft size={16}/></button>
                        <span style={{ fontWeight: 'bold' }}>Grade: {grades.find(g => g.id === selectedGradeId)?.name || "N/A"}</span>
                        <button onClick={() => handleGradeChange(1)} className="btn-icon no-print"><ArrowRight size={16}/></button>
                      </div>

                      <div>
                        <span style={{ fontWeight: 'bold' }}>Teacher: {teacherName}</span>
                      </div>

                    </div>
                  </th>
                </tr>
                {/* Compact Legenda */}
                <tr>
                  <th colSpan={6} style={{ padding: '6px', background: '#F8FAFC', borderBottom: '1px solid black' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', fontSize: '11px', fontWeight: 'normal', color: '#333' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ display: 'inline-block', width: '12px', height: '12px', backgroundColor: '#CC0000', border: '1px solid #000', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>&nbsp;</span> 1 - Não consegue</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ display: 'inline-block', width: '12px', height: '12px', backgroundColor: '#F6B26B', border: '1px solid #000', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>&nbsp;</span> 2 - Dificuldade</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ display: 'inline-block', width: '12px', height: '12px', backgroundColor: '#FFD966', border: '1px solid #000', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>&nbsp;</span> 3 - Parcial c/ ajuda</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ display: 'inline-block', width: '12px', height: '12px', backgroundColor: '#93C47D', border: '1px solid #000', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>&nbsp;</span> 4 - Pouca ajuda</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ display: 'inline-block', width: '12px', height: '12px', backgroundColor: '#6FA8DC', border: '1px solid #000', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>&nbsp;</span> 5 - Autonomia</span>
                    </div>
                  </th>
                </tr>
                <tr>
                  <th style={{ width: '25%', color: '#673AB7', fontSize: '14px', padding: '6px', background: 'white' }}>NAME</th>
                  <th colSpan={5} style={{ color: '#673AB7', fontSize: '14px', padding: '6px', background: 'white' }}>ACTIVITIES</th>
                </tr>
                <tr>
                  <th style={{ background: 'white' }}></th>
                  {days.map((d, idx) => (
                    <th key={d} style={{ fontSize: '12px', padding: '4px', background: 'white' }}>
                      <div>{d.charAt(0).toUpperCase() + d.slice(1)}</div>
                      <div style={{ fontWeight: 'normal', fontSize: '10px', color: '#666' }}>
                        {format(addDays(currentWeek, idx), "MMM d")}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {students.map(student => (
                  <tr key={student.id}>
                    <td className="name-cell">{student.name}</td>
                    {days.map(d => {
                      const evalValue = evaluations[student.id]?.[d]
                      const obsValue = evaluations[student.id]?.[`${d}Obs`] || ""
                      return (
                        <td 
                          key={d} 
                          style={{ 
                            width: '60px', 
                            background: getBgColor(evalValue),
                            transition: 'background 0.2s',
                            verticalAlign: 'top',
                            padding: '2px'
                          }}
                        >
                          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: '44px' }}>
                            <input 
                              type="number"
                              min="1" max="5"
                              className="grade-input"
                              style={{ color: getTextColor(evalValue) }}
                              value={evalValue || ""}
                              onChange={(e) => handleEvalChange(student.id, d, e.target.value)}
                            />
                            <input 
                              type="text"
                              value={obsValue}
                              onChange={(e) => handleObsChange(student.id, d, e.target.value)}
                              placeholder="Obs..."
                              className="no-print"
                              style={{
                                fontSize: '10px',
                                width: '100%',
                                background: 'transparent',
                                border: 'none',
                                borderTop: evalValue ? '1px solid rgba(255,255,255,0.3)' : '1px solid rgba(0,0,0,0.1)',
                                textAlign: 'center',
                                marginTop: 'auto',
                                color: getTextColor(evalValue)
                              }}
                            />
                            {obsValue && (
                              <div className="print-only" style={{ display: 'none', fontSize: '9px', borderTop: '1px solid rgba(0,0,0,0.3)', marginTop: '2px', paddingTop: '2px', color: getTextColor(evalValue), wordBreak: 'break-word', textAlign: 'center' }}>
                                {obsValue}
                              </div>
                            )}
                          </div>
                        </td>
                      )
                    })}
                  </tr>
                ))}
                {students.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ padding: '16px', color: 'gray', textAlign: 'center' }}>No students found in this class.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
      {isManageModalOpen && (
        <ManageDataModal 
          onClose={() => {
            setIsManageModalOpen(false)
            setImageTimestamp(Date.now())
            fetchData()
          }} 
          grades={grades} 
          skills={availableSkills}
          onRefresh={fetchData}
        />
      )}
    </div>
  )
}
