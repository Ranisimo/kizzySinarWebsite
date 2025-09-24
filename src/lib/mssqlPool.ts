import sql from 'mssql'

declare global {
  // eslint-disable-next-line no-var
  var __mssqlPool: sql.ConnectionPool | undefined
}

const connStr = process.env.MSSQL_CONNECTION_STRING || ''

function sanitizeConnStr(s: string) {
  if (!s) return ''
  // mask password value but keep other keys
  return s.replace(/(Password|Pwd)=[^;]*/ig, '$1=***')
}

function parseConnInfo(s: string) {
  const parts = s.split(';').map(p => p.trim()).filter(Boolean)
  const obj: Record<string,string> = {}
  for (const p of parts) {
    const idx = p.indexOf('=')
    if (idx === -1) continue
    const k = p.slice(0, idx).trim()
    const v = p.slice(idx+1).trim()
    obj[k.toLowerCase()] = v
  }
  return {
    server: obj['server'] || obj['data source'] || obj['datasource'] || '',
    database: obj['database'] || obj['initial catalog'] || ''
  }
}

// Log sanitized connection info at module load for debug (no password)
try {
  const sanitized = sanitizeConnStr(connStr)
  const info = parseConnInfo(connStr)
  console.info('MSSQL connection (sanitized):', sanitized)
  console.info('MSSQL target server:', info.server || '<unknown>', 'database:', info.database || '<unknown>')
} catch (e) {
  // ignore logging errors
}

export async function getPool() {
  if (!connStr) throw new Error('MSSQL_CONNECTION_STRING missing')
  if (global.__mssqlPool) {
    try {
      if (!global.__mssqlPool.connected) {
        await global.__mssqlPool.connect()
      }
      return global.__mssqlPool
    } catch (err) {
      console.error('Existing MSSQL pool is invalid, will recreate. Error:', err)
      try {
        await global.__mssqlPool.close()
      } catch (_) {
        // ignore
      }
      global.__mssqlPool = undefined
    }
  }

  const pool = new sql.ConnectionPool(connStr)
  pool.on && pool.on('error', (err: unknown) => {
    console.error('MSSQL pool error event - invalidating global pool', err)
    try {
      pool.close().catch(() => { /* ignore */ })
    } catch (_) {}
    if (global.__mssqlPool === pool) global.__mssqlPool = undefined
  })

  await pool.connect()
  if (process.env.NODE_ENV !== 'production') global.__mssqlPool = pool
  return pool
}

export function getSanitizedConn() {
  return sanitizeConnStr(connStr)
}

export function getConnInfo() {
  return parseConnInfo(connStr)
}

// re-export the mssql module for convenience (types and sql.* constants)
export { sql }

