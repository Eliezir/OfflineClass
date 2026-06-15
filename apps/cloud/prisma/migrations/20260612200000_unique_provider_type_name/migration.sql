-- Tipos são identificados pelo nome para que o seed possa ser idempotente.
UPDATE "Provedor"
SET "tipoProvedorId" = (
    SELECT MIN("tipo_canonico"."id")
    FROM "TipoProvedor" AS "tipo_canonico"
    WHERE "tipo_canonico"."nome" = (
        SELECT "tipo_atual"."nome"
        FROM "TipoProvedor" AS "tipo_atual"
        WHERE "tipo_atual"."id" = "Provedor"."tipoProvedorId"
    )
);

DELETE FROM "TipoProvedor"
WHERE "id" NOT IN (
    SELECT MIN("id")
    FROM "TipoProvedor"
    GROUP BY "nome"
);

CREATE UNIQUE INDEX "TipoProvedor_nome_key" ON "TipoProvedor"("nome");
