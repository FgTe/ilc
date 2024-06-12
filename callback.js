export default class Callback {
    constructor () {
        this.runing = false
        this.list = []
        this.pendingRemove = []
    }
    add (callback) {
        this.list.push(callback)
    }
    remove (callback) {
        let index = this.list.indexOf(callback)
        if ( this.runing ) {
            this.pendingRemove.push(index)
        } else {
            this.list.splice(index, 1)
        }
    }
    once (callback) {
        let handle = (...args) => {
            callback(...args)
            this.remove(handle)
        }
        this.add(handle)
        return handle
    }
    removeAll () {
        this.list = []
    }
    invoke (...args) {
        let list = this.list
        this.runing = true
        for ( let i = 0; i < list.length; i++ ) {
            list[i](...args)
        }
        if ( this.pendingRemove.length > 0 ) {
            let index
            while ( ( index = this.pendingRemove.splice(this.pendingRemove.length - 1, 1)[0] ) !== undefined ) {
                this.list.splice(index, 1)
            }
            this.pendingRemove = []
        }
        this.runing = false
    }
}