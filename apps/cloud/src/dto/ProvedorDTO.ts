import type { EncryptedApiKey } from '../config/crypto'
import type { ProvedorRequest } from '../requests/ProvedorRequest'

export type CriaProvedorInput = Omit<ProvedorRequest, 'apiKey'> & EncryptedApiKey

export type ProvedorPersistencia = {
  nome: string
  apiKeyEncrypted: string
  apiKeyIv: string
  apiKeyAuthTag: string
  tipoProvedorId: number
}

export class ProvedorDTO {
  constructor(
    private readonly nome: string,
    private readonly apiKeyEncrypted: string,
    private readonly apiKeyIv: string,
    private readonly apiKeyAuthTag: string,
    private readonly tipoProvedorId: number
  ) {}

  static porRequest(request: CriaProvedorInput): ProvedorDTO {
    return new ProvedorDTO(
      request.nome,
      request.apiKeyEncrypted,
      request.apiKeyIv,
      request.apiKeyAuthTag,
      request.tipoProvedorId
    )
  }

  toJson(): ProvedorPersistencia {
    return {
      nome: this.nome,
      apiKeyEncrypted: this.apiKeyEncrypted,
      apiKeyIv: this.apiKeyIv,
      apiKeyAuthTag: this.apiKeyAuthTag,
      tipoProvedorId: this.tipoProvedorId
    }
  }
}
