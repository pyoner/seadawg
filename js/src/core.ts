import { SeaSinkNode } from "./data";

const EDGE_OPEN = -2;

export class SeaEdge {
  constructor(
    public partial: string,
    public startIdx: number,
    public endIdx: number,
    public dest: SeaNode | SeaSinkNode,
  ) {}

  clone(): SeaEdge {
    
    return new SeaEdge(this.partial, this.startIdx, this.endIdx, this.dest);
  }
}

export class SeaNode {

  public toEdges: Map<string, SeaEdge>;

  constructor(
    public length: number,
    public suffix: SeaNode,
  ) {

    this.toEdges = new Map();
  }

  setEdge(partial: string, letter: string, startIdx: number, endIdx: number, dest: SeaNode | SeaSinkNode) {

    this.toEdges.set(letter, new SeaEdge(partial, startIdx, endIdx, dest));
  }

  clone(): SeaNode {

    const cloneNode = new SeaNode(this.length, this.suffix);

    for (let [key, edge] of this.toEdges.entries()) {
      const clonedEdge = edge.clone();
      cloneNode.toEdges.set(key, clonedEdge);
    }

    return cloneNode;
  }
}

/**
 * This class exists as the efficient actively developed version
 */
export class SeaDawgCore {

  // Properties of a CDAWG
  // S is a set of strings, S' is a the set of strings ending with a stop symbol
  // A CDAWG has an initial node (root), ||S|| - 1 internal nodes and |S| - 1 final nodes (sink)
  // Root node and initial nodes must have at least 2 outoging edges
  // Labels of two outgoing edges do not begin wit the same letter
  // Any Factor(S), substring, is represented by a path starting at the initial node
  // Any string in the Suffix(S') is represented by a path starting at the initial node and ending at the final node
  // Suppose that a path spelling out α∈Σ∗ ends at a node v. If a string β is always preceded by γ∈Σ∗ and α=γβ in any string x ∈ S′ such that β ∈ Factor(x), the path spelling out β also ends at node v.

  root: SeaNode;
  sink: SeaSinkNode;
  source: SeaNode;
  debug: boolean = false;
  wordTerminator: string = "\u0000";

  constructor() {

    this.root = new SeaNode(-1, null);
    (<any>this.root).id = "root";

    this.source = new SeaNode(0, this.root);
    (<any>this.source).id = "source";
  }

  public add(word: string, sink: SeaSinkNode) {

    word = this._terminateWord(word);
    this.sink = sink;

    (<any>this.sink).id = "sink";
    
    let updateData: [SeaNode, number] = [this.source, 0];

    //TODO: Was given an idea to instead traverse the graph until reaching the node that can no longer be traversed for the path and use that as the starting path. This version is good enough right now.
    for(let wordIdx = 0; wordIdx < word.length; wordIdx++) {

      const letter = word[wordIdx];
      
      // Initialize edges from root if needed
      if (!this.root.toEdges.has(letter)) {
        this.root.setEdge(null, letter, wordIdx, wordIdx, this.source);
      }

      (<any>this.sink).length = wordIdx + 1; // This is e as citied in the paper

      updateData = this._update(word, letter, updateData[0], updateData[1], wordIdx);
    }

    return this.sink;
  }

  public findExact(word: string): SeaSinkNode {

    word = this._terminateWord(word);

    let targetNode: SeaSinkNode = null;
    let wordIdx = 0;

    let currentNode = this.source;

    while(true) {

      const wordFirstChar = word[wordIdx];
      const matchingEdge = currentNode.toEdges.get(wordFirstChar);

      if(!matchingEdge) {
        break;
      }

      const partialLength = matchingEdge.partial.length;
      if(matchingEdge.partial === word.substring(wordIdx, wordIdx + partialLength)) {

        if (!(matchingEdge.dest instanceof SeaNode)) {

          if (matchingEdge.dest.length === word.length) {
            targetNode = matchingEdge.dest;
          }
          break;
        }

        currentNode = matchingEdge.dest;
        wordIdx += partialLength;

        continue;
      }

      break;
    }

    return targetNode;
  }

  private _update(word: string, letter: string, updateNode: SeaNode, startIdx: number, endIdx: number): [SeaNode, number] {

    let prevNode: SeaNode = null;
    let updateNodePrime: SeaNode | SeaSinkNode = null;
    let updateNodeNext: SeaNode = null;

    while (!this._checkEndpoint(updateNode, startIdx, endIdx - 1, letter, word)) {

      if (startIdx <= endIdx - 1) {

        const possibleExtension = this._extension(updateNode, startIdx, endIdx - 1, word);
        if (updateNodePrime === possibleExtension) {

          this._redirectEdge(updateNode, startIdx, endIdx - 1, updateNodeNext, word);
          [updateNode, startIdx] = this._canonize(updateNode.suffix, startIdx, endIdx - 1, word);

          continue;
        }

        updateNodePrime = possibleExtension;
        updateNodeNext = this._splitEdge(updateNode, startIdx, endIdx - 1, word);

      } else {

        updateNodeNext = updateNode;
      }

      updateNodeNext.setEdge(word.substring(endIdx), letter, endIdx, EDGE_OPEN, this.sink);

      if (prevNode != null) {
        prevNode.suffix = updateNodeNext;
      }

      prevNode = updateNodeNext;

      let snapNode = updateNode;
      [updateNode, startIdx] = this._canonize(updateNode.suffix, startIdx, endIdx - 1, word);

      if (!updateNode) {
        console.error("update", word, letter, startIdx, endIdx, snapNode);
      }
    }

    if (prevNode != null) {
      prevNode.suffix = updateNode;
    }

    return this._separateNode(updateNode, startIdx, endIdx, word);
  }

