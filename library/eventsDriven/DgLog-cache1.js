export default {one: {
  "chipActive": "Memtest",
  "chip": {
    "main": {
      "ins": [],
      "outs": [],
      "comp": {
        "Memory1": {
          "id": "Memory1",
          "type": "chip.mem",
          "x": 2.75,
          "y": -0.5,
          "state": 0,
          "inputs": [
            "Clk",
            "En",
            "Dt"
          ],
          "outputs": [
            "Nq",
            "Q"
          ],
          "ins": {
            "Clk": {
              "pos": "top",
              "pin": "Clk",
              "pinx": 69,
              "piny": 100.5,
              "xtt": 0,
              "ytt": -5,
              "id": "CLK",
              "pout": "out"
            },
            "En": {
              "pos": "top",
              "pin": "En",
              "pinx": 74,
              "piny": 100.5,
              "xtt": 0,
              "ytt": -5,
              "id": "En",
              "pout": "out"
            },
            "Dt": {
              "pos": "top",
              "pin": "Dt",
              "pinx": 79,
              "piny": 100.5,
              "xtt": 0,
              "ytt": -5,
              "id": "Dt",
              "pout": "out"
            }
          },
          "outs": {
            "Nq": {
              "pos": "bottom",
              "pout": "Nq",
              "pinx": 70.25,
              "piny": 119.5,
              "xtt": 0,
              "ytt": 7,
              "id": "Nq"
            },
            "Q": {
              "pos": "bottom",
              "pout": "Q",
              "pinx": 77.75,
              "piny": 119.5,
              "xtt": 0,
              "ytt": 7,
              "id": "Q"
            }
          },
          "inConns": [
            "CLK^out",
            "En^out",
            "Dt^out"
          ],
          "outConns": [
            "Q^in"
          ],
          "nextInput": 0,
          "nextOutput": 0,
          "xOfs": 0,
          "yOfs": 0,
          "revIns": 0,
          "states": {
            "Nq": 1,
            "Q": 0
          },
          "st": 0,
          "dt": 0,
          "rt": 0
        },
        "Dt": {
          "id": "Dt",
          "type": "controlled",
          "x": 3.5,
          "y": -3,
          "state": 0,
          "inputs": [],
          "outputs": [
            "out"
          ],
          "ins": {},
          "outs": {
            "out": {
              "pos": "bottom",
              "pout": "out",
              "pinx": 111.5,
              "piny": 49.5,
              "xtt": 0,
              "ytt": 7,
              "id": "Memory1"
            }
          },
          "inConns": [],
          "outConns": [
            "Memory1^En",
            "Memory1^Dt"
          ],
          "nextInput": 0,
          "nextOutput": 0,
          "xOfs": 0,
          "yOfs": 0,
          "revIns": 0,
          "states": {
            "out": 0
          },
          "st": -7.5,
          "dt": 0,
          "rt": 0
        },
        "En": {
          "id": "En",
          "type": "controlled",
          "x": 2.25,
          "y": -3,
          "state": 0,
          "inputs": [],
          "outputs": [
            "out"
          ],
          "ins": {},
          "outs": {
            "out": {
              "pos": "bottom",
              "pout": "out",
              "pinx": 49,
              "piny": 49.5,
              "xtt": 0,
              "ytt": 7,
              "id": "Memory1"
            }
          },
          "inConns": [],
          "outConns": [
            "Memory1^Clk",
            "Memory1^En"
          ],
          "nextInput": 0,
          "nextOutput": 0,
          "xOfs": 0,
          "yOfs": 0,
          "revIns": 0,
          "states": {
            "out": 0
          },
          "st": -7.5,
          "dt": 0,
          "rt": 0
        },
        "CLK": {
          "id": "CLK",
          "type": "clock",
          "x": 4.25,
          "y": -1.5,
          "state": 0,
          "inputs": [],
          "outputs": [
            "out"
          ],
          "ins": {},
          "outs": {
            "out": {
              "pos": "bottom",
              "pout": "out",
              "pinx": 149,
              "piny": 94.5,
              "xtt": 0,
              "ytt": 7,
              "id": "Memory1"
            }
          },
          "inConns": [],
          "outConns": [
            "Memory1^Dt",
            "Memory1^Clk",
            "Memory4^Clk"
          ],
          "nextInput": 0,
          "nextOutput": 0,
          "xOfs": 0,
          "yOfs": 0,
          "revIns": 0,
          "states": {
            "out": 1
          },
          "st": 0,
          "dt": 0,
          "rt": 0,
          "varStates": {
            "out": 1
          }
        },
        "Q": {
          "id": "Q",
          "type": "led",
          "x": 3.5,
          "y": 1.5,
          "state": 0,
          "inputs": [
            "in"
          ],
          "outputs": [],
          "ins": {
            "in": {
              "pos": "top",
              "pin": "in",
              "pinx": 111.5,
              "piny": 150.5,
              "xtt": 0,
              "ytt": -5,
              "id": "Memory1",
              "pout": "Q"
            }
          },
          "outs": {},
          "inConns": [],
          "outConns": [],
          "nextInput": 0,
          "nextOutput": 0,
          "xOfs": 0,
          "yOfs": 0,
          "revIns": 0,
          "states": {
            "out": 0
          },
          "st": 0,
          "dt": 0,
          "rt": 0,
          "varStates": {}
        },
        "NQ": {
          "id": "NQ",
          "type": "led",
          "x": 2.5,
          "y": 1.5,
          "state": 0,
          "inputs": [
            "in"
          ],
          "outputs": [],
          "ins": {
            "in": {
              "pos": "top",
              "pin": "in",
              "pinx": 61.5,
              "piny": 150.5,
              "xtt": 0,
              "ytt": -5,
              "id": "Memory1",
              "pout": "Nq"
            }
          },
          "outs": {},
          "inConns": [],
          "outConns": [],
          "nextInput": 0,
          "nextOutput": 0,
          "xOfs": 0,
          "yOfs": 0,
          "revIns": 0,
          "states": {
            "out": 1
          },
          "st": 0,
          "dt": 0,
          "rt": 0,
          "varStates": {}
        },
        "Adr2": {
          "id": "Adr2",
          "type": "controlled",
          "x": 8.5,
          "y": -2,
          "state": 0,
          "inputs": [],
          "outputs": [
            "out"
          ],
          "ins": {},
          "outs": {
            "out": {
              "pos": "bottom",
              "pout": "out",
              "pinx": 361.5,
              "piny": 74.5,
              "xtt": 0,
              "ytt": 7
            }
          },
          "inConns": [],
          "outConns": [
            "Memory4^Sel1"
          ],
          "nextInput": 0,
          "nextOutput": 0,
          "xOfs": 0,
          "yOfs": 0,
          "revIns": 0,
          "states": {
            "out": 0
          },
          "st": -7.5,
          "dt": 0,
          "rt": 0
        },
        "Adr1": {
          "id": "Adr1",
          "type": "controlled",
          "x": 7.75,
          "y": -2,
          "state": 0,
          "inputs": [],
          "outputs": [
            "out"
          ],
          "ins": {},
          "outs": {
            "out": {
              "pos": "bottom",
              "pout": "out",
              "pinx": 324,
              "piny": 74.5,
              "xtt": 0,
              "ytt": 7
            }
          },
          "inConns": [],
          "outConns": [
            "Memory4^Sel0"
          ],
          "nextInput": 0,
          "nextOutput": 0,
          "xOfs": 0,
          "yOfs": 0,
          "revIns": 0,
          "states": {
            "out": 1
          },
          "st": -7.5,
          "dt": 0,
          "rt": 0
        },
        "En2": {
          "id": "En2",
          "type": "controlled",
          "x": 5.75,
          "y": -2,
          "state": 0,
          "inputs": [],
          "outputs": [
            "out"
          ],
          "ins": {},
          "outs": {
            "out": {
              "pos": "bottom",
              "pout": "out",
              "pinx": 224,
              "piny": 74.5,
              "xtt": 0,
              "ytt": 7
            }
          },
          "inConns": [],
          "outConns": [
            "Memory4^En"
          ],
          "nextInput": 0,
          "nextOutput": 0,
          "xOfs": 0,
          "yOfs": 0,
          "revIns": 0,
          "states": {
            "out": 1
          },
          "st": -7.5,
          "dt": 0,
          "rt": 0
        },
        "Dt2": {
          "id": "Dt2",
          "type": "controlled",
          "x": 6.5,
          "y": -2,
          "state": 0,
          "inputs": [],
          "outputs": [
            "out"
          ],
          "ins": {},
          "outs": {
            "out": {
              "pos": "bottom",
              "pout": "out",
              "pinx": 261.5,
              "piny": 74.5,
              "xtt": 0,
              "ytt": 7
            }
          },
          "inConns": [],
          "outConns": [
            "Memory4^Data"
          ],
          "nextInput": 0,
          "nextOutput": 0,
          "xOfs": 0,
          "yOfs": 0,
          "revIns": 0,
          "states": {
            "out": 1
          },
          "st": -7.5,
          "dt": 0,
          "rt": 0
        },
        "led11": {
          "id": "led11",
          "type": "led",
          "x": 7.25,
          "y": 3.5,
          "state": 0,
          "inputs": [
            "in"
          ],
          "outputs": [],
          "ins": {
            "in": {
              "pos": "top",
              "pin": "in",
              "pinx": 299,
              "piny": 200.5,
              "xtt": 0,
              "ytt": -5,
              "id": "Memory4",
              "pout": "Out"
            }
          },
          "outs": {},
          "inConns": [
            "Memory4^Out"
          ],
          "outConns": [],
          "nextInput": 0,
          "nextOutput": 0,
          "xOfs": 0,
          "yOfs": 0,
          "revIns": 0,
          "states": {
            "out": 1
          },
          "st": 0,
          "dt": 0,
          "rt": 0,
          "varStates": {
            "out": 1
          }
        },
        "Memory4": {
          "id": "Memory4",
          "type": "chip.mem4b",
          "x": 7.75,
          "y": 1.5,
          "state": 0,
          "inputs": [
            "Clk",
            "En",
            "Sel0",
            "Sel1",
            "Data"
          ],
          "outputs": [
            "Out"
          ],
          "ins": {
            "Clk": {
              "pos": "top",
              "pin": "Clk",
              "pinx": 318,
              "piny": 150.5,
              "xtt": 0,
              "ytt": -5,
              "id": "CLK",
              "pout": "out"
            },
            "En": {
              "pos": "top",
              "pin": "En",
              "pinx": 321,
              "piny": 150.5,
              "xtt": 0,
              "ytt": -5,
              "id": "En2",
              "pout": "out"
            },
            "Sel0": {
              "pos": "top",
              "pin": "Sel0",
              "pinx": 324,
              "piny": 150.5,
              "xtt": 0,
              "ytt": -5,
              "id": "Adr1",
              "pout": "out"
            },
            "Sel1": {
              "pos": "top",
              "pin": "Sel1",
              "pinx": 327,
              "piny": 150.5,
              "xtt": 0,
              "ytt": -5,
              "id": "Adr2",
              "pout": "out"
            },
            "Data": {
              "pos": "top",
              "pin": "Data",
              "pinx": 330,
              "piny": 150.5,
              "xtt": 0,
              "ytt": -5,
              "id": "Dt2",
              "pout": "out"
            }
          },
          "outs": {
            "Out": {
              "pos": "bottom",
              "pout": "Out",
              "pinx": 324,
              "piny": 169.5,
              "xtt": 0,
              "ytt": 7
            }
          },
          "inConns": [
            "CLK^out",
            "En2^out",
            "Adr1^out",
            "Adr2^out",
            "Dt2^out"
          ],
          "outConns": [
            "led11^in"
          ],
          "nextInput": 0,
          "nextOutput": 0,
          "xOfs": 0,
          "yOfs": 0,
          "revIns": 0,
          "states": {
            "Out": 1
          },
          "st": 0,
          "dt": 0,
          "rt": 0
        }
      },
      "active": 0,
      "pX": -74.25,
      "pY": 111.75
    },
    "mem": {
      "ins": {
        "Clk": {
          "pos": "top",
          "pin": "Clk",
          "pinx": 41.5,
          "piny": 57,
          "xtt": 0,
          "ytt": -5
        },
        "En": {
          "pos": "top",
          "pin": "En",
          "pinx": 46.5,
          "piny": 57,
          "xtt": 0,
          "ytt": -5
        },
        "Dt": {
          "pos": "top",
          "pin": "Dt",
          "pinx": 51.5,
          "piny": 57,
          "xtt": 0,
          "ytt": -5
        }
      },
      "outs": {
        "Q": {
          "pos": "bottom",
          "pout": "Q",
          "pinx": 42.75,
          "piny": 76,
          "xtt": 0,
          "ytt": 7
        },
        "Nq": {
          "pos": "bottom",
          "pout": "Nq",
          "pinx": 50.25,
          "piny": 76,
          "xtt": 0,
          "ytt": 7
        }
      },
      "comp": {
        "and5": {
          "id": "and5",
          "type": "and",
          "x": 1.75,
          "y": 4.5,
          "state": 0,
          "inputs": [
            "in1",
            "in2"
          ],
          "outputs": [
            "out"
          ],
          "ins": {
            "in1": {
              "pos": "top",
              "pin": "in1",
              "pinx": 56.25,
              "piny": 171.5,
              "xtt": 0,
              "ytt": -5,
              "id": "not4",
              "pout": "out"
            },
            "in2": {
              "pos": "top",
              "pin": "in2",
              "pinx": 63.75,
              "piny": 171.5,
              "xtt": 0,
              "ytt": -5,
              "id": "and8",
              "pout": "out"
            }
          },
          "outs": {
            "out": {
              "pos": "bottom",
              "pout": "out",
              "pinx": 60,
              "piny": 190.5,
              "xtt": 0,
              "ytt": 7
            }
          },
          "inConns": [
            "and8^out",
            "and8^out",
            "and8^out",
            "not4^out"
          ],
          "outConns": [
            "nor2^in1"
          ],
          "nextInput": 1,
          "nextOutput": 0,
          "xOfs": 0,
          "yOfs": 0,
          "revIns": 0,
          "st": 0,
          "dt": 0,
          "rt": 0,
          "states": {
            "out": 0
          },
          "varStates": {}
        },
        "nor2": {
          "id": "nor2",
          "type": "nor",
          "x": 1.75,
          "y": 6.5,
          "state": 0,
          "inputs": [
            "in1",
            "in2"
          ],
          "outputs": [
            "out"
          ],
          "ins": {
            "in1": {
              "pos": "top",
              "pin": "in1",
              "pinx": 56.25,
              "piny": 221.5,
              "xtt": 0,
              "ytt": -5,
              "id": "and5",
              "pout": "out"
            },
            "in2": {
              "pos": "top",
              "pin": "in2",
              "pinx": 63.75,
              "piny": 221.5,
              "xtt": 0,
              "ytt": -5,
              "id": "nor3",
              "pout": "out"
            }
          },
          "outs": {
            "out": {
              "pos": "bottom",
              "pout": "out",
              "pinx": 60,
              "piny": 244.25,
              "xtt": 0,
              "ytt": 7,
              "id": "Q"
            }
          },
          "inConns": [
            "and5^out",
            "nor3^out"
          ],
          "outConns": [
            "nor3^in1",
            "Q^in"
          ],
          "nextInput": 0,
          "nextOutput": 0,
          "xOfs": 0,
          "yOfs": 0,
          "revIns": 0,
          "st": 3.75,
          "dt": 0,
          "rt": 0,
          "states": {
            "out": 1
          },
          "varStates": {}
        },
        "nor3": {
          "id": "nor3",
          "type": "nor",
          "x": 2.75,
          "y": 6.5,
          "state": 0,
          "inputs": [
            "in1",
            "in2"
          ],
          "outputs": [
            "out"
          ],
          "ins": {
            "in1": {
              "pos": "top",
              "pin": "in1",
              "pinx": 106.25,
              "piny": 221.5,
              "xtt": 0,
              "ytt": -5,
              "id": "nor2",
              "pout": "out"
            },
            "in2": {
              "pos": "top",
              "pin": "in2",
              "pinx": 113.75,
              "piny": 221.5,
              "xtt": 0,
              "ytt": -5,
              "id": "and1",
              "pout": "out"
            }
          },
          "outs": {
            "out": {
              "pos": "bottom",
              "pout": "out",
              "pinx": 110,
              "piny": 244.25,
              "xtt": 0,
              "ytt": 7,
              "id": "Nq"
            }
          },
          "inConns": [
            "nor2^out",
            "and1^out"
          ],
          "outConns": [
            "nor2^in2",
            "Nq^in"
          ],
          "nextInput": 0,
          "nextOutput": 0,
          "xOfs": 0,
          "yOfs": 0,
          "revIns": 0,
          "st": 3.75,
          "dt": 0,
          "rt": 0,
          "states": {
            "out": 0
          },
          "varStates": {}
        },
        "and1": {
          "id": "and1",
          "type": "and",
          "x": 2.75,
          "y": 4.5,
          "state": 0,
          "inputs": [
            "in1",
            "in2"
          ],
          "outputs": [
            "out"
          ],
          "ins": {
            "in1": {
              "pos": "top",
              "pin": "in1",
              "pinx": 106.25,
              "piny": 171.5,
              "xtt": 0,
              "ytt": -5,
              "id": "Dt",
              "pout": "out"
            },
            "in2": {
              "pos": "top",
              "pin": "in2",
              "pinx": 113.75,
              "piny": 171.5,
              "xtt": 0,
              "ytt": -5,
              "id": "and8",
              "pout": "out"
            }
          },
          "outs": {
            "out": {
              "pos": "bottom",
              "pout": "out",
              "pinx": 110,
              "piny": 190.5,
              "xtt": 0,
              "ytt": 7
            }
          },
          "inConns": [
            "not4^out",
            "not4^out",
            "and8^out",
            "and8^out"
          ],
          "outConns": [
            "nor3^in2"
          ],
          "nextInput": 0,
          "nextOutput": 0,
          "xOfs": 0,
          "yOfs": 0,
          "revIns": 0,
          "st": 0,
          "dt": 0,
          "rt": 0,
          "states": {
            "out": 0
          },
          "varStates": {}
        },
        "not4": {
          "id": "not4",
          "type": "not",
          "x": 1.75,
          "y": 2,
          "state": 0,
          "inputs": [
            "in"
          ],
          "outputs": [
            "out"
          ],
          "ins": {
            "in": {
              "pos": "top",
              "pin": "in",
              "pinx": 60,
              "piny": 109,
              "xtt": 0,
              "ytt": -5,
              "id": "Dt",
              "pout": "out"
            }
          },
          "outs": {
            "out": {
              "pos": "bottom",
              "pout": "out",
              "pinx": 60,
              "piny": 129.875,
              "xtt": 0,
              "ytt": 7
            }
          },
          "inConns": [],
          "outConns": [
            "and1^in1",
            "and1^in1",
            "and5^in1"
          ],
          "nextInput": 0,
          "nextOutput": 0,
          "xOfs": 0,
          "yOfs": 0,
          "revIns": 0,
          "st": 1.875,
          "dt": 0,
          "rt": 0,
          "states": {
            "out": 1
          },
          "varStates": {}
        },
        "and8": {
          "id": "and8",
          "type": "and",
          "x": 3,
          "y": 2,
          "state": 0,
          "inputs": [
            "in1",
            "in2"
          ],
          "outputs": [
            "out"
          ],
          "ins": {
            "in1": {
              "pos": "top",
              "pin": "in1",
              "pinx": 118.75,
              "piny": 109,
              "xtt": 0,
              "ytt": -5,
              "id": "En",
              "pout": "out"
            },
            "in2": {
              "pos": "top",
              "pin": "in2",
              "pinx": 126.25,
              "piny": 109,
              "xtt": 0,
              "ytt": -5,
              "id": "Clk",
              "pout": "out"
            }
          },
          "outs": {
            "out": {
              "pos": "bottom",
              "pout": "out",
              "pinx": 122.5,
              "piny": 128,
              "xtt": 0,
              "ytt": 7
            }
          },
          "inConns": [],
          "outConns": [
            "and5^in2",
            "and1^in2",
            "and5^in1",
            "and5^in2",
            "and1^in2"
          ],
          "nextInput": 0,
          "nextOutput": 0,
          "xOfs": 0,
          "yOfs": 0,
          "revIns": 0,
          "states": {
            "out": 0
          },
          "st": 0,
          "dt": 0,
          "rt": 0,
          "varStates": {}
        },
        "Clk": {
          "id": "Clk",
          "type": "pin",
          "x": 3,
          "y": -1,
          "state": 0,
          "inputs": [],
          "outputs": [
            "out"
          ],
          "ins": {},
          "outs": {
            "out": {
              "pos": "bottom",
              "pout": "out",
              "pinx": 122.5,
              "piny": 45.5,
              "xtt": 0,
              "ytt": 7
            }
          },
          "inConns": [],
          "outConns": [
            "and8^in2",
            "and8^in2"
          ],
          "nextInput": 0,
          "nextOutput": 0,
          "xOfs": 0,
          "yOfs": 0,
          "revIns": 0,
          "states": {
            "out": 0
          },
          "st": -7.5,
          "dt": 0,
          "rt": 0
        },
        "En": {
          "id": "En",
          "type": "pin",
          "x": 2.25,
          "y": -1,
          "state": 0,
          "inputs": [],
          "outputs": [
            "out"
          ],
          "ins": {},
          "outs": {
            "out": {
              "pos": "bottom",
              "pout": "out",
              "pinx": 85,
              "piny": 45.5,
              "xtt": 0,
              "ytt": 7
            }
          },
          "inConns": [],
          "outConns": [
            "and8^in1"
          ],
          "nextInput": 0,
          "nextOutput": 0,
          "xOfs": 0,
          "yOfs": 0,
          "revIns": 0,
          "states": {
            "out": 0
          },
          "st": -7.5,
          "dt": 0,
          "rt": 0
        },
        "Dt": {
          "id": "Dt",
          "type": "pin",
          "x": 1.75,
          "y": -1,
          "state": 0,
          "inputs": [],
          "outputs": [
            "out"
          ],
          "ins": {},
          "outs": {
            "out": {
              "pos": "bottom",
              "pout": "out",
              "pinx": 60,
              "piny": 45.5,
              "xtt": 0,
              "ytt": 7
            }
          },
          "inConns": [],
          "outConns": [
            "not4^in",
            "and1^in1"
          ],
          "nextInput": 0,
          "nextOutput": 0,
          "xOfs": 0,
          "yOfs": 0,
          "revIns": 0,
          "states": {
            "out": 0
          },
          "st": -7.5,
          "dt": 0,
          "rt": 0
        },
        "Q": {
          "id": "Q",
          "type": "pout",
          "x": 1.75,
          "y": 9,
          "state": 0,
          "inputs": [
            "in"
          ],
          "outputs": [],
          "ins": {
            "in": {
              "pos": "top",
              "pin": "in",
              "pinx": 60,
              "piny": 284,
              "xtt": 0,
              "ytt": -5,
              "id": "nor2",
              "pout": "out"
            }
          },
          "outs": {},
          "inConns": [
            "nor2^out"
          ],
          "outConns": [],
          "nextInput": 0,
          "nextOutput": 0,
          "xOfs": 0,
          "yOfs": 0,
          "revIns": 0,
          "states": {
            "out": 1
          },
          "st": -7.5,
          "dt": 0,
          "rt": 0
        },
        "Nq": {
          "id": "Nq",
          "type": "pout",
          "x": 2.75,
          "y": 9,
          "state": 0,
          "inputs": [
            "in"
          ],
          "outputs": [],
          "ins": {
            "in": {
              "pos": "top",
              "pin": "in",
              "pinx": 110,
              "piny": 284,
              "xtt": 0,
              "ytt": -5,
              "id": "nor3",
              "pout": "out"
            }
          },
          "outs": {},
          "inConns": [
            "nor3^out"
          ],
          "outConns": [],
          "nextInput": 0,
          "nextOutput": 0,
          "xOfs": 0,
          "yOfs": 0,
          "revIns": 0,
          "states": {
            "out": 0
          },
          "st": -7.5,
          "dt": 0,
          "rt": 0
        }
      },
      "active": 0,
      "pX": -38.375,
      "pY": 57
    },
    "mem4b": {
      "ins": {
        "Clk": {
          "pos": "top",
          "pin": "Clk",
          "pinx": 88,
          "piny": 122.5,
          "xtt": 0,
          "ytt": -5,
          "id": "CLK",
          "pout": "out"
        },
        "En": {
          "pos": "top",
          "pin": "En",
          "pinx": 91,
          "piny": 122.5,
          "xtt": 0,
          "ytt": -5,
          "id": "En2",
          "pout": "out"
        },
        "Sel0": {
          "pos": "top",
          "pin": "Sel0",
          "pinx": 94,
          "piny": 122.5,
          "xtt": 0,
          "ytt": -5,
          "id": "Adr1",
          "pout": "out"
        },
        "Sel1": {
          "pos": "top",
          "pin": "Sel1",
          "pinx": 97,
          "piny": 122.5,
          "xtt": 0,
          "ytt": -5,
          "id": "Adr2",
          "pout": "out"
        },
        "Data": {
          "pos": "top",
          "pin": "Data",
          "pinx": 100,
          "piny": 122.5,
          "xtt": 0,
          "ytt": -5,
          "id": "Dt2",
          "pout": "out"
        }
      },
      "outs": {
        "Out": {
          "pos": "bottom",
          "pout": "Out",
          "pinx": 94,
          "piny": 141.5,
          "xtt": 0,
          "ytt": 7
        }
      },
      "comp": {
        "Clk": {
          "id": "Clk",
          "type": "pin",
          "x": 1.75,
          "y": -5.5,
          "state": 0,
          "inputs": [],
          "outputs": [
            "out"
          ],
          "ins": {},
          "outs": {
            "out": {
              "pos": "bottom",
              "pout": "out",
              "pinx": 29,
              "piny": -44,
              "xtt": 0,
              "ytt": 7,
              "id": "mm3"
            }
          },
          "inConns": [],
          "outConns": [
            "mm0^Clk",
            "mm1^Clk",
            "mm3^Clk",
            "mm2^Clk"
          ],
          "nextInput": 0,
          "nextOutput": 0,
          "xOfs": 0,
          "yOfs": 0,
          "revIns": 0,
          "states": {
            "out": 1
          },
          "st": -7.5,
          "dt": 0,
          "rt": 0
        },
        "En": {
          "id": "En",
          "type": "pin",
          "x": 2.75,
          "y": -6,
          "state": 0,
          "inputs": [],
          "outputs": [
            "out"
          ],
          "ins": {},
          "outs": {
            "out": {
              "pos": "bottom",
              "pout": "out",
              "pinx": 79,
              "piny": -56.5,
              "xtt": 0,
              "ytt": 7,
              "id": "mm3"
            }
          },
          "inConns": [],
          "outConns": [
            "mm0^En",
            "mm1^En",
            "mm2^En"
          ],
          "nextInput": 0,
          "nextOutput": 0,
          "xOfs": 0,
          "yOfs": 0,
          "revIns": 0,
          "states": {
            "out": 1
          },
          "st": -7.5,
          "dt": 0,
          "rt": 0
        },
        "Sel0": {
          "id": "Sel0",
          "type": "pin",
          "x": 3.75,
          "y": -8,
          "state": 0,
          "inputs": [],
          "outputs": [
            "out"
          ],
          "ins": {},
          "outs": {
            "out": {
              "pos": "bottom",
              "pout": "out",
              "pinx": 129,
              "piny": -106.5,
              "xtt": 0,
              "ytt": 7
            }
          },
          "inConns": [],
          "outConns": [
            "chip.demux2b12^Sel1",
            "Retriver^Sel0"
          ],
          "nextInput": 0,
          "nextOutput": 0,
          "xOfs": 0,
          "yOfs": 0,
          "revIns": 0,
          "states": {
            "out": 1
          },
          "st": -7.5,
          "dt": 0,
          "rt": 0
        },
        "Sel1": {
          "id": "Sel1",
          "type": "pin",
          "x": 4.25,
          "y": -8,
          "state": 0,
          "inputs": [],
          "outputs": [
            "out"
          ],
          "ins": {},
          "outs": {
            "out": {
              "pos": "bottom",
              "pout": "out",
              "pinx": 154,
              "piny": -106.5,
              "xtt": 0,
              "ytt": 7
            }
          },
          "inConns": [],
          "outConns": [
            "chip.demux2b12^Sel0",
            "Retriver^Sel1"
          ],
          "nextInput": 0,
          "nextOutput": 0,
          "xOfs": 0,
          "yOfs": 0,
          "revIns": 0,
          "states": {
            "out": 0
          },
          "st": -7.5,
          "dt": 0,
          "rt": 0
        },
        "Data": {
          "id": "Data",
          "type": "pin",
          "x": 3,
          "y": -9.5,
          "state": 0,
          "inputs": [],
          "outputs": [
            "out"
          ],
          "ins": {},
          "outs": {
            "out": {
              "pos": "bottom",
              "pout": "out",
              "pinx": 91.5,
              "piny": -144,
              "xtt": 0,
              "ytt": 7
            }
          },
          "inConns": [],
          "outConns": [
            "chip.demux2b12^D"
          ],
          "nextInput": 0,
          "nextOutput": 0,
          "xOfs": 0,
          "yOfs": 0,
          "revIns": 0,
          "states": {
            "out": 1
          },
          "st": -7.5,
          "dt": 0,
          "rt": 0
        },
        "chip.demux2b12": {
          "id": "chip.demux2b12",
          "type": "chip.demux2b",
          "x": 3.5,
          "y": -6,
          "state": 0,
          "inputs": [
            "D",
            "Sel1",
            "Sel0"
          ],
          "outputs": [
            "Out0",
            "Out1",
            "Out2",
            "Out3"
          ],
          "ins": {
            "D": {
              "pos": "top",
              "pin": "D",
              "pinx": 111.5,
              "piny": -68,
              "xtt": 0,
              "ytt": -5,
              "id": "Data",
              "pout": "out"
            },
            "Sel1": {
              "pos": "top",
              "pin": "Sel1",
              "pinx": 116.5,
              "piny": -68,
              "xtt": 0,
              "ytt": -5,
              "id": "Sel0",
              "pout": "out"
            },
            "Sel0": {
              "pos": "top",
              "pin": "Sel0",
              "pinx": 121.5,
              "piny": -68,
              "xtt": 0,
              "ytt": -5,
              "id": "Sel1",
              "pout": "out"
            }
          },
          "outs": {
            "Out0": {
              "pos": "bottom",
              "pout": "Out0",
              "pinx": 110.875,
              "piny": -49,
              "xtt": 0,
              "ytt": 7,
              "id": "mm0"
            },
            "Out1": {
              "pos": "bottom",
              "pout": "Out1",
              "pinx": 114.625,
              "piny": -49,
              "xtt": 0,
              "ytt": 7,
              "id": "mm1"
            },
            "Out2": {
              "pos": "bottom",
              "pout": "Out2",
              "pinx": 118.375,
              "piny": -49,
              "xtt": 0,
              "ytt": 7,
              "id": "mm2"
            },
            "Out3": {
              "pos": "bottom",
              "pout": "Out3",
              "pinx": 122.125,
              "piny": -49,
              "xtt": 0,
              "ytt": 7,
              "id": "mm3"
            }
          },
          "inConns": [
            "Data^out",
            "Sel0^out",
            "Sel1^out"
          ],
          "outConns": [
            "mm0^Dt",
            "mm1^Dt",
            "mm2^Dt",
            "mm3^Dt"
          ],
          "nextInput": 0,
          "nextOutput": 0,
          "xOfs": 0,
          "yOfs": 0,
          "revIns": 0,
          "states": {
            "Out0": 0,
            "Out1": 1,
            "Out2": 0,
            "Out3": 0
          },
          "st": 0,
          "dt": 0,
          "rt": 0
        },
        "Retriver": {
          "id": "Retriver",
          "type": "chip.mux2b",
          "x": 4.5,
          "y": 6,
          "state": 0,
          "inputs": [
            "D0",
            "D1",
            "D2",
            "D3",
            "Sel0",
            "Sel1"
          ],
          "outputs": [
            "Out"
          ],
          "ins": {
            "D0": {
              "pos": "top",
              "pin": "D0",
              "pinx": 160.25,
              "piny": 232,
              "xtt": 0,
              "ytt": -5,
              "id": "mm0",
              "pout": "Q"
            },
            "D1": {
              "pos": "top",
              "pin": "D1",
              "pinx": 162.75,
              "piny": 232,
              "xtt": 0,
              "ytt": -5,
              "id": "mm1",
              "pout": "Q"
            },
            "D2": {
              "pos": "top",
              "pin": "D2",
              "pinx": 165.25,
              "piny": 232,
              "xtt": 0,
              "ytt": -5,
              "id": "mm2",
              "pout": "Q"
            },
            "D3": {
              "pos": "top",
              "pin": "D3",
              "pinx": 167.75,
              "piny": 232,
              "xtt": 0,
              "ytt": -5,
              "id": "mm3",
              "pout": "Q"
            },
            "Sel0": {
              "pos": "top",
              "pin": "Sel0",
              "pinx": 170.25,
              "piny": 232,
              "xtt": 0,
              "ytt": -5,
              "id": "Sel0",
              "pout": "out"
            },
            "Sel1": {
              "pos": "top",
              "pin": "Sel1",
              "pinx": 172.75,
              "piny": 232,
              "xtt": 0,
              "ytt": -5,
              "id": "Sel1",
              "pout": "out"
            }
          },
          "outs": {
            "Out": {
              "pos": "bottom",
              "pout": "Out",
              "pinx": 166.5,
              "piny": 251,
              "xtt": 0,
              "ytt": 7,
              "id": "Out"
            }
          },
          "inConns": [
            "Sel0^out",
            "Sel1^out"
          ],
          "outConns": [
            "Out^in"
          ],
          "nextInput": 0,
          "nextOutput": 0,
          "xOfs": 0,
          "yOfs": 0,
          "revIns": 0,
          "states": {
            "Out": 1
          },
          "st": 0,
          "dt": 0,
          "rt": 0
        },
        "Out": {
          "id": "Out",
          "type": "pout",
          "x": 2.75,
          "y": 8,
          "state": 0,
          "inputs": [
            "in"
          ],
          "outputs": [],
          "ins": {
            "in": {
              "pos": "top",
              "pin": "in",
              "pinx": 79,
              "piny": 282,
              "xtt": 0,
              "ytt": -5,
              "id": "Retriver",
              "pout": "Out"
            }
          },
          "outs": {},
          "inConns": [
            "Retriver^Out"
          ],
          "outConns": [],
          "nextInput": 0,
          "nextOutput": 0,
          "xOfs": 0,
          "yOfs": 0,
          "revIns": 0,
          "states": {
            "out": 1
          },
          "st": -7.5,
          "dt": 0,
          "rt": 0
        },
        "mm0": {
          "id": "mm0",
          "type": "chip.mem",
          "x": 2.25,
          "y": -2.5,
          "state": 0,
          "inputs": [
            "Clk",
            "En",
            "Dt"
          ],
          "outputs": [
            "Q",
            "Nq"
          ],
          "ins": {
            "Clk": {
              "pos": "top",
              "pin": "Clk",
              "pinx": 49,
              "piny": 19.5,
              "xtt": 0,
              "ytt": -5,
              "id": "Clk",
              "pout": "out"
            },
            "En": {
              "pos": "top",
              "pin": "En",
              "pinx": 54,
              "piny": 19.5,
              "xtt": 0,
              "ytt": -5,
              "id": "En",
              "pout": "out"
            },
            "Dt": {
              "pos": "top",
              "pin": "Dt",
              "pinx": 59,
              "piny": 19.5,
              "xtt": 0,
              "ytt": -5,
              "id": "chip.demux2b12",
              "pout": "Out0"
            }
          },
          "outs": {
            "Q": {
              "pos": "bottom",
              "pout": "Q",
              "pinx": 50.25,
              "piny": 38.5,
              "xtt": 0,
              "ytt": 7
            },
            "Nq": {
              "pos": "bottom",
              "pout": "Nq",
              "pinx": 57.75,
              "piny": 38.5,
              "xtt": 0,
              "ytt": 7
            }
          },
          "inConns": [
            "Clk^out",
            "En^out",
            "chip.demux2b12^Out0"
          ],
          "outConns": [
            "Retriver^D0"
          ],
          "nextInput": 0,
          "nextOutput": 1,
          "xOfs": 0,
          "yOfs": 0,
          "revIns": 0,
          "states": {
            "Q": 0,
            "Nq": 1
          },
          "st": 0,
          "dt": 0,
          "rt": 0
        },
        "mm1": {
          "id": "mm1",
          "type": "chip.mem",
          "x": 2,
          "y": 2,
          "state": 0,
          "inputs": [
            "Clk",
            "En",
            "Dt"
          ],
          "outputs": [
            "Q",
            "Nq"
          ],
          "ins": {
            "Clk": {
              "pos": "top",
              "pin": "Clk",
              "pinx": 36.5,
              "piny": 132,
              "xtt": 0,
              "ytt": -5,
              "id": "Clk",
              "pout": "out"
            },
            "En": {
              "pos": "top",
              "pin": "En",
              "pinx": 41.5,
              "piny": 132,
              "xtt": 0,
              "ytt": -5,
              "id": "En",
              "pout": "out"
            },
            "Dt": {
              "pos": "top",
              "pin": "Dt",
              "pinx": 46.5,
              "piny": 132,
              "xtt": 0,
              "ytt": -5,
              "id": "chip.demux2b12",
              "pout": "Out1"
            }
          },
          "outs": {
            "Q": {
              "pos": "bottom",
              "pout": "Q",
              "pinx": 37.75,
              "piny": 151,
              "xtt": 0,
              "ytt": 7
            },
            "Nq": {
              "pos": "bottom",
              "pout": "Nq",
              "pinx": 45.25,
              "piny": 151,
              "xtt": 0,
              "ytt": 7
            }
          },
          "inConns": [
            "Clk^out",
            "En^out",
            "chip.demux2b12^Out1"
          ],
          "outConns": [
            "Retriver^D1"
          ],
          "nextInput": 0,
          "nextOutput": 1,
          "xOfs": 0,
          "yOfs": 0,
          "revIns": 0,
          "states": {
            "Q": 1,
            "Nq": 0
          },
          "st": 0,
          "dt": 0,
          "rt": 0
        },
        "mm2": {
          "id": "mm2",
          "type": "chip.mem",
          "x": 5.25,
          "y": 2.5,
          "state": 0,
          "inputs": [
            "Clk",
            "En",
            "Dt"
          ],
          "outputs": [
            "Q",
            "Nq"
          ],
          "ins": {
            "Clk": {
              "pos": "top",
              "pin": "Clk",
              "pinx": 199,
              "piny": 144.5,
              "xtt": 0,
              "ytt": -5,
              "id": "Clk",
              "pout": "out"
            },
            "En": {
              "pos": "top",
              "pin": "En",
              "pinx": 204,
              "piny": 144.5,
              "xtt": 0,
              "ytt": -5,
              "id": "En",
              "pout": "out"
            },
            "Dt": {
              "pos": "top",
              "pin": "Dt",
              "pinx": 209,
              "piny": 144.5,
              "xtt": 0,
              "ytt": -5,
              "id": "chip.demux2b12",
              "pout": "Out2"
            }
          },
          "outs": {
            "Q": {
              "pos": "bottom",
              "pout": "Q",
              "pinx": 200.25,
              "piny": 163.5,
              "xtt": 0,
              "ytt": 7
            },
            "Nq": {
              "pos": "bottom",
              "pout": "Nq",
              "pinx": 207.75,
              "piny": 163.5,
              "xtt": 0,
              "ytt": 7
            }
          },
          "inConns": [
            "Clk^out",
            "En^out",
            "chip.demux2b12^Out2"
          ],
          "outConns": [
            "Retriver^D2"
          ],
          "nextInput": 0,
          "nextOutput": 1,
          "xOfs": 0,
          "yOfs": 0,
          "revIns": 0,
          "states": {
            "Q": 0,
            "Nq": 1
          },
          "st": 0,
          "dt": 0,
          "rt": 0
        },
        "mm3": {
          "id": "mm3",
          "type": "chip.mem",
          "x": 5,
          "y": -2.5,
          "state": 0,
          "inputs": [
            "Clk",
            "En",
            "Dt"
          ],
          "outputs": [
            "Q",
            "Nq"
          ],
          "ins": {
            "Clk": {
              "pos": "top",
              "pin": "Clk",
              "pinx": 186.5,
              "piny": 19.5,
              "xtt": 0,
              "ytt": -5,
              "id": "Clk",
              "pout": "out"
            },
            "En": {
              "pos": "top",
              "pin": "En",
              "pinx": 191.5,
              "piny": 19.5,
              "xtt": 0,
              "ytt": -5
            },
            "Dt": {
              "pos": "top",
              "pin": "Dt",
              "pinx": 196.5,
              "piny": 19.5,
              "xtt": 0,
              "ytt": -5,
              "id": "chip.demux2b12",
              "pout": "Out3"
            }
          },
          "outs": {
            "Q": {
              "pos": "bottom",
              "pout": "Q",
              "pinx": 187.75,
              "piny": 38.5,
              "xtt": 0,
              "ytt": 7
            },
            "Nq": {
              "pos": "bottom",
              "pout": "Nq",
              "pinx": 195.25,
              "piny": 38.5,
              "xtt": 0,
              "ytt": 7
            }
          },
          "inConns": [
            "Clk^out",
            "En^out",
            "chip.demux2b12^Out3"
          ],
          "outConns": [
            "Retriver^D3"
          ],
          "nextInput": 0,
          "nextOutput": 1,
          "xOfs": 0,
          "yOfs": 0,
          "revIns": 0,
          "states": {
            "Q": 0,
            "Nq": 1
          },
          "st": 0,
          "dt": 0,
          "rt": 0
        }
      },
      "active": 0,
      "pX": -69.75,
      "pY": 80.75
    },
    "mux2b": {
      "ins": {
        "D0": {
          "pos": "top",
          "pin": "D0",
          "pinx": 155.25,
          "piny": 459,
          "xtt": 0,
          "ytt": -5,
          "id": "chip.mem0",
          "pout": "Q"
        },
        "D1": {
          "pos": "top",
          "pin": "D1",
          "pinx": 157.75,
          "piny": 459,
          "xtt": 0,
          "ytt": -5,
          "id": "chip.mem1",
          "pout": "Q"
        },
        "D2": {
          "pos": "top",
          "pin": "D2",
          "pinx": 160.25,
          "piny": 459,
          "xtt": 0,
          "ytt": -5,
          "id": "chip.mem2",
          "pout": "Q"
        },
        "D3": {
          "pos": "top",
          "pin": "D3",
          "pinx": 162.75,
          "piny": 459,
          "xtt": 0,
          "ytt": -5,
          "id": "chip.mem3",
          "pout": "Q"
        },
        "Sel0": {
          "pos": "top",
          "pin": "Sel0",
          "pinx": 165.25,
          "piny": 459,
          "xtt": 0,
          "ytt": -5,
          "id": "Sel0",
          "pout": "out"
        },
        "Sel1": {
          "pos": "top",
          "pin": "Sel1",
          "pinx": 167.75,
          "piny": 459,
          "xtt": 0,
          "ytt": -5,
          "id": "Sel1",
          "pout": "out"
        }
      },
      "outs": {
        "Out": {
          "pos": "bottom",
          "pout": "Out",
          "pinx": 161.5,
          "piny": 478,
          "xtt": 0,
          "ytt": 7,
          "id": "Out"
        }
      },
      "comp": {
        "not5": {
          "id": "not5",
          "type": "not",
          "x": 2.75,
          "y": -7.5,
          "state": 0,
          "inputs": [
            "in"
          ],
          "outputs": [
            "out"
          ],
          "ins": {
            "in": {
              "pos": "top",
              "pin": "in",
              "pinx": -166,
              "piny": 67.5,
              "xtt": 0,
              "ytt": -5,
              "id": "Sel0",
              "pout": "out"
            }
          },
          "outs": {
            "out": {
              "pos": "bottom",
              "pout": "out",
              "pinx": -166,
              "piny": 88.375,
              "xtt": 0,
              "ytt": 7
            }
          },
          "inConns": [],
          "outConns": [
            "and14^in2",
            "and14^in1",
            "and17^in1"
          ],
          "nextInput": 0,
          "nextOutput": 0,
          "xOfs": 0,
          "yOfs": 0,
          "revIns": 0,
          "states": {
            "out": 0
          },
          "st": 1.875,
          "dt": 0,
          "rt": 0,
          "varStates": {}
        },
        "not11": {
          "id": "not11",
          "type": "not",
          "x": 5.75,
          "y": -9,
          "state": 0,
          "inputs": [
            "in"
          ],
          "outputs": [
            "out"
          ],
          "ins": {
            "in": {
              "pos": "top",
              "pin": "in",
              "pinx": -16,
              "piny": 30,
              "xtt": 0,
              "ytt": -5,
              "id": "Sel1",
              "pout": "out"
            }
          },
          "outs": {
            "out": {
              "pos": "bottom",
              "pout": "out",
              "pinx": -16,
              "piny": 50.875,
              "xtt": 0,
              "ytt": 7
            }
          },
          "inConns": [],
          "outConns": [
            "and10^in1",
            "and17^in1",
            "and17^in2",
            "and18^in2",
            "and18^in2"
          ],
          "nextInput": 0,
          "nextOutput": 0,
          "xOfs": 0,
          "yOfs": 0,
          "revIns": 0,
          "states": {
            "out": 1
          },
          "st": 1.875,
          "dt": 0,
          "rt": 0,
          "varStates": {}
        },
        "and17": {
          "id": "and17",
          "type": "and",
          "x": 6.25,
          "y": -6.5,
          "state": 0,
          "inputs": [
            "in1",
            "in2"
          ],
          "outputs": [
            "out"
          ],
          "ins": {
            "in1": {
              "pos": "top",
              "pin": "in1",
              "pinx": 5.25,
              "piny": 92.5,
              "xtt": 0,
              "ytt": -5,
              "id": "not5",
              "pout": "out"
            },
            "in2": {
              "pos": "top",
              "pin": "in2",
              "pinx": 12.75,
              "piny": 92.5,
              "xtt": 0,
              "ytt": -5,
              "id": "not11",
              "pout": "out"
            }
          },
          "outs": {
            "out": {
              "pos": "bottom",
              "pout": "out",
              "pinx": 9,
              "piny": 111.5,
              "xtt": 0,
              "ytt": 7
            }
          },
          "inConns": [
            "not11^out",
            "not11^out",
            "not5^out"
          ],
          "outConns": [
            "and10^in1",
            "and10^in2",
            "and10^in1"
          ],
          "nextInput": 1,
          "nextOutput": 0,
          "xOfs": 0,
          "yOfs": 0,
          "revIns": 1,
          "states": {
            "out": 0
          },
          "st": 0,
          "dt": 0,
          "rt": 0,
          "varStates": {}
        },
        "and18": {
          "id": "and18",
          "type": "and",
          "x": 5.5,
          "y": -5.5,
          "state": 0,
          "inputs": [
            "in1",
            "in2"
          ],
          "outputs": [
            "out"
          ],
          "ins": {
            "in1": {
              "pos": "top",
              "pin": "in1",
              "pinx": -32.25,
              "piny": 117.5,
              "xtt": 0,
              "ytt": -5,
              "id": "Sel0",
              "pout": "out"
            },
            "in2": {
              "pos": "top",
              "pin": "in2",
              "pinx": -24.75,
              "piny": 117.5,
              "xtt": 0,
              "ytt": -5,
              "id": "not11",
              "pout": "out"
            }
          },
          "outs": {
            "out": {
              "pos": "bottom",
              "pout": "out",
              "pinx": -28.5,
              "piny": 136.5,
              "xtt": 0,
              "ytt": 7
            }
          },
          "inConns": [
            "not11^out",
            "not11^out"
          ],
          "outConns": [
            "and9^in1",
            "and9^in1",
            "and9^in1"
          ],
          "nextInput": 1,
          "nextOutput": 0,
          "xOfs": 0,
          "yOfs": 0,
          "revIns": 1,
          "states": {
            "out": 1
          },
          "st": 0,
          "dt": 0,
          "rt": 0,
          "varStates": {}
        },
        "and14": {
          "id": "and14",
          "type": "and",
          "x": 4.75,
          "y": -4.5,
          "state": 0,
          "inputs": [
            "in1",
            "in2"
          ],
          "outputs": [
            "out"
          ],
          "ins": {
            "in1": {
              "pos": "top",
              "pin": "in1",
              "pinx": -69.75,
              "piny": 142.5,
              "xtt": 0,
              "ytt": -5,
              "id": "Sel1",
              "pout": "out"
            },
            "in2": {
              "pos": "top",
              "pin": "in2",
              "pinx": -62.25,
              "piny": 142.5,
              "xtt": 0,
              "ytt": -5,
              "id": "Sel1",
              "pout": "out"
            }
          },
          "outs": {
            "out": {
              "pos": "bottom",
              "pout": "out",
              "pinx": -66,
              "piny": 161.5,
              "xtt": 0,
              "ytt": 7
            }
          },
          "inConns": [
            "not11^out",
            "Sel0^out",
            "Sel0^out",
            "Sel0^out",
            "not5^out",
            "not5^out"
          ],
          "outConns": [
            "and6^in1"
          ],
          "nextInput": 1,
          "nextOutput": 0,
          "xOfs": 0,
          "yOfs": 0,
          "revIns": 1,
          "states": {
            "out": 0
          },
          "st": 0,
          "dt": 0,
          "rt": 0,
          "varStates": {}
        },
        "and13": {
          "id": "and13",
          "type": "and",
          "x": 4,
          "y": -3.5,
          "state": 0,
          "inputs": [
            "in1",
            "in2"
          ],
          "outputs": [
            "out"
          ],
          "ins": {
            "in1": {
              "pos": "top",
              "pin": "in1",
              "pinx": -107.25,
              "piny": 167.5,
              "xtt": 0,
              "ytt": -5,
              "id": "Sel0",
              "pout": "out"
            },
            "in2": {
              "pos": "top",
              "pin": "in2",
              "pinx": -99.75,
              "piny": 167.5,
              "xtt": 0,
              "ytt": -5,
              "id": "Sel1",
              "pout": "out"
            }
          },
          "outs": {
            "out": {
              "pos": "bottom",
              "pout": "out",
              "pinx": -103.5,
              "piny": 186.5,
              "xtt": 0,
              "ytt": 7
            }
          },
          "inConns": [
            "not5^out",
            "not5^out"
          ],
          "outConns": [
            "and4^in1"
          ],
          "nextInput": 1,
          "nextOutput": 0,
          "xOfs": 0,
          "yOfs": 0,
          "revIns": 1,
          "states": {
            "out": 0
          },
          "st": 0,
          "dt": 0,
          "rt": 0,
          "varStates": {}
        },
        "and4": {
          "id": "and4",
          "type": "and",
          "x": 4.75,
          "y": 0.5,
          "state": 0,
          "inputs": [
            "in1",
            "in2"
          ],
          "outputs": [
            "out"
          ],
          "ins": {
            "in1": {
              "pos": "top",
              "pin": "in1",
              "pinx": -69.75,
              "piny": 267.5,
              "xtt": 0,
              "ytt": -5,
              "id": "and13",
              "pout": "out"
            },
            "in2": {
              "pos": "top",
              "pin": "in2",
              "pinx": -62.25,
              "piny": 267.5,
              "xtt": 0,
              "ytt": -5,
              "id": "D0",
              "pout": "out"
            }
          },
          "outs": {
            "out": {
              "pos": "bottom",
              "pout": "out",
              "pinx": -66,
              "piny": 286.5,
              "xtt": 0,
              "ytt": 7
            }
          },
          "inConns": [
            "and13^out",
            "D0^out",
            "D0^out",
            "and13^out"
          ],
          "outConns": [
            "or18^in1"
          ],
          "nextInput": 1,
          "nextOutput": 0,
          "xOfs": 0,
          "yOfs": 0,
          "revIns": 1,
          "states": {
            "out": 0
          },
          "st": 0,
          "dt": 0,
          "rt": 0,
          "varStates": {}
        },
        "and6": {
          "id": "and6",
          "type": "and",
          "x": 5.5,
          "y": 0.5,
          "state": 0,
          "inputs": [
            "in1",
            "in2"
          ],
          "outputs": [
            "out"
          ],
          "ins": {
            "in1": {
              "pos": "top",
              "pin": "in1",
              "pinx": -32.25,
              "piny": 267.5,
              "xtt": 0,
              "ytt": -5,
              "id": "and14",
              "pout": "out"
            },
            "in2": {
              "pos": "top",
              "pin": "in2",
              "pinx": -24.75,
              "piny": 267.5,
              "xtt": 0,
              "ytt": -5,
              "id": "D2",
              "pout": "out"
            }
          },
          "outs": {
            "out": {
              "pos": "bottom",
              "pout": "out",
              "pinx": -28.5,
              "piny": 286.5,
              "xtt": 0,
              "ytt": 7
            }
          },
          "inConns": [
            "not5^out",
            "and14^out",
            "D1^out",
            "D1^out",
            "and14^out",
            "D2^out"
          ],
          "outConns": [
            "or18^in2"
          ],
          "nextInput": 0,
          "nextOutput": 0,
          "xOfs": 0,
          "yOfs": 0,
          "revIns": 1,
          "states": {
            "out": 0
          },
          "st": 0,
          "dt": 0,
          "rt": 0,
          "varStates": {}
        },
        "and9": {
          "id": "and9",
          "type": "and",
          "x": 6.5,
          "y": -2,
          "state": 0,
          "inputs": [
            "in1",
            "in2"
          ],
          "outputs": [
            "out"
          ],
          "ins": {
            "in1": {
              "pos": "top",
              "pin": "in1",
              "pinx": 17.75,
              "piny": 205,
              "xtt": 0,
              "ytt": -5,
              "id": "and18",
              "pout": "out"
            },
            "in2": {
              "pos": "top",
              "pin": "in2",
              "pinx": 25.25,
              "piny": 205,
              "xtt": 0,
              "ytt": -5,
              "id": "D1",
              "pout": "out"
            }
          },
          "outs": {
            "out": {
              "pos": "bottom",
              "pout": "out",
              "pinx": 21.5,
              "piny": 224,
              "xtt": 0,
              "ytt": 7
            }
          },
          "inConns": [
            "and18^out",
            "D2^out",
            "D2^out",
            "and18^out",
            "D2^out",
            "and18^out",
            "D1^out",
            "and18^out"
          ],
          "outConns": [
            "or17^in1"
          ],
          "nextInput": 1,
          "nextOutput": 0,
          "xOfs": 0,
          "yOfs": 0,
          "revIns": 1,
          "states": {
            "out": 1
          },
          "st": 0,
          "dt": 0,
          "rt": 0,
          "varStates": {}
        },
        "and10": {
          "id": "and10",
          "type": "and",
          "x": 7.25,
          "y": -2,
          "state": 0,
          "inputs": [
            "in1",
            "in2"
          ],
          "outputs": [
            "out"
          ],
          "ins": {
            "in1": {
              "pos": "top",
              "pin": "in1",
              "pinx": 55.25,
              "piny": 205,
              "xtt": 0,
              "ytt": -5,
              "id": "and17",
              "pout": "out"
            },
            "in2": {
              "pos": "top",
              "pin": "in2",
              "pinx": 62.75,
              "piny": 205,
              "xtt": 0,
              "ytt": -5,
              "id": "D3",
              "pout": "out"
            }
          },
          "outs": {
            "out": {
              "pos": "bottom",
              "pout": "out",
              "pinx": 59,
              "piny": 224,
              "xtt": 0,
              "ytt": 7
            }
          },
          "inConns": [
            "not11^out",
            "not11^out",
            "and17^out",
            "D3^out",
            "D3^out",
            "and17^out",
            "and17^out",
            "and17^out",
            "D3^out"
          ],
          "outConns": [
            "or17^in2"
          ],
          "nextInput": 0,
          "nextOutput": 0,
          "xOfs": 0,
          "yOfs": 0,
          "revIns": 1,
          "states": {
            "out": 0
          },
          "st": 0,
          "dt": 0,
          "rt": 0,
          "varStates": {}
        },
        "Out": {
          "id": "Out",
          "type": "pout",
          "x": 6.25,
          "y": 6.5,
          "state": 0,
          "inputs": [
            "in"
          ],
          "outputs": [],
          "ins": {
            "in": {
              "pos": "top",
              "pin": "in",
              "pinx": 9,
              "piny": 417.5,
              "xtt": 0,
              "ytt": -5,
              "id": "or19",
              "pout": "out"
            }
          },
          "outs": {},
          "inConns": [
            "or19^out"
          ],
          "outConns": [],
          "nextInput": 0,
          "nextOutput": 0,
          "xOfs": 0,
          "yOfs": 0,
          "revIns": 1,
          "states": {
            "out": 1
          },
          "st": -7.5,
          "dt": 0,
          "rt": 0
        },
        "D0": {
          "id": "D0",
          "type": "pin",
          "x": 7,
          "y": -7.5,
          "state": 0,
          "inputs": [],
          "outputs": [
            "out"
          ],
          "ins": {},
          "outs": {
            "out": {
              "pos": "bottom",
              "pout": "out",
              "pinx": 46.5,
              "piny": 79,
              "xtt": 0,
              "ytt": 7
            }
          },
          "inConns": [],
          "outConns": [
            "and4^in1",
            "and4^in2"
          ],
          "nextInput": 0,
          "nextOutput": 0,
          "xOfs": 0,
          "yOfs": 0,
          "revIns": 0,
          "states": {
            "out": 0
          },
          "st": -7.5,
          "dt": 0,
          "rt": 0
        },
        "D1": {
          "id": "D1",
          "type": "pin",
          "x": 7.75,
          "y": -7.5,
          "state": 0,
          "inputs": [],
          "outputs": [
            "out"
          ],
          "ins": {},
          "outs": {
            "out": {
              "pos": "bottom",
              "pout": "out",
              "pinx": 84,
              "piny": 79,
              "xtt": 0,
              "ytt": 7
            }
          },
          "inConns": [],
          "outConns": [
            "and6^in1",
            "and6^in2",
            "and9^in2"
          ],
          "nextInput": 0,
          "nextOutput": 0,
          "xOfs": 0,
          "yOfs": 0,
          "revIns": 0,
          "states": {
            "out": 1
          },
          "st": -7.5,
          "dt": 0,
          "rt": 0
        },
        "D2": {
          "id": "D2",
          "type": "pin",
          "x": 8.5,
          "y": -7.5,
          "state": 0,
          "inputs": [],
          "outputs": [
            "out"
          ],
          "ins": {},
          "outs": {
            "out": {
              "pos": "bottom",
              "pout": "out",
              "pinx": 121.5,
              "piny": 79,
              "xtt": 0,
              "ytt": 7
            }
          },
          "inConns": [],
          "outConns": [
            "and9^in1",
            "and9^in2",
            "and9^in2",
            "and6^in2"
          ],
          "nextInput": 0,
          "nextOutput": 0,
          "xOfs": 0,
          "yOfs": 0,
          "revIns": 1,
          "states": {
            "out": 0
          },
          "st": -7.5,
          "dt": 0,
          "rt": 0
        },
        "D3": {
          "id": "D3",
          "type": "pin",
          "x": 9.25,
          "y": -7.5,
          "state": 0,
          "inputs": [],
          "outputs": [
            "out"
          ],
          "ins": {},
          "outs": {
            "out": {
              "pos": "bottom",
              "pout": "out",
              "pinx": 159,
              "piny": 79,
              "xtt": 0,
              "ytt": 7
            }
          },
          "inConns": [],
          "outConns": [
            "and10^in2",
            "and10^in2"
          ],
          "nextInput": 0,
          "nextOutput": 0,
          "xOfs": 0,
          "yOfs": 0,
          "revIns": 0,
          "states": {
            "out": 0
          },
          "st": -7.5,
          "dt": 0,
          "rt": 0
        },
        "or17": {
          "id": "or17",
          "type": "or",
          "x": 7,
          "y": 0,
          "state": 0,
          "inputs": [
            "in1",
            "in2"
          ],
          "outputs": [
            "out"
          ],
          "ins": {
            "in1": {
              "pos": "top",
              "pin": "in1",
              "pinx": 42.75,
              "piny": 255,
              "xtt": 0,
              "ytt": -5,
              "id": "and9",
              "pout": "out"
            },
            "in2": {
              "pos": "top",
              "pin": "in2",
              "pinx": 50.25,
              "piny": 255,
              "xtt": 0,
              "ytt": -5,
              "id": "and10",
              "pout": "out"
            }
          },
          "outs": {
            "out": {
              "pos": "bottom",
              "pout": "out",
              "pinx": 46.5,
              "piny": 274,
              "xtt": 0,
              "ytt": 7
            }
          },
          "inConns": [
            "and9^out",
            "and10^out"
          ],
          "outConns": [
            "or19^in2"
          ],
          "nextInput": 0,
          "nextOutput": 0,
          "xOfs": 0,
          "yOfs": 0,
          "revIns": 0,
          "states": {
            "out": 1
          },
          "st": 0,
          "dt": 0,
          "rt": 0,
          "varStates": {}
        },
        "or18": {
          "id": "or18",
          "type": "or",
          "x": 5.25,
          "y": 2.5,
          "state": 0,
          "inputs": [
            "in1",
            "in2"
          ],
          "outputs": [
            "out"
          ],
          "ins": {
            "in1": {
              "pos": "top",
              "pin": "in1",
              "pinx": -44.75,
              "piny": 317.5,
              "xtt": 0,
              "ytt": -5,
              "id": "and4",
              "pout": "out"
            },
            "in2": {
              "pos": "top",
              "pin": "in2",
              "pinx": -37.25,
              "piny": 317.5,
              "xtt": 0,
              "ytt": -5,
              "id": "and6",
              "pout": "out"
            }
          },
          "outs": {
            "out": {
              "pos": "bottom",
              "pout": "out",
              "pinx": -41,
              "piny": 336.5,
              "xtt": 0,
              "ytt": 7
            }
          },
          "inConns": [
            "and4^out",
            "and6^out"
          ],
          "outConns": [
            "or19^in1"
          ],
          "nextInput": 0,
          "nextOutput": 0,
          "xOfs": 0,
          "yOfs": 0,
          "revIns": 0,
          "states": {
            "out": 0
          },
          "st": 0,
          "dt": 0,
          "rt": 0,
          "varStates": {}
        },
        "or19": {
          "id": "or19",
          "type": "or",
          "x": 6.25,
          "y": 4,
          "state": 0,
          "inputs": [
            "in1",
            "in2"
          ],
          "outputs": [
            "out"
          ],
          "ins": {
            "in1": {
              "pos": "top",
              "pin": "in1",
              "pinx": 5.25,
              "piny": 355,
              "xtt": 0,
              "ytt": -5,
              "id": "or18",
              "pout": "out"
            },
            "in2": {
              "pos": "top",
              "pin": "in2",
              "pinx": 12.75,
              "piny": 355,
              "xtt": 0,
              "ytt": -5,
              "id": "or17",
              "pout": "out"
            }
          },
          "outs": {
            "out": {
              "pos": "bottom",
              "pout": "out",
              "pinx": 9,
              "piny": 374,
              "xtt": 0,
              "ytt": 7
            }
          },
          "inConns": [
            "or18^out",
            "or17^out"
          ],
          "outConns": [
            "Out^in"
          ],
          "nextInput": 0,
          "nextOutput": 0,
          "xOfs": 0,
          "yOfs": 0,
          "revIns": 0,
          "states": {
            "out": 1
          },
          "st": 0,
          "dt": 0,
          "rt": 0,
          "varStates": {}
        },
        "Sel0": {
          "id": "Sel0",
          "type": "pin",
          "x": 3.25,
          "y": -12,
          "state": 0,
          "inputs": [],
          "outputs": [
            "out"
          ],
          "ins": {},
          "outs": {
            "out": {
              "pos": "bottom",
              "pout": "out",
              "pinx": -141,
              "piny": -33.5,
              "xtt": 0,
              "ytt": 7
            }
          },
          "inConns": [],
          "outConns": [
            "not5^in",
            "and13^in1",
            "and18^in1",
            "not5^in",
            "and13^in2",
            "and13^in1",
            "and18^in1",
            "and14^in1",
            "and13^in1"
          ],
          "nextInput": 0,
          "nextOutput": 0,
          "xOfs": 0,
          "yOfs": 0,
          "revIns": 0,
          "states": {
            "out": 1
          },
          "st": -7.5,
          "dt": 0,
          "rt": 0
        },
        "Sel1": {
          "id": "Sel1",
          "type": "pin",
          "x": 3.75,
          "y": -12,
          "state": 0,
          "inputs": [],
          "outputs": [
            "out"
          ],
          "ins": {},
          "outs": {
            "out": {
              "pos": "bottom",
              "pout": "out",
              "pinx": -116,
              "piny": -33.5,
              "xtt": 0,
              "ytt": 7
            }
          },
          "inConns": [],
          "outConns": [
            "not11^in",
            "and13^in2",
            "and14^in1",
            "and14^in2"
          ],
          "nextInput": 0,
          "nextOutput": 0,
          "xOfs": 0,
          "yOfs": 0,
          "revIns": 0,
          "states": {
            "out": 0
          },
          "st": -7.5,
          "dt": 0,
          "rt": 0
        }
      },
      "active": 0,
      "pX": -315,
      "pY": 253
    },
    "demux2b": {
      "ins": {
        "D": {
          "pos": "top",
          "pin": "D",
          "pinx": 102.5,
          "piny": -164,
          "xtt": 0,
          "ytt": -5,
          "id": "Data",
          "pout": "out"
        },
        "Sel1": {
          "pos": "top",
          "pin": "Sel1",
          "pinx": 107.5,
          "piny": -164,
          "xtt": 0,
          "ytt": -5,
          "id": "Sel0",
          "pout": "out"
        },
        "Sel0": {
          "pos": "top",
          "pin": "Sel0",
          "pinx": 112.5,
          "piny": -164,
          "xtt": 0,
          "ytt": -5,
          "id": "Sel1",
          "pout": "out"
        }
      },
      "outs": {
        "Out0": {
          "pos": "bottom",
          "pout": "Out0",
          "pinx": 101.875,
          "piny": -145,
          "xtt": 0,
          "ytt": 7
        },
        "Out1": {
          "pos": "bottom",
          "pout": "Out1",
          "pinx": 105.625,
          "piny": -145,
          "xtt": 0,
          "ytt": 7
        },
        "Out2": {
          "pos": "bottom",
          "pout": "Out2",
          "pinx": 109.375,
          "piny": -145,
          "xtt": 0,
          "ytt": 7
        },
        "Out3": {
          "pos": "bottom",
          "pout": "Out3",
          "pinx": 113.125,
          "piny": -145,
          "xtt": 0,
          "ytt": 7
        }
      },
      "comp": {
        "D": {
          "id": "D",
          "type": "pin",
          "x": 7.25,
          "y": -5.5,
          "state": 0,
          "inputs": [],
          "outputs": [
            "out"
          ],
          "ins": {},
          "outs": {
            "out": {
              "pos": "bottom",
              "pout": "out",
              "pinx": 179,
              "piny": 24,
              "xtt": 0,
              "ytt": 7
            }
          },
          "inConns": [],
          "outConns": [
            "and9^in2",
            "and10^in2",
            "and9^in2",
            "and6^in2",
            "and4^in2"
          ],
          "nextInput": 0,
          "nextOutput": 0,
          "xOfs": 0,
          "yOfs": 0,
          "revIns": 0,
          "states": {
            "out": 1
          },
          "st": -7.5,
          "dt": 0,
          "rt": 0
        },
        "Out0": {
          "id": "Out0",
          "type": "pout",
          "x": 4.25,
          "y": -0.5,
          "state": 0,
          "inputs": [
            "in"
          ],
          "outputs": [],
          "ins": {
            "in": {
              "pos": "top",
              "pin": "in",
              "pinx": 29,
              "piny": 137.5,
              "xtt": 0,
              "ytt": -5,
              "id": "and4",
              "pout": "out"
            }
          },
          "outs": {},
          "inConns": [
            "and4^out"
          ],
          "outConns": [],
          "nextInput": 0,
          "nextOutput": 0,
          "xOfs": 0,
          "yOfs": 0,
          "revIns": 0,
          "states": {
            "out": 0
          },
          "st": -7.5,
          "dt": 0,
          "rt": 0
        },
        "Out1": {
          "id": "Out1",
          "type": "pout",
          "x": 5,
          "y": -0.5,
          "state": 0,
          "inputs": [
            "in"
          ],
          "outputs": [],
          "ins": {
            "in": {
              "pos": "top",
              "pin": "in",
              "pinx": 66.5,
              "piny": 137.5,
              "xtt": 0,
              "ytt": -5,
              "id": "and6",
              "pout": "out"
            }
          },
          "outs": {},
          "inConns": [
            "and6^out"
          ],
          "outConns": [],
          "nextInput": 0,
          "nextOutput": 0,
          "xOfs": 0,
          "yOfs": 0,
          "revIns": 0,
          "states": {
            "out": 1
          },
          "st": -7.5,
          "dt": 0,
          "rt": 0
        },
        "and4": {
          "id": "and4",
          "type": "and",
          "x": 4.25,
          "y": -2.5,
          "state": 0,
          "inputs": [
            "in1",
            "in2"
          ],
          "outputs": [
            "out"
          ],
          "ins": {
            "in1": {
              "pos": "top",
              "pin": "in1",
              "pinx": 25.25,
              "piny": 87.5,
              "xtt": 0,
              "ytt": -5,
              "id": "and13",
              "pout": "out"
            },
            "in2": {
              "pos": "top",
              "pin": "in2",
              "pinx": 32.75,
              "piny": 87.5,
              "xtt": 0,
              "ytt": -5,
              "id": "D",
              "pout": "out"
            }
          },
          "outs": {
            "out": {
              "pos": "bottom",
              "pout": "out",
              "pinx": 29,
              "piny": 106.5,
              "xtt": 0,
              "ytt": 7
            }
          },
          "inConns": [
            "D^out",
            "and13^out",
            "D^out"
          ],
          "outConns": [
            "Out0^in"
          ],
          "nextInput": 0,
          "nextOutput": 0,
          "xOfs": 0,
          "yOfs": 0,
          "revIns": 0,
          "states": {
            "out": 0
          },
          "st": 0,
          "dt": 0,
          "rt": 0,
          "varStates": {}
        },
        "not5": {
          "id": "not5",
          "type": "not",
          "x": 2.75,
          "y": -7.5,
          "state": 0,
          "inputs": [
            "in"
          ],
          "outputs": [
            "out"
          ],
          "ins": {
            "in": {
              "pos": "top",
              "pin": "in",
              "pinx": -46,
              "piny": -37.5,
              "xtt": 0,
              "ytt": -5,
              "id": "Sel0",
              "pout": "out"
            }
          },
          "outs": {
            "out": {
              "pos": "bottom",
              "pout": "out",
              "pinx": -46,
              "piny": -16.625,
              "xtt": 0,
              "ytt": 7
            }
          },
          "inConns": [
            "Sel0^out"
          ],
          "outConns": [
            "and14^in2",
            "and14^in1",
            "and17^in1"
          ],
          "nextInput": 0,
          "nextOutput": 0,
          "xOfs": 0,
          "yOfs": 0,
          "revIns": 0,
          "states": {
            "out": 1
          },
          "st": 1.875,
          "dt": 0,
          "rt": 0,
          "varStates": {}
        },
        "and6": {
          "id": "and6",
          "type": "and",
          "x": 5,
          "y": -2.5,
          "state": 0,
          "inputs": [
            "in1",
            "in2"
          ],
          "outputs": [
            "out"
          ],
          "ins": {
            "in1": {
              "pos": "top",
              "pin": "in1",
              "pinx": 62.75,
              "piny": 87.5,
              "xtt": 0,
              "ytt": -5,
              "id": "and14",
              "pout": "out"
            },
            "in2": {
              "pos": "top",
              "pin": "in2",
              "pinx": 70.25,
              "piny": 87.5,
              "xtt": 0,
              "ytt": -5,
              "id": "D",
              "pout": "out"
            }
          },
          "outs": {
            "out": {
              "pos": "bottom",
              "pout": "out",
              "pinx": 66.5,
              "piny": 106.5,
              "xtt": 0,
              "ytt": 7
            }
          },
          "inConns": [
            "not5^out",
            "D^out",
            "and14^out",
            "D^out"
          ],
          "outConns": [
            "Out1^in"
          ],
          "nextInput": 0,
          "nextOutput": 0,
          "xOfs": 0,
          "yOfs": 0,
          "revIns": 0,
          "states": {
            "out": 1
          },
          "st": 0,
          "dt": 0,
          "rt": 0,
          "varStates": {}
        },
        "and9": {
          "id": "and9",
          "type": "and",
          "x": 5.75,
          "y": -2.5,
          "state": 0,
          "inputs": [
            "in1",
            "in2"
          ],
          "outputs": [
            "out"
          ],
          "ins": {
            "in1": {
              "pos": "top",
              "pin": "in1",
              "pinx": 100.25,
              "piny": 87.5,
              "xtt": 0,
              "ytt": -5,
              "id": "and18",
              "pout": "out"
            },
            "in2": {
              "pos": "top",
              "pin": "in2",
              "pinx": 107.75,
              "piny": 87.5,
              "xtt": 0,
              "ytt": -5,
              "id": "D",
              "pout": "out"
            }
          },
          "outs": {
            "out": {
              "pos": "bottom",
              "pout": "out",
              "pinx": 104,
              "piny": 106.5,
              "xtt": 0,
              "ytt": 7,
              "id": "Out2"
            }
          },
          "inConns": [
            "Sel1^out",
            "D^out",
            "D^out",
            "Sel1^out",
            "and18^out",
            "D^out"
          ],
          "outConns": [
            "Out2^in"
          ],
          "nextInput": 0,
          "nextOutput": 0,
          "xOfs": 0,
          "yOfs": 0,
          "revIns": 0,
          "states": {
            "out": 0
          },
          "st": 0,
          "dt": 0,
          "rt": 0,
          "varStates": {}
        },
        "and10": {
          "id": "and10",
          "type": "and",
          "x": 6.5,
          "y": -2.5,
          "state": 0,
          "inputs": [
            "in1",
            "in2"
          ],
          "outputs": [
            "out"
          ],
          "ins": {
            "in1": {
              "pos": "top",
              "pin": "in1",
              "pinx": 137.75,
              "piny": 87.5,
              "xtt": 0,
              "ytt": -5,
              "id": "and17",
              "pout": "out"
            },
            "in2": {
              "pos": "top",
              "pin": "in2",
              "pinx": 145.25,
              "piny": 87.5,
              "xtt": 0,
              "ytt": -5,
              "id": "D",
              "pout": "out"
            }
          },
          "outs": {
            "out": {
              "pos": "bottom",
              "pout": "out",
              "pinx": 141.5,
              "piny": 106.5,
              "xtt": 0,
              "ytt": 7,
              "id": "Out3"
            }
          },
          "inConns": [
            "not11^out",
            "Sel1^out",
            "D^out",
            "not11^out",
            "and17^out",
            "D^out"
          ],
          "outConns": [
            "Out3^in"
          ],
          "nextInput": 0,
          "nextOutput": 0,
          "xOfs": 0,
          "yOfs": 0,
          "revIns": 0,
          "states": {
            "out": 0
          },
          "st": 0,
          "dt": 0,
          "rt": 0,
          "varStates": {}
        },
        "not11": {
          "id": "not11",
          "type": "not",
          "x": 5.75,
          "y": -9,
          "state": 0,
          "inputs": [
            "in"
          ],
          "outputs": [
            "out"
          ],
          "ins": {
            "in": {
              "pos": "top",
              "pin": "in",
              "pinx": 104,
              "piny": -75,
              "xtt": 0,
              "ytt": -5,
              "id": "Sel1",
              "pout": "out"
            }
          },
          "outs": {
            "out": {
              "pos": "bottom",
              "pout": "out",
              "pinx": 104,
              "piny": -54.125,
              "xtt": 0,
              "ytt": 7
            }
          },
          "inConns": [
            "Sel1^out"
          ],
          "outConns": [
            "and10^in1",
            "and17^in1",
            "and17^in2",
            "and18^in2"
          ],
          "nextInput": 0,
          "nextOutput": 0,
          "xOfs": 0,
          "yOfs": 0,
          "revIns": 0,
          "states": {
            "out": 0
          },
          "st": 1.875,
          "dt": 0,
          "rt": 0,
          "varStates": {}
        },
        "Sel1": {
          "id": "Sel1",
          "type": "pin",
          "x": 4.5,
          "y": -10.5,
          "state": 0,
          "inputs": [],
          "outputs": [
            "out"
          ],
          "ins": {},
          "outs": {
            "out": {
              "pos": "bottom",
              "pout": "out",
              "pinx": 41.5,
              "piny": -101,
              "xtt": 0,
              "ytt": 7
            }
          },
          "inConns": [],
          "outConns": [
            "not11^in",
            "and9^in1",
            "and10^in2",
            "and13^in2",
            "and14^in2",
            "and14^in2"
          ],
          "nextInput": 0,
          "nextOutput": 0,
          "xOfs": 0,
          "yOfs": 0,
          "revIns": 0,
          "states": {
            "out": 1
          },
          "st": -7.5,
          "dt": 0,
          "rt": 0
        },
        "Sel0": {
          "id": "Sel0",
          "type": "pin",
          "x": 3,
          "y": -10.5,
          "state": 0,
          "inputs": [],
          "outputs": [
            "out"
          ],
          "ins": {},
          "outs": {
            "out": {
              "pos": "bottom",
              "pout": "out",
              "pinx": -33.5,
              "piny": -101,
              "xtt": 0,
              "ytt": 7
            }
          },
          "inConns": [],
          "outConns": [
            "not5^in",
            "and13^in1",
            "and18^in1"
          ],
          "nextInput": 0,
          "nextOutput": 0,
          "xOfs": 0,
          "yOfs": 0,
          "revIns": 0,
          "states": {
            "out": 0
          },
          "st": -7.5,
          "dt": 0,
          "rt": 0
        },
        "and13": {
          "id": "and13",
          "type": "and",
          "x": 3.75,
          "y": -5,
          "state": 0,
          "inputs": [
            "in1",
            "in2"
          ],
          "outputs": [
            "out"
          ],
          "ins": {
            "in1": {
              "pos": "top",
              "pin": "in1",
              "pinx": 0.25,
              "piny": 25,
              "xtt": 0,
              "ytt": -5,
              "id": "Sel0",
              "pout": "out"
            },
            "in2": {
              "pos": "top",
              "pin": "in2",
              "pinx": 7.75,
              "piny": 25,
              "xtt": 0,
              "ytt": -5,
              "id": "Sel1",
              "pout": "out"
            }
          },
          "outs": {
            "out": {
              "pos": "bottom",
              "pout": "out",
              "pinx": 4,
              "piny": 44,
              "xtt": 0,
              "ytt": 7
            }
          },
          "inConns": [
            "Sel0^out",
            "not5^out",
            "not5^out",
            "Sel1^out",
            "Sel0^out",
            "Sel1^out",
            "Sel0^out"
          ],
          "outConns": [
            "and4^in1"
          ],
          "nextInput": 1,
          "nextOutput": 0,
          "xOfs": 0,
          "yOfs": 0,
          "revIns": 0,
          "states": {
            "out": 0
          },
          "st": 0,
          "dt": 0,
          "rt": 0,
          "varStates": {}
        },
        "and14": {
          "id": "and14",
          "type": "and",
          "x": 4.75,
          "y": -5,
          "state": 0,
          "inputs": [
            "in1",
            "in2"
          ],
          "outputs": [
            "out"
          ],
          "ins": {
            "in1": {
              "pos": "top",
              "pin": "in1",
              "pinx": 50.25,
              "piny": 25,
              "xtt": 0,
              "ytt": -5,
              "id": "not5",
              "pout": "out"
            },
            "in2": {
              "pos": "top",
              "pin": "in2",
              "pinx": 57.75,
              "piny": 25,
              "xtt": 0,
              "ytt": -5,
              "id": "Sel1",
              "pout": "out"
            }
          },
          "outs": {
            "out": {
              "pos": "bottom",
              "pout": "out",
              "pinx": 54,
              "piny": 44,
              "xtt": 0,
              "ytt": 7
            }
          },
          "inConns": [
            "not11^out",
            "Sel0^out",
            "Sel0^out",
            "Sel1^out",
            "Sel0^out",
            "not5^out",
            "not5^out",
            "Sel1^out"
          ],
          "outConns": [
            "and6^in1"
          ],
          "nextInput": 0,
          "nextOutput": 0,
          "xOfs": 0,
          "yOfs": 0,
          "revIns": 0,
          "states": {
            "out": 1
          },
          "st": 0,
          "dt": 0,
          "rt": 0,
          "varStates": {}
        },
        "and17": {
          "id": "and17",
          "type": "and",
          "x": 6.25,
          "y": -6.5,
          "state": 0,
          "inputs": [
            "in1",
            "in2"
          ],
          "outputs": [
            "out"
          ],
          "ins": {
            "in1": {
              "pos": "top",
              "pin": "in1",
              "pinx": 125.25,
              "piny": -12.5,
              "xtt": 0,
              "ytt": -5,
              "id": "not5",
              "pout": "out"
            },
            "in2": {
              "pos": "top",
              "pin": "in2",
              "pinx": 132.75,
              "piny": -12.5,
              "xtt": 0,
              "ytt": -5,
              "id": "not11",
              "pout": "out"
            }
          },
          "outs": {
            "out": {
              "pos": "bottom",
              "pout": "out",
              "pinx": 129,
              "piny": 6.5,
              "xtt": 0,
              "ytt": 7
            }
          },
          "inConns": [
            "not11^out",
            "not11^out",
            "not5^out"
          ],
          "outConns": [
            "and10^in1"
          ],
          "nextInput": 1,
          "nextOutput": 0,
          "xOfs": 0,
          "yOfs": 0,
          "revIns": 0,
          "states": {
            "out": 0
          },
          "st": 0,
          "dt": 0,
          "rt": 0,
          "varStates": {}
        },
        "and18": {
          "id": "and18",
          "type": "and",
          "x": 5.5,
          "y": -5.5,
          "state": 0,
          "inputs": [
            "in1",
            "in2"
          ],
          "outputs": [
            "out"
          ],
          "ins": {
            "in1": {
              "pos": "top",
              "pin": "in1",
              "pinx": 87.75,
              "piny": 12.5,
              "xtt": 0,
              "ytt": -5,
              "id": "Sel0",
              "pout": "out"
            },
            "in2": {
              "pos": "top",
              "pin": "in2",
              "pinx": 95.25,
              "piny": 12.5,
              "xtt": 0,
              "ytt": -5,
              "id": "not11",
              "pout": "out"
            }
          },
          "outs": {
            "out": {
              "pos": "bottom",
              "pout": "out",
              "pinx": 91.5,
              "piny": 31.5,
              "xtt": 0,
              "ytt": 7
            }
          },
          "inConns": [
            "Sel0^out",
            "not11^out"
          ],
          "outConns": [
            "and9^in1"
          ],
          "nextInput": 0,
          "nextOutput": 0,
          "xOfs": 0,
          "yOfs": 0,
          "revIns": 0,
          "states": {
            "out": 0
          },
          "st": 0,
          "dt": 0,
          "rt": 0,
          "varStates": {}
        },
        "Out2": {
          "id": "Out2",
          "type": "pout",
          "x": 5.75,
          "y": -0.5,
          "state": 0,
          "inputs": [
            "in"
          ],
          "outputs": [],
          "ins": {
            "in": {
              "pos": "top",
              "pin": "in",
              "pinx": 104,
              "piny": 137.5,
              "xtt": 0,
              "ytt": -5,
              "id": "and9",
              "pout": "out"
            }
          },
          "outs": {},
          "inConns": [
            "and9^out"
          ],
          "outConns": [],
          "nextInput": 0,
          "nextOutput": 0,
          "xOfs": 0,
          "yOfs": 0,
          "revIns": 0,
          "states": {
            "out": 0
          },
          "st": -7.5,
          "dt": 0,
          "rt": 0
        },
        "Out3": {
          "id": "Out3",
          "type": "pout",
          "x": 6.5,
          "y": -0.5,
          "state": 0,
          "inputs": [
            "in"
          ],
          "outputs": [],
          "ins": {
            "in": {
              "pos": "top",
              "pin": "in",
              "pinx": 141.5,
              "piny": 137.5,
              "xtt": 0,
              "ytt": -5,
              "id": "and10",
              "pout": "out"
            }
          },
          "outs": {},
          "inConns": [
            "and10^out"
          ],
          "outConns": [],
          "nextInput": 0,
          "nextOutput": 0,
          "xOfs": 0,
          "yOfs": 0,
          "revIns": 0,
          "states": {
            "out": 0
          },
          "st": -7.5,
          "dt": 0,
          "rt": 0
        }
      },
      "active": 0,
      "pX": -195,
      "pY": 148.5
    },
    "Memtest": {
      "ins": {},
      "outs": {},
      "comp": {
        "En": {
          "id": "En",
          "type": "controlled",
          "x": 2.25,
          "y": -3,
          "state": 0,
          "inputs": [],
          "outputs": [
            "out"
          ],
          "ins": {},
          "outs": {
            "out": {
              "pos": "bottom",
              "pout": "out",
              "pinx": 45,
              "piny": 65.5,
              "xtt": 0,
              "ytt": 7,
              "id": "Memory1"
            }
          },
          "inConns": [],
          "outConns": [
            "Memory1^Clk",
            "Memory1^En"
          ],
          "nextInput": 0,
          "nextOutput": 0,
          "xOfs": 0,
          "yOfs": 0,
          "revIns": 0,
          "states": {
            "out": 0
          },
          "st": -7.5,
          "dt": 0,
          "rt": 0
        },
        "Dt": {
          "id": "Dt",
          "type": "controlled",
          "x": 3.5,
          "y": -3,
          "state": 0,
          "inputs": [],
          "outputs": [
            "out"
          ],
          "ins": {},
          "outs": {
            "out": {
              "pos": "bottom",
              "pout": "out",
              "pinx": 107.5,
              "piny": 65.5,
              "xtt": 0,
              "ytt": 7,
              "id": "Memory1"
            }
          },
          "inConns": [],
          "outConns": [
            "Memory1^En",
            "Memory1^Dt"
          ],
          "nextInput": 0,
          "nextOutput": 0,
          "xOfs": 0,
          "yOfs": 0,
          "revIns": 0,
          "states": {
            "out": 0
          },
          "st": -7.5,
          "dt": 0,
          "rt": 0
        },
        "CLK": {
          "id": "CLK",
          "type": "clock",
          "x": 4.25,
          "y": -1.5,
          "state": 0,
          "inputs": [],
          "outputs": [
            "out"
          ],
          "ins": {},
          "outs": {
            "out": {
              "pos": "bottom",
              "pout": "out",
              "pinx": 145,
              "piny": 110.5,
              "xtt": 0,
              "ytt": 7,
              "id": "Memory1"
            }
          },
          "inConns": [],
          "outConns": [
            "Memory1^Dt",
            "Memory1^Clk"
          ],
          "nextInput": 0,
          "nextOutput": 0,
          "xOfs": 0,
          "yOfs": 0,
          "revIns": 0,
          "states": {
            "out": 0
          },
          "st": 0,
          "dt": 0,
          "rt": 0,
          "varStates": {
            "out": 1
          }
        },
        "Memory1": {
          "id": "Memory1",
          "type": "chip.mem",
          "x": 2.75,
          "y": -0.5,
          "state": 0,
          "inputs": [
            "Clk",
            "En",
            "Dt"
          ],
          "outputs": [
            "Nq",
            "Q"
          ],
          "ins": {
            "Clk": {
              "pos": "top",
              "pin": "Clk",
              "pinx": 65,
              "piny": 116.5,
              "xtt": 0,
              "ytt": -5,
              "id": "CLK",
              "pout": "out"
            },
            "En": {
              "pos": "top",
              "pin": "En",
              "pinx": 70,
              "piny": 116.5,
              "xtt": 0,
              "ytt": -5,
              "id": "En",
              "pout": "out"
            },
            "Dt": {
              "pos": "top",
              "pin": "Dt",
              "pinx": 75,
              "piny": 116.5,
              "xtt": 0,
              "ytt": -5,
              "id": "Dt",
              "pout": "out"
            }
          },
          "outs": {
            "Nq": {
              "pos": "bottom",
              "pout": "Nq",
              "pinx": 66.25,
              "piny": 135.5,
              "xtt": 0,
              "ytt": 7,
              "id": "Nq"
            },
            "Q": {
              "pos": "bottom",
              "pout": "Q",
              "pinx": 73.75,
              "piny": 135.5,
              "xtt": 0,
              "ytt": 7,
              "id": "Q"
            }
          },
          "inConns": [
            "CLK^out",
            "En^out",
            "Dt^out"
          ],
          "outConns": [
            "Q^in"
          ],
          "nextInput": 0,
          "nextOutput": 0,
          "xOfs": 0,
          "yOfs": 0,
          "revIns": 0,
          "states": {
            "Nq": 0,
            "Q": 1
          },
          "st": 0,
          "dt": 0,
          "rt": 0
        },
        "NQ": {
          "id": "NQ",
          "type": "led",
          "x": 2.5,
          "y": 1.5,
          "state": 0,
          "inputs": [
            "in"
          ],
          "outputs": [],
          "ins": {
            "in": {
              "pos": "top",
              "pin": "in",
              "pinx": 57.5,
              "piny": 166.5,
              "xtt": 0,
              "ytt": -5,
              "id": "Memory1",
              "pout": "Nq"
            }
          },
          "outs": {},
          "inConns": [],
          "outConns": [],
          "nextInput": 0,
          "nextOutput": 0,
          "xOfs": 0,
          "yOfs": 0,
          "revIns": 0,
          "states": {
            "out": 0
          },
          "st": 0,
          "dt": 0,
          "rt": 0,
          "varStates": {}
        },
        "Q": {
          "id": "Q",
          "type": "led",
          "x": 3.5,
          "y": 1.5,
          "state": 0,
          "inputs": [
            "in"
          ],
          "outputs": [],
          "ins": {
            "in": {
              "pos": "top",
              "pin": "in",
              "pinx": 107.5,
              "piny": 166.5,
              "xtt": 0,
              "ytt": -5,
              "id": "Memory1",
              "pout": "Q"
            }
          },
          "outs": {},
          "inConns": [],
          "outConns": [],
          "nextInput": 0,
          "nextOutput": 0,
          "xOfs": 0,
          "yOfs": 0,
          "revIns": 0,
          "states": {
            "out": 1
          },
          "st": 0,
          "dt": 0,
          "rt": 0,
          "varStates": {}
        }
      },
      "active": 1
    }
  },
  "mpan": {
    "x": 26.869421005249023,
    "y": 110.13392639160156,
    "ofsX": 0,
    "ofsY": 0,
    "xOfs": -79,
    "yOfs": 127
  },
  "node": [],
  "nodeConn": {}
}
}