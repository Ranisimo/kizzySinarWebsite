import Head from "next/head";
import Container from "react-bootstrap/Container";
import Header from "@/components/Header";
import { useEffect, useState } from "react";

type DbResponse = { ok: true; now: string } | { error: string }

export default function Home() {
  const [data, setData] = useState<DbResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(50)
  const [prefix, setPrefix] = useState('A')

  useEffect(() => {
    let mounted = true
    setLoading(true)
    const qs = new URLSearchParams({ page: String(page), pageSize: String(pageSize), prefix })
    fetch('/api/mssql?' + qs.toString())
      .then((r) => r.json())
      .then((json) => {
        if (!mounted) return
        setData(json)
        if ((json as any).error) setError((json as any).error)
      })
      .catch((err) => {
        if (!mounted) return
        setError(String(err))
      })
      .finally(() => {
        if (!mounted) return
        setLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [page, pageSize, prefix])

  return (
    <>
      <Head>
        <title>FISC Study Tool</title>
        <meta name="description" content="FISC study tool" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Container as="main" className="py-4 px-3 mx-auto">
        <body className="text-bg-dark">
          <Header />

          <h1>FISC Study Tool</h1>

          <p>All data provided below was downloaded from the BSBI Online Plant Atlas 2020 csv.</p>

          {loading && <p>Loading database info…</p>}
          {error && <div className="alert alert-danger">Error: {error}</div>}

          {/* If MSSQL endpoint returns rows */}
          <div className="mb-3">
            <label className="me-2">Prefix:</label>
            <input value={prefix} onChange={(e) => { setPrefix(e.target.value); setPage(1); }} className="form-control d-inline-block w-auto me-3" />
            <label className="me-2">Page size:</label>
            <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }} className="form-select d-inline-block w-auto">
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>

          {data && 'rows' in (data as any) && (
            <div>
              <h2>Plants</h2>
              <div className="mb-2">Page { (data as any).page } / { Math.max(1, Math.ceil(((data as any).totalCount || 0) / (data as any).pageSize || 1)) } — { (data as any).totalCount } results</div>
              <div className="table-responsive">
                <table className="table table-sm table-striped">
                  <thead>
                    <tr>
                      <th>taxonName</th>
                      <th>vernacular</th>
                    </tr>
                  </thead>
                  <tbody>
                    {((data as any).rows as any[]).map((r, i) => (
                      <tr key={i}>
                        <td>{r.taxonName}</td>
                        <td>{r.vernacular}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="d-flex gap-2 mt-2">
                <button className="btn btn-secondary" disabled={page <= 1 || loading} onClick={() => setPage(p => Math.max(1, p - 1))}>Prev</button>
                <button className="btn btn-secondary" disabled={loading || ((data as any)?.rows || []).length < pageSize} onClick={() => setPage(p => p + 1)}>Next</button>
              </div>
            </div>
          )}

        </body>
      </Container>
     
    </>
  );
}
