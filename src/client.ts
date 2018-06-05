import axios, { AxiosError, AxiosRequestConfig } from 'axios'

export type SendRequestFunction = <R extends object, V extends object>(
  query: string,
  variables?: V,
) => Promise<R>

export interface Params {
  url: string
  augmentRequest?: (
    request: AxiosRequestConfig,
  ) => AxiosRequestConfig | Promise<AxiosRequestConfig>
  processResponse?: (response: any) => any | Promise<any>
  processError?: (error: Error) => Error | Promise<Error>
}

const augmentRequestDefault = async (request: AxiosRequestConfig) => request
const processResponseDefault = async (response: any) => response
const processErrorDefault = async (error: Error) => error

export const createSendRequestFunction = ({
  url,
  augmentRequest = augmentRequestDefault,
  processResponse = processResponseDefault,
  processError = processErrorDefault,
}: Params): SendRequestFunction => async <
  R extends object = object,
  V extends object = object
>(
  query: string,
  variables?: V,
) => {
  const request = { method: 'POST', url, data: { query, variables } }
  const augmentedRequest = await augmentRequest(request)
  try {
    const { data: response } = await axios(augmentedRequest)
    if (response.errors) {
      throw new Error(response.errors.map((e: any) => e.message).join('\n'))
    } else if (response.data) {
      const processedResponse: R = await processResponse(response.data)
      return processedResponse
    }
    throw new Error('Response has neither data nor errors')
  } catch (error) {
    const processedError = await processError(error)
    throw processedError
  }
}
