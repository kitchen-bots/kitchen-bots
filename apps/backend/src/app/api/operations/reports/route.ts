import { NextRequest, NextResponse } from 'next/server';
import { PostgresOperationsRepository } from '@/lib/postgres-operations-repo';
import { authenticateRequest, authorizeRole } from '@/lib/auth-guard';

const repo = new PostgresOperationsRepository();

// GET /api/operations/reports?type=financial|inventory|manufacturing&format=json|csv
export async function GET(req: NextRequest) {
  const user = await authenticateRequest(req);
  if (!authorizeRole(user, ['admin', 'operations', 'editor'])) {
    return NextResponse.json({ error: 'Unauthorized: Operational role required' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const type = (searchParams.get('type') || 'financial') as 'financial' | 'inventory' | 'manufacturing';
  const format = searchParams.get('format') || 'json';

  try {
    const reportData = await repo.generateOperationalReport(type);

    if (format === 'csv') {
      let csvContent = '';
      if (type === 'financial') {
        const stats = reportData.stats as Record<string, unknown>;
        csvContent = `Metric,Value\nTotal Invoices,${stats.total_invoices}\nGross Billed (Paise),${stats.gross_billed_paise}\nTotal Collected (Paise),${stats.total_collected_paise}\nOutstanding Due (Paise),${stats.total_outstanding_paise}\n`;
      } else if (type === 'inventory') {
        const movements = (reportData.movements || []) as Array<{ movement_type: string; total_movements: number; total_quantity: number }>;
        csvContent = `Movement Type,Total Records,Total Quantity\n` + movements.map(m => `${m.movement_type},${m.total_movements},${m.total_quantity}`).join('\n');
      } else {
        const tasks = (reportData.tasks || []) as Array<{ stage: string; status: string; task_count: number }>;
        csvContent = `Stage,Status,Task Count\n` + tasks.map(t => `${t.stage},${t.status},${t.task_count}`).join('\n');
      }

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="kitchenbots_${type}_report_${Date.now()}.csv"`,
        },
      });
    }

    return NextResponse.json(reportData);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Report generation error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
