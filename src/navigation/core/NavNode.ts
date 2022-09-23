import { Node } from "../../graph/core/Node";
import { TVector3 } from "../../math/TVector3";

export class NavNode extends Node {
  /**
   * The position of the node in 3D space.
   */
  position: TVector3;

  /**
   * Custom user data connected to this node.
   */
  userData: any;

  /**
   * Constructs a new navigation node.
   *
   * @param index - The unique index of this node.
   * @param position - The position of the node in 3D space.
   * @param userData - Custom user data connected to this node.
   */
  constructor(
    index: number = -1,
    position: TVector3 = new TVector3(),
    userData = {}
  ) {
    super(index);
    this.position = position;
    this.userData = userData;
  }
}
