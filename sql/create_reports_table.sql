-- sql/create_reports_table.sql
CREATE TABLE IF NOT EXISTS invtrack_relatorios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome VARCHAR(200) NOT NULL,
  tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('inventario_completo', 'contagens_por_loja', 'contagens_por_cd', 'ativos_em_transito', 'comparativo_contagens', 'divergencias', 'resumo_executivo')),
  status VARCHAR(20) DEFAULT 'processando' CHECK (status IN ('processando', 'concluido', 'erro')),
  codigo_inventario VARCHAR(50) NOT NULL,
  filtros JSONB,
  dados JSONB,
  arquivo_url TEXT,
  formato VARCHAR(10) DEFAULT 'json' CHECK (formato IN ('json', 'csv', 'excel', 'pdf')),
  total_registros INTEGER DEFAULT 0,
  usuario_criacao VARCHAR(100) NOT NULL,
  data_inicio TIMESTAMPTZ DEFAULT NOW(),
  data_conclusao TIMESTAMPTZ,
  tempo_processamento_ms INTEGER,
  tamanho_arquivo_kb INTEGER,
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Foreign key para inventário
  FOREIGN KEY (codigo_inventario) REFERENCES invtrack_inventarios(codigo)
);

-- Indexes para performance
CREATE INDEX IF NOT EXISTS idx_relatorios_inventario ON invtrack_relatorios(codigo_inventario);
CREATE INDEX IF NOT EXISTS idx_relatorios_tipo ON invtrack_relatorios(tipo);
CREATE INDEX IF NOT EXISTS idx_relatorios_status ON invtrack_relatorios(status);
CREATE INDEX IF NOT EXISTS idx_relatorios_usuario ON invtrack_relatorios(usuario_criacao);
CREATE INDEX IF NOT EXISTS idx_relatorios_data ON invtrack_relatorios(created_at);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_relatorios_updated_at 
    BEFORE UPDATE ON invtrack_relatorios 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Tabela para templates de relatórios personalizados
CREATE TABLE IF NOT EXISTS invtrack_relatorio_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome VARCHAR(200) NOT NULL,
  descricao TEXT,
  tipo_base VARCHAR(50) NOT NULL,
  configuracao JSONB NOT NULL,
  ativo BOOLEAN DEFAULT true,
  publico BOOLEAN DEFAULT false,
  usuario_criacao VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_templates_tipo ON invtrack_relatorio_templates(tipo_base);
CREATE INDEX IF NOT EXISTS idx_templates_usuario ON invtrack_relatorio_templates(usuario_criacao);
CREATE INDEX IF NOT EXISTS idx_templates_ativo ON invtrack_relatorio_templates(ativo);

-- Trigger para templates
CREATE TRIGGER update_templates_updated_at 
    BEFORE UPDATE ON invtrack_relatorio_templates 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();