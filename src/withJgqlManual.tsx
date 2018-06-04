import * as React from 'react'
const hoistNonReactStatic = require('hoist-non-react-statics')

import { Consumer } from './context'
import { JgqlClient } from './client'

export const withJgqlManual = <P extends object>(
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
