"use client"

import { useState, useEffect } from "react"
import { X, Plus, Trash2, Edit2, Upload, ArrowRightLeft } from "lucide-react"
import { createGrade, updateGrade, deleteGrade, getStudents, createStudent, updateStudent, moveStudent, deleteStudent, importStudents, uploadHeaderImage, createSkill, updateSkill, deleteSkill } from "@/actions"
import * as XLSX from "xlsx"

export default function ManageDataModal({ onClose, grades, skills, onRefresh }: { onClose: () => void, grades: any[], skills: any[], onRefresh: () => void }) {
  const [activeTab, setActiveTab] = useState<"grades" | "students" | "import" | "settings" | "skills">("grades")
  const [selectedGradeId, setSelectedGradeId] = useState(grades[0]?.id || "")
  const [students, setStudents] = useState<any[]>([])
  
  const [newGradeName, setNewGradeName] = useState("")
  const [newStudentName, setNewStudentName] = useState("")
  const [newSkillName, setNewSkillName] = useState("")

  const [editingGrade, setEditingGrade] = useState<{id: string, name: string} | null>(null)
  const [editingStudent, setEditingStudent] = useState<{id: string, name: string} | null>(null)
  const [editingSkill, setEditingSkill] = useState<{id: string, name: string} | null>(null)
  const [importData, setImportData] = useState<any[]>([])
  const [availableGrades, setAvailableGrades] = useState<string[]>([])
  const [selectedImportGrades, setSelectedImportGrades] = useState<Record<string, boolean>>({})
  const [isImporting, setIsImporting] = useState(false)

  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null)
  const [confirmDialog, setConfirmDialog] = useState<{message: string, confirmText?: string, onConfirm: () => void} | null>(null)

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const loadStudents = async () => {
    const data = await getStudents(selectedGradeId)
    setStudents(data)
  }

  useEffect(() => {
    if (activeTab === "students" && selectedGradeId) {
      loadStudents()
    }
  }, [activeTab, selectedGradeId])

  // --- Grade Actions ---
  const handleAddGrade = async () => {
    if (!newGradeName.trim()) return
    await createGrade(newGradeName)
    setNewGradeName("")
    onRefresh()
    showToast("Turma criada com sucesso!")
  }

  const handleUpdateGrade = async () => {
    if (!editingGrade || !editingGrade.name.trim()) return
    await updateGrade(editingGrade.id, editingGrade.name)
    setEditingGrade(null)
    onRefresh()
    showToast("Turma atualizada com sucesso!")
  }

  const handleDeleteGrade = async (id: string) => {
    setConfirmDialog({
      message: "Tem certeza? Isso excluirá a turma, todos os seus alunos e registros.",
      onConfirm: async () => {
        await deleteGrade(id)
        onRefresh()
        showToast("Turma excluída com sucesso!")
        setConfirmDialog(null)
      }
    })
  }

  // --- Student Actions ---
  const handleAddStudent = async () => {
    if (!newStudentName.trim() || !selectedGradeId) return
    await createStudent(selectedGradeId, newStudentName)
    setNewStudentName("")
    loadStudents()
    showToast("Aluno adicionado com sucesso!")
  }

  const handleUpdateStudent = async () => {
    if (!editingStudent || !editingStudent.name.trim()) return
    await updateStudent(editingStudent.id, editingStudent.name)
    setEditingStudent(null)
    loadStudents()
    showToast("Aluno atualizado com sucesso!")
  }

  const handleDeleteStudent = async (id: string) => {
    setConfirmDialog({
      message: "Tem certeza que deseja excluir este aluno?",
      onConfirm: async () => {
        await deleteStudent(id)
        loadStudents()
        showToast("Aluno excluído com sucesso!")
        setConfirmDialog(null)
      }
    })
  }

  // --- Skill Actions ---
  const handleAddSkill = async () => {
    if (!newSkillName.trim()) return
    await createSkill(newSkillName)
    setNewSkillName("")
    onRefresh()
    showToast("Habilidade criada com sucesso!")
  }

  const handleUpdateSkill = async () => {
    if (!editingSkill || !editingSkill.name.trim()) return
    await updateSkill(editingSkill.id, editingSkill.name)
    setEditingSkill(null)
    onRefresh()
    showToast("Habilidade atualizada com sucesso!")
  }

  const handleDeleteSkill = async (id: string) => {
    setConfirmDialog({
      message: "Tem certeza que deseja excluir esta habilidade?",
      onConfirm: async () => {
        await deleteSkill(id)
        onRefresh()
        showToast("Habilidade excluída com sucesso!")
        setConfirmDialog(null)
      }
    })
  }

  // --- Import Actions ---
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (evt) => {
      const bstr = evt.target?.result
      const wb = XLSX.read(bstr, { type: 'binary' })
      const wsname = wb.SheetNames[0]
      const ws = wb.Sheets[wsname]
      const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][]
      
      // Expected headers (based on user info):
      // 0: Código da turma
      // 1: Série
      // 2: Identificador do estudante
      // 3: Nome completo

      const parsedData: any[] = []
      const gradesSet = new Set<string>()

      // Skip header row (index 0)
      for (let i = 1; i < data.length; i++) {
        const row = data[i]
        if (!row || row.length < 4) continue
        
        const codigoTurma = String(row[0]).trim().toUpperCase()
        let gradeName = String(row[1]).trim()
        const studentId = String(row[2]).trim()
        const studentName = String(row[3]).trim()

        if (codigoTurma.endsWith("MA")) {
          gradeName += " (Manhã)"
        } else if (codigoTurma.endsWith("TA")) {
          gradeName += " (Tarde)"
        } else if (codigoTurma) {
          // Fallback if there's a code but it doesn't end with MA or TA
          gradeName += ` (${codigoTurma})`
        }

        if (gradeName && studentName) {
          parsedData.push({ gradeName, studentId, studentName })
          gradesSet.add(gradeName)
        }
      }

      setImportData(parsedData)
      
      const uniqueGrades = Array.from(gradesSet).sort()
      setAvailableGrades(uniqueGrades)
      
      const defaultSelected: Record<string, boolean> = {}
      uniqueGrades.forEach(g => {
        // Auto select requested grades
        const lower = g.toLowerCase()
        if (lower.includes("maternal") || lower.includes("pré i") || lower.includes("pré ii") || lower.includes("1º ano") || lower.includes("2º ano")) {
          defaultSelected[g] = true
        } else {
          defaultSelected[g] = false
        }
      })
      setSelectedImportGrades(defaultSelected)
    }
    reader.readAsBinaryString(file)
  }

  const handleRunImport = async () => {
    setIsImporting(true)
    const selectedGrades = availableGrades.filter(g => selectedImportGrades[g])
    const dataToImport = importData.filter(d => selectedGrades.includes(d.gradeName))
    
    await importStudents(dataToImport)
    
    setIsImporting(false)
    showToast("Importação concluída com sucesso!")
    onRefresh()
  }

  let oppositeGradeId: string | null = null
  let oppositeGradeName = ""
  
  const currentGrade = grades.find(g => g.id === selectedGradeId)
  if (currentGrade) {
    let oppositeName = ""
    if (currentGrade.name.includes("(Manhã)")) {
      oppositeName = currentGrade.name.replace("(Manhã)", "(Tarde)")
    } else if (currentGrade.name.includes("(Tarde)")) {
      oppositeName = currentGrade.name.replace("(Tarde)", "(Manhã)")
    }
    
    if (oppositeName) {
      const oppositeGrade = grades.find(g => g.name === oppositeName)
      if (oppositeGrade) {
        oppositeGradeId = oppositeGrade.id
        oppositeGradeName = oppositeName
      }
    }
  }

  const handleMoveStudent = async (studentId: string, studentName: string) => {
    if (!oppositeGradeId) return
    setConfirmDialog({
      message: `Deseja mover o(a) aluno(a) ${studentName} para a turma ${oppositeGradeName}?`,
      confirmText: "Sim, transferir",
      onConfirm: async () => {
        await moveStudent(studentId, oppositeGradeId!)
        loadStudents()
        showToast(`Aluno movido para ${oppositeGradeName} com sucesso!`)
        setConfirmDialog(null)
      }
    })
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '20px' }}>Manage System Data</h2>
          <button onClick={onClose} className="btn-icon"><X size={20} /></button>
        </div>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
          <button 
            style={{ fontWeight: activeTab === "grades" ? 600 : 400, color: activeTab === "grades" ? 'var(--primary)' : 'var(--text-muted)' }} 
            onClick={() => setActiveTab("grades")}
          >
            Classes (Séries)
          </button>
          <button 
            style={{ fontWeight: activeTab === "students" ? 600 : 400, color: activeTab === "students" ? 'var(--primary)' : 'var(--text-muted)' }} 
            onClick={() => setActiveTab("students")}
          >
            Students (Alunos)
          </button>
          <button 
            style={{ fontWeight: activeTab === "skills" ? 600 : 400, color: activeTab === "skills" ? 'var(--primary)' : 'var(--text-muted)' }} 
            onClick={() => setActiveTab("skills")}
          >
            Skills
          </button>
          <button 
            style={{ fontWeight: activeTab === "import" ? 600 : 400, color: activeTab === "import" ? 'var(--primary)' : 'var(--text-muted)' }} 
            onClick={() => setActiveTab("import")}
          >
            Import Excel
          </button>
          <button 
            style={{ fontWeight: activeTab === "settings" ? 600 : 400, color: activeTab === "settings" ? 'var(--primary)' : 'var(--text-muted)' }} 
            onClick={() => setActiveTab("settings")}
          >
            Settings
          </button>
        </div>

        <div style={{ maxHeight: '400px', overflowY: 'auto', paddingRight: '8px' }}>
          {activeTab === "grades" && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input 
                  value={newGradeName} 
                  onChange={e => setNewGradeName(e.target.value)} 
                  placeholder="New Class Name" 
                  style={{ flex: 1 }} 
                />
                <button onClick={handleAddGrade} className="btn-primary"><Plus size={16} /> Add</button>
              </div>

              {grades.map(grade => (
                <div key={grade.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'var(--bg-color)', borderRadius: '6px' }}>
                  {editingGrade?.id === grade.id ? (
                    <div style={{ display: 'flex', gap: '8px', flex: 1 }}>
                      <input 
                        value={editingGrade!.name} 
                        onChange={e => setEditingGrade({...editingGrade!, name: e.target.value})} 
                        style={{ flex: 1 }} 
                      />
                      <button onClick={handleUpdateGrade} className="btn-primary" style={{ padding: '4px 12px' }}>Save</button>
                      <button onClick={() => setEditingGrade(null)} className="btn-danger" style={{ padding: '4px 12px' }}>Cancel</button>
                    </div>
                  ) : (
                    <>
                      <span style={{ fontWeight: 500 }}>{grade.name}</span>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => setEditingGrade(grade)} className="btn-icon"><Edit2 size={16} /></button>
                        <button onClick={() => handleDeleteGrade(grade.id)} className="btn-icon" style={{ color: 'var(--danger)' }}><Trash2 size={16} /></button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}

          {activeTab === "skills" && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input 
                  value={newSkillName} 
                  onChange={e => setNewSkillName(e.target.value)} 
                  placeholder="New Skill Preset" 
                  style={{ flex: 1 }} 
                />
                <button onClick={handleAddSkill} className="btn-primary"><Plus size={16} /> Add</button>
              </div>

              {skills.map(skill => (
                <div key={skill.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'var(--bg-color)', borderRadius: '6px' }}>
                  {editingSkill?.id === skill.id ? (
                    <div style={{ display: 'flex', gap: '8px', flex: 1 }}>
                      <input 
                        value={editingSkill!.name} 
                        onChange={e => setEditingSkill({...editingSkill!, name: e.target.value})} 
                        style={{ flex: 1 }} 
                      />
                      <button onClick={handleUpdateSkill} className="btn-primary" style={{ padding: '4px 12px' }}>Save</button>
                      <button onClick={() => setEditingSkill(null)} className="btn-danger" style={{ padding: '4px 12px' }}>Cancel</button>
                    </div>
                  ) : (
                    <>
                      <span style={{ fontWeight: 500, wordBreak: 'break-all' }}>{skill.name}</span>
                      <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                        <button onClick={() => setEditingSkill(skill)} className="btn-icon"><Edit2 size={16} /></button>
                        <button onClick={() => handleDeleteSkill(skill.id)} className="btn-icon" style={{ color: 'var(--danger)' }}><Trash2 size={16} /></button>
                      </div>
                    </>
                  )}
                </div>
              ))}
              {skills.length === 0 && <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No skills added yet.</p>}
            </div>
          )}

          {activeTab === "students" && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <select value={selectedGradeId} onChange={e => setSelectedGradeId(e.target.value)} style={{ width: '100%', marginBottom: '8px' }}>
                <option value="" disabled>Select a Class</option>
                {grades.map(g => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>

              {selectedGradeId && (
                <>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input 
                      value={newStudentName} 
                      onChange={e => setNewStudentName(e.target.value)} 
                      placeholder="New Student Name" 
                      style={{ flex: 1 }} 
                    />
                    <button onClick={handleAddStudent} className="btn-primary"><Plus size={16} /> Add</button>
                  </div>

                  {students.map(student => (
                    <div key={student.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'var(--bg-color)', borderRadius: '6px' }}>
                      {editingStudent?.id === student.id ? (
                        <div style={{ display: 'flex', gap: '8px', flex: 1 }}>
                          <input 
                            value={editingStudent!.name} 
                            onChange={e => setEditingStudent({...editingStudent!, name: e.target.value})} 
                            style={{ flex: 1 }} 
                          />
                          <button onClick={handleUpdateStudent} className="btn-primary" style={{ padding: '4px 12px' }}>Save</button>
                          <button onClick={() => setEditingStudent(null)} className="btn-danger" style={{ padding: '4px 12px' }}>Cancel</button>
                        </div>
                      ) : (
                        <>
                          <span>{student.name}</span>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            {oppositeGradeId && (
                              <button 
                                onClick={() => handleMoveStudent(student.id, student.name)} 
                                className="btn-icon" 
                                title={`Mover para ${oppositeGradeName}`}
                                style={{ color: 'var(--primary)' }}
                              >
                                <ArrowRightLeft size={16} />
                              </button>
                            )}
                            <button onClick={() => setEditingStudent(student)} className="btn-icon"><Edit2 size={16} /></button>
                            <button onClick={() => handleDeleteStudent(student.id)} className="btn-icon" style={{ color: 'var(--danger)' }}><Trash2 size={16} /></button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                  {students.length === 0 && <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '16px' }}>No students in this class.</p>}
                </>
              )}
            </div>
          )}

          {activeTab === "import" && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ background: 'var(--bg-color)', padding: '16px', borderRadius: '8px', border: '1px dashed var(--border)' }}>
                <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', color: 'var(--text-muted)' }}>
                  <Upload size={32} style={{ marginBottom: '8px' }} />
                  <span>Click to select .xlsx file</span>
                  <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} style={{ display: 'none' }} />
                </label>
              </div>

              {availableGrades.length > 0 && (
                <div>
                  <h3 style={{ fontSize: '16px', marginBottom: '12px' }}>Selecione as Séries para Importar:</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                    {availableGrades.map(g => (
                      <label key={g} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                        <input 
                          type="checkbox" 
                          checked={selectedImportGrades[g]} 
                          onChange={(e) => setSelectedImportGrades({...selectedImportGrades, [g]: e.target.checked})}
                        />
                        {g}
                      </label>
                    ))}
                  </div>

                  <button 
                    onClick={handleRunImport} 
                    className="btn-primary" 
                    style={{ width: '100%', justifyContent: 'center' }}
                    disabled={isImporting || !availableGrades.some(g => selectedImportGrades[g])}
                  >
                    {isImporting ? "Importing..." : "Start Import"}
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === "settings" && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ background: 'var(--bg-color)', padding: '16px', borderRadius: '8px', border: '1px dashed var(--border)' }}>
                <h3 style={{ fontSize: '16px', marginBottom: '8px' }}>Personalizar Cabeçalho (Impressão)</h3>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>Faça upload de uma nova imagem .jpg para substituir o cabeçalho impresso atual.</p>
                <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', color: 'var(--text-muted)' }}>
                  <Upload size={32} style={{ marginBottom: '8px' }} />
                  <span>Click to select new Header Image</span>
                  <input type="file" accept="image/jpeg" onChange={async (e) => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    const formData = new FormData()
                    formData.append('image', file)
                    await uploadHeaderImage(formData)
                    showToast("Cabeçalho atualizado! Pressione F5 para ver as mudanças.")
                  }} style={{ display: 'none' }} />
                </label>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          background: toast.type === 'success' ? 'var(--success)' : 'var(--danger)',
          color: 'white',
          padding: '12px 24px',
          borderRadius: '8px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          zIndex: 100,
          fontWeight: 500,
          animation: 'fadeIn 0.3s ease'
        }}>
          {toast.message}
        </div>
      )}

      {/* Custom Confirm Dialog */}
      {confirmDialog && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100
        }}>
          <div style={{
            background: 'white',
            padding: '24px',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '400px',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ fontSize: '18px', marginBottom: '16px' }}>Confirmação</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>{confirmDialog.message}</p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button 
                onClick={() => setConfirmDialog(null)}
                style={{ padding: '8px 16px', borderRadius: '6px', fontWeight: 500, background: '#f1f5f9' }}
              >
                Cancelar
              </button>
              <button 
                onClick={confirmDialog.onConfirm}
                className={confirmDialog.confirmText ? "btn-primary" : "btn-danger"}
              >
                {confirmDialog.confirmText || "Sim, excluir"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
