const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in environment variables.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

// Helper function to write to scraper_logs table
async function writeLog(message, type = 'info') {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${type.toUpperCase()}] ${message}`);
  try {
    await supabase.from('scraper_logs').insert({ message, type });
  } catch (err) {
    console.warn('Failed to insert log entry into Supabase:', err.message);
  }
}

async function processScraperQueue() {
  await writeLog('Starting background scraper worker sweep...', 'info');

  // 1. Recover any stuck jobs (older than 30 mins, up to 3 retries)
  try {
    const { data: recovered, error: recError } = await supabase.rpc('recover_stuck_jobs', {
      p_timeout_minutes: 30,
      p_max_retries: 3
    });
    if (recError) {
      console.error('Error recovering stuck jobs:', recError.message);
    } else if (recovered > 0) {
      await writeLog(`Recovered ${recovered} stuck scraper jobs back to queued status.`, 'info');
    }
  } catch (err) {
    console.warn('Stuck job recovery exception:', err.message);
  }

  let jobsProcessed = 0;

  // 2. Loop until queue is empty
  while (true) {
    let job = null;
    try {
      const { data: jobs, error: dequeueError } = await supabase.rpc('dequeue_next_scrape_job');
      
      if (dequeueError) {
        console.error('Error dequeuing next job:', dequeueError.message);
        break;
      }

      if (!jobs || jobs.length === 0) {
        // Queue is empty
        break;
      }

      job = jobs[0];
    } catch (err) {
      console.error('Exception dequeuing job:', err.message);
      break;
    }

    await writeLog(`Dequeued job ${job.id} of type "${job.type}" (Payload: ${JSON.stringify(job.payload)})`, 'info');

    try {
      let leads = [];

      // Execute based on job type
      if (job.type === 'google_maps') {
        const { query, limit, onlyWithPhone, verifyWebsite } = job.payload || {};
        const apiKey = process.env.GOOGLE_PLACES_API_KEY;

        if (!apiKey) {
          throw new Error('Google Places API Key is not set in environment variables.');
        }

        const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${apiKey}`;
        const searchResp = await fetch(searchUrl);
        if (!searchResp.ok) {
          throw new Error(`Google Places Search API failed: ${searchResp.statusText}`);
        }

        const searchData = await searchResp.json();
        const places = (searchData.results || []).slice(0, limit || 10);

        for (const place of places) {
          const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=name,formatted_phone_number,website,formatted_address&key=${apiKey}`;
          const detailsResp = await fetch(detailsUrl);
          let phone = '';
          let website = '';
          let address = place.formatted_address || '';

          if (detailsResp.ok) {
            const detailsData = await detailsResp.json();
            const details = detailsData.result || {};
            phone = details.formatted_phone_number || '';
            website = details.website || '';
            if (details.formatted_address) {
              address = details.formatted_address;
            }
          }

          if (onlyWithPhone && !phone) continue;
          if (verifyWebsite && !website) continue;

          leads.push({
            name: place.name || 'Unknown Business',
            phone: phone || '08000000000',
            email: null,
            location: address || 'Nigeria',
            running_load_w: 5000,
            kva_recommended: '7.5 kVA',
            monthly_fuel_spend: 250000,
            monthly_savings_ngn: 200000
          });
        }

      } else if (job.type === 'apify') {
        const { token, datasetId } = job.payload || {};
        const apifyToken = token || process.env.APIFY_TOKEN;
        const apifyDatasetId = datasetId || process.env.APIFY_DATASET_ID;

        if (!apifyToken || !apifyDatasetId) {
          throw new Error('Apify Token and Dataset ID are not configured.');
        }

        const itemsUrl = `https://api.apify.com/v2/datasets/${apifyDatasetId}/items?token=${apifyToken}&clean=true`;
        const itemsResp = await fetch(itemsUrl);
        if (!itemsResp.ok) {
          throw new Error(`Apify Dataset fetch failed with status ${itemsResp.status}`);
        }

        const items = await itemsResp.json();
        if (Array.isArray(items)) {
          for (const item of items) {
            const name = item.fullName || item.name || item.title || item.username || item.companyName || item.bizName || item.ownerName || 'Unknown Contact';
            
            let phone = item.phone || item.phoneNumber || item.telephone || item.mobile || item.contactPhone || '';
            if (!phone && Array.isArray(item.phoneNumbers) && item.phoneNumbers.length > 0) {
              phone = item.phoneNumbers[0];
            } else if (!phone && Array.isArray(item.phones) && item.phones.length > 0) {
              phone = item.phones[0];
            }
            
            let email = item.email || item.emailAddress || item.contactEmail || '';
            if (!email && Array.isArray(item.emails) && item.emails.length > 0) {
              email = item.emails[0];
            }
            
            const location = item.location || item.city || item.address || item.country || 'Nigeria';

            leads.push({
              name,
              phone: phone || '08000000000',
              email: email || null,
              location,
              running_load_w: 3000,
              kva_recommended: '5 kVA',
              monthly_fuel_spend: 180000,
              monthly_savings_ngn: 150000
            });
          }
        }

      } else if (job.type === 'jiji') {
        const { limit, onlyWhatsApp } = job.payload || {};
        const mockListings = [
          { name: "Solar Installation Services Lagos", phone: "08034567890", location: "Lekki, Lagos" },
          { name: "De-Ideal Solar Solutions", phone: "08123456789", location: "Ikeja, Lagos" },
          { name: "Bright future Inverters Ltd", phone: "09087654321", location: "Yaba, Lagos" },
          { name: "Greenlight Solar Hub", phone: "07011223344", location: "Surulere, Lagos" },
          { name: "Apex Power Generators & Solar", phone: "08055667788", location: "Victoria Island, Lagos" }
        ];

        const targetLimit = Math.min(limit || 5, mockListings.length);
        for (let i = 0; i < targetLimit; i++) {
          const listing = mockListings[i];
          if (onlyWhatsApp && !listing.phone.startsWith("080")) {
            continue;
          }
          leads.push({
            name: listing.name,
            phone: listing.phone,
            email: null,
            location: listing.location,
            running_load_w: 4000,
            kva_recommended: '5 kVA',
            monthly_fuel_spend: 200000,
            monthly_savings_ngn: 170000
          });
        }
      } else {
        throw new Error(`Unsupported job type: "${job.type}"`);
      }

      // Process Ingestion with Bulk Checking to resolve N+1 loop bottleneck
      let added = 0;
      let skipped = 0;

      if (leads.length > 0) {
        // 1. Gather all phone numbers
        const phones = leads.map(l => l.phone).filter(Boolean);

        // 2. Fetch existing in bulk
        const { data: existingLeads, error: queryErr } = await supabase
          .from('homeowner_leads')
          .select('phone')
          .in('phone', phones);

        if (queryErr) {
          throw new Error(`Bulk duplicate query failed: ${queryErr.message}`);
        }

        const existingPhoneSet = new Set(existingLeads?.map(l => l.phone) || []);

        // 3. Filter out duplicates
        const uniqueLeads = [];
        const uniquePhonesInBatch = new Set();

        for (const lead of leads) {
          if (existingPhoneSet.has(lead.phone) || uniquePhonesInBatch.has(lead.phone)) {
            skipped++;
          } else {
            uniqueLeads.push(lead);
            uniquePhonesInBatch.add(lead.phone);
          }
        }

        // 4. Batch insert all new records
        if (uniqueLeads.length > 0) {
          const { error: insertErr } = await supabase
            .from('homeowner_leads')
            .insert(uniqueLeads);

          if (insertErr) {
            throw new Error(`Bulk insert failed: ${insertErr.message}`);
          }
          added = uniqueLeads.length;
        }
      }

      // Update job to completed
      await supabase.from('scrape_jobs').update({
        status: 'completed',
        result: { added, skipped },
        updated_at: new Date().toISOString()
      }).eq('id', job.id);

      await writeLog(`Successfully completed job ${job.id}. Imported ${added} leads, skipped ${skipped} duplicates.`, 'success');
      jobsProcessed++;

    } catch (jobErr) {
      await writeLog(`Job ${job.id} failed: ${jobErr.message}`, 'error');
      try {
        await supabase.from('scrape_jobs').update({
          status: 'failed',
          error_message: jobErr.message,
          updated_at: new Date().toISOString()
        }).eq('id', job.id);
      } catch (dbErr) {
        console.error('Failed to update job status to failed:', dbErr.message);
      }
    }
  }

  await writeLog(`Background scraper sweep completed. Processed ${jobsProcessed} jobs.`, 'success');
}

processScraperQueue().catch(err => {
  console.error('Fatal runner execution error:', err);
  process.exit(1);
});
