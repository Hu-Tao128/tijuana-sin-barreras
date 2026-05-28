import { httpsCallable } from 'firebase/functions'
import { functions } from './firebase'
import type {
  BarrierType,
  Confirmation,
  DashboardStats,
  HeatmapZone,
  Report,
} from '../types'

/**
 * Cliente tipado de las Cloud Functions del proyecto.
 * Refleja los callables exportados en functions/src/index.ts.
 */

type ConfirmInput = { reportId: string }
type ConfirmResult = { success: boolean; confirmation: Confirmation }

type ArchiveInput = { reportId: string }
type ArchiveResult = { success: boolean; report: Report }

type DashboardStatsResult = { stats: DashboardStats }

type ExportCsvResult = { csv: string; totalReports: number }

type HeatmapResult = { heatmap: HeatmapZone[] }

type ClassifyInput = { description: string }
type ClassifyResult = { type: BarrierType; confidence: number }

type SeverityInput = { description: string; barrierType: string }
type SeverityResult = { severity: number }

const confirmReportFn = httpsCallable<ConfirmInput, ConfirmResult>(functions, 'confirmReport')
const rejectReportFn = httpsCallable<ConfirmInput, ConfirmResult>(functions, 'rejectReport')
const archiveReportFn = httpsCallable<ArchiveInput, ArchiveResult>(functions, 'archiveReport')

const getDashboardStatsFn = httpsCallable<void, DashboardStatsResult>(
  functions,
  'getDashboardStats',
)
const exportCsvFn = httpsCallable<void, ExportCsvResult>(functions, 'exportCsv')
const generateHeatmapFn = httpsCallable<void, HeatmapResult>(functions, 'generateHeatmap')

const classifyBarrierFn = httpsCallable<ClassifyInput, ClassifyResult>(
  functions,
  'classifyBarrierCallable',
)
const calculateSeverityFn = httpsCallable<SeverityInput, SeverityResult>(
  functions,
  'calculateSeverityCallable',
)

export async function confirmReport(reportId: string): Promise<ConfirmResult> {
  const { data } = await confirmReportFn({ reportId })
  return data
}

export async function rejectReport(reportId: string): Promise<ConfirmResult> {
  const { data } = await rejectReportFn({ reportId })
  return data
}

export async function archiveReport(reportId: string): Promise<ArchiveResult> {
  const { data } = await archiveReportFn({ reportId })
  return data
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const { data } = await getDashboardStatsFn()
  return data.stats
}

export async function exportReportsCsv(): Promise<ExportCsvResult> {
  const { data } = await exportCsvFn()
  return data
}

export async function generateHeatmap(): Promise<HeatmapZone[]> {
  const { data } = await generateHeatmapFn()
  return data.heatmap
}

export async function classifyBarrier(description: string): Promise<ClassifyResult> {
  const { data } = await classifyBarrierFn({ description })
  return data
}

export async function calculateSeverity(
  description: string,
  barrierType: string,
): Promise<number> {
  const { data } = await calculateSeverityFn({ description, barrierType })
  return data.severity
}
