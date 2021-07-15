class Comp{

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
