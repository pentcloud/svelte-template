import client from '@pentcloud/client'
import custom from './client/index'
import session from './session.service'

export default {
    client : {
        ...client,
        ...custom
    },
    session
}