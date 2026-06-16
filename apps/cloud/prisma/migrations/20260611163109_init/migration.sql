-- CreateTable
CREATE TABLE "TipoProvedor" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Provedor" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome" TEXT NOT NULL,
    "apiKey" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tipoProvedorId" INTEGER NOT NULL,
    CONSTRAINT "Provedor_tipoProvedorId_fkey" FOREIGN KEY ("tipoProvedorId") REFERENCES "TipoProvedor" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