  private _checkEndpoint(src: SeaNode, startIdx: number, endIdx: number, letter: string, word: string): boolean {

    if (startIdx <= endIdx) {

      const edge = src.toEdges.get(word[startIdx]);
      word = edge.partial;
      
      return letter === word[endIdx - startIdx + 1];
    }

    return src.toEdges.has(letter);
  }

  private _canonize(node: SeaNode, startIdx: number, endIdx: number, word: string): [SeaNode, number] {

    if (startIdx > endIdx) {
      return [node, startIdx];
    }

    let edge = node.toEdges.get(word[startIdx]);
    
    let edgeIdxDiff = getEndIdx(edge) - edge.startIdx;
    while(edgeIdxDiff <= endIdx - startIdx) {

      startIdx += edgeIdxDiff + 1;

      if (!(edge.dest instanceof SeaNode)) {
        
        throw new Error("Only SeaNodes should be returned by canonize");
      }

      node = edge.dest;

      if(startIdx <= endIdx) {
        
        edge = node.toEdges.get(word[startIdx]);
      }
      
      edgeIdxDiff = getEndIdx(edge) - edge.startIdx;
    }

    return [node, startIdx];
  }

  private _extension(node: SeaNode, startIdx: number, endIdx: number, word: string): SeaNode | SeaSinkNode {

    if (startIdx > endIdx) {
      return node;
    }

    const letter = word[startIdx];
    const edge = node.toEdges.get(letter);

    return edge.dest;
  }

  private _redirectEdge(src: SeaNode, startIdx: number, endIdx: number, dest: SeaNode, word: string) {

    const letter = word[startIdx];
    const edge = src.toEdges.get(letter);
    const subStringIdxDiff = endIdx - startIdx;
    const newEndIdx = edge.startIdx + subStringIdxDiff;
    const newPartial = edge.partial.substring(0, subStringIdxDiff + 1);
    
    src.setEdge(newPartial, letter, edge.startIdx, newEndIdx, dest);
  }

  // Adds a node into the middle of an edge, which results src -> newNode -> src.dest
  // Just think of it as splitting a string
  private _splitEdge(src: SeaNode, startIdx: number, endIdx: number, word: string): SeaNode {

    const letter = word[startIdx]; // This is the k variable
    const edge = src.toEdges.get(letter);
    const snapWord = word;
    word = edge.partial; // Word at edge
    
    const subStringIdxDiff = endIdx - startIdx; // This is p - k
    const newNode = new SeaNode(src.length + subStringIdxDiff + 1, null);
    
    // newNode.edge[letter] -> src.dest
    const newStartIdx = edge.startIdx + subStringIdxDiff + 1;
    const newLetter = word[subStringIdxDiff + 1];

    if (this.debug && (typeof newLetter === "undefined" || newLetter === null)) {
      console.log(`[snap, ${snapWord}, ${snapWord.length}]`, `[curr, ${word}, ${word.length}]`, `edge startIdx: ${edge.startIdx} => ${newStartIdx}`, `edge endIdx: ${edge.endIdx} => ${endIdx}`, `[snap: ${letter}, curr: ${newLetter}]`, subStringIdxDiff, startIdx, endIdx);
      console.log(require("util").inspect(src, {"depth": 4}));
      console.error("^ New letter should not be empty. Info above.");
    }

    newNode.setEdge(edge.partial.substring(subStringIdxDiff + 1), newLetter, newStartIdx, edge.endIdx, edge.dest);

    // src.edge[letter] -> newNode
    src.setEdge(edge.partial.substring(0, subStringIdxDiff + 1), letter, edge.startIdx, newStartIdx - 1, newNode);

    return newNode;
  }

  private _separateNode(src: SeaNode, startIdx: number, endIdx: number, word: string): [SeaNode, number] {

    let canonizedData = this._canonize(src, startIdx, endIdx, word);

    if (canonizedData[1] <= endIdx) {
      return canonizedData;
    }

    let canonNode = canonizedData[0];
    const sepLength = src.length + endIdx - startIdx + 1;

    if (canonNode.length === sepLength) {
      return canonizedData;
    }

    const sepNode = canonNode.clone();
    sepNode.length = sepLength;
    sepNode.suffix = canonNode.suffix;
    canonNode.suffix = sepNode;

    while(true) {
      
      const edge = src.toEdges.get(word[startIdx]);

      src.setEdge(edge.partial, edge.partial[0], edge.startIdx, edge.endIdx, sepNode);

      [src, startIdx] = this._canonize(src.suffix, startIdx, endIdx - 1, word);
      
      let newCanonizedNodePair = this._canonize(src, startIdx, endIdx, word);

      if ((canonizedData[0] !== newCanonizedNodePair[0]) || (canonizedData[1] !== newCanonizedNodePair[1])) {
        break;
      }
    }
    
    return [sepNode, endIdx + 1];
  }

  private _terminateWord(word: string): string {
    return word + this.wordTerminator;
  }
}

/**
 * Most efficient way to return the value for undefined endIdx. I believe that
 * the edges that point to the sink are considered to be open nodes since longer
 * strings could redirect the edges
 */
function getEndIdx(edge: SeaEdge): number {
  
  return edge.endIdx === EDGE_OPEN ? edge.dest.length : edge.endIdx; // This is e(i) as citied in the paper
}