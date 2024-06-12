/* eslint-disable */
export default class Query {
    constructor (str) {
        const matched = str.match(/[^?&=]+=?[^?&]*/g)
        if ( matched ) {
            const re = /([^=]+)(?:=(.+))/
            for ( let i = 0; i < matched.length; i++ ) {
                const item = matched[i].match(re)
                if ( item ) {
                    this[item[1]] = item[2] ? item[2] : true
                }
            }
        }
    }
    toString () {
        const query = []
        for ( let name in this ) {
            if ( this.hasOwnProperty(name) ) {
                query.push(`${name}${this[name] === true ? '' : `=${this[name]}` }`)
            }
        }
        return query.length ? `?${query.join('&')}` : ''
    }
}