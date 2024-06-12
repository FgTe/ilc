import React from 'react'

import createRef from '@@/common/lib/create_ref_polyfill'

export default class RNLikeComponent extends React.Component {
    constructor (props) {
        super(props)
        this.nativeElement = createRef()
    }
    setNativeProps (props) {
        if ( this.nativeElement.current ) {
            this.assignProps(this.nativeElement.current, props)
        }
    }
    assignProps (target, props) {
        for ( let key in props ) {
            let prop = props[key]
            if ( prop instanceof Array ) {
                for ( let i = 0; i < prop.length; i++ ) {
                    target[key].push(prop[i])
                }
            } else if ( prop instanceof Object ) {
                for ( let subKey in prop ) {
                    if ( prop[subKey] instanceof Object ) {
                        this.assignProps(target[key][subKey], prop[subKey])
                    } else {
                        target[key][subKey] = prop[subKey]
                    }
                }
            }
        }
    }
}