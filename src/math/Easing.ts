export class Easing {
  static linear(amount: number): number {
    return amount;
  }

  static quadraticIn(amount: number): number {
    return amount * amount;
  }

  static quadraticOut(amount: number): number {
    return amount * (2 - amount);
  }

  static quadraticInOut(amount: number): number {
    if ((amount *= 2) < 1) {
      return 0.5 * amount * amount;
    }

    return -0.5 * (--amount * (amount - 2) - 1);
  }

  static cubicIn(amount: number): number {
    return amount * amount * amount;
  }

  static cubicOut(amount: number): number {
    return --amount * amount * amount + 1;
  }

  static cubicInOut(amount: number): number {
    if ((amount *= 2) < 1) {
      return 0.5 * amount * amount * amount;
    }
    return 0.5 * ((amount -= 2) * amount * amount + 2);
  }

  static quarticIn(amount: number): number {
    return amount * amount * amount * amount;
  }

  static quarticOut(amount: number): number {
    return 1 - --amount * amount * amount * amount;
  }

  static quarticInOut(amount: number): number {
    if ((amount *= 2) < 1) {
      return 0.5 * amount * amount * amount * amount;
    }

    return -0.5 * ((amount -= 2) * amount * amount * amount - 2);
  }

  static quinticIn(amount: number): number {
    return amount * amount * amount * amount * amount;
  }

  static quinticOut(amount: number): number {
    return --amount * amount * amount * amount * amount + 1;
  }

  static quinticInOut(amount: number): number {
    if ((amount *= 2) < 1) {
      return 0.5 * amount * amount * amount * amount * amount;
    }

    return 0.5 * ((amount -= 2) * amount * amount * amount * amount + 2);
  }

  static sinusoidalIn(amount: number): number {
    return 1 - Math.sin(((1.0 - amount) * Math.PI) / 2);
  }

  static sinusoidalOut(amount: number): number {
    return Math.sin((amount * Math.PI) / 2);
  }

  static sinusoidalInOut(amount: number): number {
    return 0.5 * (1 - Math.sin(Math.PI * (0.5 - amount)));
  }

  static exponentialIn(amount: number): number {
    return amount === 0 ? 0 : Math.pow(1024, amount - 1);
  }

  static exponentialOut(amount: number): number {
    return amount === 1 ? 1 : 1 - Math.pow(2, -10 * amount);
  }

  static exponentialInOut(amount: number): number {
    if (amount === 0) {
      return 0;
    }

    if (amount === 1) {
      return 1;
    }

    if ((amount *= 2) < 1) {
      return 0.5 * Math.pow(1024, amount - 1);
    }

    return 0.5 * (-Math.pow(2, -10 * (amount - 1)) + 2);
  }

  static circularIn(amount: number): number {
    return 1 - Math.sqrt(1 - amount * amount);
  }

  static circularOut(amount: number): number {
    return Math.sqrt(1 - --amount * amount);
  }

  static circularInOut(amount: number): number {
    if ((amount *= 2) < 1) {
      return -0.5 * (Math.sqrt(1 - amount * amount) - 1);
    }
    return 0.5 * (Math.sqrt(1 - (amount -= 2) * amount) + 1);
  }

  static elasticIn(amount: number): number {
    if (amount === 0) {
      return 0;
    }

    if (amount === 1) {
      return 1;
    }

    return (
      -Math.pow(2, 10 * (amount - 1)) * Math.sin((amount - 1.1) * 5 * Math.PI)
    );
  }

  static elasticOut(amount: number): number {
    if (amount === 0) {
      return 0;
    }

    if (amount === 1) {
      return 1;
    }
    return (
      Math.pow(2, -10 * amount) * Math.sin((amount - 0.1) * 5 * Math.PI) + 1
    );
  }

  static elasticInOut(amount: number): number {
    if (amount === 0) {
      return 0;
    }

    if (amount === 1) {
      return 1;
    }

    amount *= 2;

    if (amount < 1) {
      return (
        -0.5 *
        Math.pow(2, 10 * (amount - 1)) *
        Math.sin((amount - 1.1) * 5 * Math.PI)
      );
    }

    return (
      0.5 *
        Math.pow(2, -10 * (amount - 1)) *
        Math.sin((amount - 1.1) * 5 * Math.PI) +
      1
    );
  }

  static backIn(amount: number): number {
    const s = 1.70158;
    return amount === 1 ? 1 : amount * amount * ((s + 1) * amount - s);
  }

  static backOut(amount: number): number {
    const s = 1.70158;
    return amount === 0 ? 0 : --amount * amount * ((s + 1) * amount + s) + 1;
  }

  static backInOut(amount: number): number {
    const s = 1.70158 * 1.525;
    if ((amount *= 2) < 1) {
      return 0.5 * (amount * amount * ((s + 1) * amount - s));
    }
    return 0.5 * ((amount -= 2) * amount * ((s + 1) * amount + s) + 2);
  }

  static bounceIn(amount: number): number {
    return 1 - Easing.bounceOut(1 - amount);
  }

  static bounceOut(amount: number): number {
    if (amount < 1 / 2.75) {
      return 7.5625 * amount * amount;
    } else if (amount < 2 / 2.75) {
      return 7.5625 * (amount -= 1.5 / 2.75) * amount + 0.75;
    } else if (amount < 2.5 / 2.75) {
      return 7.5625 * (amount -= 2.25 / 2.75) * amount + 0.9375;
    } else {
      return 7.5625 * (amount -= 2.625 / 2.75) * amount + 0.984375;
    }
  }

  static bounceInOut(amount: number): number {
    if (amount < 0.5) {
      return Easing.bounceIn(amount * 2) * 0.5;
    }
    return Easing.bounceOut(amount * 2 - 1) * 0.5 + 0.5;
  }

  static generatePow(power = 4): {
    In(amount: number): number;
    Out(amount: number): number;
    InOut(amount: number): number;
  } {
    power = power < Number.EPSILON ? Number.EPSILON : power;
    power = power > 10000 ? 10000 : power;
    return {
      In: function (amount: number): number {
        return amount ** power;
      },
      Out: function (amount: number): number {
        return 1 - (1 - amount) ** power;
      },
      InOut: function (amount: number): number {
        if (amount < 0.5) {
          return (amount * 2) ** power / 2;
        }
        return (1 - (2 - amount * 2) ** power) / 2 + 0.5;
      },
    };
  }
}
