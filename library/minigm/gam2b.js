
var gam2 = {
    'start': function (ra, vs, rd) {
        this.init.parents.apply(gam2.init);
        this.init.parents.apply(gam2.model);
        this.init.parents.apply(gam2.view);
        this.init.parents.apply(gam2.action);
        this.model.constr.init();
        this.init.topBar(ra);
    },
    'init': {
        'parents': function () {
            this.view = gam2.view;
            this.model = gam2.model;
            this.action = gam2.action;
        },
        'topBar': function (ra) {
            this.view.topBar = ra.container('topbar','div')
                .addText(' ')

                .container('fa fa-donate','i')
                .up()
                .container('s-money','span')
                .addText('0')
                .up()

                .container('fa fa-plug','i')
                .up()
                .container('s-power','span')
                .addText('0')
                .up()

                .container('fa fa-child','i')
                .up()
                .container('s-people','span')
                .addText('0')
                .up()
                .up()
                .br()
                .container('main', 'div');

        }
    },
    'view': {},
    'model': {
        'constr': {
            'getAddFunc': function (defaultProp) {
                var defaults = JSON.parse(JSON.stringify(defaultProp));

                return function (prop) {
                    var pub = {...defaults, ...prop};

                    pub.chain = {
                        'parent': null,
                        'child': null,
                        'next': null,
                        'prev': null,
                        'first': null,
                        'addChildObj': function (obj) {
                            obj.chain.parent = this;
                            this.child = obj;
                            return this;
                        },
                        'nextObj': function (obj) {
                            obj.chain.prev = this;
                            obj.chain.first = this.first;
                            this.next = obj;
                            return obj;
                        },
                    };
                    pub.chain.first = pub;

                    return pub;
                }
            },
            'init': function () {
                this.addLoc = this.getAddFunc({
                    'name': '',
                    'type': '',
                    'lvl': 0,
                    'pos': 0,
                    'cardType': 'empty',
                });

                this.addSlot = this.getAddFunc({
                    'item': 0,
                    'amount': 0,
                    'unitValue': 0,
                });

                this.addBox = this.getAddFunc({
                    'type': 0,
                    'level': 0,
                    'levelCost': 0,
                    'moneyCost': 0,
                    'peopleCost': 0,
                    'powerCost': 0,
                });
            },
            'addLoc': function (prop) {},
            'addSlot': function (prop) {},
            'addBox': function (prop) {},
        }
    },
    'action': {},
}



export { gam2 };