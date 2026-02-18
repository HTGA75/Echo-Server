# TCP Server from Scratch (Node.js + TypeScript)

Implemented a raw TCP echo server without using any web frameworks to understand how networking and asynchronous I/O work at a low level.

**This project explores how Node handles sockets internally and compares two architectural styles:**

- event-driven callbacks

- promise-based async/await abstraction

Why I built this

Most backend development hides networking behind Express/Fastify. **I wanted to understand what actually happens underneath:**

- how connections are established

- how data flows through sockets

- how the event loop schedules I/O

- how to design cleaner async APIs

## Implementations
### Callback-based server (JavaScript)*

- direct use of net.Socket

- manual event handling (data, end, close, error)

- explicit connection lifecycle management

### Promise-based server (TypeScript)

- wrapped raw socket into a custom TCPConn abstraction

- exposed soRead() / soWrite() async methods

- refactored callback flow → linear async/await flow

- centralized error handling + cleanup

### Simple Parsing Protocol (New)

- Implements a robust message parsing strategy using strictly typed TypeScript.

- **Dynamic Buffers (`DynBuf`)**:
  - Automatically resizes the buffer capacity by powers of two when full (amortized O(1) appending).
  - Efficiently handles incoming chunks of arbitrary size.

- **Smart Message Parsing**:
  - Parses newline-delimited messages (`\n`).
  - **Lazy Shifting**: Instead of shifting data after every consume (which is O(N^2)), it only removes data from the front (`bufPop`) when the read head advances beyond 50% of the buffer. This ensures O(N) performance for parsing.

## Key engineering concepts explored

- TCP socket lifecycle

- non-blocking I/O

- buffering and stream handling

- converting callback APIs into Promises

- resource cleanup & failure handling

- abstraction design around low-level primitives

## Tech

Node.js, TypeScript, net module