//Using Callback Style
import * as net from "net";

function newConn(socket) {
    console.log('new connection', socket.remoteAddress, socket.remotePort);

    socket.on('end', () => {
        // FIN received. The connection will bea closed automatically.
        console.log('EOF.');//End of File
    });
    socket.on('close', () => { console.log('Connection fully closed'); });
    socket.on('data', (data) => {//Data Recieved
        console.log('data:', data);
        socket.write(data); // echo the Data back

        // actively closed the connection if the data contains 'q'
        if (data.includes('q')) {
            console.log('closing.');
            socket.end();   // this will send FIN and close the connection.
        }
    });
}

let server = net.createServer();//create server

server.on('error', (err) => { throw err; });
server.on('connection', newConn);//when the client connects

server.listen({host: '127.0.0.1', port: 1234});//bind server to a port