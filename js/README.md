# SeaDAWG Js

Implementation of SeaDAWG in Typescript. Probably the first working open sourced implementation of online construction of CDAWGs.

Under development, so anything can change at any point.

# Tools

**Bad State Runner** - runs words that put the Graph into a bad state while I was developing. Mostly to ensure that those bad states do not happen again.

**Thrasher** - runs series of random 128 character words to make sure the graph is constructed properly. If bad state that causes fatal error is encountered, then words that were added will be dumped into a file, so it can be reproduced.