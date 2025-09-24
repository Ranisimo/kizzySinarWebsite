import type { NextApiRequest, NextApiResponse } from 'next'
import { getPool, sql } from '@/lib/mssqlPool'

const hasConn = !!process.env.MSSQL_CONNECTION_STRING
if (!hasConn) console.error('MSSQL_CONNECTION_STRING is not set. MSSQL API will return 500.')

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!hasConn) return res.status(500).json({ error: 'Server DB not configured (MSSQL_CONNECTION_STRING).' })

  try {
  const pool = await getPool()

    // Accept optional prefix query param to limit results. Default to 'A' for tester.
    const prefix = (typeof req.query.prefix === 'string' && req.query.prefix.trim() !== '') ? req.query.prefix : 'A'

    // Pagination params
    const page = Math.max(1, parseInt(String(req.query.page || '1'), 10) || 1)
    const pageSize = Math.min(1000, Math.max(1, parseInt(String(req.query.pageSize || '50'), 10) || 50))
    const offset = (page - 1) * pageSize

    // Parameterized query to avoid injection; use LIKE prefix + '%'
  const request = pool.request()
  request.input('prefix', sql.VarChar(100), prefix + '%')
  request.input('offset', sql.Int, offset)
  request.input('pageSize', sql.Int, pageSize)

    // Total count for this prefix (without pagination)
    const countResult = await request.query(
      `SELECT COUNT(1) AS totalCount
       FROM (
         SELECT p.ddbidOrig, p.taxonName, p.vernacular
         FROM dbo.plants p
         WHERE p.taxonName LIKE @prefix
         GROUP BY p.ddbidOrig, p.taxonName, p.vernacular
       ) AS t`
    )
    const totalCount = countResult.recordset[0]?.totalCount || 0

    // Paginated rows using OFFSET/FETCH
    const rowsResult = await pool.request()
      .input('prefix', sql.VarChar(100), prefix + '%')
      .input('offset', sql.Int, offset)
      .input('pageSize', sql.Int, pageSize)
      .query(
        `SELECT p.ddbidOrig, p.taxonName, p.vernacular
         FROM dbo.plants p
         WHERE p.taxonName LIKE @prefix
         GROUP BY p.ddbidOrig, p.taxonName, p.vernacular
         ORDER BY p.taxonName
         OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY`
      )

    return res.status(200).json({ ok: true, totalCount, page, pageSize, rows: rowsResult.recordset })
  } catch (err) {
    console.error('MSSQL query error', err)
    return res.status(500).json({ error: 'MSSQL query failed' })
  }
}
