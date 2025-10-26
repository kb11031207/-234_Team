import api from '../lib/api'

export interface ConfigResponse {
  api_key: string
}

export const getGoogleMapsApiKey = async (): Promise<string> => {
  const response = await api.get<ConfigResponse>('/config/maps-key')
  return response.data.api_key
}