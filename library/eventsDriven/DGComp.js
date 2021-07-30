class Comp extends CompType{

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


class CompType{
	const name;
	
	let draw = function() {
	};
	
	const pins= {};
	const outStates= {out: 0};
	
	set values(values) {
		this.valuesSet = values;
	}
	
	get values() {
		return this.valuesSet;
	}
	
	subscriber(pin, pinValue) {
		this.calcValues(
		return;
	}
	
	calcValues(inStates = {}) {
		return;
	}
}


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
