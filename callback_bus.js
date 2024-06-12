let donothing = () => {}

export default class CallbackBUS {
    constructor (options) {
        this.invoke = this.invoke.bind(this)
        this.tasks = {}
        this.increase = 0
        this.idle = true
        this.options = options
        this.onBusy = donothing
        this.onIdle = donothing
        if ( this.options ) {
            if ( this.options.shouldInvoke instanceof Function ) {
                this.shouldInvokeHandle = this.options.shouldInvoke
            }
            this.onBusy = this.options.onBusy instanceof Function && this.options.onBusy
            this.onIdle = this.options.onIdle instanceof Function && this.options.onIdle
        }
    }
    shouldInvokeHandle (tasks) {
        return true 
    }
    register (identity) {
        let id = this.increase++
        this.tasks[id] = {
            identity: identity,
            list: []
        }
        if ( this.idle ) {
            this.onBusy()
            this.idle = false
        }
        return {
            id,
            set: (callback) => {
                this.tasks[id].list.push(callback)
            },
            remove: (callback) => {
                let list = this.tasks[id].list
                for ( let i = 0; i < list.length; i++ ) {
                    if ( list[i] === callback ) {
                        list.splice(i, 1)
                    }
                }
            },
            destroy: () => {
                delete this.tasks[id]
                if ( !Object.keys(this.tasks).length ) {
                    this.onIdle()
                    this.idle = true
                }
            }
        }
    }
    invoke (...arg) {
        for ( let id in this.tasks ) {
            if ( this.shouldInvokeHandle(this.tasks[id]) ) {
                let list = this.tasks[id].list
                for ( let i = 0; i < list.length; i++ ) {
                    list[i](...arg)
                }
            }
        }
    }
}