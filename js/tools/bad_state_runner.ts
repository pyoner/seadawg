import fs from "fs-extra";
import path from "path";

import { SeaDawgCore } from "../src/core";
import { SeaDefaultSinkNode } from "../src/data";

/** 
 * Runs cases of bad states that were captured during development.
 * If it doesn't fail then everything is good.
 */
async function main() {

  let testCompleteCount = 0;

  const toolsFolder = path.resolve(__dirname, "bad_states")
  const dirContents = await fs.readdir(toolsFolder);

  for(const badStatesSubPath of dirContents) {
    
    const resolvedPath = path.resolve(toolsFolder, badStatesSubPath);

    if(!fs.lstatSync(resolvedPath).isFile()) {
      continue;
    }

    console.log(`----------Running test at ${resolvedPath}----------`);
    
    let currentIdx = 0;
    let seaDawg = new SeaDawgCore();

    const words: string[] = await fs.readJson(resolvedPath);
    const maxCount = words.length;
  
    for(;currentIdx < maxCount; currentIdx++) {
      const word = words[currentIdx];
      
      //console.log(word);
     
      seaDawg.add(word, new SeaDefaultSinkNode());
    }

    console.log(`----------Finished test at ${resolvedPath}----------`);
    testCompleteCount++;
  }

  console.log(`Finished completing ${testCompleteCount} tests. Waiting 5 secs to exit.`);
  await new Promise((resolve) => setTimeout(resolve, 5000));
}

main();