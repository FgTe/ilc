import React, { createContext, createRef } from 'react'

import passiveOption from '@@/common/components/container/passive'

let { impassive } = passiveOption

let Context = createContext({
    mountItem (item) {},
    unmountItem (item) {}
})

export class Bar extends React.Component {
    constructor (props) {
        super(props)
        this.elementRef = createRef()
        this.contextValue = {
            mountItem: this.mountItem,
            unmountItem: this.unmountItem
        }
        this.prevTouch = null
        this.prevFocused = -1
        this.prevPosition = ''
        this.sort = {
            left: [],
            top: []
        }
        this.items = []
        this.positions = []
    }
    componentDidMount () {
        this.forwardRef(this.elementRef.current)
        this.elementRef.current.addEventListener('touchstart', this.touchStartHandle, impassive)
        this.elementRef.current.addEventListener('touchmove', this.touchMoveHandle, impassive)
    }
    componentWillUnmount () {
        this.forwardRef(null)
        this.elementRef.current.removeEventListener('touchstart', this.touchStartHandle)
        this.elementRef.current.removeEventListener('touchmove', this.touchMoveHandle)
    }
    componentDidUpdate (prevProps) {
        if ( this.props.forwardedRef !== prevProps.forwardedRef ) {
            this.forwardRef(this.elementRef.current)
        }
    }
    mountItem = (item) => {
        this.items.push(item)
    }
    unmountItem = (item) => {
        let index = this.items.findIndex(($item) => $item === item)
        if ( ~index ) {
            this.items.splice(index, 1)
        }
    }
    getItemPosition (element) {
        let left = element.offsetLeft
        let top = element.offsetTop
        let parent = element.offsetParent
        if ( parent === document.body ) {
            let scrollLeft = 0
            let scrollTop = 0
            if ( document.body !== document.scrollingElement ) {
                scrollLeft = document.scrollingElement.scrollLeft
                scrollTo = document.scrollingElement.scrollTop
            }
            left = left - scrollLeft
            top = top - scrollTop
            return {
                left,
                top,
                right: left + element.offsetWidth,
                bottom: top + element.offsetHeight
            }
        } else {
            let position = this.getItemPosition(parent)
            left = left + position.left
            top = top + position.top
            return {
                left,
                top,
                right: left + element.offsetWidth,
                bottom: top + element.offsetHeight
            }
        }
    }
    sortItem (itemIndex, rect, sort, position) {
        let i = sort.length - 1
        do {
            if ( i === -1 || this.positions[sort[i]][position] <= rect[position] ) {
                sort.splice(i + 1, 0, itemIndex)
                break
            }
            i--
        } while ( i >= -1 )
    }
    touchStartHandle = (event) => {
        this.prevTouch = null
        this.checkFocusedItem(event)
        event.preventDefault()
    }
    touchMoveHandle = (event) => {
        this.checkFocusedItem(event)
        event.preventDefault()
    }
    checkFocusedItem (event) {
        let touch = event.touches[0]
        let pointX = touch.clientX
        let pointY = touch.clientY
        let direction
        let sort
        let start
        let end
        let canBreak
        let focused = -1
        let horizontal = !this.props.vertical || this.props.horizontal
        let vertical = !this.props.horizontal || this.props.vertical
        let position = ''
        if ( this.prevTouch && this.prevTouch.identifier === touch.identifier ) {
            let $x = touch.clientX - this.prevTouch.clientX
            let $y = touch.clientY - this.prevTouch.clientY
            if ( !vertical || horizontal && Math.abs($x) > Math.abs($y) ) {
                direction = $x > 0 ? 1 : -1
                sort = this.sort.left
                position = 'left'
            } else {
                direction = $y > 0 ? 1 : -1
                sort = this.sort.top
                position = 'top'
            }
            if ( this.prevPosition === position ) {
                direction = 1
                start = 0
                end = sort.length
            } else {
                start = this.prevFocused >= 0 ? this.prevFocused : 0
                end = direction < 0 ? 0 : sort.length
            }
            this.prevPosition = position
            canBreak = true
        } else {
            direction = 1
            sort = this.items.map((item, index) => index)
            start = 0
            end = sort.length
            canBreak = false
        }
        for ( let i = start; i !== end; i += direction ) {
            let index = sort[i]
            let component = this.items[index]
            let position
            if ( this.positions[index] ) {
                position = this.positions[index]
            } else {
                position = this.positions[index] = this.getItemPosition(component.elementRef.current)
                horizontal && this.sortItem(i, position, this.sort.left, 'left')
                vertical && this.sortItem(i, position, this.sort.top, 'top')
            }
            if ( ( horizontal ? pointX > position.left && pointX < position.right : true ) && ( vertical ? pointY > position.top && pointY < position.bottom : true ) ) {
                focused = index
                if ( canBreak ) break
            }
        }
        if ( this.prevFocused >= 0 && focused !== this.prevFocused ) {
            this.items[this.prevFocused].unfocusHandle()
        }
        if ( focused >= 0 ) {
            this.items[focused].focusHandle()
            this.prevFocused = focused
        }
        this.prevTouch = {
            identifier: touch.identifier,
            clientX: pointX,
            clientY: pointY
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
    render () {
        let { forwardedRef, vertical, horizontal, ...rest } = this.props
        return (
            <Context.Provider value={this.contextValue}>
                <div ref={this.elementRef} {...rest}/>
            </Context.Provider>
        )
    }
}

export class Item extends React.Component {
    constructor (props) {
        super(props)
        this.finalRnder = this.finalRnder.bind(this)
        this.context = null
        this.elementRef = createRef()
        this.focused = false
    }
    componentDidMount () {
        this.forwardRef(this.elementRef.current)
        this.context.mountItem(this)
    }
    componentWillUnmount () {
        this.forwardRef(null)
        this.context.unmountItem(this)
    }
    componentDidUpdate (prevProps) {
        if ( this.props.forwardedRef !== prevProps.forwardedRef ) {
            this.forwardRef(this.elementRef.current)
        }
    }
    focusHandle () {
        if ( !this.focused ) {
            this.focused = true
            if ( this.props.onFocus instanceof Function ) {
                this.props.onFocus()
            }
        }
    }
    unfocusHandle () {
        if ( this.focused ) {
            this.focused = false
            if ( this.props.onUnfocus instanceof Function ) {
                this.props.onUnfocus()
            }
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
    finalRnder (contextValue) {
        let { inline, forwardedRef, onFocus, onUnfocus, ...rest } = this.props
        this.context = contextValue
        return inline ? (
            <span ref={this.elementRef} {...rest}/>
        ) : (
            <div ref={this.elementRef} {...rest}/>
        )
    }
    render () {
        return (
            <Context.Consumer>
                {this.finalRnder}
            </Context.Consumer>
        )
    }
}

export default {
    Bar,
    Item
}