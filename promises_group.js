import Callback from './callback';

function pushCallback (context, options) {
    typeof options.success === 'function' && context.successCallback.once(options.success);
    typeof options.complete === 'function' && context.completeCallback.once(options.complete);
    typeof options.fail === 'function' && context.failCallback.once(options.fail);
}

export default class {
    constructor (list, condition) {
        this.list = [];
        this.condition = condition;
        this.completed = false;
        this.successful = false;
        this.completeCallback = new Callback();
        this.successCallback = new Callback();
        this.failCallback = new Callback();
        this.responses = [];
        this.errors = [];
        for ( let i = 0; i < list.length; i++ ) {
            this.list.push({
                completed: false,
                successful: false,
                processing: false,
                action: list[i]
            });
        }
    }
    eachHandle (item, res, err) {
        item.completed = true;
        item.processing = false;
        if ( !err && ( !this.condition || typeof this.condition === 'function' && this.condition(res) ) ) {
            item.successful = true;
        }
        this.checkStatus();
    }
    checkStatus () {
        let completed = true;
        let successful = true;
        let failed = false;
        for ( let i = 0; i < this.list.length; i++ ) {
            if ( !this.list[i].completed ) {
                completed = successful = false;
                break;
            } else if ( !this.list[i].successful ) {
                failed = true
                successful = false;
            }
        }
        this.completed = completed;
        this.successful = successful;
        if ( completed ) {
            this.completeCallback.invoke(this.responses, this.errors);
            if ( failed ) {
                this.failCallback.invoke(this.errors.filter((err) => err))
            }
        }
        if ( successful ) {
            this.successCallback.invoke(this.responses);
        }
    }
    _run (failedOnly, options) {
        options && pushCallback(this, options);
        this.responses = [];
        this.errors = [];
        let processing = 0;
        if ( this.list.length ) {
            for ( let i = 0; i < this.list.length; i++ ) {
                if ( !failedOnly || !this.list[i].successful ) {
                    processing++;
                    if ( !this.list[i].processing ) {
                        this.list[i].processing = true;
                        this.list[i].action().then((res) => {
                            this.responses[i] = res;
                            this.eachHandle(this.list[i], res);
                        }).catch((err) => {
                            this.errors[i] = err;
                            this.eachHandle(this.list[i], null, err);
                            throw err;
                        });
                    }
                }
            }
        } else {
            this.checkStatus();
        }
        processing || this.checkStatus();
    }
    call (options) {
        this._run(true, options);
    }
    refresh (options) {
        this._run(false, options);
    }
}