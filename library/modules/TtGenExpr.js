var TTgenFn = function (rd) {
  pub.gen = function (seed = 1, qmax = 1000, restart = 1) {
    if (restart) {
      rd.deleteRand(seed);
    }

    var v = [];
    for (var i = 0; i < qmax; i++) {
      v[i] = rd.rand(0, 99, seed, 0, 0);
    }
    return v;
  }
};

export { TTgenFn }