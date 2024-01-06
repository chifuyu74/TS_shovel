class BinarySearchTreeNode<T> {
  data: T;
  left: BinarySearchTreeNode<T> | null = null;
  right: BinarySearchTreeNode<T> | null = null;
  parent: BinarySearchTreeNode<T> | null = null;
}

class BinarySearchTree<T> {
  private root: BinarySearchTreeNode<T> | null = null;
  public length: number = 0;

  size(): number {
    return this.length;
  }

  insert(key: T) {
    let newNode = new BinarySearchTreeNode<T>();
    newNode.data = key;

    if (this.root == null) {
      let rootNode = new BinarySearchTreeNode<T>();
      rootNode.data = key;
      this.root = rootNode;
      return;
    }

    let node: BinarySearchTreeNode<T> = this.root;
    let parent = null;
    // 1) root보다 작은 경우 / 큰 경우... 자식들과 비교

    while (node !== null) {
      if (key < node.data && node.left) {
        node = node.left;
        parent = node;
      }

      if (key > node.data && node.right) {
        node = node.right;
        parent = node;
      } else {
        node = this.root;
      }
    }

    newNode.parent = parent;
    node = node as BinarySearchTreeNode<T>;
    if (key < node.data) {
      node.left = newNode;
    }
    if (key > node.data) {
      node.right = newNode;
    }
  }

  delete(key: T) {}

  private min(node: BinarySearchTreeNode<T>) {
    while (node.left) {
      node = node.left;
    }

    return node;
  }

  private max(node: BinarySearchTreeNode<T>) {
    while (node.right) {
      node = node.right;
    }

    return node;
  }

  private next(node: BinarySearchTreeNode<T>): BinarySearchTreeNode<T> | null {
    if (node === null || (node && !node?.parent)) {
      return null;
    }

    if (node.right) {
      return this.min(node.right);
    }

    let parent = node.parent;
    while (parent && parent.right && node === parent.right) {
      if (node && node.parent) {
        node = node.parent;
        parent = parent.parent;
      }
    }

    return parent;
  }

  search(
    node: BinarySearchTreeNode<T>,
    key: T
  ): BinarySearchTreeNode<T> | null {
    if (node == null || (this.root && this.root.data == key)) {
      return this.root;
    }

    if (node.left && key < node.data) {
      return this.search(node.left, key);
    } else if (node.right && key > node.data) {
      return this.search(node.right, key);
    } else {
      return this.root;
    }
  }

  print() {}
}

export { BinarySearchTree };
