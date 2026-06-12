-- ============================================================
-- Corporación Henko — init-henko.sql
-- Ejecutar en: Supabase Dashboard → SQL Editor → Run
-- ============================================================

-- 1. Tabla de leads
CREATE TABLE IF NOT EXISTS leads_henko (
  id              BIGSERIAL PRIMARY KEY,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  session_id      TEXT,
  nombre          TEXT,
  telefono        TEXT,
  email           TEXT,
  proyecto_interes TEXT,
  mensaje         TEXT,
  canal           TEXT DEFAULT 'web'
);

-- 2. Tabla de documentos (vector store KB)
-- IMPORTANTE: gemini-embedding-001 produce 3072 dims por default
-- NO agregar índice ivfflat/hnsw — pgvector no soporta >2000 dims
CREATE TABLE IF NOT EXISTS documents_henko (
  id         BIGSERIAL PRIMARY KEY,
  content    TEXT,
  metadata   JSONB,
  embedding  VECTOR(3072)
);

-- 3. RPC para RAG — búsqueda por similitud coseno
CREATE OR REPLACE FUNCTION match_documents_henko(
  query_embedding VECTOR(3072),
  match_count     INT DEFAULT 10,
  filter          JSONB DEFAULT '{}'
)
RETURNS TABLE (
  id         BIGINT,
  content    TEXT,
  metadata   JSONB,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    documents_henko.id,
    documents_henko.content,
    documents_henko.metadata,
    1 - (documents_henko.embedding <=> query_embedding) AS similarity
  FROM documents_henko
  WHERE
    CASE
      WHEN filter = '{}' THEN TRUE
      ELSE (documents_henko.metadata @> filter)
    END
  ORDER BY documents_henko.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- ============================================================
-- Verificación post-ejecución (correr por separado):
-- SELECT COUNT(*) FROM leads_henko;
-- SELECT COUNT(*) FROM documents_henko;
-- SELECT proname FROM pg_proc WHERE proname = 'match_documents_henko';
-- ============================================================
