import * as React from 'react'
import axios, { AxiosError, AxiosRequestConfig } from 'axios'
const hoistNonReactStatic = require('hoist-non-react-statics')

export type JgqlClient = (query: string, variables?: object) => Promise<any>

export interface CreateClientParams {
  url: string
  augmentRequest: (request: AxiosRequestConfig) => Promise<AxiosRequestConfig>
  processResponse: (response: any) => Promise<any>
  processError: (error: Error) => Error
}
const augmentRequestDefault = async (request: AxiosRequestConfig) => request
const processResponseDefault = async (response: any) => response
const processErrorDefault = console.error
export const createClient = ({
  url,
  augmentRequest = augmentRequestDefault,
  processResponse = processResponseDefault,
  processError = processErrorDefault,
}: CreateClientParams): JgqlClient => async (
  query: string,
  variables: object = {},
) => {
  const request = { method: 'POST', url, data: { query, variables } }
  const augmentedRequest = await augmentRequest(request)
  try {
    const response = await axios(augmentedRequest)
    const data = response.data.data
    const processedResponse = await processResponse(data)
    return processedResponse
  } catch (axiosError) {
    const processedError = await processError(axiosError)
    throw processedError
  }
}

const { Provider, Consumer } = React.createContext<JgqlClient>(() => {
  throw new Error('Invalid jgql client')
})

export const JgqlProvider = Provider

export const withJgql = <P extends object>(
  WrappedComponent: React.ComponentType<P & { jgql: JgqlClient }>,
) => {
  const JgqlEnhancedComponent = (props: P) => (
    <Consumer>
      {client => <WrappedComponent {...props} jgql={client} />}
    </Consumer>
  )

  hoistNonReactStatic(JgqlEnhancedComponent, WrappedComponent)
  return JgqlEnhancedComponent
}

export const gql = (strs: string[]) => {
  if (strs.length !== 1) {
    throw new Error("The gql tag can't handle complex template strings.")
  }
  return strs[0]
}
