import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { TDocumentDefinitions } from 'pdfmake/interfaces';

// Helper to fetch lead data by ID
async function getLead(leadId: string) {
  const supabase = await createClient();
  const { data: lead, error } = await supabase
    .from('leads')
    .select('*')
    .eq('id', leadId)
    .single();
  if (error) throw error;
  return lead;
}


export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const leadId = searchParams.get('leadId');
  if (!leadId) {
    return NextResponse.json({ error: 'leadId query param required' }, { status: 400 });
  }

  try {
    const lead = await getLead(leadId);
    
    // Dynamic import to avoid build-time node execution issues
    const pdfMake = (await import('pdfmake/build/pdfmake')).default;
    const pdfFonts = (await import('pdfmake/build/vfs_fonts')).default;
    (pdfMake as any).vfs = (pdfFonts as any).pdfMake.vfs;

    // Define a minimal PDF doc with branding
    const docDefinition: TDocumentDefinitions = {
      content: [
        { text: 'Solar ROI Proposal', style: 'header' },
        { text: `Lead: ${lead.name}`, style: 'subheader' },
        { text: `Phone: ${lead.phone}` },
        { text: `Email: ${lead.email ?? 'N/A'}` },
        { text: `Location: ${lead.location ?? 'N/A'}` },
        { text: `Status: ${lead.status ?? 'new'}` },
        { text: `Notes: ${lead.notes ?? 'None'}` },
        // Add more fields as needed
      ],
      styles: {
        header: { fontSize: 22, bold: true, margin: [0, 0, 0, 10] },
        subheader: { fontSize: 16, bold: true, margin: [0, 10, 0, 5] },
      },
    };
    // Generate PDF buffer using pdfMake's getBuffer (works in Node with vfs fonts)
    const pdfDoc = pdfMake.createPdf(docDefinition);
    const buffer: Buffer = await new Promise((resolve, reject) => {
      (pdfDoc as any).getBuffer((buf: Buffer) => resolve(buf));
    });
    return new NextResponse(buffer as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${lead.name.replace(/\s+/g, '_')}_Proposal.pdf"`,
      },
    });
  } catch (err: any) {
    console.error('[API export PDF] error', err);
    return NextResponse.json({ error: err.message || 'Failed to generate PDF' }, { status: 500 });
  }
}
