-- Postgres init script — runs on first container start (before connector migration)
-- wal_level=logical is set via the postgres command flag in docker-compose.
--
-- The publication (offlineclass_pub) and tables are created by the connector's
-- migration at startup. This script only runs once and has no dependencies on
-- those tables existing yet.
--
-- FOR ALL TABLES means new syncable tables are automatically included in the
-- publication. The cloud_accounts table (password hashes) is NOT exposed to
-- clients because no Sync Stream is defined for it in sync-config.yaml.
SELECT pg_catalog.set_config('search_path', 'public', false);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication WHERE pubname = 'offlineclass_pub'
  ) THEN
    -- Use FOR ALL TABLES so the connector can add syncable tables without
    -- having to alter the publication. Filter happens at the Sync Stream level.
    EXECUTE 'CREATE PUBLICATION offlineclass_pub FOR ALL TABLES';
  END IF;
END;
$$;
