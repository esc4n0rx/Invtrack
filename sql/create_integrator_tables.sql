-- sql/create_integrator_tables.sql

-- Tabela de configuração do integrador
CREATE TABLE IF NOT EXISTS invtrack_integrator_config (
  id INTEGER PRIMARY KEY DEFAULT 1,
  is_active BOOLEAN DEFAULT false,
  interval_seconds INTEGER DEFAULT 30 CHECK (interval_seconds IN (5, 10, 30, 60)),
  last_sync TIMESTAMPTZ,
  total_processed INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Garantir que só existe uma configuração
  CONSTRAINT single_config CHECK (id = 1)
);

-- Tabela de logs do integrador
CREATE TABLE IF NOT EXISTS invtrack_integrator_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type VARCHAR(20) NOT NULL CHECK (type IN ('success', 'error', 'warning', 'info')),
  message TEXT NOT NULL,
  details JSONB,
  processed_count INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes para performance
CREATE INDEX IF NOT EXISTS idx_integrator_logs_type ON invtrack_integrator_logs(type);
CREATE INDEX IF NOT EXISTS idx_integrator_logs_created_at ON invtrack_integrator_logs(created_at);

-- Trigger para atualizar updated_at na config
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_integrator_config_updated_at 
    BEFORE UPDATE ON invtrack_integrator_config 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Inserir configuração inicial
INSERT INTO invtrack_integrator_config (id, is_active, interval_seconds, total_processed, error_count)
VALUES (1, false, 30, 0, 0)
ON CONFLICT (id) DO NOTHING;

-- Função para limpar logs antigos (manter apenas últimos 1000)
CREATE OR REPLACE FUNCTION clean_old_integrator_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM invtrack_integrator_logs 
  WHERE id NOT IN (
    SELECT id FROM invtrack_integrator_logs 
    ORDER BY created_at DESC 
    LIMIT 1000
  );
END;
$$ LANGUAGE plpgsql;