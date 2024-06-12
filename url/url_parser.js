/* eslint-disable */
import Query from './query_parser'

const schemeMatcher = /(?:([^:]+:)\/\/)/.source
const authMatcher = /(?:([^:@]+)(?::([^@]+))?@)/.source
const hostMatcher = /([^:/?#]+\.[^:/?#]+)/.source
const portMatcher = /(?::(\d*))/.source
const pathMatcher = /(\/[^;?#]*)/.source
const paramMatcher = /((?:;[^?#;]*)+)/.source
const queryMatcher = /(\?[^#]*)/.source
const fragMattcher = /(#.*)/.source
function Url(url) {
    try {
        const mather = new RegExp(
            [
                schemeMatcher,
                authMatcher,
                hostMatcher,
                portMatcher,
                pathMatcher,
                paramMatcher,
                queryMatcher,
                fragMattcher
            ].join('?') + '?'
        )
        const matched = url.match(mather)
        this.url = url
        this.scheme = matched[1] || ''
        this.user = matched[2] || ''
        this.password = matched[3] || ''
        this.host = matched[4] || ''
        this.port = matched[5] || ''
        this.path = matched[6] && /\/.*/.test(matched[6]) && matched[6] || ''
        this.params = matched[7] && /;.*/.test(matched[7]) && matched[7] || ''
        const query = new Query(matched[8] && /\?.*/.test(matched[8]) && matched[8] || '')
        Object.defineProperty(this, '[[QUERY]]', {
            configurable: false,
            writable: true,
            enumerable: false,
            value: query
        })
        Object.defineProperty(this, 'query', {
            configurable: false,
            enumerable: true,
            get () {
                return this['[[QUERY]]']
            },
            set (query) {
                if ( typeof query === 'string' ) {
                    this['[[QUERY]]'] = new Query(query)
                } else {
                    this['[[QUERY]]'] = Object.assign(new Query(''), query)
                }
            }
        })
        this.frag = matched[9] && /#.*/.test(matched[9]) && matched[9] || ''
    } catch (err) {
        throw new Error('invalid url')
    }
}
Url.prototype.toString = function () {
    return [
        `${this.scheme}//`,
        this.user,
        (this.password ? ':' : ''),
        this.password,
        (this.user ? '@' : ''),
        this.host,
        (this.port ? ':' : ''),
        this.port,
        this.path,
        this.params,
        this.query.toString(),
        this.frag
    ].join('')
}

export default Url