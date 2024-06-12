import React from 'react'

export default function withTransition (Component) {
    return class Transition extends React.Component {
        constructor (props) {
            super(props)
            this.forwardedRef = this.forwardedRef.bind(this)
            this.showDelayOperation = this.showDelayOperation.bind(this)
            this.hideDelayOperation = this.hideDelayOperation.bind(this)
            this.element = null
            this.displayBackup = null
            this.timeoutId = null
            this.prevVisibility = null
            this.state = {
                display: this.props.visible === undefined ? true : this.props.visible
            }
        }
        componentDidMount () {
            this.setup(true)
        }
        componentDidUpdate (prevProps) {
            if ( this.props.visible !== prevProps.visible ) {
                this.setup()
            }
        }
        setup (init) {
            if ( this.props.visible ) {
                this.show(init)
            } else {
                this.hide(init)
            }
        }
        forwardedRef (element) {
            this.element = element
            this.displayBackup = element ? element.style && element.style.display || document.defaultView && document.defaultView.getComputedStyle && document.defaultView.getComputedStyle(element).display : null
            this.props.forwardRef && this.props.forwardRef(element)
        }
        show (init) {
            this.timeoutId !== null && clearTimeout(this.timeoutId)
            if ( this.props.keepAlive ) {
                this.element.style.display = this.displayBackup
                if ( init ) {
                    this.showDelayOperation()
                } else {
                    this.timeoutId = setTimeout(this.showDelayOperation)
                }
            } else {
                this.setState({
                    display: true
                }, () => {
                    if ( init ) {
                        this.showDelayOperation()
                    } else {
                        this.timeoutId = setTimeout(this.showDelayOperation)
                    }
                })
            }
        }
        showDelayOperation () {
            this.switchClass(this.props.visibleClassName, this.props.hiddenClassName)
            this.timeoutId = null
        }
        hide(init) {
            if ( this.element ) {
                this.timeoutId !== null && clearTimeout(this.timeoutId)
                this.switchClass(this.props.hiddenClassName, this.props.visibleClassName)
                if ( init ) {
                    this.hideDelayOperation()
                } else {
                    this.timeoutId = setTimeout(this.hideDelayOperation, this.props.hiddenTimeout !== undefined ? this.props.hiddenTimeout : this.props.timeout !== undefined ? this.props.timeout : 0)
                }
            }
        }
        hideDelayOperation () {
            if ( this.props.keepAlive ) {
                this.element.style.display = 'none'
            } else {
                this.setState({
                    display: false
                })
            }
            this.timeoutId = null
        }
        switchClass (newer, older) {
            newer !== undefined && this.addAnimationClass(newer)
            older !== undefined && this.removeAnimationClass(older)
        }
        addAnimationClass (className) {
            let origin = this.element.className
            this.element.className = origin ? ~origin.indexOf(className) ? origin : `${origin} ${className}` : className
        }
        removeAnimationClass (className) {
            let origin = this.element.className
            this.element.className = origin.replace(new RegExp(`\\s*${className}`), '')
        }
        render () {
            let { forwardRef, visible, keepAlive, timeout, visibleTimeout, hiddenTimeout, visibleClassName, hiddenClassName, onAnimationstart, onAnimationend, ...rest } = this.props
            return ( this.props.visible || this.state.display || keepAlive ) ? <Component ref={this.forwardedRef} {...rest}/> : null
        }
    }
}