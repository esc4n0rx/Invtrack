-- sql/create_contagens_table.sql
CREATE TABLE IF NOT EXISTS invtrack_contagens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('loja', 'cd', 'fornecedor', 'transito')),
  ativo VARCHAR(100) NOT NULL,
  quantidade INTEGER NOT NULL CHECK (quantidade >= 0),
  data_contagem TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'America/Sao_Paulo'),
  codigo_inventario VARCHAR(50) NOT NULL,
  responsavel VARCHAR(100) NOT NULL,
  obs TEXT,
  
  -- Campos específicos por tipo
  loja VARCHAR(100),
  setor_cd VARCHAR(100),
  cd_origem VARCHAR(100),
  cd_destino VARCHAR(100),
  fornecedor VARCHAR(100),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Foreign key para inventário
  FOREIGN KEY (codigo_inventario) REFERENCES invtrack_inventarios(codigo),
  
  -- Constraint única para evitar duplicatas
  UNIQUE(tipo, ativo, loja, setor_cd, cd_origem, cd_destino, fornecedor, codigo_inventario)
);

-- Indexes para performance
CREATE INDEX IF NOT EXISTS idx_contagens_inventario ON invtrack_contagens(codigo_inventario);
CREATE INDEX IF NOT EXISTS idx_contagens_tipo ON invtrack_contagens(tipo);
CREATE INDEX IF NOT EXISTS idx_contagens_data ON invtrack_contagens(data_contagem);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_contagens_updated_at 
    BEFORE UPDATE ON invtrack_contagens 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Tabela de auditoria para edições/exclusões
CREATE TABLE IF NOT EXISTS invtrack_contagens_auditoria (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  contagem_id UUID NOT NULL,
  acao VARCHAR(20) NOT NULL CHECK (acao IN ('edicao', 'exclusao')),
  usuario VARCHAR(100) NOT NULL,
  motivo TEXT NOT NULL,
  dados_anteriores JSONB,
  dados_novos JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_auditoria_contagem ON invtrack_contagens_auditoria(contagem_id);