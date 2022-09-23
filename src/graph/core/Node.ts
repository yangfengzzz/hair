export class Node {
  /**
   * The unique index of this node. The default value *-1* means invalid index.
   */
  index: number;

  /**
   * Constructs a new node.
   *
   * @param index - The unique index of this node.
   */
  constructor(index: number = -1) {
    this.index = index;
  }
}
