-- sql/create_integrator_events_table.sql
CREATE TABLE IF NOT EXISTS invtrack_integrator_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('new_integration', 'config_change', 'error')),
  processed_count INTEGER DEFAULT 0,
  details JSONB,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes para performance
CREATE INDEX IF NOT EXISTS idx_integrator_events_type ON invtrack_integrator_events(event_type);
CREATE INDEX IF NOT EXISTS idx_integrator_events_timestamp ON invtrack_integrator_events(timestamp);

-- Função para limpar eventos antigos (manter apenas últimos 1000)
CREATE OR REPLACE FUNCTION cleanup_integrator_events() RETURNS void AS $$
BEGIN
  DELETE FROM invtrack_integrator_events 
  WHERE id NOT IN (
    SELECT id FROM invtrack_integrator_events 
    ORDER BY timestamp DESC 
    LIMIT 1000
  );
END;
$$ LANGUAGE plpgsql;