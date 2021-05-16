async function brutePrime(n) {
  function work({ data }) {
    while (true) {
      let d = 2;
      for (; d < data; d++) {
        if (data % d == 0) break;
      }
      if (d == data) return self.postMessage(data);
      data++;
    }
  }

  let b = new Blob(["onmessage =" + work.toString()], { type: "text/javascript" });
  let worker = new Worker(URL.createObjectURL(b));
  worker.postMessage(n);
  return await new Promise(resolve => worker.onmessage = e => resolve(e.data));
}

function testW() {
(async () => {
  let n = 100;
  for (let i = 0; i < 10; i++) {
    console.log(n = await brutePrime(n + 1));
  }
})().catch(e => console.log(e));

}
