class Queue<T> {
  private vector: T[] = [];
  private copyVector: T[] = [];
  public length: number = 0;

  empty(): boolean {
    return this.vector.length === 0;
  }

  size(): number {
    return +this.vector.length;
  }

  push(value: T) {
    this.vector.push(value);
    this.length += 1;
  }

  pop() {
    const value = this.vector.shift();
    this.length -= 1;
    return value;
  }

  top(): T | undefined {
    if (this.empty()) {
      return undefined;
    }
    return this.vector[0];
  }

  print(): void {
    this.vector.forEach((f) => {
      console.log(f);
    });
  }

  log(): void {
    console.log(this.vector);
  }
}

export { Queue };
