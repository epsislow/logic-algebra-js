/*
 Module: AddLang
 Version: 2.0.1
 Author: epsislow@gmail.com
*/

var lex = (function() {
    const digits= '0123456789';

    const tks = {
    plus : '+',
    minus: '-',
    divide : '/',
    multiply: '*',
    assign:'=',
    paraSt:'(',
    paraEd:')',
    
    varSt: '{',
    varEnd: '}',
    store: ':',
    endExpr:';',
    stPar:'(',
    endPar:')',
    stDefArray:'(',
    endDefArray:')',
    stArrayIdx:'[',
    endArrayIdx:']',
    prevArrayIdx:'<',
    }
    const anyFromTheList = 'anyFromTheList';
    const expr = {
        'opMult': tks.multiply,
        'opDiv': tks.divide,
        'opSub': tks.minus,
        'opAdd': tks.plus,
        'opMultDiv': [anyFromTheList, 'opMult', 'opDiv'],
        'opSubAdd': [anyFromTheList, 'opSub', 'opAdd'],
        'binary': ['numeric', 'opMultDiv', 'numeric'],
        'binaryOrLiteral': [anyFromTheList, 'binary', 'numeric'],

    };

    let pub = {};

    pub.parse = function (string = '') {
        let ast = this.tokenize(string);

        console.log(ast);

        return this.interpret(ast);
    }

    pub.tokenize = function (string) {
        let ast = [];

        return ast;
    }

    pub.interpret = function (ast) {

    }

    pub.eval = function (ast = []) {

    }

    return pub;
})();

console.log(lex.parse('a + b'));