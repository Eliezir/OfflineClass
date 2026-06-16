PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;

CREATE TABLE "new_Provedor" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome" TEXT NOT NULL,
    "apiKeyEncrypted" TEXT NOT NULL,
    "apiKeyIv" TEXT NOT NULL,
    "apiKeyAuthTag" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tipoProvedorId" INTEGER NOT NULL,
    CONSTRAINT "Provedor_tipoProvedorId_fkey" FOREIGN KEY ("tipoProvedorId") REFERENCES "TipoProvedor" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Chaves legadas em texto puro não podem ser convertidas com segurança sem a
-- chave mestra. Os registros são preservados e devem receber uma nova API key.
INSERT INTO "new_Provedor" (
    "id",
    "nome",
    "apiKeyEncrypted",
    "apiKeyIv",
    "apiKeyAuthTag",
    "createdAt",
    "tipoProvedorId"
)
SELECT
    "id",
    "nome",
    '',
    '',
    '',
    "createdAt",
    "tipoProvedorId"
FROM "Provedor";

DROP TABLE "Provedor";
ALTER TABLE "new_Provedor" RENAME TO "Provedor";

PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
