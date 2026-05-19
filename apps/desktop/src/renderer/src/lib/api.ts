import { DiscoveryStatus, type LoginInput, type RegisterInput, Teacher } from '@offlineclass/shared'

const TeacherOrNull = Teacher.nullable()

export const api = {
  discovery: {
    getStatus: async () => DiscoveryStatus.parse(await window.api.discovery.getStatus())
  },
  auth: {
    register: async (input: RegisterInput) => Teacher.parse(await window.api.auth.register(input)),
    login: async (input: LoginInput) => Teacher.parse(await window.api.auth.login(input)),
    me: async () => TeacherOrNull.parse(await window.api.auth.me()),
    logout: async () => {
      await window.api.auth.logout()
    }
  }
}
