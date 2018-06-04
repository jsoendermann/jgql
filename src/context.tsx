import * as React from 'react'

import { JgqlClient } from './client'

const { Provider, Consumer } = React.createContext<JgqlClient>(() => {
  throw new Error('Invalid jgql client')
})
export { Consumer }
export interface JgqlProviderProps {
  jgqlClient: JgqlClient
  children?: any
}
export const JgqlProvider = ({ jgqlClient, children }: JgqlProviderProps) => (
  <Provider value={jgqlClient}>{children}</Provider>
)
