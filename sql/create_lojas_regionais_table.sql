-- sql/create_lojas_regionais_table.sql
-- Criação da tabela responsável por armazenar a relação entre lojas e regionais

-- Extensão necessária para geração de UUIDs
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS public.invtrack_lojas_regionais (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome_loja TEXT NOT NULL,
    responsavel TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    CONSTRAINT invtrack_lojas_regionais_nome_unico UNIQUE (nome_loja)
);

CREATE INDEX IF NOT EXISTS invtrack_lojas_regionais_responsavel_idx
    ON public.invtrack_lojas_regionais (responsavel);

-- Trigger para manter a coluna updated_at atualizada automaticamente
CREATE OR REPLACE FUNCTION public.set_invtrack_lojas_regionais_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc', now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_invtrack_lojas_regionais_updated_at ON public.invtrack_lojas_regionais;
CREATE TRIGGER trg_invtrack_lojas_regionais_updated_at
    BEFORE UPDATE ON public.invtrack_lojas_regionais
    FOR EACH ROW
    EXECUTE FUNCTION public.set_invtrack_lojas_regionais_updated_at();

-- Dados iniciais baseados no arquivo data/loja.ts
INSERT INTO public.invtrack_lojas_regionais (nome_loja, responsavel)
VALUES
    ('ATERRADO', 'Jean Mendes'),
    ('ATAULFO DE PAIVA', 'Jean Mendes'),
    ('CARLOS GOIS', 'Jean Mendes'),
    ('CONDE 648', 'Jean Mendes'),
    ('CONDE 99', 'Jean Mendes'),
    ('CONDE DE BONFIM', 'Jean Mendes'),
    ('GÁVEA', 'Jean Mendes'),
    ('HUMAITA', 'Jean Mendes'),
    ('INGÁ', 'Jean Mendes'),
    ('LARANJEIRAS 49', 'Jean Mendes'),
    ('MARIZ 1083', 'Jean Mendes'),
    ('MARIZ 312 NITEROI', 'Jean Mendes'),
    ('MARIZ E BARROS', 'Jean Mendes'),
    ('MOREIRA CESAR', 'Jean Mendes'),
    ('PASSAGEM', 'Jean Mendes'),
    ('JUIZ DE FORA', 'Jean Mendes'),
    ('SÃO FRANCISCO XAVIER', 'Jean Mendes'),
    ('VOLUNTARIO 157', 'Jean Mendes'),
    ('BUZIOS', 'RONDINELLI LAIBER'),
    ('CABO FRIO', 'RONDINELLI LAIBER'),
    ('CAMPOS', 'RONDINELLI LAIBER'),
    ('ICARAÍ', 'RONDINELLI LAIBER'),
    ('ITAIPU', 'RONDINELLI LAIBER'),
    ('MACAÉ', 'RONDINELLI LAIBER'),
    ('MARQUES DE PARANÁ', 'RONDINELLI LAIBER'),
    ('REGIÃO OCEANICA', 'RONDINELLI LAIBER'),
    ('RIO DAS OSTRAS', 'RONDINELLI LAIBER'),
    ('SANTA ROSA', 'RONDINELLI LAIBER'),
    ('TAMANDARÉ', 'RONDINELLI LAIBER'),
    ('BOTAFOGO', 'RONDINELLI LAIBER'),
    ('SIQUEIRA CAMPOS', 'RONDINELLI LAIBER'),
    ('CATETE', 'RONDINELLI LAIBER'),
    ('FLAMENGO', 'RONDINELLI LAIBER'),
    ('JARDIM BOTANICO', 'RONDINELLI LAIBER'),
    ('LARANJEIRAS', 'RONDINELLI LAIBER'),
    ('LEBLON', 'RONDINELLI LAIBER'),
    ('MARQUES DE ABRANTES', 'RONDINELLI LAIBER'),
    ('VISCONDE DE PIRAJÁ', 'RONDINELLI LAIBER'),
    ('VOLUNTÁRIOS DA PÁTRIA', 'RONDINELLI LAIBER'),
    ('PRADO JUNIOR', 'RONDINELLI LAIBER'),
    ('DIAS DA ROCHA', 'RONDINELLI LAIBER'),
    ('ADALBERTO FERREIRA', 'RONDINELLI LAIBER'),
    ('ARAPANÉS', 'Marcus Junior'),
    ('BROOKLIN', 'Marcus Junior'),
    ('CORUJAS', 'Marcus Junior'),
    ('INTERLAGOS', 'Marcus Junior'),
    ('IPIRANGA', 'Marcus Junior'),
    ('JOÃO CACHOEIRA', 'Marcus Junior'),
    ('NHAMBIQUARAS', 'Marcus Junior'),
    ('PARAÍSO', 'Marcus Junior'),
    ('ROSA E SILVA', 'Marcus Junior'),
    ('SANTOS', 'Marcus Junior'),
    ('SÃO BERNARDO DO CAMPO', 'Marcus Junior'),
    ('VERBO DIVINO', 'Marcus Junior'),
    ('VILA MARIANA', 'Marcus Junior'),
    ('VILA MASCOTE', 'Marcus Junior'),
    ('VILA OLIMPIA', 'Marcus Junior'),
    ('ABELARDO BUENO', 'ANA PAULA'),
    ('VILA ISABEL', 'ANA PAULA'),
    ('AV. DAS AMÉRICAS', 'ANA PAULA'),
    ('BARRA', 'ANA PAULA'),
    ('TIJUCA', 'ANA PAULA'),
    ('BARRA BLUE', 'ANA PAULA'),
    ('BARRA GARDEN', 'ANA PAULA'),
    ('VILA VELHA', 'ANA PAULA'),
    ('RECREIO', 'ANA PAULA'),
    ('RECREIO A5', 'ANA PAULA'),
    ('SÃO CONRADO SCO', 'ANA PAULA'),
    ('GRAJAÚ', 'ANA PAULA'),
    ('URUGUAI', 'ANA PAULA'),
    ('MARACANÃ', 'ANA PAULA'),
    ('ILHA DO GOVERNADOR', 'ANA PAULA'),
    ('FREGUESIA', 'ANA PAULA'),
    ('PRAIA DO SUÁ', 'ANA PAULA')
ON CONFLICT (nome_loja) DO UPDATE
SET
    responsavel = EXCLUDED.responsavel,
    updated_at = timezone('utc', now());
