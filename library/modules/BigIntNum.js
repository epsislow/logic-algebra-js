/*
 Module: BigNum
 Version: 1.0.1
 Author: epsislow@gmail.com
*/

var BigIntNum = (function () {
    const type = 'BigIntNum';
    const DEFAULT_MOST_SIGN = 10;
    let pub = {
        type: type,
        num: false,
        exp: 0,
        mostSign: DEFAULT_MOST_SIGN, //keepMostSignificantNumDigits
    };

    function cInt(num) {
        return (Number.isInteger(num))? num: Math.floor(num);
    }

    function check(a, arg=false) {
        if(typeof a === 'object' && ('type' in a) && a.type === type) {
            return;
        }
        throw new Error('Expected an object '+ type+ ' but found something else' + ((arg !== false) ? ' at argument '+ arg: ''));
    }

    function keepMostSign(a) {
        let extraLen = (a.num + '').length - a.mostSign;
        if (extraLen > 0) {
            a.exp += extraLen;
            a.num = Math.trunc(a.num/Math.pow(10, extraLen));
        }
    }

    function addMethods(pub) {
        pub.keepMostSign = keepMostSign;
        pub.toString = function () {
            return '{ '+this.num + ' ^ '+this.exp + ' ('+this.mostSign+') }';
        }

        pub.new = function (num, exp =0) {
            let pub = {
                type: type,
                num: num,
                exp: exp,
                mostSign: this.mostSign, //keepMostSignificantNumDigits
            };
            return addMethods(pub);
        }

        pub.from = function (num, exp =0, mostSign = DEFAULT_MOST_SIGN) {
            let pub = {
                type: type,
                num: num,
                exp: exp,
                mostSign: mostSign, //keepMostSignificantNumDigits
            };
            return addMethods(pub);
        }

        pub.clone = function () {
            let pub = {
                type: type,
                num: this.num,
                exp: this.exp,
                mostSign: this.mostSign, //keepMostSignificantNumDigits
            };
            return addMethods(pub);
        }

        pub.cInt = cInt;

        pub.numToExp = function (exp) {
            return Math.pow(10, this.exp - exp)* this.num;
        }

        pub.add = function (b) {
            check(b,1);

            //b = BigIntNum.from(234, 4); c = BigIntNum.from(234, 4); b.toString() + c.toString();
            //b.add(BigIntNum.from(100,17)); // not working because many errors

            //console.log(this.toString());

            if (this.exp === b.exp) {
                //console.log('=' + this.num + ' '+ b.num);
                this.num += b.num;
            } else if (this.exp < b.exp) {
                //console.log('<' + this.num + ' ' +  b.numToExp(this.exp));
                this.num += b.numToExp(this.exp);
            } else { // >
                //console.log('>' + this.numToExp(b.exp) + ' ' + b.num);
                this.num = this.numToExp(b.exp) + b.num;
                this.exp = b.exp;
            }

            keepMostSign(this);

            console.log(this.toString());

            /*if (this.exp > b.exp) {
                this.num += b.numToExp(this.exp);
            } else {
                this.num += this.numToExp(b.exp);
            }*/

            return this;
        }



        pub.plus = function (b) {
            let r = this.clone();
            this.add.apply(r, b);
            return r;
        }

        pub.minus = function (b) {
            check(b,1);
            /*
            if (this.exp > b.exp) {
                this.num -= b.numToExp(this.exp);
            } else {
                this.num -= this.numToExp(b.exp);
            }*/
            return this;
        }

        pub.subtract = function (b) {
            let r = this.clone(this);
            this.minus.apply(r, b);
            return r;
        }

        pub.lessThen = function (b) {
            return (this.exp === b.exp)? 0 :  (this.exp > b.exp ? -1:-1);
        }

        pub.biggerThen = function (b) {
            return (this.exp === b.exp)? 0 :  (this.exp > b.exp ? 1:-1);
        }

        return pub;
    }

    return addMethods(pub);
})();

export { BigIntNum }