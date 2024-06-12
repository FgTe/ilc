const arith = {
    exponent (value) {
        let matched = value.toString().match(/^([+-])?(\d+)(?:\.(\d*))?$/);
        if ( matched ) {
                return {
                    signal: matched[1] === '-' ? -1 : 1,
                    exponent: matched[3] ? matched[3].length : 0,
                    digital: matched[0].replace(matched[1], '').replace('.', '')
                }
        } else {
            throw new Error(`Arguments[0] expect a number but got ${typeof value}`);
        }
    },
    match (x, y) {
        let elements = [arith.exponent(x), arith.exponent(y)];
        let jump = elements[0].exponent  - elements[1].exponent;
        let mutant = jump > 0 ? 1 : 0;
        elements[mutant].exponent += Math.abs(jump);
        elements[mutant].digital += '0'.repeat(Math.abs(jump));
        return elements;
    },
    dot (result, exponent) {
        let signal = ~result.search('-') ? '-' : '';
        result = result.replace(signal, '');
        if ( ~result.indexOf('e') ) {
            let [match, digits, scale] = result.match(/(\d+(?:\.\d+)?)e([+-]\d+)/);
            return +`${digits}e${+scale - exponent}`;
        } else {
            result = signal + ( result.length < exponent ? result.replace(/(\d+(?:.\d+)?)/, `${'0'.repeat(exponent - result.length)}$1`) : result );
            return +result.replace(new RegExp(`(\\d{${exponent}})$`), '.$1');
        }
    },
    _add (x, y) {
        let result = ( +x.digital * x.signal + +y.digital * y.signal ).toString();
        return +arith.dot(result, x.exponent);
    },
    add (...args) {
        let result = args.reduce((accumulator, currentValue) => {
            return arith.match(accumulator, currentValue).reduce(arith._add);
        });
        return result;
    },
    _mult (x, y) {
        let result = ( +x.digital * x.signal * +y.digital * y.signal ).toString();
        return +arith.dot(result, x.exponent + y.exponent);
    },
    multiply (...args) {
        let result = args.reduce((accumulator, currentValue) => {
            return arith.match(accumulator, currentValue).reduce(arith._mult);
        });
        return result;
    },
    _divide (x, y) {
        return x.digital / y.digital * x.signal * y.signal;
    },
    divide (...args) {
        let result = args.reduce((accumulator, currentValue) => {
            return arith.match(accumulator, currentValue).reduce(arith._divide);
        });
        return result;
    }
};
export default arith;