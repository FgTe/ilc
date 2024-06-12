class FTAnimation {
    static mapValueRegEx = /(\d+(?:\.\d+)?)(px|rem|em|%|pc)?/
    constructor (props) {
        this.object = props.object
        this.property = props.property
        this.duration = props.duration || 350
        if ( typeof props.easing === 'function' ) {
            this.easing = props.easing
        }
        if ( typeof props.interpolation === 'function' ) {
            this.interpolation = props.interpolation
        }
        if ( typeof props.callback === 'function' ) {
            this.callback = props.callback
        }
        this.queue = []
        this.running = false
        this.durationID = null
        this.delayID = null
        this.ended = false
        this.run = this.run.bind(this)
    }
    _createKeyfram (props) {
        let object = props.object || this.object,
            property = props.property || this.property,
            mappedStartValue = FTAnimation.mapValueRegEx.exec(props.start === undefined ? object[property] : props.start),
            start = +mappedStartValue[1],
            mappedEndValue = FTAnimation.mapValueRegEx.exec(props.end),
            end = +mappedEndValue[1],
            unit = mappedEndValue[2] || '',
            duration = props.duration || this.duration,
            loop = props.loop || 1,
            infinite = props.infinite || false,
            delay = props.delay || 0
        let keyfram = {
            object,
            property,
            start,
            end,
            unit,
            duration,
            loop,
            infinite,
            delay,
            _travel: end - start,
            _started: false,
            _startTime: null,
            _progress: 0,
            _times: 0
        }
        if ( typeof props.beforeStart === 'function' ) {
            keyfram.beforeStart = props.beforeStart
        }
        if ( typeof props.easing === 'function' ) {
            keyfram.easing = props.easing
        } else if ( this.easing ) {
            keyfram.easing = this.easing
        }
        if ( typeof props.interpolation === 'function' ) {
            keyfram.interpolation = props.interpolation
        } else if ( this.interpolation ) {
            keyfram.interpolation = this.interpolation
        }
        if ( typeof props.callback === 'function' ) {
            keyfram.callback = props.callback
        } else if ( this.callback ) {
            keyfram.callback = this.callback
        }
        return keyfram
    }
    createKeyfram (props) {
        this.queue.push(this._createKeyfram(props))
    }
    reset (props) {
        if ( this.running && this.queue ) {
            this.queue[0] = this._createKeyfram(props)
        } else {
            this.step(props)
        }
    }
    step (props) {
        this.queue && this.createKeyfram(props)
        if ( !this.running ) {
            this.start()
        }
    }
    pause () {
        this.paused = true
    }
    start () {
        this.paused = false
        if ( !this.running ) {
            this.run()
        }
    }
    stop () {
        this.queue = []
        this.ended = false
        this.running = false
        clearTimeout(this.delayID)
        cancelAnimationFrame(this.durationID)
    }
    end () {
        this.ended = true
    }
    destroy () {
        clearTimeout(this.delayID)
        cancelAnimationFrame(this.durationID)
        this.object = null
        this.property = null
        this.duration = null
        this.easing = null
        this.interpolation = null
        this.queue = null
        this.running = null
        this.durationID = null
        this.delayID = null
        this.createKeyfram = null
        this._createKeyfram = null
        this.reset = null
        this.satep = null
        this.pause = null
        this.start = null
        this.stop = null
        this.end = null
        this.run = null
    }
    run () {
        if ( this.queue.length ) {
            this.running = true
            let keyfram = this.queue[0]
            if ( !keyfram._started ) {
                keyfram._started = true
                keyfram._startTime = Date.now() - keyfram._progress * keyfram.duration
                keyfram._progress = 0
                if ( keyfram.delay ) {
                    keyfram._startTime = keyfram._startTime + keyfram.delay
                    this.delayID = setTimeout(() => {
                        keyfram.beforeStart && keyfram.beforeStart()
                        this.run()
                    }, keyfram.delay)
                } else {
                    keyfram.beforeStart && keyfram.beforeStart()
                }
            }
            let passedTime = Date.now() - keyfram._startTime
            passedTime = passedTime > keyfram.duration || this.ended ? keyfram.duration : passedTime
            let progress = passedTime / keyfram.duration
            let travel = keyfram._travel * progress
            let current = keyfram.start + ( keyfram.easing ? keyfram.easing(passedTime, keyfram.duration, keyfram._travel) : travel )
            if ( keyfram.interpolation ) {
                let interpolation = keyfram.interpolation(current, progress)
                keyfram.object[keyfram.property] = interpolation === undefined ? current + keyfram.unit : interpolation
            } else {
                keyfram.object[keyfram.property] = current + keyfram.unit
            }
            if ( !this.paused ) {
                if ( passedTime === keyfram.duration ) {
                    if ( keyfram.infinite && !this.ended ) {
                        keyfram._started = false
                    } else if ( keyfram._times < keyfram.loop && !this.ended ) {
                        keyfram._times++
                    } else {
                        keyfram.callback && keyfram.callback()
                        this.queue.shift()
                    }
                }
                this.durationID = requestAnimationFrame(this.run)
            } else {
                keyfram._progress = progress
                keyfram._started = false
            }
        } else {
            this.ended = false
            this.running = false
        }
    }
}

export default FTAnimation
