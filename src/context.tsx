import * as React from 'react'

import { SendRequestFunction } from './sendRequestFunction'

const { Provider, Consumer } = React.createContext<SendRequestFunction>(() => {
  throw new Error('Invalid jgql client')
})

export interface JgqlProviderProps {
  sendRequest: SendRequestFunction
  children?: any
}
const JgqlProvider = ({ sendRequest, children }: JgqlProviderProps) => (
  <Provider value={sendRequest}>{children}</Provider>
)

export { Consumer, JgqlProvider }
