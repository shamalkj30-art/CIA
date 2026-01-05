import JSZip from 'jszip'
import type { VaultItem, InsuranceRoom, ROOM_CONFIGS } from '@/lib/types'

// Room labels for the summary
const ROOM_LABELS: Record<InsuranceRoom, string> = {
  kitchen: 'Kitchen',
  bedroom: 'Bedroom',
  living_room: 'Living Room',
  bathroom: 'Bathroom',
  garage: 'Garage',
  office: 'Office',
  outdoor: 'Outdoor',
  other: 'Other',
}

export interface PackGenerationInput {
  packName: string
  rooms: InsuranceRoom[] // Empty array means all rooms
  items: VaultItem[]
  fileBuffers: Map<string, ArrayBuffer> // Map of storage_path -> file buffer
}

export interface PackGenerationResult {
  zipBuffer: ArrayBuffer
  documentCount: number
  totalValue: number
  roomsIncluded: InsuranceRoom[]
}

/**
 * Generates an insurance claim pack as a ZIP file
 * Contains all documents organized by room + a summary text file
 */
export async function generateInsurancePack(
  input: PackGenerationInput
): Promise<PackGenerationResult> {
  const { packName, rooms, items, fileBuffers } = input
  const zip = new JSZip()

  // Filter items by rooms (if rooms specified)
  const filteredItems = rooms.length > 0
    ? items.filter(item => item.room && rooms.includes(item.room as InsuranceRoom))
    : items

  // Group items by room
  const itemsByRoom = new Map<string, VaultItem[]>()
  for (const item of filteredItems) {
    const roomKey = item.room || 'unassigned'
    if (!itemsByRoom.has(roomKey)) {
      itemsByRoom.set(roomKey, [])
    }
    itemsByRoom.get(roomKey)!.push(item)
  }

  // Calculate totals
  let totalValue = 0
  const roomsIncluded: InsuranceRoom[] = []

  // Create folder structure and add files
  for (const [roomKey, roomItems] of itemsByRoom.entries()) {
    if (roomKey !== 'unassigned') {
      roomsIncluded.push(roomKey as InsuranceRoom)
    }

    const folderName = roomKey === 'unassigned'
      ? '00_Unassigned'
      : ROOM_LABELS[roomKey as InsuranceRoom] || roomKey

    const folder = zip.folder(folderName)
    if (!folder) continue

    for (const item of roomItems) {
      const fileBuffer = fileBuffers.get(item.storage_path)
      if (fileBuffer) {
        // Use a clean filename with item title
        const extension = item.file_name.split('.').pop() || ''
        const cleanTitle = item.title.replace(/[^a-zA-Z0-9 ]/g, '').substring(0, 50)
        const fileName = `${cleanTitle}${extension ? '.' + extension : ''}`
        folder.file(fileName, fileBuffer)
      }

      if (item.estimated_value) {
        totalValue += item.estimated_value
      }
    }
  }

  // Generate summary text file
  const summary = generateSummaryText(packName, filteredItems, itemsByRoom, totalValue)
  zip.file('SUMMARY.txt', summary)

  // Generate the ZIP
  const zipBuffer = await zip.generateAsync({
    type: 'arraybuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  })

  return {
    zipBuffer,
    documentCount: filteredItems.length,
    totalValue,
    roomsIncluded,
  }
}

/**
 * Generates a text summary of all items in the pack
 */
function generateSummaryText(
  packName: string,
  items: VaultItem[],
  itemsByRoom: Map<string, VaultItem[]>,
  totalValue: number
): string {
  const now = new Date()
  const dateStr = now.toLocaleDateString('no-NO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  let summary = `
================================================================================
INSURANCE CLAIM PACK
================================================================================

Pack Name:       ${packName}
Generated:       ${dateStr}
Total Documents: ${items.length}
Total Value:     kr ${totalValue.toLocaleString('no-NO', { minimumFractionDigits: 2 })}

================================================================================
ITEMS BY ROOM
================================================================================
`

  for (const [roomKey, roomItems] of itemsByRoom.entries()) {
    const roomLabel = roomKey === 'unassigned'
      ? 'Unassigned'
      : ROOM_LABELS[roomKey as InsuranceRoom] || roomKey

    const roomValue = roomItems.reduce((sum, item) => sum + (item.estimated_value || 0), 0)

    summary += `
${roomLabel.toUpperCase()}
${'-'.repeat(roomLabel.length)}
Documents: ${roomItems.length}
Value:     kr ${roomValue.toLocaleString('no-NO', { minimumFractionDigits: 2 })}

`
    for (const item of roomItems) {
      const value = item.estimated_value
        ? `kr ${item.estimated_value.toLocaleString('no-NO', { minimumFractionDigits: 2 })}`
        : 'Not specified'
      summary += `  - ${item.title}\n`
      summary += `    File: ${item.file_name}\n`
      summary += `    Value: ${value}\n`
      if (item.notes) {
        summary += `    Notes: ${item.notes}\n`
      }
      summary += '\n'
    }
  }

  summary += `
================================================================================
DETAILED ITEM LIST
================================================================================

`

  // Add detailed list with all fields
  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    summary += `${i + 1}. ${item.title}\n`
    summary += `   Library:  ${item.library}\n`
    summary += `   Room:     ${item.room ? ROOM_LABELS[item.room] : 'Not assigned'}\n`
    summary += `   File:     ${item.file_name}\n`
    summary += `   Type:     ${item.file_type}\n`
    summary += `   Value:    ${item.estimated_value ? `kr ${item.estimated_value.toLocaleString('no-NO', { minimumFractionDigits: 2 })}` : 'Not specified'}\n`
    if (item.expires_at) {
      summary += `   Expires:  ${new Date(item.expires_at).toLocaleDateString('no-NO')}\n`
    }
    if (item.tags && item.tags.length > 0) {
      summary += `   Tags:     ${item.tags.join(', ')}\n`
    }
    if (item.notes) {
      summary += `   Notes:    ${item.notes}\n`
    }
    summary += '\n'
  }

  summary += `
================================================================================
LEGAL DISCLAIMER
================================================================================

This document pack was generated by Cyncro for insurance claim purposes.
All values are user-reported estimates and may not reflect actual market value.
Please verify all information with your insurance provider.

Generated: ${now.toISOString()}
================================================================================
`

  return summary
}

/**
 * Format currency value
 */
export function formatCurrency(value: number, currency: string = 'NOK'): string {
  if (currency === 'NOK') {
    return `kr ${value.toLocaleString('no-NO', { minimumFractionDigits: 2 })}`
  }
  return `${currency} ${value.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
}
