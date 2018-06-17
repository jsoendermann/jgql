export { AxiosRequestConfig as RequestConfig } from 'axios'

export {
  SendRequestFunction,
  createSendRequestFunction,
  JgqlError,
} from './sendRequestFunction'
export {
  withJgql,
  VariableGetter,
  JgqlData,
  RefetchDataParams,
} from './withJgql'
export { JgqlProvider } from './context'
export { gql } from './gql'
