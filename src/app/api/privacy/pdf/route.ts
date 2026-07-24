import { NextResponse } from 'next/server';
import type { TDocumentDefinitions } from 'pdfmake/interfaces';

export async function GET() {
  try {
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

    // Define the PDF document layout and protective clauses
    const docDefinition: TDocumentDefinitions = {
      content: [
        { text: 'SolarQuotePro', style: 'brandTitle' },
        { text: 'DATA PROTECTION CHARTER & PRIVACY POLICY', style: 'brandSubtitle' },
        { text: `Effective Date: June 1, 2026`, style: 'dateStamp' },
        {
          canvas: [
            {
              type: 'line',
              x1: 0,
              y1: 5,
              x2: 515,
              y2: 5,
              lineWidth: 1.5,
              lineColor: '#14b8a6', // Teal brand color
            },
          ],
          margin: [0, 0, 0, 20],
        },

        { text: '1. Overview and Scope', style: 'sectionHeader' },
        {
          text: 'This Privacy Policy governs the processing of data by SolarQuotePro ("we", "us", or "the Platform"). The platform is designed to provide hybrid solar sizing recommendations, financial return-on-investment (ROI) estimators, and professional proposal workflows for clean energy installers. This policy outlines how data is gathered, stored locally first, synchronized to secure databases, and what protective measures are in place to limit liability.',
          style: 'bodyText',
        },

        { text: '2. Information We Collect', style: 'sectionHeader' },
        {
          text: 'To compute accurate system recommendations and generate proposals, we collect the following datasets:',
          style: 'bodyText',
        },
        {
          ul: [
            'System Load & Appliance Profiling: Load items, active runtimes, surge wattages, and energy priorities entered by the user.',
            'Utility & Expenses Data: DisCo (Grid) tariffs, monthly electricity expenditures, generator fuel spend (Petrol and Diesel prices per liter), and legacy maintenance expenses.',
            'Installer Business Information: Installer name, business logo files, primary and secondary brand hex colors, marketing taglines, and pricing margins (markup percentages, transport logistics, and labor costs).',
            'Homeowner / Client Data: Full name, phone number, email address, and property city locations (used to pull local peak sun hours metadata).',
          ],
          style: 'listStyle',
        },

        { text: '3. Local-First & Offline Storage Reliability', style: 'sectionHeader' },
        {
          text: 'SolarQuotePro utilizes local storage caches (such as IndexedDB and localStorage) to cache system catalog parameters and preserve pending proposal drafts. This allows the application to remain functional in areas with weak cellular coverage. Users understand and agree that:',
          style: 'bodyText',
        },
        {
          ul: [
            'Local data is stored on the user\'s physical device and is subject to deletion if browser cache, site data, or private histories are cleared.',
            'The Platform operator is not responsible for any data loss, corrupt local caches, or unsaved drafts resulting from device damage or browser cleaning.',
          ],
          style: 'listStyle',
        },

        { text: '4. Supabase Database and RLS Security', style: 'sectionHeader' },
        {
          text: 'When connected to the internet, installer proposal data is synchronized to our secure PostgreSQL database managed via Supabase. We enforce strict Row-Level Security (RLS) constraints to guarantee that company members can only access estimates generated within their organization, protecting proprietary commercial leads and price markup details.',
          style: 'bodyText',
        },

        { text: '5. Third-Party Integrations & Payment Gateway', style: 'sectionHeader' },
        {
          text: 'All monetary transactions (including client site survey fees and equipment deposit payments) are securely routed and processed via Paystack. We do not store, process, or keep credit card, pin, or bank verification details on our servers. All transaction lifecycles are governed by Paystack\'s terms and privacy policies.',
          style: 'bodyText',
        },

        { text: '6. SIZING ESTIMATOR & ROI DISCLAIMER (LIMITATION OF LIABILITY)', style: 'sectionHeaderCritical' },
        {
          table: {
            widths: ['*'],
            body: [
              [
                {
                  stack: [
                    {
                      text: 'CRITICAL LIMITATION OF LIABILITY:',
                      bold: true,
                      color: '#991b1b',
                      fontSize: 10,
                      margin: [0, 0, 0, 5],
                    },
                    {
                      text: 'ALL CALCULATIONS, SOLAR ARRAY SIZING ESTIMATES, BATTERY BANK RECOMMENDATIONS, AND PAYBACK PERIOD CHARTS ARE SIMULATIONS FOR GUIDANCE ONLY. THEY DO NOT CONSTITUTE PROFESSIONAL ELECTRICAL ENGINEERING DESIGNS OR FINANCIAL CONTRACTS.',
                      bold: true,
                      color: '#1e293b',
                      fontSize: 9,
                      margin: [0, 0, 0, 5],
                    },
                    {
                      text: 'System outcomes will vary depending on installer installation practices, ambient temperatures, weather variables, shadow structures, panel tilts, and actual appliance usage patterns. The Platform operator explicitly disclaims all liability for electrical overload, fires, battery damage, or financial losses resulting from recommendations generated by this software. Installers MUST perform physical site surveys and load audits before procurement.',
                      color: '#334155',
                      fontSize: 9,
                    },
                  ],
                }
              ]
            ]
          },
          layout: {
            fillColor: () => '#fef2f2',
            hLineWidth: (i: number) => i === 0 || i === 1 ? 1 : 0,
            vLineWidth: (i: number) => i === 0 || i === 1 ? 1 : 0,
            hLineColor: () => '#fee2e2',
            vLineColor: () => '#fee2e2',
            paddingLeft: () => 12,
            paddingRight: () => 12,
            paddingTop: () => 12,
            paddingBottom: () => 12,
          },
          margin: [0, 5, 0, 15],
        },

        { text: '7. NDPR & Global Compliance', style: 'sectionHeader' },
        {
          text: 'We comply with the provisions of the Nigeria Data Protection Regulation (NDPR) and other applicable privacy frameworks. By submitting homeowner details to generate proposals, installers certify they have obtained explicit consent from the respective clients to process their contact and location details.',
          style: 'bodyText',
        },
        {
          text: 'Clients have the right to request access to their collected data, ask for correction of inaccurate data, or request complete deletion of their files from our servers by contacting us.',
          style: 'bodyText',
        },

        { text: '8. Contact and Queries', style: 'sectionHeader' },
        {
          text: 'For questions regarding data processing, security updates, or to submit a data erasure request, please reach out to our privacy compliance desk at:',
          style: 'bodyText',
        },
        {
          text: 'Email: privacy@solarquotepro.ng\nWeb: https://solarquotepro.ng',
          style: 'contactInfo',
        },
      ],
      styles: {
        brandTitle: { fontSize: 24, bold: true, color: '#0f172a', margin: [0, 0, 0, 2] },
        brandSubtitle: { fontSize: 10, bold: true, color: '#475569', characterSpacing: 1, margin: [0, 0, 0, 5] },
        dateStamp: { fontSize: 9, italics: true, color: '#64748b', margin: [0, 0, 0, 10] },
        sectionHeader: { fontSize: 12, bold: true, color: '#0f172a', margin: [0, 15, 0, 8] },
        sectionHeaderCritical: { fontSize: 12, bold: true, color: '#991b1b', margin: [0, 15, 0, 8] },
        bodyText: { fontSize: 10, color: '#334155', lineHeight: 1.45, margin: [0, 0, 0, 10] },
        listStyle: { fontSize: 10, color: '#334155', lineHeight: 1.4, margin: [0, 0, 0, 10] },
        disclaimerBox: {
          margin: [0, 5, 0, 15],
        },
        contactInfo: { fontSize: 10, bold: true, color: '#0f172a', margin: [0, 5, 0, 10] },
      },
      defaultStyle: {
        columnGap: 20,
      },
    };

    const pdfDoc = pdfMake.createPdf(docDefinition);
    const buffer: Buffer = await pdfDoc.getBuffer();

    return new NextResponse(buffer as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="SolarQuotePro_Privacy_Policy.pdf"',
      },
    });
  } catch (err: any) {
    console.error('[API Privacy PDF] Error generating policy:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to generate PDF' },
      { status: 500 }
    );
  }
}
