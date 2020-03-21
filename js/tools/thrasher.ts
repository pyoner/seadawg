import fs from "fs-extra";
import prettyMs from "pretty-ms";
import randomString from "randomstring";
import { performance } from "perf_hooks";

import { SeaDawgCore } from "../src/core";
import { SeaDefaultSinkNode } from "../src/data";

/**
 * Exists to thrash the data structure.
 * Primariiy to break it to find bad states during development or the node binary.
 */
async function main() {

  const testMaxCount = 50;
  const maxCount = 500;
  let currentIdx = 0;

  console.log("Starting bencher");

  for (let testIdx = 0; testIdx < testMaxCount; testIdx++) {
    const startTime = performance.now();
    let seaDawg = new SeaDawgCore();
    let words = []; // TODO Need to be able to collect these. Maybe use a trie instead for compression.

    try {

      currentIdx = 0;

      for(;currentIdx < maxCount; currentIdx++) {
        const word = randomString.generate({
          length: 128,
          charset: "alphanumeric",
        });
        
        seaDawg.add(word, new SeaDefaultSinkNode());
      }
    } catch (err) {
      await fs.writeJson("bench_broken_words.json", words);
      console.error(err);
      return;
    }

    const elapsed = performance.now() - startTime;

    console.log(`Completed in ${prettyMs(elapsed)}`);

    if (global.gc && currentIdx > 75000) {
      console.log("Performing garbage collection");
      global.gc();
    }
  }

  console.log(`Finished adding ${currentIdx} waiting 10 secs`);
  await new Promise((resolve) => setTimeout(resolve, 10000));
}

main();