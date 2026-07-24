import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { TDocumentDefinitions } from 'pdfmake/interfaces';
import { isE2EBypassed } from '@/utils/e2eBypass';
import { getCityById } from '@/lib/nigerianCities';

// Helper to fetch lead data by ID and type
async function getLead(leadId: string, leadType: string) {
  if (await isE2EBypassed()) {
    if (leadType === 'enterprise') {
      return {
        id: leadId,
        company_name: 'Acme Corp Ltd',
        contact_person: 'Chinedu Eze',
        email: 'chinedu@acmecorp.com',
        phone: '08099991111',
        project_scope: '100kW rooftop installation for warehouse in Lagos',
        status: 'new',
        created_at: new Date().toISOString()
      };
    } else {
      return {
        id: leadId,
        name: 'Mock Homeowner',
        phone: '08012345678',
        email: 'homeowner@mock.com',
        location: 'Lagos',
        status: 'new',
        notes: 'E2E test notes',
        created_at: new Date().toISOString()
      };
    }
  }

  const supabase = await createClient();
  const tableName = leadType === 'enterprise' ? 'enterprise_leads' : 'leads';
  const { data: lead, error } = await supabase
    .from(tableName)
    .select('*')
    .eq('id', leadId)
    .single();
  if (error) throw error;
  return lead;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const leadId = searchParams.get('leadId');
  const leadType = searchParams.get('leadType') || 'homeowner';
  const cityId = searchParams.get('city') || 'lagos';

  if (!leadId) {
    return NextResponse.json({ error: 'leadId query param required' }, { status: 400 });
  }

  try {
    const lead = await getLead(leadId, leadType);
    const city = getCityById(cityId);

    // Dynamic import to avoid build-time node execution issues
    const pdfMake = (await import('pdfmake/build/pdfmake')).default;
    const pdfFonts = (await import('pdfmake/build/vfs_fonts')).default;
    const fontsDict = (pdfFonts as any)?.pdfMake?.vfs || pdfFonts;
    if ((pdfMake as any).virtualfs && (pdfMake as any).virtualfs.storage) {
      for (const [key, value] of Object.entries(fontsDict)) {
        (pdfMake as any).virtualfs.storage[key] = Buffer.from(value as string, 'base64');
      }
    } else {
      (pdfMake as any).vfs = fontsDict;
    }

    let docDefinition: TDocumentDefinitions;

    if (leadType === 'enterprise') {
      docDefinition = {
        content: [
          // Page 1: Enterprise Lead & Compliance Report
          { text: 'Solar ROI Proposal & Compliance Report', style: 'header' },
          { text: 'ENTERPRISE SOLAR SYSTEM PROPOSAL', style: 'sectionHeader' },
          {
            table: {
              widths: ['35%', '65%'],
              body: [
                [{ text: 'Company Name', bold: true }, lead.company_name || 'N/A'],
                [{ text: 'Contact Person', bold: true }, lead.contact_person || 'N/A'],
                [{ text: 'Phone Number', bold: true }, lead.phone || 'N/A'],
                [{ text: 'Email Address', bold: true }, lead.email || 'N/A'],
                [{ text: 'Status', bold: true }, (lead.status || 'new').toUpperCase()],
                [{ text: 'Created At', bold: true }, new Date(lead.created_at).toLocaleDateString()],
              ]
            },
            margin: [0, 10, 0, 20]
          },
          
          { text: 'Project Scope', style: 'subheader' },
          { text: lead.project_scope || 'No project scope details provided.', margin: [0, 0, 0, 20] },

          { text: `Regional Compliance Guidelines (${city.name} - ${city.disco} Region)`, style: 'subheader' },
          {
            ol: city.complianceNotes.map((note: string) => ({ text: note, fontSize: 10 })),
            margin: [0, 5, 0, 20]
          },

          { text: 'Standard Compliance Requirements', style: 'subheader' },
          {
            ul: [
              'All structural installations must utilize lightweight materials and comply with regional dead-load guidelines.',
              'EPDM gaskets or equivalent waterproofing sealants must be applied at all roof mounting penetration points.',
              'Grid-tied connections require certified hybrid inverters with net-metering support where available.',
              'Electrical isolation via dedicated AC/DC disconnect breakers and surge protection is mandatory.'
            ],
            fontSize: 10,
            margin: [0, 5, 0, 20]
          },

          // Page 2: Landlord Consent Addendum
          { text: 'Landlord Solar Installation Consent Addendum', style: 'header', pageBreak: 'before' },
          { text: `Pursuant to ${city.name} Local Tenancy and DISCO (${city.disco}) Guidelines`, style: 'caption', alignment: 'center', italics: true, margin: [0, 0, 0, 20] },

          {
            text: [
              'This Addendum is made and entered into as an extension of the existing Lease Agreement for the Demised Premises, by and between the parties defined below:\n\n',
              { text: 'LANDLORD: ', bold: true }, '_________________________________________________\n',
              { text: 'TENANT: ', bold: true }, `${lead.company_name} (Represented by ${lead.contact_person})\n`,
              { text: 'PROPERTY ADDRESS: ', bold: true }, '_________________________________________________\n',
              { text: 'CITY / STATE: ', bold: true }, `${city.name} (${city.state})\n`
            ],
            margin: [0, 10, 0, 20],
            lineHeight: 1.5
          },

          { text: '1. Consent to Installation & Access Rights', style: 'legalHeader' },
          {
            text: 'The Landlord hereby grants formal consent to the Tenant for the installation, operation, and maintenance of a removable solar photovoltaic power system (including solar panels, metal mounting structures, hybrid inverter, charge controllers, and battery bank) on the designated roof, balcony, or structural areas of the Premises. The Landlord agrees to provide reasonable access to the installer partners for cabling and routine maintenance.',
            style: 'legalText'
          },

          { text: '2. Ownership of Assets & Removability', style: 'legalHeader' },
          {
            text: 'It is explicitly agreed that the entire solar power system and all associated components (excluding any permanent electrical panel upgrades agreed separately) remain the sole personal property of the Tenant. The Tenant reserves the absolute right to dismantle, pack, and remove the solar system at the expiration, termination, or non-renewal of the lease, provided that the Premises is restored to its original condition, normal wear and tear excepted.',
            style: 'legalText'
          },

          { text: '3. Structural & Permitting Standards', style: 'legalHeader' },
          {
            text: `The installation must comply with local safety regulations. Mounting frames must use lightweight structural components, not exceeding ${cityId.includes('lagos') ? '15 kg/sqm' : '20 kg/sqm'} total roof dead-load. Waterproofing integrity must be maintained using proper sealing compounds at all roof mounting penetrations. Inverters must be isolated on non-combustible boards with standard surge protectors conforming to local earthing standards.`,
            style: 'legalText'
          },

          { text: '4. Liability & Insurance', style: 'legalHeader' },
          {
            text: 'The Tenant agrees to bear all costs associated with the installation, cabling, and future removal of the solar equipment. The Tenant shall hold the Landlord harmless against any structural damage directly caused by the negligence of the installation team during the mounting phase.',
            style: 'legalText',
            margin: [0, 0, 0, 40]
          },

          {
            columns: [
              {
                width: '50%',
                stack: [
                  { text: '___________________________', margin: [0, 0, 0, 5] },
                  { text: 'LANDLORD SIGNATURE', bold: true, fontSize: 10 },
                  { text: 'Date: ____ / ____ / 20___', fontSize: 9, color: '#555' }
                ],
                alignment: 'center'
              },
              {
                width: '50%',
                stack: [
                  { text: '___________________________', margin: [0, 0, 0, 5] },
                  { text: 'TENANT SIGNATURE', bold: true, fontSize: 10 },
                  { text: 'Date: ____ / ____ / 20___', fontSize: 9, color: '#555' }
                ],
                alignment: 'center'
              }
            ]
          }
        ],
        styles: {
          header: { fontSize: 20, bold: true, color: '#0f766e', alignment: 'center', margin: [0, 0, 0, 15] },
          sectionHeader: { fontSize: 12, bold: true, color: '#334155', margin: [0, 10, 0, 5] },
          subheader: { fontSize: 14, bold: true, color: '#0f766e', margin: [0, 10, 0, 5] },
          caption: { fontSize: 10, color: '#64748b' },
          legalHeader: { fontSize: 11, bold: true, color: '#1e293b', margin: [0, 10, 0, 3] },
          legalText: { fontSize: 9, color: '#334155', lineHeight: 1.3, margin: [0, 0, 0, 10], alignment: 'justify' }
        }
      };
    } else {
      docDefinition = {
        content: [
          { text: 'Solar ROI Proposal', style: 'header' },
          { text: `Lead: ${lead.name}`, style: 'subheader' },
          { text: `Phone: ${lead.phone}` },
          { text: `Email: ${lead.email ?? 'N/A'}` },
          { text: `Location: ${lead.location ?? 'N/A'}` },
          { text: `Status: ${lead.status ?? 'new'}` },
          { text: `Notes: ${lead.notes ?? 'None'}` },
        ],
        styles: {
          header: { fontSize: 22, bold: true, margin: [0, 0, 0, 10] },
          subheader: { fontSize: 16, bold: true, margin: [0, 10, 0, 5] },
        },
      };
    }

    // Generate PDF buffer using pdfMake's getBuffer (works in Node with vfs fonts)
    const pdfDoc = pdfMake.createPdf(docDefinition);
    const buffer: Buffer = await pdfDoc.getBuffer();

    const formattedName = leadType === 'enterprise'
      ? (lead.company_name || 'Enterprise_Lead').replace(/\s+/g, '_')
      : (lead.name || 'Homeowner_Lead').replace(/\s+/g, '_');

    return new NextResponse(buffer as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${formattedName}_Proposal.pdf"`,
      },
    });
  } catch (err: any) {
    console.error('[API export PDF] error', err);
    return NextResponse.json({ error: err.message || 'Failed to generate PDF' }, { status: 500 });
  }
}
