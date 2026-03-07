/**
 * Simple CSV parser — handles quoted fields, commas in values, and newlines.
 * No external dependencies needed for our use case.
 */

export interface ParseResult<T> {
  data: T[]
  errors: { row: number; message: string }[]
  headers: string[]
}

export function parseCSV(text: string): { rows: string[][]; headers: string[] } {
  const lines = splitCSVLines(text.trim())
  if (lines.length === 0) return { rows: [], headers: [] }

  const headers = parseCSVLine(lines[0]).map((h) => h.trim().toLowerCase())
  const rows = lines.slice(1).map((line) => parseCSVLine(line))

  return { headers, rows }
}

function splitCSVLines(text: string): string[] {
  const lines: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    if (char === '"') {
      inQuotes = !inQuotes
      current += char
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      if (current.trim()) lines.push(current)
      current = ''
      // Skip \r\n
      if (char === '\r' && text[i + 1] === '\n') i++
    } else {
      current += char
    }
  }
  if (current.trim()) lines.push(current)

  return lines
}

function parseCSVLine(line: string): string[] {
  const fields: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++ // skip escaped quote
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      fields.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  fields.push(current.trim())

  return fields
}

// --- Crew CSV parsing ---

export interface CrewImportRow {
  email: string
  role: 'admin' | 'crew'
  sailing_position?: string
}

const VALID_ROLES = ['admin', 'crew'] as const
const VALID_POSITIONS = [
  'skipper', 'helmsman', 'tactician', 'trimmer',
  'bowman', 'pit', 'grinder', 'navigator', 'crew',
] as const

export function parseCrewCSV(text: string): ParseResult<CrewImportRow> {
  const { headers, rows } = parseCSV(text)
  const data: CrewImportRow[] = []
  const errors: { row: number; message: string }[] = []

  const emailIdx = headers.indexOf('email')
  if (emailIdx === -1) {
    return { data: [], errors: [{ row: 0, message: 'Missing required "email" column' }], headers }
  }

  const roleIdx = headers.indexOf('role')
  const positionIdx = findColumnIndex(headers, ['sailing_position', 'position'])

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const rowNum = i + 2 // 1-indexed, skip header

    const email = row[emailIdx]?.trim().toLowerCase()
    if (!email) {
      errors.push({ row: rowNum, message: 'Missing email' })
      continue
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push({ row: rowNum, message: `Invalid email: ${email}` })
      continue
    }

    let role: 'admin' | 'crew' = 'crew'
    if (roleIdx !== -1 && row[roleIdx]) {
      const rawRole = row[roleIdx].trim().toLowerCase()
      if (VALID_ROLES.includes(rawRole as any)) {
        role = rawRole as 'admin' | 'crew'
      } else {
        errors.push({ row: rowNum, message: `Invalid role "${row[roleIdx]}", defaulting to crew` })
      }
    }

    let sailing_position: string | undefined
    if (positionIdx !== -1 && row[positionIdx]) {
      const rawPos = row[positionIdx].trim().toLowerCase()
      if (VALID_POSITIONS.includes(rawPos as any)) {
        sailing_position = rawPos
      } else {
        errors.push({ row: rowNum, message: `Unknown position "${row[positionIdx]}", ignoring` })
      }
    }

    data.push({ email, role, sailing_position })
  }

  return { data, errors, headers }
}

// --- Events CSV parsing ---

export interface EventImportRow {
  title: string
  event_type: string
  start_time: string
  end_time?: string
  location?: string
  all_day: boolean
  description?: string
}

const VALID_EVENT_TYPES = ['race', 'practice', 'social', 'maintenance', 'other'] as const

export function parseEventsCSV(text: string): ParseResult<EventImportRow> {
  const { headers, rows } = parseCSV(text)
  const data: EventImportRow[] = []
  const errors: { row: number; message: string }[] = []

  const titleIdx = headers.indexOf('title')
  if (titleIdx === -1) {
    return { data: [], errors: [{ row: 0, message: 'Missing required "title" column' }], headers }
  }

  const typeIdx = findColumnIndex(headers, ['event_type', 'type'])
  const startIdx = findColumnIndex(headers, ['start_time', 'start', 'date'])
  const endIdx = findColumnIndex(headers, ['end_time', 'end'])
  const locationIdx = headers.indexOf('location')
  const allDayIdx = findColumnIndex(headers, ['all_day', 'allday'])
  const descIdx = findColumnIndex(headers, ['description', 'desc', 'notes'])

  if (startIdx === -1) {
    return { data: [], errors: [{ row: 0, message: 'Missing required "start_time" or "date" column' }], headers }
  }

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const rowNum = i + 2

    const title = row[titleIdx]?.trim()
    if (!title) {
      errors.push({ row: rowNum, message: 'Missing title' })
      continue
    }

    let event_type = 'other'
    if (typeIdx !== -1 && row[typeIdx]) {
      const rawType = row[typeIdx].trim().toLowerCase()
      if (VALID_EVENT_TYPES.includes(rawType as any)) {
        event_type = rawType
      } else {
        errors.push({ row: rowNum, message: `Unknown event type "${row[typeIdx]}", defaulting to "other"` })
      }
    }

    const rawStart = row[startIdx]?.trim()
    if (!rawStart) {
      errors.push({ row: rowNum, message: 'Missing start time' })
      continue
    }

    const startDate = parseFlexibleDate(rawStart)
    if (!startDate) {
      errors.push({ row: rowNum, message: `Invalid start time: "${rawStart}"` })
      continue
    }

    let end_time: string | undefined
    if (endIdx !== -1 && row[endIdx]?.trim()) {
      const endDate = parseFlexibleDate(row[endIdx].trim())
      if (endDate) {
        end_time = endDate
      } else {
        errors.push({ row: rowNum, message: `Invalid end time: "${row[endIdx]}", ignoring` })
      }
    }

    const location = locationIdx !== -1 ? row[locationIdx]?.trim() || undefined : undefined
    const description = descIdx !== -1 ? row[descIdx]?.trim() || undefined : undefined

    let all_day = false
    if (allDayIdx !== -1 && row[allDayIdx]) {
      const val = row[allDayIdx].trim().toLowerCase()
      all_day = val === 'true' || val === 'yes' || val === '1'
    }

    data.push({ title, event_type, start_time: startDate, end_time, location, all_day, description })
  }

  return { data, errors, headers }
}

// --- Helpers ---

function findColumnIndex(headers: string[], variants: string[]): number {
  for (const v of variants) {
    const idx = headers.indexOf(v)
    if (idx !== -1) return idx
  }
  return -1
}

function parseFlexibleDate(value: string): string | null {
  // Try ISO format first
  const isoDate = new Date(value)
  if (!isNaN(isoDate.getTime())) {
    return isoDate.toISOString()
  }

  // Try common US formats: MM/DD/YYYY, MM-DD-YYYY
  const usMatch = value.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(am|pm)?)?$/i)
  if (usMatch) {
    const [, month, day, year, hours, minutes, seconds, ampm] = usMatch
    let h = parseInt(hours || '0')
    if (ampm?.toLowerCase() === 'pm' && h < 12) h += 12
    if (ampm?.toLowerCase() === 'am' && h === 12) h = 0
    const d = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), h, parseInt(minutes || '0'), parseInt(seconds || '0'))
    if (!isNaN(d.getTime())) return d.toISOString()
  }

  return null
}
