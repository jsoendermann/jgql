import * as React from 'react'
const hoistNonReactStatic = require('hoist-non-react-statics')

import { JgqlClient } from './client'
import { withJgqlManual } from './withJgqlManual'

type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>
type ComponentType<P> = React.ComponentType<P>
type StatelessComponent<P> = React.StatelessComponent<P>

export interface JgqlEnhancedFetchingComponentDataProps<
  D extends object = object
> {
  loadingState: 'INITIAL' | 'LOADING' | 'SUCCESS' | 'ERROR'
  error: Error | null
  data: D | null
}
export interface JgqlEnhancedFetchingComponentFetchDataProps<
  V extends object = object
> {
  fetchData: (variables?: V) => void
}
export interface JgqlEnhancedFetchingComponentProps<
  D extends object = object,
  V extends object = object
>
  extends JgqlEnhancedFetchingComponentDataProps<D>,
    JgqlEnhancedFetchingComponentFetchDataProps<V> {}

export interface OptionsType<V extends object = object> {
  autofetch?: boolean
  variables?: () => V | PromiseLike<V>
  resetDataAtStartOfFetch?: boolean
}

export const withJgql = <D extends object = object, V extends object = object>(
  query: string,
  options?: OptionsType<V>,
) => <
  PropsWithJgql extends JgqlEnhancedFetchingComponentProps<D, V>,
  Props extends object = Omit<
    PropsWithJgql,
    keyof JgqlEnhancedFetchingComponentProps<D, V>
  >
>(
  WrappedComponent: ComponentType<PropsWithJgql>,
): StatelessComponent<Props> => {
  class JgqlEnhancedFetchingComponent extends React.Component<
    Props & { jgql: JgqlClient },
    JgqlEnhancedFetchingComponentDataProps
  > {
    state: JgqlEnhancedFetchingComponentDataProps<D> = {
      loadingState: 'INITIAL',
      error: null,
      data: null,
    }

    componentDidMount() {
      if (options && options.autofetch) {
        this.fetchData()
      }
    }

    fetchData = (variables?: any) => {
      const newState: Partial<JgqlEnhancedFetchingComponentDataProps<D>> = {
        loadingState: 'LOADING',
        error: null,
      }

      if (options && options.resetDataAtStartOfFetch) {
        newState.data = null
      }

      // TODO Fix type
      this.setState(newState as any, async () => {
        let vars: V
        if (variables) {
          vars = variables
        } else if (options && options.variables) {
          vars = await options.variables()
        } else {
          vars = {} as V
        }

        this.props
          .jgql<any, any>(query, vars)
          .then(data =>
            this.setState({
              loadingState: 'SUCCESS',
              data,
              error: null,
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

  const WrappedWrapper = withJgqlManual(JgqlEnhancedFetchingComponent)

  hoistNonReactStatic(JgqlEnhancedFetchingComponent, WrappedComponent)
  hoistNonReactStatic(WrappedWrapper, JgqlEnhancedFetchingComponent)

  return WrappedWrapper
}
