class LinkedListNode<T> {
  prev: LinkedListNode<T> | null;
  next: LinkedListNode<T> | null;
  data: T | null = null;

  constructor() {
    this.prev = null;
    this.next = null;
  }
}

class LinkedList<T> {
  private head: LinkedListNode<T> = new LinkedListNode<T>();
  private tail: LinkedListNode<T> = new LinkedListNode<T>();
  public length: number = 0;

  constructor() {
    this.head.next = this.tail;
    this.tail.prev = this.head;
    this.length = 0;
  }

  clear() {
    while (this.length > 0) {
      this.pop();
    }
  }

  size(): number {
    return this.length;
  }

  push(value: T) {
    this.addNode(this.tail, value);
  }

  pop() {
    this.removeNode(this.tail.prev);
  }

  private addNode(node: LinkedListNode<T> | null, value: T) {
    if (node === null || node.prev === null) {
      return;
    }

    let newNode = new LinkedListNode<T>();
    newNode.data = value;

    let prevNode = node.prev;
    prevNode.next = newNode;
    newNode.prev = prevNode;

    newNode.next = node;
    node.prev = newNode;

    this.length += 1;
    return newNode;
  }

  private removeNode(node: LinkedListNode<T> | null) {
    if (node === null || node.prev === null || node.next === null) {
      return;
    }
    let prev = node.prev;
    let next = node.next;

    prev.next = next.prev;
    next.prev = prev.next;

    this.length -= 1;
    return next;
  }
}

export { LinkedList as DoubleLinkedList };
