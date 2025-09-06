-- sql/create_contagens_externas_table.sql
CREATE TABLE IF NOT EXISTS invtrack_contagens_externas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  codigo_inventario VARCHAR(50) NOT NULL,
  setor_cd VARCHAR(100) NOT NULL,
  contador VARCHAR(100) NOT NULL,
  obs TEXT,
  numero_contagem INTEGER NOT NULL CHECK (numero_contagem BETWEEN 1 AND 5),
  status VARCHAR(20) DEFAULT 'pendente' NOT NULL CHECK (status IN ('pendente', 'lançada')),
  data_contagem TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'America/Sao_Paulo'),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Foreign key para inventário
  FOREIGN KEY (codigo_inventario) REFERENCES invtrack_inventarios(codigo),
  
  -- Constraint única para evitar duplicatas
  UNIQUE(codigo_inventario, setor_cd, numero_contagem)
);

CREATE TABLE IF NOT EXISTS invtrack_itens_contagem_externa (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  contagem_externa_id UUID NOT NULL,
  ativo VARCHAR(100) NOT NULL,
  quantidade INTEGER NOT NULL CHECK (quantidade >= 0),
  
  -- Foreign key para contagem externa
  FOREIGN KEY (contagem_externa_id) REFERENCES invtrack_contagens_externas(id) ON DELETE CASCADE,
  
  -- Constraint única para evitar duplicatas do mesmo ativo na mesma contagem
  UNIQUE(contagem_externa_id, ativo)
);

-- Indexes para performance
CREATE INDEX IF NOT EXISTS idx_contagens_externas_inventario ON invtrack_contagens_externas(codigo_inventario);
CREATE INDEX IF NOT EXISTS idx_contagens_externas_setor ON invtrack_contagens_externas(setor_cd);
CREATE INDEX IF NOT EXISTS idx_contagens_externas_status ON invtrack_contagens_externas(status);
CREATE INDEX IF NOT EXISTS idx_itens_contagem_externa ON invtrack_itens_contagem_externa(contagem_externa_id);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_contagens_externas_updated_at 
    BEFORE UPDATE ON invtrack_contagens_externas 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();