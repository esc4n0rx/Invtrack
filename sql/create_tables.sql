-- sql/create_tables.sql
CREATE TABLE IF NOT EXISTS invtrack_inventarios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  codigo VARCHAR(50) UNIQUE NOT NULL,
  status VARCHAR(20) DEFAULT 'ativo' CHECK (status IN ('ativo', 'finalizado', 'cancelado')),
  responsavel VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index para buscar inventário ativo rapidamente
CREATE INDEX IF NOT EXISTS idx_inventarios_status ON invtrack_inventarios(status);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_inventarios_updated_at 
    BEFORE UPDATE ON invtrack_inventarios 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();