# SeaDawg

SeaDawg is a library that implements the online algorithm for Compact Direct Acyclic Word Graph (CDAWG).

The version implemented is as defined in the [On-Line Construction ofCompact Directed Acyclic Word Graphs](https://str.i.kyushu-u.ac.jp/~inenaga/papers/dam-cdawg.pdf) by Shunsuke Inenaga et. al.

Licensed under the MPL 2.0 since it is fair enough.

# Current Status

Currently working on the far more efficient Rust version, which currently [compresses text > 50% in in-memory and very fast at indexing millions of terms](https://www.normansoven.com/post/obessed-with-making-a-gst-memory-efficient-part-4-indexing-100m-128-letter-words).

# Why

1. **Did it for fun.** Was reading about Suffix Trees moved on to DAWG then CDAWG. I implemented Suffix Tree, but it is memory expensive.
2. Looks like a very efficient data structure and I did not find a good version of this anywhere.
3. It is an advanced data structure, so this probably would be implemented in advanced circles that can afford it.
4. Let's be honest, the more open libraries the more building blocks you have. I've benefitted a lot from having building blocks, so might as well contribute some as well.

# Feature requests

To contribute features read [Contributions](CONTRIBUTING.md).

Request for the author to implement features will automatically be denied. I did this for fun. I like ideas, but I cannot hold myself to implement them.
