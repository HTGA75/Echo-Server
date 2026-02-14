import * as net from "net"

// A promise-based API for TCP sockets.
type TCPConn = {
    // the JS socket object
    socket: net.Socket;
    // from the 'error' event
    err: null|Error;
    // EOF, from the 'end' event
    ended: boolean;
    // the callbacks of the promise of the current read
    reader: null|{
        resolve: (value: Buffer) => void,
        reject: (reason: Error) => void,
    };
};

type DynBuf = {
    data: Buffer,
    length: number,
}


function soInit(socket: net.Socket): TCPConn {
    const conn: TCPConn = {
        socket: socket, err: null, ended: false, reader: null,
    };
    socket.on('data', (data: Buffer) => {
        if (conn.reader) {
            // pause the 'data' event until the next read.
            conn.socket.pause();
            // fulfill the promise of the current read.
            conn.reader.resolve(data);
            conn.reader = null;
        }
    });
    socket.on('end', () => {
        // this also fulfills the current read.
        conn.ended = true;
        if (conn.reader) {
            conn.reader.resolve(Buffer.from(''));   // EOF
            conn.reader = null;
        }
    });
    socket.on('error', (err: Error) => {
        // errors are also delivered to the current read.
        conn.err = err;
        if (conn.reader) {
            conn.reader.reject(err);
            conn.reader = null;
        }
    });
    return conn;
}

function soRead(conn: TCPConn): Promise<Buffer> {
    console.assert(!conn.reader);   // no concurrent calls
    return new Promise((resolve, reject) => {
        // if the connection is not readable, complete the promise now.
        if (conn.err) {
            reject(conn.err);
            return;
        }
        if (conn.ended) {
            resolve(Buffer.from(''));   // EOF
            return;
        }

        // save the promise callbacks
        conn.reader = {resolve: resolve, reject: reject};
        // and resume the 'data' event to fulfill the promise later.
        conn.socket.resume();
    });
}

function soWrite(conn: TCPConn, data: Buffer): Promise<void> {
    console.assert(data.length > 0);
    return new Promise((resolve, reject) => {
        if (conn.err) {
            reject(conn.err);
            return;
        }

        conn.socket.write(data, (err) => {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
}

// append data to DynBuf
function bufPush(buf: DynBuf, data: Buffer): void {
    const newLen = buf.length + data.length;
    if (buf.data.length < newLen) {
        // grow the capacity by the power of two
        let cap = Math.max(buf.data.length, 32);
        while (cap < newLen) {
            cap *= 2;
        }
        const grown = Buffer.alloc(cap);
        buf.data.copy(grown, 0, 0);
        buf.data = grown;
    }
    data.copy(buf.data, buf.length, 0);
    buf.length = newLen;
}

// remove data from the front
function bufPop(buf: DynBuf, len: number): void {
    buf.data.copyWithin(0, len, buf.length);
    buf.length -= len;
}

function cutMessage(buf: DynBuf, prevDelIdx: number, setPrevDelIdx: CallableFunction): null|Buffer {
    // messages are separated by '\n'
    const idx = buf.data.subarray(prevDelIdx, buf.length).indexOf('\n');
    if (idx < 0) {
        return null;    // not complete
    }
    // make a copy of the message and move the remaining data to the front
    const msg = Buffer.from(buf.data.subarray(prevDelIdx, prevDelIdx + idx + 1));//subarray gives the relative index so we add prevDelIdx to the (idx + 1)
    
    //we can check the length of space available in front and only call bufPop when the space is 1/2 the total capacity of the buf 
    //we will have to carefully manage the the logical length of the buffer as well
    //STEPS:
    //Use index of \n to start the data.subarray from that index + 1 to find the next \n
    //For this we can store the idx value in a var like prevIdx we could be either 0 or prev Index of \n
    //Extra: Used setPrevIdx callback function to set the variable value that was not in the cutMessage function scope
    //But we cannot initialize the varibale inside cutMessage 
    //At the bottom before calling bufPop we can check if the length from 0 to current idx is 1/2 of buf.data.length 
    //Check if the data infront as reached the threshold
    const nextDelIdx = prevDelIdx + idx + 1;
    if (nextDelIdx >= buf.data.length / 2) {
        bufPop(buf, nextDelIdx);
        setPrevDelIdx(0)
    } else {
        setPrevDelIdx(nextDelIdx);
    }
    
    return msg;
}

async function serveClient(socket: net.Socket): Promise<void> {
    const conn: TCPConn = soInit(socket);
    const buf: DynBuf = {data: Buffer.alloc(0), length: 0};
    let prevDelIdx: number = 0;
    while (true) {
        // try to get 1 message from the buffer
        const msg = cutMessage(buf, prevDelIdx, (idx: number) => (prevDelIdx = idx));
        if (!msg) {
            const data: Buffer = await soRead(conn);
            bufPush(buf, data);
            // EOF?
            if (data.length === 0) {
                // omitted ...
                return;
            }
            // got some data, try it again.
            continue;
        }

        const msgStr = msg.toString().trim();
        if (msgStr === 'quit') {
            await soWrite(conn, Buffer.from('Bye.\n'));
            socket.destroy();
            return;
        } else {
            const reply = Buffer.concat([Buffer.from('Echo: '), msg]);
            await soWrite(conn, reply);
        }
    } // loop for messages
}

async function newConn(socket: net.Socket): Promise<void> {
    console.log('new connection', socket.remoteAddress, socket.remotePort);
    try {
        await serveClient(socket);
    } catch (exc) {
        console.error('exception:', exc);
    } finally {
        socket.destroy();
    }
}

const server = net.createServer({
    pauseOnConnect: true,   // required by `TCPConn`
});

server.on('connection', newConn);

server.listen({host: '127.0.0.1', port: 1234});//bind server to a port