class Stack<T> {
  private vector: T[] = [];
  public length: number = 0;

  push(value: T): void {
    this.vector.push(value);
    this.length += 1;
  }

  pop(): void {
    this.vector.pop();
    this.length -= 1;
  }

  top(): T | undefined {
    if (this.empty()) {
      return undefined;
    }
    return this.vector[this.length - 1];
  }

  empty(): boolean {
    return this.length === 0;
  }

  size(): number {
    return this.length;
  }
}

export { Stack };
