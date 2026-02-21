import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";

export default function AdminClientPage() {
  const { id } = useParams<{ id: string }>();

  const { data, error, isLoading } = useQuery<any>({
    queryKey: [`/api/admin/clients/${id}/progress`],
    enabled: !!id,
  });

  return (
    <div style={{ padding: '40px', fontFamily: 'sans-serif' }}>
      <h1>Diagnostic Mode: Client Profile</h1>
      <p><strong>Step 1: ID Check</strong></p>
      <p>The browser is looking for Client ID: <code style={{background: '#eee'}}>{id}</code></p>

      <hr />

      <p><strong>Step 2: Server Communication</strong></p>
      {isLoading && <p style={{color: 'blue'}}>⏳ Waiting for server response...</p>}
      {error && <p style={{color: 'red'}}>❌ ERROR: {(error as any).message}</p>}

      {data && (
        <div style={{ background: '#f0fff0', padding: '20px', border: '1px solid green' }}>
          <p style={{color: 'green'}}>✅ SUCCESS: Server responded!</p>
          <p><strong>Client Name:</strong> {data.client?.name || "Missing Name"}</p>
          <p><strong>Relapse Records Found:</strong> {data.relapseAutopsies?.length || 0}</p>
          <pre style={{ fontSize: '10px', overflow: 'auto' }}>
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}