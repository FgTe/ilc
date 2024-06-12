import axios from 'zzc-axios'

import cacheMemory from './cache_memory'

const CACHE_STORE = {
    memory: new cacheMemory()
}

const GLOBAL_LOCKS = {}

const ERROR_ABORT_BY_REPEAT = 'Canceled since a new request emitting'

function _Abortion() {
    return {
        then: _Abortion,
        catch: _Abortion
    }
}

function _symbolRequest(symbol, record, config, handle, callback) {
    let _symbol = symbol ? symbol : config.url
    if ( _symbol ) {
        return handle.call(this, _symbol, record, config, callback)
    } else {
        return this.request(config)
    }
}
function _lockedRequest(symbol, record, config, unlockCallback) {
    if ( record[symbol] ) {
        return _Abortion()
    } else {
        record[symbol] = true
        let callback = () => {
            typeof unlockCallback === 'function' && unlockCallback()
        }
        return this.request(config).then((response) => {
            record[symbol] = null
            callback()
            return response
        }, (error) => {
            record[symbol] = null
            callback()
            throw error
        });
    }
}
function _latestRequest(symbol, record, config) {
    let canceler = record[symbol]
    if ( canceler ) {
        if ( canceler.requesting ) {
            record[symbol].source.cancel(ERROR_ABORT_BY_REPEAT)
            record[symbol] = {
                source: config.cancelToken ? config.cancelToken : axios.CancelToken.source()
            }
        }
    } else {
        record[symbol] = {
            source: config.cancelToken ? config.cancelToken : axios.CancelToken.source()
        }
    }
    record[symbol].requesting = true
    return new Promise((resolve, reject) => {
        let request = () => {
            this.request({
                ...config,
                cancelToken: record[symbol].source.token
            }).then((response) => {
                record[symbol].requesting = false
                resolve(response)
            }, (error) => {
                if (error.message !== ERROR_ABORT_BY_REPEAT) {
                    reject(error)
                }
            })
        }
        if ( config.delay ) {
            let timeoutID = setTimeout(request, config.delay)
            record[symbol].source.token.promise.then(() => {
                clearTimeout(timeoutID);
            })
        } else {
            request()
        }
    })
}

function _mergeFun (fun1, fun2) {
    return function (...args) {
        let result1 = fun1.apply(undefined, args)
        let result2 = fun2.apply(undefined, args)
        return result2 === undefined ? result1 : result2
    }
}

export default function createRequestHelper(config) {
    let defaultUrlPrefix = config.urlPrefix || ''
    let defaultRequestInterception = config.requestInterception || ((config) => {
        return config
    })
    let defaultResponseInterception = config.responseInterception || ((response) => {
        return response
    })
    let defaultNetwordErrorHandle = config.networdErrorHandle || ((err) => {
        throw err
    })
    return class {
        constructor(config) {
            let { urlPrefix, requestInterception, responseInterception, networdErrorHandle, ...presetRequestConfig } = config || {}
            this.defaultConfig = {
                urlPrefix: urlPrefix || defaultUrlPrefix,
                requestInterception: requestInterception ? mergeFun(defaultRequestInterception, requestInterception) : defaultRequestInterception,
                responseInterception: responseInterception ? mergeFun(defaultResponseInterception, responseInterception) : defaultResponseInterception,
                networdErrorHandle: networdErrorHandle ? mergeFun(defaultNetwordErrorHandle, networdErrorHandle) : defaultNetwordErrorHandle
            }
            this.presetRequestConfig = presetRequestConfig
            this.request = this.request.bind(this)
            this.lockedRequest = this.lockedRequest.bind(this)
            this.latestRequest = this.latestRequest.bind(this)
            this.source = axios.CancelToken.source()
            this.locks = {}
            this.latest = {}
        }
        request(config) {
            let requestInterceptionInThisRequest = this.defaultConfig.requestInterception
            let responseInterceptionInThisRequest = this.defaultConfig.responseInterception
            let networdErrorHandleInThisRequets = this.defaultConfig.networdErrorHandle
            let requestConfig = {
                ...this.presetRequestConfig,
                url: this.defaultConfig.urlPrefix,
                cancelToken: this.source.token
            }
            let cache = config.cache ? CACHE_STORE[config.cache] || CACHE_STORE.memory : null
            let canceled = false
            for ( let prop in config ) {
                if ( config.hasOwnProperty(prop) ) {
                    switch ( prop ) {
                        case 'url':
                            requestConfig.url += config[prop]
                            break
                        case 'requestInterception':
                            requestInterceptionInThisRequest = _mergeFun(this.defaultConfig.requestInterception, config[prop])
                            break
                        case 'responseInterception':
                            responseInterceptionInThisRequest = _mergeFun(this.defaultConfig.responseInterception, config[prop])
                            break
                        case 'networdErrorHandle':
                            networdErrorHandleInThisRequets = _mergeFun(this.defaultConfig.networdErrorHandle, config[prop])
                            break
                        case 'cancelToken':
                            if ( cache !== null ) {
                                ( config.cancelToken || requestConfig.cancelToken ).promise.then((reason) => {
                                    canceled = true
                                })
                                break
                            }
                        default:
                            requestConfig[prop] = config[prop]
                            break
                    }
                }
            }
            return new Promise((resolve, reject) => {
                function resolveHandle (response) {
                    if ( !canceled ) {
                        resolve(responseInterceptionInThisRequest(response, config))
                    }
                }
                function rejectHandle (error) {
                    if ( !canceled ) {
                        let raise = true
                        try {
                            let resolved = networdErrorHandleInThisRequets(error, config, () => { raise = false })
                            if ( raise ) {
                                resolve(resolved)
                            }
                        } catch ( error ) {
                            if ( raise ) {
                                reject(error)
                            }
                        }
                    }
                }
                function request () {
                    return axios.request(requestInterceptionInThisRequest(requestConfig))
                }
                if ( cache ) {
                    let cached = cache.get(requestConfig)
                    if ( cached ) {
                        if ( cached.then instanceof Function ) {
                            cached.then(resolveHandle, rejectHandle)
                        } else {
                            resolveHandle(cached)
                        }
                    } else {
                        let requested = request()
                        cache.set(requestConfig, requested)
                        requested.then(resolveHandle, rejectHandle)
                    }
                } else {
                    request().then(resolveHandle, rejectHandle)
                }
            })
        }
        lockedRequest(config, options) {
            let { symbol, onunlock } = options || {}
            return _symbolRequest.call(this, symbol, this.locks, config, _lockedRequest, onunlock)
        }
        globalLockedRequest(config, options) {
            let { symbol, onunlock } = options || {}
            return _symbolRequest.call(this, symbol, GLOBAL_LOCKS, config, _lockedRequest, onunlock)
        }
        latestRequest(config, options) {
            let { symbol } = options || {}
            return _symbolRequest.call(this, symbol, this.latest, config, _latestRequest)
        }
        abort(message) {
            this.source.cancel(message)
            for ( let key in this.latest ) {
                if ( this.latest.hasOwnProperty(key) && this.latest[key].requesting ) {
                    this.latest[key].source.cancel(message)
                }
            }
        }
    }
}