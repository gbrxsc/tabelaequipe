-- Criação da tabela atualizacoes no Supabase
-- Execute este script no SQL Editor do Supabase

CREATE TABLE IF NOT EXISTS atualizacoes (
  id BIGSERIAL PRIMARY KEY,
  titulo TEXT NOT NULL,
  descricao TEXT NOT NULL,
  autor TEXT NOT NULL,
  data TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para melhorar performance na ordenação por data
CREATE INDEX IF NOT EXISTS idx_atualizacoes_created_at ON atualizacoes(created_at DESC);

-- Política RLS (Row Level Security) - permite leitura e escrita para todos
ALTER TABLE atualizacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir leitura para todos" ON atualizacoes
  FOR SELECT USING (true);

CREATE POLICY "Permitir inserção para todos" ON atualizacoes
  FOR INSERT WITH CHECK (true);

-- Inserir alguns dados de exemplo (opcional)
INSERT INTO atualizacoes (titulo, descricao, autor, data) VALUES
('Sistema de Dashboard Implementado', 'Novo sistema de dashboard para acompanhamento da equipe foi implementado com sucesso. Agora é possível visualizar todas as atualizações em tempo real.', 'Gabriel Silva', NOW()),
('Manutenção Programada', 'Será realizada manutenção no servidor no próximo sábado das 02:00 às 04:00. O sistema ficará temporariamente indisponível.', 'João Santos', NOW() - INTERVAL '1 day'),
('Nova Funcionalidade de Relatórios', 'Adicionada nova funcionalidade para geração de relatórios automáticos. Os relatórios serão enviados semanalmente por email.', 'Maria Costa', NOW() - INTERVAL '2 days');
