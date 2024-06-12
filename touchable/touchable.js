import React, { createRef } from 'react'

import './touchable.scss'

let timeStamp = null
let handled = false

class Touchable extends React.Component {
    constructor (props) {
        super(props)
        this.touchStartHandle = this.touchStartHandle.bind(this)
        this.touchEndHandle = this.touchEndHandle.bind(this)
        this.mouseDownHandle = this.mouseDownHandle.bind(this)
        this.mouseUpHandle = this.mouseUpHandle.bind(this)
        this.clickHandle = this.clickHandle.bind(this)
        this.delay = null
        this.container = createRef()
        this.handling = false
    }
    componentDidMount () {
        this.forwardRef(this.container.current)
    }
    componentWillUnmount () {
        this.forwardRef(null)
    }
    componentDidUpdate (prevProps) {
        if ( this.props.forwardedRef !== prevProps.forwardedRef ) {
            this.forwardRef(this.container.current)
        }
    }
    forwardRef (element) {
        if ( this.props.forwardedRef ) {
            if ( this.props.forwardedRef instanceof Function ) {
                this.props.forwardedRef(element)
            } else if ( this.props.forwardedRef.hasOwnProperty('current') ) {
                this.props.forwardedRef.current = element
            }
        }
    }
    startHandle (event, listener) {
        if ( event.timeStamp === timeStamp && handled ) {
            this.handling = false
        } else {
            timeStamp = event.timeStamp
            handled = true
            this.handling = true
            this.container.current.className += ' f-touchable-actived'
            if ( this.delay !== null ) {
                clearTimeout(this.delay)
                this.delay = null
            }
            this.delay = setTimeout(this.touchEndHandle, 800)
            listener instanceof Function && listener(event)
        }
    }
    endHandle (event, listener) {
        if ( this.handling ) {
            if ( this.delay !== null ) {
                clearTimeout(this.delay)
                this.delay = null
            }
            this.container.current && ( this.container.current.className = this.container.current.className.replace(' f-touchable-actived', '') )
            listener instanceof Function && listener(event)
        }
    }
    clickHandle (event) {
        if ( this.handling ) {
            this.props.onPress instanceof Function && this.props.onPress(event)
            if ( this.props.analytics ) {
                window.userTrack({ level: 1, action: 'click', ...this.props.analytics })
            }
        }
        this.props.onClick instanceof Function && this.props.onClick(event)
    }
    touchStartHandle (event) {
        this.startHandle(event, this.props.onTouchStart)
    }
    touchEndHandle (event) {
        this.endHandle(event, this.props.onTouchEnd)
    }
    mouseDownHandle (event) {
        this.startHandle(event, this.props.onMouseDown)
    }
    mouseUpHandle (event) {
        this.endHandle(event, this.props.onMouseUp)
    }
    render () {
        let { forwardedRef, onTouchEnd, onTouchStart, onMouseDown, onMouseUp, onPress, inline, analytics, ...rest } = this.props
        return inline ? (
            <span ref={this.container} onTouchStart={this.touchStartHandle} onTouchEnd={this.touchEndHandle} onMouseDown={this.mouseDownHandle} onMouseUp={this.mouseUpHandle} onClick={this.clickHandle} {...rest} data-style-touchable/>
        ) : (
            <div ref={this.container} onTouchStart={this.touchStartHandle} onTouchEnd={this.touchEndHandle} onMouseDown={this.mouseDownHandle} onMouseUp={this.mouseUpHandle} onClick={this.clickHandle} {...rest} data-style-touchable/>
        )
    }
}


export default React.forwardRef((props, ref) => {
    return <Touchable forwardedRef={ref} {...props}/>
})