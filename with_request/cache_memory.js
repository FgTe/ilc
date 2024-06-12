import Cache from './cache'

export default class cacheMemory extends Cache {
    constructor () {
        super()
        this.store = {}
    }
    control (request) {
        if ( String.prototype.toUpperCase.call(request.method) === 'GET' && request.data === undefined ) {
            return true
        } else {
            return false
        }
    }
    get (request) {
        let control = this.control(request)
        if ( !control ) return null
        let matched = this.store[`${request.url}${JSON.stringify(request.params)}`]
        return matched ? matched : null
    }
    set (request, response) {
        let id = `${request.url}${JSON.stringify(request.params)}`
        this.store[id] = response
        if ( response.then instanceof Function ) {
            response.then((res) => {
                if ( res.data && res.data.code === 200 ) {
                    this.store[id] = { ...res, request: null }
                } else {
                    this.store[id] = null
                }
            })
        }
    }
}