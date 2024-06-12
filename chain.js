export default class chain {
  constructor() {
    this.runing = false
    this.list = []
    this.args = undefined
  }
  push(call) {
    this.list.push(call)
  }
  unshift(call) {
    this.list.unshift(call)
  }
  remove(call) {
    let index = this.list.indexOf(call)
    this.list.splice(index, 1)
  }
  removeAll() {
    this.list = []
  }
  next = (...args) => {
    this.invoke(args.length ? args : this.args)
  }
  invoke(...args) {
    if ( this.list.length ) {
      this.args = args
      this.runing = true
      const run = this.list.shift()
      run.apply(undefined, [this.next, ...args])
    } else {
      this.runing = false
    }
  }
}