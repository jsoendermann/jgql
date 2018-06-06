import * as React from 'react'
const hoistNonReactStatic = require('hoist-non-react-statics')

import { SendRequestFunction } from './client'
import { withJgqlManual } from './withJgqlManual'

type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>
type ComponentType<P> = React.ComponentType<P>
type StatelessComponent<P> = React.StatelessComponent<P>
export type VariableGetter<V> = () => V | Promise<V>

export interface InitialState {
  state: 'INITIAL'
}
export interface LoadingState {
  state: 'LOADING'
}
export interface SuccessState<D extends object> {
  state: 'SUCCESS'
  response: D
}
export interface ErrorState {
  state: 'ERROR'
  error: Error
}
export type JgqlData<D extends object> =
  | InitialState
  | LoadingState
  | SuccessState<D>
  | ErrorState

export interface JgqlDataProp<D extends object> {
  data?: JgqlData<D>
}
export interface FetchDataProps<V extends object> {
  refetchData?: (variables?: V) => void
  registerVariableGetter?: (getter: VariableGetter<V>) => void
  sendRequest?: SendRequestFunction
}
export type JgqlProps<D extends object, V extends object> = JgqlDataProp<D> &
  FetchDataProps<V>

export interface OptionsType<V extends object> {
  dontAutofetch?: boolean
  getVariables?: VariableGetter<V>
}

export const withJgql = <D extends object = object, V extends object = object>(
  query?: string,
  options?: OptionsType<V>,
) => <
  PP extends JgqlProps<D, V>,
  P extends object = Omit<PP, keyof JgqlProps<D, V>>
>(
  WrappedComponent: ComponentType<PP>,
): StatelessComponent<P> => {
  class JgqlEnhancedFetchingComponent extends React.Component<
    P & { sendRequest: SendRequestFunction },
    JgqlData<D>
  > {
    private variableGetter: VariableGetter<V> | null = null

    state: JgqlData<D> = {
      state: 'INITIAL',
    }

    componentDidMount() {
      if (!(options && options.dontAutofetch)) {
        this.refetchData()
      }
    }

    registerVariableGetter = (getter: VariableGetter<V>) => {
      this.variableGetter = getter
    }

    refetchData = (variables?: any) => {
      if (!query) {
        return
      }

      const newState: any = {
        state: 'LOADING',
      }

      this.setState(newState, async () => {
        let vars: V
        if (variables) {
          vars = variables
        } else if (this.variableGetter) {
          vars = await this.variableGetter()
        } else if (options && options.getVariables) {
          vars = await options.getVariables()
        } else {
          vars = {} as V
        }

        try {
          const data = await this.props.sendRequest<D, V>(query, vars)

          this.setState({
            state: 'SUCCESS',
            response: data,
          })
        } catch (error) {
          this.setState({
            state: 'ERROR',
            error,
          })
        }
      })
    }

    render() {
      return (
        <WrappedComponent
          {...this.props}
          data={this.state}
          refetchData={this.refetchData}
          registerVariableGetter={this.registerVariableGetter}
          sendRequest={this.props.sendRequest}
        />
      )
    }
  }

  const WrappedWrapper = withJgqlManual(JgqlEnhancedFetchingComponent)

  hoistNonReactStatic(JgqlEnhancedFetchingComponent, WrappedComponent)
  hoistNonReactStatic(WrappedWrapper, JgqlEnhancedFetchingComponent)

  return WrappedWrapper
}
