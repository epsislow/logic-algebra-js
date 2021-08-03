class CompDecorator {
	
	constructor(compDec = false) {
		if (compDec !== false && compDec.constructor.name != 'CompDecorator') {
			throw new Error("Expected CompDecorator");
		}
		this.nextDec = compDec;
	}
	
	applyDec(name = 'def') {
		if (this.nextDec) {
			console.log(this.nextDec.applyDec(name));
		}
		return this[name]();
	}
	
	def() {
		return this.constructor.name;
	}
}


let c = new CompDecorator();

let d = new CompDecorator(c);
let e = new CompDecorator(d);
console.log(e.applyDec());

/*
class Comp extends Evaled{

	constructor(type, name, x, y) {
		this.pins = []
		this.pouts = [];
		
		this.nextPin = 0;
		this.nextPout = 0;
	
		this.xOfs = 0;
		this.yOfs = 0;
	
		this.states = {};
	}

	addPin() {
	}

	addPout() {
	}

	connectCompPoutToPin() {
	}

	connectPoutToCompPin() {
	}

	disconnectPin() {
	}
	
	disconnectPout() {
	}
	
	notifyComps() {
		for(var cc of this.connectedComps) {
			cc.pout
			cc.comp.subscriber(this.id, this.valuesSet);
		}
	}
}

class Evaled{
	const name
	
	let draw = function() {
	};
	
	const pins= {};
	const inStates= {};
	const outStates= {out: 0};
	
	set values(values) {
		this.valuesSet = values;
	}
	
	get values() {
		return this.valuesSet;
	}
	
	subscriber(pin, pinValue) {
		if (inStates[pin] == pinValue) {
			return false;
		}
		calcValues(inStates);
		
		return true;
	}
	
	calcValues(inStates = {}) {
		 return;
	}
}
*/
/*

{
	id:newid,
	type:this.m.compMenu.sel,
	x:0,
	y:0,
	state:0,
	inputs: Object.keys(ins),
	outputs:Object.keys(outs),
	ins: ins, 
	outs: outs,
	inConns: [],
	outConns: [],
	nextInput:0,
	nextOutput:0,
	xOfs:35,
	yOfs:(this.m.compMenu.dragArea[0]+this.m.compMenu.dragArea[1])/2,
	revIns:0,
	states: {},
}
*/

export {CompDecorator};