const { Queue } = require('bullmq');

async function test() {
  const redisConnection = {
    host: 'localhost',
    port: 6379,
    enableOfflineQueue: false,
    maxRetriesPerRequest: 0,
    lazyConnect: true,
  };

  let q = null;
  try {
    console.log('Creating queue...');
    q = new Queue('test-queue', {
      connection: redisConnection,
    });

    // WITHOUT the error listener, this might crash
    /*
    q.on('error', (err) => {
      console.log('Caught queue error:', err.message);
    });
    */

    console.log('Waiting for ready...');
    await Promise.race([
      q.waitUntilReady(),
      new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 500)),
    ]);
    console.log('Queue ready');
  } catch (err) {
    console.log('Queue failed:', err.message);
    if (q) {
      console.log('Closing queue...');
      await q.close();
      console.log('Queue closed');
    }
  }
  
  console.log('Waiting to see if it crashes...');
  await new Promise(resolve => setTimeout(resolve, 2000));
  console.log('Still alive!');
}

test().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
