if (this.m.addComp) {
    var ct;
    const csd = dglcvs.compStDt;

    var types = this.compType;
    var open = this.compTypeOpen;
    if (mdx >= 0 && mdx <= 120 && mdy >= 0 && mdy <= 195) {

        if (this.m.compMenu.sel && mdx < 65 && mdy >= this.m.compMenu.dragArea[0] && mdy <= this.m.compMenu.dragArea[1]) {
            this.m.compMenu.isDrag = 1;
            this.m.compMenu.mdx = mdx;
            this.m.compMenu.mdy = mdy;
            var newid = this.m.compMenu.sel + Object.keys(this.chip[this.chipActive].comp).length;
            var ins = {};

            if (this.m.compMenu.sel.startsWith('chip.')) {
                var chipNameSplit = this.m.compMenu.sel.split('.');

                chipNameSplit.shift();

                var chipName = chipNameSplit.join('.');

                var ins = this.chip[chipName].ins;
                var outs = this.chip[chipName].outs;
                var posOrder = this.chip[chipName].posOrder;

                this.m.compMenu.comp = {
                    id: newid,
                    type: this.m.compMenu.sel,
                    x: 0,
                    y: 0,
                    state: 0,
                    inputs: Object.keys(ins),
                    outputs: Object.keys(outs),
                    ins: ins,
                    outs: outs,
                    inConns: [],
                    outConns: [],
                    posOrder: posOrder,
                    nextInput: 0,
                    nextOutput: 0,
                    xOfs: 35,
                    yOfs: (this.m.compMenu.dragArea[0] + this.m.compMenu.dragArea[1]) / 2,
                    revIns: 0,
                    states: {},
                }
            } else {
                for (var i in this.compInOuts[this.m.compMenu.sel][0]) {
                    var xi = this.compInOuts[this.m.compMenu.sel][0][i];
                    if (['demux', 'mux'].includes(this.m.compMenu.sel) && xi == 'sel') {
                        ins[xi] = {
                            pos: 'left',
                            pin: xi,
                        }
                    } else {
                        ins[xi] = {
                            pos: 'top',
                            pin: xi,
                        }
                    }
                }

                var outs = {};
                for (var o in this.compInOuts[this.m.compMenu.sel][1]) {
                    var xo = this.compInOuts[this.m.compMenu.sel][1][o];
                    outs[xo] = {
                        pos: 'bottom',
                        pout: xo,
                    }
                }

                this.m.compMenu.comp = {
                    id: newid,
                    type: this.m.compMenu.sel,
                    x: 0,
                    y: 0,
                    state: 0,
                    inputs: this.compInOuts[this.m.compMenu.sel][0],
                    outputs: this.compInOuts[this.m.compMenu.sel][1],
                    ins: ins,
                    outs: outs,
                    inConns: [],
                    outConns: [],
                    posOrder: {ins: [], outs: [], pos: {}},
                    nextInput: 0,
                    nextOutput: 0,
                    xOfs: 35,
                    yOfs: (this.m.compMenu.dragArea[0] + this.m.compMenu.dragArea[1]) / 2,
                    revIns: 0,
                    states: {},
                }
            }

            return;
        } else {
            this.m.compMenu.isDrag = 0;
            this.m.compMenu.comp = 0;
        }
        var i = 1;
        const ppY = -Math.floor(this.m.compMenu.pan.yOfs + this.m.compMenu.pan.ofsY)
        for (var p in types) {
            ct = types[p];

            if (mdx <= 60 && mdy >= 10 * i - 5 + ppY * 2.5 && mdy <= 10 * (i + 1) + ppY * 2.5 + 5) {

                if (p in open) {
                    delete this.compTypeOpen[p]
                } else {
                    this.compTypeOpen[p] = 1;
                }
                break;
            }
            i++;
            if (p in open) {
                var im;
                for (var g in types[p]) {
                    if (this.chipActive == 'main' && ['pin', 'pout'].includes(types[p][g]) || types[p][g] == 'chip.' + this.chipActive) {
                        continue;
                    }
                    im = i
                    i++;
                    if (types[p][g] in csd) {
                        i += 1 + 15 * ((100 + csd[types[p][g]][0]) / 100) / 10;
                    } else {
                        i += 1 + 1
                    }


                    if (mdx < 65 && mdy >= 10 * im + ppY * 2.5 && mdy <= 10 * (i) + ppY * 2.5) {
                        this.m.compMenu.sel = types[p][g];
                        this.m.compMenu.dragArea = [10 * im + ppY * 2.5, 10 * (i) + ppY * 2.5]


                        if (0) {
                        }
                        return;
                    }
                }
                i++
            }

        }
        return;
    }
}
   