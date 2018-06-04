import axios, { AxiosError, AxiosRequestConfig } from 'axios'

export type JgqlClient = <R extends object = object, V extends object = object>(
  query: string,
  variables?: V,
) => Promise<R>

export interface CreateClientParams {
  url: string
  augmentRequest?: (
    request: AxiosRequestConfig,
  ) => AxiosRequestConfig | Promise<AxiosRequestConfig>
  processResponse?: (response: any) => any | Promise<any>
  processError?: (error: Error) => Error | Promise<Error>
}
const augmentRequestDefault = async (request: AxiosRequestConfig) => request
const processResponseDefault = async (response: any) => response
const processErrorDefault = console.error
export const createClient = ({
  url,
  augmentRequest = augmentRequestDefault,
  processResponse = processResponseDefault,
  processError = processErrorDefault,
}: CreateClientParams): JgqlClient => async <R, V>(
  query: string,
  variables?: V,
) => {
  const request = { method: 'POST', url, data: { query, variables } }
  const augmentedRequest = await augmentRequest(request)
  try {
    const response = await axios(augmentedRequest)
    const data = response.data.data
    const processedResponse = (await processResponse(data)) as R
    return processedResponse
  } catch (error) {
    const processedError = await processError(error)
    throw processedError
  }
}
