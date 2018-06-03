import * as React from 'react'
import axios, { AxiosError, AxiosRequestConfig } from 'axios'
const hoistNonReactStatic = require('hoist-non-react-statics')

export type JgqlClient = <
  Response extends object = object,
  Variables extends object = object
>(
  query: string,
  variables?: Variables,
) => Promise<Response>

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
}: CreateClientParams): JgqlClient => async <Response, Variables>(
  query: string,
  variables?: Variables,
) => {
  const request = { method: 'POST', url, data: { query, variables } }
  const augmentedRequest = await augmentRequest(request)
  try {
    const response = await axios(augmentedRequest)
    const data = response.data.data
    const processedResponse = (await processResponse(data)) as Response
    return processedResponse
  } catch (axiosError) {
    const processedError = await processError(axiosError)
    throw processedError
  }
}

const { Provider, Consumer } = React.createContext<JgqlClient>(() => {
  throw new Error('Invalid jgql client')
})

export interface JgqlProviderProps {
  jgqlClient: JgqlClient
  children?: any
}
export const JgqlProvider = ({ jgqlClient, children }: JgqlProviderProps) => (
  <Provider value={jgqlClient}>{children}</Provider>
)

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

export interface OptionsType {
  autofetch?: boolean
  variables?: () => object
  resetDataAtStartOfFetch?: boolean
}
export const withJgqlFetchData = <
  P extends object,
  Data extends object = object
>(
  WrappedComponent: React.ComponentType<
    P & {
      loadingState: 'INITIAL' | 'LOADING' | 'SUCCESS' | 'ERROR'
      error: Error | null
      data: Data | null
      fetchData: () => void
    }
  >,
  query: string,
  options?: OptionsType,
) => {
  interface State {
    loadingState: 'INITIAL' | 'LOADING' | 'SUCCESS' | 'ERROR'
    error: Error | null
    data: Data | null
  }
  class JgqlEnhancedFetchingComponent extends React.Component<
    P & { jgql: JgqlClient },
    State
  > {
    componentDidMount() {
      if (options && options.autofetch) {
        this.fetchData()
      }
    }

    fetchData = () => {
      const newState: any = {
        loadingState: 'LOADING',
        errorMessage: null,
      }

      if (options && options.resetDataAtStartOfFetch) {
        newState.data = null
      }
      this.setState(newState, () => {
        this.props
          .jgql<Data>(query, (options && options.variables) || {})
          .then(data =>
            this.setState({
              loadingState: 'SUCCESS',
              data,
            }),
          )
          .catch(error => this.setState({ loadingState: 'ERROR', error }))
      })
    }

    render() {
      return (
        <WrappedComponent
          {...this.props}
          {...this.state}
          fetchData={this.fetchData}
        />
      )
    }
  }

  const WrappedWrapper = withJgql(JgqlEnhancedFetchingComponent)

  hoistNonReactStatic(JgqlEnhancedFetchingComponent, WrappedComponent)
  hoistNonReactStatic(WrappedWrapper, JgqlEnhancedFetchingComponent)

  return WrappedWrapper
}

export const gql = (strs: TemplateStringsArray) => {
  if (strs.length !== 1) {
    throw new Error("The gql tag can't handle complex template strings.")
  }
  return strs[0]
}
