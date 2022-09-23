import { Graph } from "../core/Graph";
import { Vector3 } from "oasis-engine";
import { NavNode } from "../../navigation/core/NavNode";

/**
 * Class for representing a heuristic for graph search algorithms based
 * on the euclidean distance. The heuristic assumes that the node have
 * a *position* property of type {@link TVector3}.
 */
export class HeuristicPolicyEuclid {
  /**
   * Calculates the euclidean distance between two nodes.
   *
   * @param graph - The graph.
   * @param source - The index of the source node.
   * @param target - The index of the target node.
   * @return The euclidean distance between both nodes.
   */
  static calculate(graph: Graph, source: number, target: number): number {
    const sourceNode: NavNode = <NavNode>graph.getNode(source);
    const targetNode: NavNode = <NavNode>graph.getNode(target);

    return sourceNode.position.distanceTo(targetNode.position);
  }
}

/**
 * Class for representing a heuristic for graph search algorithms based
 * on the squared euclidean distance. The heuristic assumes that the node
 * have a *position* property of type {@link Vector3}.
 */
export class HeuristicPolicyEuclidSquared {
  /**
   * Calculates the squared euclidean distance between two nodes.
   *
   * @param graph - The graph.
   * @param source - The index of the source node.
   * @param target - The index of the target node.
   * @return The squared euclidean distance between both nodes.
   */
  static calculate(graph: Graph, source: number, target: number): number {
    const sourceNode: NavNode = <NavNode>graph.getNode(source);
    const targetNode: NavNode = <NavNode>graph.getNode(target);

    return sourceNode.position.distanceSquaredTo(targetNode.position);
  }
}

/**
 * Class for representing a heuristic for graph search algorithms based
 * on the manhattan distance. The heuristic assumes that the node
 * have a *position* property of type {@link Vector3}.
 */
export class HeuristicPolicyManhattan {
  /**
   * Calculates the manhattan distance between two nodes.
   *
   * @param graph - The graph.
   * @param source - The index of the source node.
   * @param target - The index of the target node.
   * @return The manhattan distance between both nodes.
   */
  static calculate(graph: Graph, source: number, target: number): number {
    const sourceNode: NavNode = <NavNode>graph.getNode(source);
    const targetNode: NavNode = <NavNode>graph.getNode(target);

    return sourceNode.position.manhattanDistanceTo(targetNode.position);
  }
}

/**
 * Class for representing a heuristic for graph search algorithms based
 * on Dijkstra's algorithm.
 */
export class HeuristicPolicyDijkstra {
  /**
   * This heuristic always returns *0*. The {@link AStar} algorithm
   * behaves with this heuristic exactly like {@link Dijkstra}
   */
  static calculate(): number {
    return 0;
  }
}
