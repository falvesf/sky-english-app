"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function getGrades() {
  return prisma.grade.findMany({ orderBy: { name: 'asc' } })
}

export async function createGrade(name: string) {
  await prisma.grade.create({ data: { name } })
  revalidatePath("/")
}

export async function updateGrade(id: string, name: string) {
  await prisma.grade.update({ where: { id }, data: { name } })
  revalidatePath("/")
}

export async function deleteGrade(id: string) {
  await prisma.grade.delete({ where: { id } })
  revalidatePath("/")
}

export async function getStudents(gradeId: string) {
  return prisma.student.findMany({
    where: { gradeId },
    orderBy: { name: 'asc' }
  })
}

export async function createStudent(gradeId: string, name: string) {
  await prisma.student.create({ data: { gradeId, name } })
  revalidatePath("/")
}

export async function updateStudent(id: string, name: string) {
  await prisma.student.update({ where: { id }, data: { name } })
  revalidatePath("/")
}

export async function moveStudent(id: string, newGradeId: string) {
  await prisma.student.update({ where: { id }, data: { gradeId: newGradeId } })
  revalidatePath("/")
}

export async function deleteStudent(id: string) {
  await prisma.student.delete({ where: { id } })
  revalidatePath("/")
}

export async function getWeeklyRecord(gradeId: string, weekStart: Date) {
  let record = await prisma.weeklyRecord.findUnique({
    where: {
      gradeId_weekStart: {
        gradeId,
        weekStart
      }
    },
    include: {
      evaluations: true
    }
  })

  if (!record) {
    record = await prisma.weeklyRecord.create({
      data: {
        gradeId,
        weekStart
      },
      include: {
        evaluations: true
      }
    })
  }

  return record
}

export async function updateWeeklyRecord(id: string, activity: string, skill: string) {
  await prisma.weeklyRecord.update({
    where: { id },
    data: { activity, skill }
  })
  revalidatePath("/")
}

export async function updateEvaluation(weeklyRecordId: string, studentId: string, day: string, value: number | null) {
  let evaluation = await prisma.evaluation.findUnique({
    where: {
      weeklyRecordId_studentId: {
        weeklyRecordId,
        studentId
      }
    }
  })

  if (!evaluation) {
    evaluation = await prisma.evaluation.create({
      data: {
        weeklyRecordId,
        studentId,
        [day]: value
      }
    })
  } else {
    evaluation = await prisma.evaluation.update({
      where: { id: evaluation.id },
      data: {
        [day]: value
      }
    })
  }

  revalidatePath("/")
  return evaluation
}

export async function importStudents(data: { gradeName: string, studentId: string, studentName: string }[]) {
  for (const row of data) {
    let grade = await prisma.grade.findUnique({ where: { name: row.gradeName } })
    if (!grade) {
      grade = await prisma.grade.create({ data: { name: row.gradeName } })
    }
    if (row.studentId) {
      const existing = await prisma.student.findUnique({ where: { externalId: row.studentId } })
      if (existing) {
        await prisma.student.update({ where: { id: existing.id }, data: { name: row.studentName, gradeId: grade.id } })
      } else {
        await prisma.student.create({ data: { externalId: row.studentId, name: row.studentName, gradeId: grade.id } })
      }
    } else {
      await prisma.student.create({ data: { name: row.studentName, gradeId: grade.id } })
    }
  }
  revalidatePath('/')
}


import fs from 'fs'
import path from 'path'

export async function uploadHeaderImage(formData: FormData) {
  const file = formData.get('image') as File
  if (!file) return
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  const filePath = path.join(process.cwd(), 'public', 'header.jpg')
  fs.writeFileSync(filePath, buffer)
}

export async function getSkills() {
  return prisma.skill.findMany({ orderBy: { name: 'asc' } })
}

export async function createSkill(name: string) {
  await prisma.skill.create({ data: { name } })
  revalidatePath("/")
}

export async function updateSkill(id: string, name: string) {
  await prisma.skill.update({ where: { id }, data: { name } })
  revalidatePath("/")
}

export async function deleteSkill(id: string) {
  await prisma.skill.delete({ where: { id } })
  revalidatePath("/")
}
