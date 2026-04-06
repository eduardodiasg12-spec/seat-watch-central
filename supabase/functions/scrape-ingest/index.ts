import { Hono } from "https://deno.land/x/hono@v4.3.11/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const app = new Hono();

app.options('/*', (c) => c.json({}, 200, corsHeaders));

app.post('/', async (c) => {
  try {
    const body = await c.req.json();
    const {
      monitoring_target_id,
      run_timestamp,
      occupied_seats_estimated,
      available_seats_estimated,
      total_seats_estimated,
      confidence_score,
      confidence_reason,
      parser_key,
      parser_version,
      status = 'success',
      extraction_type = 'seat_map',
      screenshot_reference,
      raw_payload_json,
      raw_html_reference,
      error_message,
      log_messages,
    } = body;

    if (!monitoring_target_id) {
      return c.json({ error: 'monitoring_target_id is required' }, 400, corsHeaders);
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Create scrape_run
    const { data: run, error: runError } = await supabase.from('scrape_runs').insert({
      monitoring_target_id,
      run_timestamp: run_timestamp || new Date().toISOString(),
      parser_key,
      parser_version,
      status,
      raw_html_reference,
      raw_payload_json,
      screenshot_reference,
    }).select('id').single();

    if (runError) {
      return c.json({ error: 'Failed to create scrape run', details: runError.message }, 500, corsHeaders);
    }

    // Create occupancy_result if not failed
    let occupancyResult = null;
    if (status !== 'failed' && occupied_seats_estimated !== undefined) {
      const totalSeats = total_seats_estimated || 0;
      const occupancyRate = totalSeats > 0 ? Math.round((occupied_seats_estimated / totalSeats) * 10000) / 100 : 0;

      const { data: occ, error: occError } = await supabase.from('occupancy_results').insert({
        scrape_run_id: run.id,
        occupied_seats_estimated: occupied_seats_estimated || 0,
        available_seats_estimated: available_seats_estimated || 0,
        total_seats_estimated: totalSeats,
        occupancy_rate: occupancyRate,
        confidence_score: confidence_score || 0,
        confidence_reason: confidence_reason || '',
        extraction_type,
        anomaly_flag: false,
      }).select('id').single();

      if (occError) {
        console.error('Failed to create occupancy result:', occError);
      } else {
        occupancyResult = occ;
      }
    }

    // Create parser logs if provided
    if (log_messages && Array.isArray(log_messages)) {
      for (const log of log_messages) {
        await supabase.from('parser_logs').insert({
          scrape_run_id: run.id,
          log_level: log.level || 'info',
          message: log.message || '',
          error_message: log.error_message || null,
        });
      }
    }

    // Log error if status is failed
    if (status === 'failed' && error_message) {
      await supabase.from('parser_logs').insert({
        scrape_run_id: run.id,
        log_level: 'error',
        message: 'Scrape run failed',
        error_message,
      });
    }

    // Update monitoring target last_run_at
    await supabase.from('monitoring_targets').update({
      last_run_at: run_timestamp || new Date().toISOString(),
    }).eq('id', monitoring_target_id);

    return c.json({
      success: true,
      scrape_run_id: run.id,
      occupancy_result_id: occupancyResult?.id || null,
    }, 200, corsHeaders);
  } catch (err) {
    console.error('Ingest error:', err);
    return c.json({ error: 'Internal server error' }, 500, corsHeaders);
  }
});

// GET endpoint to check status
app.get('/', (c) => {
  return c.json({ status: 'ok', service: 'scrape-ingest', version: '1.0.0' }, 200, corsHeaders);
});

Deno.serve(app.fetch);
