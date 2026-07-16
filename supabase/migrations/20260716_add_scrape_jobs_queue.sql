-- Migration: Add Background Scraper Queue & Concurrency Management
-- Creates scrape_jobs table, RLS policies, and PL/pgSQL helper functions.

-- 1. Create scrape_jobs table
CREATE TABLE IF NOT EXISTS public.scrape_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL, -- e.g., 'google_maps', 'apify'
  status TEXT NOT NULL DEFAULT 'queued', -- 'queued', 'running', 'completed', 'failed'
  payload JSONB DEFAULT '{}'::jsonb,
  result JSONB DEFAULT '{}'::jsonb,
  error_message TEXT,
  retries INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Enable RLS
ALTER TABLE public.scrape_jobs ENABLE ROW LEVEL SECURITY;

-- 2. Configure Row Level Security Policies
-- Admins have full access
CREATE POLICY "Admins manage scrape_jobs" ON public.scrape_jobs
  FOR ALL USING (
    auth.uid() IN (SELECT user_id FROM public.platform_admins)
  );

-- 3. Register dequeue_next_scrape_job PL/pgSQL function using SELECT FOR UPDATE SKIP LOCKED
CREATE OR REPLACE FUNCTION public.dequeue_next_scrape_job()
RETURNS TABLE (
  id UUID,
  type TEXT,
  status TEXT,
  payload JSONB,
  result JSONB,
  error_message TEXT,
  retries INTEGER,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
  v_job_id UUID;
BEGIN
  -- Atomically find and lock the next queued job
  SELECT j.id INTO v_job_id
  FROM public.scrape_jobs j
  WHERE j.status = 'queued'
  ORDER BY j.created_at ASC
  LIMIT 1
  FOR UPDATE SKIP LOCKED;

  -- If a job was found, update its status to 'running'
  IF v_job_id IS NOT NULL THEN
    UPDATE public.scrape_jobs
    SET 
      status = 'running',
      updated_at = now()
    WHERE public.scrape_jobs.id = v_job_id;

    -- Return the selected row
    RETURN QUERY
    SELECT 
      j.id, j.type, j.status, j.payload, j.result, 
      j.error_message, j.retries, j.created_at, j.updated_at
    FROM public.scrape_jobs j
    WHERE j.id = v_job_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Register recover_stuck_jobs PL/pgSQL function
CREATE OR REPLACE FUNCTION public.recover_stuck_jobs(
  p_timeout_minutes INTEGER,
  p_max_retries INTEGER
)
RETURNS TABLE (
  recovered_count INTEGER
) AS $$
DECLARE
  v_count INTEGER := 0;
BEGIN
  -- Mark jobs as failed if they exceed max_retries and have been running too long
  UPDATE public.scrape_jobs
  SET 
    status = 'failed',
    error_message = 'Job timed out and exceeded maximum retries.',
    updated_at = now()
  WHERE status = 'running'
    AND updated_at < (now() - (p_timeout_minutes || ' minutes')::interval)
    AND retries >= p_max_retries;

  -- Reset jobs back to queued if they have been running too long but have retries left
  WITH updated AS (
    UPDATE public.scrape_jobs
    SET 
      status = 'queued',
      retries = retries + 1,
      updated_at = now()
    WHERE status = 'running'
      AND updated_at < (now() - (p_timeout_minutes || ' minutes')::interval)
      AND retries < p_max_retries
    RETURNING id
  )
  SELECT count(*) INTO v_count FROM updated;

  RETURN QUERY SELECT v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
