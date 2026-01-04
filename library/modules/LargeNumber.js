class LargeNumber {
  constructor(num) {
    this.num = num;
  }

  add(other) {
    let num1 = this.num;
    let num2 = other.num;
    let result = '';
    let carry = 0;

    // pad shorter number with leading zeros
    if (num1.length < num2.length) {
      num1 = num1.padStart(num2.length, '0');
    } else {
      num2 = num2.padStart(num1.length, '0');
    }

    for (let i = num1.length - 1; i >= 0; i--) {
      let sum = parseInt(num1[i]) + parseInt(num2[i]) + carry;
      carry = 0;
      if (sum > 9) {
        carry = 1;
        sum -= 10;
      }
      result = sum + result;
    }

    if (carry) {
      result = carry + result;
    }

    return new LargeNumber(result);
  }

  subtract(other) {
    // Subtract the two numbers and return a new LargeNumber instance
  }

  multiply(other) {
    let num1 = this.num;
    let num2 = other.num;
    let result = '';
    let carry = 0;

    // pad shorter number with leading zeros
    if (num1.length < num2.length) {
      num1 = num1.padStart(num2.length, '0');
    } else {
      num2 = num2.padStart(num1.length, '0');
    }

    for (let i = num1.length - 1; i >= 0; i--) {
      let product = '';
      for (let j = num2.length - 1; j >= 0; j--) {
        let p = parseInt(num1[i]) * parseInt(num2[j]) + carry;
        carry = 0;
        if (p > 9) {
          carry = Math.floor(p / 10);
          p = p % 10;
        }
        product = p + product;
      }
      if (carry) {
        product = carry + product;
        carry = 0;
      }
      product = product.padEnd(num1.length - i - 1, '0');
      result = new LargeNumber(result).add(new LargeNumber(product)).num;
    }

    return new LargeNumber(result);
  }

  divide(other) {
    // Divide the two numbers and return a new LargeNumber instance
  }

  compare(other) {
    let num1 = this.num;
    let num2 = other.num;

    if (num1.length > num2.length) {
      return 1;
    } else if (num1.length < num2.length) {
      return -1;
    } else {
      for (let i = 0; i < num1.length; i++) {
        if (num1[i] > num2[i]) {
          return 1;
        } else if (num1[i] < num2[i]) {
          return -1;
        }
      }
      return 0;
    }
  }

  toString() {
    let num = this.num;
    let significantDigits = num.substring(0, 11);
    let magnitude = Math.floor((num.length - 11) / 3);
    return `${significantDigits}e${magnitude}`;
  }
}