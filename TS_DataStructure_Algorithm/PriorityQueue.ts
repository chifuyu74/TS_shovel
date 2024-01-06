type Predicate<T> = (a: T, b: T) => boolean;

class PriorityQueue<T> {
  private vector: T[];
  private pred: Predicate<T>;
  private copyVector: T[] = [];

  constructor(pred: Predicate<T>) {
    this.vector = [];
    this.pred = pred;
  }

  setPred(pred: Predicate<T>): boolean {
    try {
      this.pred = pred;
      return true;
    } catch (error) {
      return false;
    }
  }

  push(value: T) {
    this.vector.push(value);

    let now = Math.floor(this.vector.length - 1);

    while (now > 0) {
      const next = Math.floor((now - 1) / 2);

      if (this.pred(this.vector[now], this.vector[next])) {
        break;
      }

      [this.vector[now], this.vector[next]] = [
        this.vector[next],
        this.vector[now],
      ];

      now = next;
    }
    this.copyVector = [...this.vector];
  }

  pop(): T {
    const result = this.vector[0];
    this.vector[0] = this.vector[this.vector.length - 1];
    this.vector.pop();

    let now = 0;
    while (true) {
      let left = 2 * now + 1;
      let right = 2 * now + 1;

      let next = now;

      if (left >= this.vector.length) {
        break;
      }

      if (this.vector[now] < this.vector[next]) {
        next = left;
      }

      if (
        right < this.vector.length &&
        this.pred(this.vector[now], this.vector[next])
      ) {
        next = right;
      }

      if (next === now) {
        break;
      }

      [this.vector[now], this.vector[next]] = [
        this.vector[next],
        this.vector[now],
      ];
      now = next;
    }
    this.copyVector = [...this.vector];
    return result;
  }

  size(): number {
    return this.vector.length;
  }

  empty(): boolean {
    return this.vector.length === 0;
  }

  top(): T | false {
    if (this.empty()) {
      return false;
    }

    return this.vector[0];
  }

  print(): void {
    while (this.copyVector.length !== 0) {
      let value = this.topCopy();
      this.popCopy();
      console.log(value);
    }
    this.copyVector = [...this.vector];
  }

  log(): void {
    console.log(this.vector, this.copyVector);
  }

  private topCopy(): T {
    return this.copyVector[0];
  }

  private popCopy(): T {
    const result = this.copyVector[0];
    this.copyVector[0] = this.copyVector[this.copyVector.length - 1];
    this.copyVector.pop();

    let now = 0;
    while (true) {
      let left = 2 * now + 1;
      let right = 2 * now + 1;

      let next = now;

      if (left >= this.copyVector.length) {
        break;
      }

      if (this.copyVector[now] < this.copyVector[next]) {
        next = left;
      }

      if (
        right < this.copyVector.length &&
        this.pred(this.copyVector[now], this.copyVector[next])
      ) {
        next = right;
      }

      if (next === now) {
        break;
      }

      [this.copyVector[now], this.copyVector[next]] = [
        this.copyVector[next],
        this.copyVector[now],
      ];
      now = next;
    }
    return result;
  }
}

export { PriorityQueue };
