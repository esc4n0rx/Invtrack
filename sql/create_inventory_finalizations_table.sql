-- sql/create_inventory_finalizations_table.sql
CREATE TABLE IF NOT EXISTS invtrack_finalizacoes_inventario (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  codigo_inventario VARCHAR(50) NOT NULL,
  data_finalizacao TIMESTAMPTZ DEFAULT NOW(),
  usuario_finalizacao VARCHAR(100) NOT NULL,
  arquivo_excel_url TEXT,
  
  -- Totais HB (618 + 623)
  total_hb_618 INTEGER DEFAULT 0,
  total_hb_623 INTEGER DEFAULT 0,
  total_hb_geral INTEGER DEFAULT 0,
  
  -- Totais HNT (G + P)
  total_hnt_g INTEGER DEFAULT 0,
  total_hnt_p INTEGER DEFAULT 0,
  total_hnt_geral INTEGER DEFAULT 0,
  
  -- Totais por região
  total_lojas_hb INTEGER DEFAULT 0,
  total_lojas_hnt INTEGER DEFAULT 0,
  total_cd_es_hb INTEGER DEFAULT 0,
  total_cd_es_hnt INTEGER DEFAULT 0,
  total_cd_sp_hb INTEGER DEFAULT 0,
  total_cd_sp_hnt INTEGER DEFAULT 0,
  total_cd_rj_hb INTEGER DEFAULT 0,
  total_cd_rj_hnt INTEGER DEFAULT 0,
  
  -- Dados completos em JSON
  dados_completos JSONB NOT NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Foreign key para inventário
  FOREIGN KEY (codigo_inventario) REFERENCES invtrack_inventarios(codigo)
);

-- Index para buscar finalizações por inventário
CREATE INDEX IF NOT EXISTS idx_finalizacoes_inventario ON invtrack_finalizacoes_inventario(codigo_inventario);
CREATE INDEX IF NOT EXISTS idx_finalizacoes_data ON invtrack_finalizacoes_inventario(data_finalizacao);