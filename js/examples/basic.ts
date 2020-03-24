import {dump} from "dumpenvy";

import { SeaDawgCore } from "../src/core";
import { SeaValueSinkNode } from "../src/data";

function main() {

  let words = [
    "cocoa",
    "abbabc",
    "cola",
    "coca cola",
    "key",
    "fob",
    "baby",
    "GG",
    "Good Game",
    "Dawg",
    "aye aye captain",
    "Matey",
    "Ohhhhhhhhhhhhhh",
    "arrrrrrrrrr ye scurvy dawg",
    "walk da plank",
    "who lives in a pipeapple under da sea?",
    "black beard, a fearsome pirate",
  ];
  let chosenWord = words[0];

  let seaDawg = new SeaDawgCore();

  console.log("Adding words");

  for(const word of words) {
    const sink  = new SeaValueSinkNode(word);

    if (word === chosenWord) {
      console.log(`Storing data in word ${chosenWord}`)
      sink.data = "GG";
    }

    seaDawg.add(word, sink);
  }
  
  console.log("Finding words");

  for(const word of words) {
    
    const sinkNode = seaDawg.findExact(word);

    if(!sinkNode) {
      console.error(`Did not find word "${word}" in graph!`);
    }
  }

  console.log("Completed finding words");

  // Exact match
  console.log("Finding cocoa");
  const sinkNode = <SeaValueSinkNode>seaDawg.findExact(chosenWord);

  if(!sinkNode || sinkNode.data !== "GG") {
    console.error(`Did not find matching data for  "${chosenWord}"'!`);
  }

  console.log(`Find of 'a' return null: ${seaDawg.findExact("a") === null}`);

  /// Prefixes
  console.log("Finding prefixed nodes of: 'w'");
  const nodesWithPrefixOfW = seaDawg.findWithPrefix("w");

  if(nodesWithPrefixOfW.length !== 2) {
    console.error("Did not return correct number of prefixes for 'w'");
  }

  console.log("Finding prefixed nodes of: 'c'");
  const nodesWithPrefixOfc = seaDawg.findWithPrefix("c");

  if(nodesWithPrefixOfc.length !== 3) {
    console.error("Did not return correct number of prefixes for 'c'");
  }

  /// Super strings
  console.log("Finding superstrings of: 'w'");
  const nodesSuperStringOfW = seaDawg.findWithSubstring("w");

  if(nodesSuperStringOfW.length !== 3) {
    console.error("Did not return correct number of super strings for 'w'");
  }

  console.log("Finding superstrings of: 'c'");
  const nodesSuperStringOfc = seaDawg.findWithSubstring("c");

  if(nodesSuperStringOfc.length !== 7) {
    console.error("Did not return correct number of super strings for 'c'");
  }

  console.log("Removing `cocoa`");
  seaDawg.delete("cocoa");
  const afterCocoaDeletedValue = seaDawg.findExact("cocoa");

  if(afterCocoaDeletedValue) {
    console.error("Cocoa still exists");
  }

  console.log("Adding cocoa again");

  seaDawg.add("cocoa", new SeaValueSinkNode("cocoa"));

  const afterCocoaAddedValue = seaDawg.findExact("cocoa");

  if(!afterCocoaAddedValue) {
    console.error("Cocoa doesn't exist after re-adding.");
  }

  console.log("Removing all words")
  for(const word of words) {
    
    seaDawg.delete(word);
  }

  if(seaDawg.source.toEdges.size !== 0) {

    console.error("Graph is not empty after all words removed");
  }
}

main();