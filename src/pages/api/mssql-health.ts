import type { NextApiRequest, NextApiResponse } from 'next'
import { getPool, getSanitizedConn, getConnInfo } from '@/lib/mssqlPool'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!process.env.MSSQL_CONNECTION_STRING) {
    return res.status(500).json({ ok: false, error: 'MSSQL_CONNECTION_STRING not configured' })
  }

  try {
    const pool = await getPool()
    const result = await pool.request().query('SELECT 1 AS ok')
    const ok = result.recordset && result.recordset.length > 0
    return res.status(200).json({ ok: !!ok, connection: getSanitizedConn(), target: getConnInfo() })
  } catch (err) {
    console.error('Health check failed', err)
    return res.status(500).json({ ok: false, error: String(err), connection: getSanitizedConn() })
  }
}
