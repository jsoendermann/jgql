import * as React from 'react'
const hoistNonReactStatic = require('hoist-non-react-statics')

import { Consumer } from './context'
import { SendRequestFunction } from './sendRequestFunction'

export const withJgqlManual = <P extends object>(
  WrappedComponent: React.ComponentType<
    P & { sendRequest: SendRequestFunction }
  >,
) => {
  const JgqlEnhancedComponent = (props: P) => (
    <Consumer>
      {sendRequest => <WrappedComponent {...props} sendRequest={sendRequest} />}
    </Consumer>
  )

  hoistNonReactStatic(JgqlEnhancedComponent, WrappedComponent)

  return JgqlEnhancedComponent
}
