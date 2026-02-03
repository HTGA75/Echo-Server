//Promise Based
// const fs = require('fs/promises');

// async function readFilePromise() {
//   try {
//     // Open file
//     const filehandle = await fs.open('text.txt', 'r');

//     // Allocate buffer
//     const buffer = Buffer.alloc(100);

//     // Read into buffer
//     const { bytesRead } = await filehandle.read(buffer, 0, buffer.length, 0);

//     console.log('Bytes read:', bytesRead);
//     console.log('Content:', buffer.toString('utf8', 0, bytesRead));

//     await filehandle.close();
//   } catch (err) {
//     console.error('Error:', err);
//   }
// }

// readFilePromise();

//-----------------------------------------------------
//Callback based
// const fs = require('fs');

// fs.open('text.txt', 'r', (err, fd) => {
//   if (err) throw err;

//   const buffer = Buffer.alloc(100);

//   fs.read(fd, buffer, 0, buffer.length, 0, (err, bytesRead) => {
//     if (err) throw err;

//     console.log('Bytes read:', bytesRead);
//     console.log('Content:', buffer.toString('utf8', 0, bytesRead));

//     fs.close(fd, (err) => {
//       if (err) throw err;
//     });
//   });
// });

//-----------------------------------------------------------
//Synchronous - Should be avoided in Network IO/production - it blocks event loop
// const fs = require('fs');

// try {
//   const fd = fs.openSync('text.txt', 'r');
//   const buffer = Buffer.alloc(100);

//   const bytesRead = fs.readSync(fd, buffer, 0, buffer.length, 0);

//   console.log('Bytes read:', bytesRead);
//   console.log('Content:', buffer.toString('utf8', 0, bytesRead));

//   fs.closeSync(fd);
// } catch (err) {
//   console.error('Error:', err);
// }
