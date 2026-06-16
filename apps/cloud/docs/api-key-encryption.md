# Criptografia da `apiKey` do Provedor

## O que mudou

A `apiKey` deixou de ser tratada como hash e passou a ser **criptografada de forma reversível**.

Isso foi necessário porque a chave precisa ser usada depois para chamar uma API externa. Com hash, o valor original não pode ser recuperado.

## Fluxo atual

1. O controller Hono recebe o `body` bruto.
2. O `ProvedorRequestSchema` valida e normaliza os dados.
3. O `ProvedorService` chama `encryptApiKey(...)`.
4. O service monta um `ProvedorDTO` com:
   - `apiKeyEncrypted`
   - `apiKeyIv`
   - `apiKeyAuthTag`
5. O `ProvedorRepository` chama `toJson()` e envia o objeto plano para o Prisma.
6. O Prisma grava os campos criptografados no banco.

## Arquivos alterados

- [`src/config/crypto.ts`](../src/config/crypto.ts)
- [`src/services/ProvedorService.ts`](../src/services/ProvedorService.ts)
- [`src/dto/ProvedorDTO.ts`](../src/dto/ProvedorDTO.ts)
- [`src/repositories/ProvedorRepository.ts`](../src/repositories/ProvedorRepository.ts)
- [`prisma/migrations/20260612120000_add_encrypted_api_key_columns/migration.sql`](../prisma/migrations/20260612120000_add_encrypted_api_key_columns/migration.sql)

## Como a criptografia funciona

Foi usado `aes-256-gcm` com:

- uma chave base64 de 32 bytes em `API_KEY_ENCRYPTION_KEY_BASE64`
- `iv` aleatório de 12 bytes
- `authTag` para autenticação do ciphertext

O helper exporta:

- `encryptApiKey(plain: string)`
- `decryptApiKey(payload)`

## Estrutura salva no banco

O model `Provedor` passa a armazenar:

- `apiKeyEncrypted`
- `apiKeyIv`
- `apiKeyAuthTag`

## Observação importante

Se a API externa precisar da chave original, ela deve ser recuperada no momento do uso com `decryptApiKey(...)`. A chave mestra não deve ser salva no banco.

O fluxo de Strategy descrito em [`provider-strategy.md`](./provider-strategy.md) faz
essa decriptação imediatamente antes da chamada à API externa.

## Testes adicionados

- teste do repository para o novo contrato de persistência
- teste do service validando que a `apiKey` chega criptografada e pode ser decriptada no fluxo
