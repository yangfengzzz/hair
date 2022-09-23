/**
 * Class for representing a binary heap priority queue that enables
 * more efficient sorting of arrays. The implementation is based on
 * {@link https://github.com/mourner/tinyqueue tinyqueue}.
 */
class PriorityQueue<T> {
  private static defaultCompare(a, b) {
    return a < b ? -1 : a > b ? 1 : 0;
  }

  /**
   * The data items of the priority queue.
   */
  data: T[] = [];

  /**
   * The length of the priority queue.
   */
  length: number = 0;

  /**
   * The compare function used for sorting.
   */
  compare: (a: T, b: T) => {};

  /**
   * Constructs a new priority queue.
   * @param compare - The compare function used for sorting.
   */
  constructor(compare: (a: T, b: T) => {} = PriorityQueue.defaultCompare) {
    this.compare = compare;
  }

  /**
   * Pushes an item to the priority queue.
   *
   * @param {Object} item - The item to add.
   */
  push(item: T): void {
    this.data.push(item);
    this.length++;
    this._up(this.length - 1);
  }

  /**
   * Returns the item with the highest priority and removes
   * it from the priority queue.
   *
   * @return The item with the highest priority.
   */
  pop(): T {
    if (this.length === 0) return null;

    const top = this.data[0];
    this.length--;

    if (this.length > 0) {
      this.data[0] = this.data[this.length];
      this._down(0);
    }

    this.data.pop();

    return top;
  }

  /**
   * Returns the item with the highest priority without removal.
   *
   * @return The item with the highest priority.
   */
  peek(): T {
    return this.data[0] || null;
  }

  private _up(index: number) {
    const data = this.data;
    const compare = this.compare;
    const item = data[index];

    while (index > 0) {
      const parent = (index - 1) >> 1;
      const current = data[parent];
      if (compare(item, current) >= 0) break;
      data[index] = current;
      index = parent;
    }

    data[index] = item;
  }

  private _down(index: number) {
    const data = this.data;
    const compare = this.compare;
    const item = data[index];
    const halfLength = this.length >> 1;

    while (index < halfLength) {
      let left = (index << 1) + 1;
      let right = left + 1;
      let best = data[left];

      if (right < this.length && compare(data[right], best) < 0) {
        left = right;
        best = data[right];
      }

      if (compare(best, item) >= 0) break;

      data[index] = best;
      index = left;
    }

    data[index] = item;
  }
}
