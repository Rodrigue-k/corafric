import { describe, it, expect, vi } from 'vitest';
import { GET as getSuggestions, POST as postSuggestions } from '@/app/api/admin/suggestions/route';

// Mock Clerk auth
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn().mockResolvedValue({ userId: null }),
  currentUser: vi.fn().mockResolvedValue(null),
}));

describe('Admin Security Integration Tests', () => {
  it('rejects unauthenticated requests to GET /api/admin/suggestions with 403', async () => {
    const req = new Request('http://localhost:3000/api/admin/suggestions');
    const res = await getSuggestions(req);

    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.error).toContain('Accès refusé');
  });

  it('rejects unauthenticated requests to POST /api/admin/suggestions with 403', async () => {
    const req = new Request('http://localhost:3000/api/admin/suggestions', {
      method: 'POST',
      body: JSON.stringify({ suggestionId: 'fake-id', action: 'approve' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await postSuggestions(req);

    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.error).toContain('Accès refusé');
  });
});
