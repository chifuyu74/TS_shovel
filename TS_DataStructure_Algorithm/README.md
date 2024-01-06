# TypeScript DataStructure & Algorithm

### Data Structures

> Current Library is Written Pure TypeScript Based on C++ Container Interfaces ( std::vector, std::stack, std::queue, ... )

- Stack
- Queue
- PriorityQueue
- DoubleLinkedList
- BianrySearchTree (now, exist TypeError)

### Algorithms

- Not Included Algorithms

### Usage

```ts
import { Stack, Queue, PriorityQueue, DoubleLinkedList, ... } from './DataStructure.ts'

const stack = new Stack<number>();
console.log(stack.empty());
stack.push(1);
stack.push(2);
console.log(stack.top());
stack.pop();
console.log(stack.size());
```
