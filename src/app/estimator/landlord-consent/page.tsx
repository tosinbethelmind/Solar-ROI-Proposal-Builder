'use client';

import * as React from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { getCityById } from '@/lib/nigerianCities';
import { Button } from '@/components/ui/button';
import { Suspense } from 'react';

function LandlordConsentContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const cityId = searchParams ? searchParams.get('city') || 'lagos' : 'lagos';
  const city = getCityById(cityId);

  React.useEffect(() => {
    // Automatically trigger print dialog on load
    const timer = setTimeout(() => {
      window.print();
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 p-8 print:p-0 print:bg-white flex flex-col items-center">
      {/* Control Bar (hidden during print) */}
      <div className="w-full max-w-2xl bg-white border rounded-2xl p-4 mb-8 flex justify-between items-center shadow-sm print:hidden">
        <Button variant="outline" onClick={() => router.back()}>
          ← Back to Estimator
        </Button>
        <div className="flex gap-2">
          <Button onClick={() => window.print()} className="bg-teal-650 hover:bg-teal-700 text-white font-bold">
            🖨️ Print / Save as PDF
          </Button>
        </div>
      </div>

      {/* Legal Contract Document Sheet */}
      <div className="w-full max-w-2xl bg-white border border-slate-300 print:border-none p-12 print:p-4 shadow-lg print:shadow-none min-h-[1000px] flex flex-col justify-between font-serif text-slate-900 leading-relaxed text-sm">
        
        {/* Document Header */}
        <div className="space-y-6">
          <div className="text-center space-y-2 border-b-2 border-slate-900 pb-4">
            <h1 className="text-xl font-bold uppercase tracking-wider">
              Landlord Solar Installation Consent Addendum
            </h1>
            <p className="text-xs italic text-slate-500">
              Pursuant to Lagos State Electricity Board (LSEB) & Local Tenancy Guidelines
            </p>
          </div>

          {/* Preamble */}
          <p className="indent-8 text-justify">
            This Addendum is made and entered into this <span className="underline"> &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; </span> day of 
            <span className="underline"> &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; </span>, 20<span className="underline"> &nbsp; &nbsp; </span>, 
            by and between the parties defined below, as an extension of the existing Residential/Commercial Lease Agreement for the Demised Premises.
          </p>

          {/* Parties block */}
          <div className="space-y-3 pl-4 border-l-4 border-slate-300">
            <div>
              <strong>LANDLORD:</strong> <span className="underline"> &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; </span>
            </div>
            <div>
              <strong>TENANT:</strong> <span className="underline"> &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; </span>
            </div>
            <div>
              <strong>PROPERTY ADDRESS (PREMISES):</strong> <span className="underline"> &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; </span>
            </div>
            <div>
              <strong>CITY / STATE:</strong> <strong className="text-slate-800">{city?.name || 'Lagos'} ({city?.state || 'Lagos State'})</strong>
            </div>
          </div>

          <div className="h-4" />

          {/* Consent terms */}
          <div className="space-y-4">
            <p className="font-bold border-b pb-1">1. Consent to Installation & Access Rights</p>
            <p className="text-justify text-xs">
              The Landlord hereby grants formal consent to the Tenant for the installation, operation, and maintenance of a removable solar photovoltaic power system (including solar panels, metal mounting structures, hybrid inverter, charge controllers, and battery bank) on the designated roof, balcony, or structural areas of the Premises. The Landlord agrees to provide reasonable access to the installer partners for cabling and routine maintenance.
            </p>

            <p className="font-bold border-b pb-1">2. Ownership of Assets & Removability</p>
            <p className="text-justify text-xs">
              It is explicitly agreed that the entire solar power system and all associated components (excluding any permanent electrical panel upgrades agreed separately) remain the sole personal property of the Tenant. The Tenant reserves the absolute right to dismantle, pack, and remove the solar system at the expiration, termination, or non-renewal of the lease, provided that the Premises is restored to its original condition, normal wear and tear excepted.
            </p>

            <p className="font-bold border-b pb-1">3. Structural & Permitting Standards ({city?.disco || 'EKEDC'} Region)</p>
            <p className="text-justify text-xs">
              The installation must comply with local safety regulations:
            </p>
            <ul className="list-decimal pl-5 text-xs space-y-1 text-slate-800">
              <li>Mounting frames must use lightweight aluminum structural components, not exceeding {cityId.includes('lagos') ? '15 kg/sqm' : '20 kg/sqm'} total roof dead-load.</li>
              <li>Waterproofing integrity must be maintained using EPDM gaskets or equivalent sealing compounds at all roof mounting penetrations.</li>
              <li>Inverters must be isolated on non-combustible boards with standard surge protectors and breakers conforming to earthing standards.</li>
              {city?.complianceNotes.slice(0, 2).map((note, index) => (
                <li key={index}>{note}</li>
              ))}
            </ul>

            <p className="font-bold border-b pb-1">4. Liability & Insurance</p>
            <p className="text-justify text-xs">
              The Tenant agrees to bear all costs associated with the installation, cabling, and future removal of the solar equipment. The Tenant shall hold the Landlord harmless against any structural damage directly caused by the negligence of the installation team during the mounting phase.
            </p>
          </div>
        </div>

        {/* Signatures block */}
        <div className="pt-16 space-y-8">
          <div className="text-xs text-slate-500 italic text-center">
            In Witness Whereof, the parties have signed this Addendum on the dates written below.
          </div>
          <div className="grid grid-cols-2 gap-12 pt-6">
            <div className="space-y-4">
              <div className="border-t border-slate-900 pt-2 text-center">
                <p className="font-bold">LANDLORD SIGNATURE</p>
                <p className="text-xs text-slate-500">Date: ____ / ____ / 20___</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="border-t border-slate-900 pt-2 text-center">
                <p className="font-bold">TENANT SIGNATURE</p>
                <p className="text-xs text-slate-500">Date: ____ / ____ / 20___</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

function LandlordConsentLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-teal-600"></div>
    </div>
  );
}

export default function LandlordConsentPage() {
  return (
    <Suspense fallback={<LandlordConsentLoading />}>
      <LandlordConsentContent />
    </Suspense>
  );
}
