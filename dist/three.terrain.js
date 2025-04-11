import * as s from "three";
const M = {};
function xr(e) {
  return Math.pow(2, Math.ceil(Math.log(e) / Math.log(2)));
}
const dr = function(e) {
  var r = {
    after: null,
    easing: M.Linear,
    heightmap: function(u, h) {
      for (var m = 0; m < u.length; m++)
        u[m] = Math.random() * (h.maxHeight - h.minHeight) + h.minHeight;
    },
    material: null,
    maxHeight: 100,
    minHeight: -100,
    optimization: M.NONE,
    frequency: 2.5,
    steps: 1,
    stretch: true,
    turbulent: false,
    xSegments: 63,
    xSize: 1024,
    ySegments: 63,
    ySize: 1024
  };
  e = e || {};
  for (var a in r)
    r.hasOwnProperty(a) && (e[a] = typeof e[a] > "u" ? r[a] : e[a]);
  e.material = e.material || new s.MeshBasicMaterial({ color: 15623731 });
  var t = new s.Object3D();
  t.rotation.x = -0.5 * Math.PI;
  var n = new s.Mesh(
    new s.PlaneGeometry(e.xSize, e.ySize, e.xSegments, e.ySegments),
    e.material
  ), f = M.toArray1D(n.geometry.attributes.position.array);
  return e.heightmap instanceof HTMLCanvasElement || e.heightmap instanceof Image ? M.fromHeightmap(f, e, e.heightmap) : typeof e.heightmap == "function" ? e.heightmap(f, e) : console.warn("An invalid value was passed for `options.heightmap`: " + e.heightmap), M.fromArray1D(n.geometry.attributes.position.array, f), M.Normalize(n, e), t.add(n), t;
};
M.Normalize = function(e, r) {
  var a = M.toArray1D(e.geometry.attributes.position.array);
  r.turbulent && M.Turbulence(a, r), r.steps > 1 && (M.Step(a, r.steps), M.Smooth(a, r)), M.Clamp(a, r), typeof r.after == "function" && r.after(a, r), M.fromArray1D(e.geometry.attributes.position.array, a), e.geometry.computeBoundingSphere(), e.geometry.computeVertexNormals();
};
M.NONE = 0;
M.GEOMIPMAP = 1;
M.GEOCLIPMAP = 2;
M.POLYGONREDUCTION = 3;
M.toArray2D = function(e, r) {
  var a = new Array(r.xSegments + 1), t = r.xSegments + 1, n = r.ySegments + 1, f, u;
  for (f = 0; f < t; f++)
    for (a[f] = new Float32Array(r.ySegments + 1), u = 0; u < n; u++)
      a[f][u] = e[u * t + f];
  return a;
};
M.fromArray2D = function(e, r) {
  for (var a = 0, t = r.length; a < t; a++)
    for (var n = 0, f = r[a].length; n < f; n++)
      e[n * t + a] = r[a][n];
};
M.toArray1D = function(e) {
  for (var r = new Float32Array(e.length / 3), a = 0, t = r.length; a < t; a++)
    r[a] = e[a * 3 + 2];
  return r;
};
M.fromArray1D = function(e, r) {
  for (var a = 0, t = Math.min(e.length / 3, r.length); a < t; a++)
    e[a * 3 + 2] = r[a];
};
M.heightmapArray = function(e, r) {
  var a = new Array((r.xSegments + 1) * (r.ySegments + 1));
  return a.length, a.fill(0), r.minHeight = r.minHeight || 0, r.maxHeight = typeof r.maxHeight > "u" ? 1 : r.maxHeight, r.stretch = r.stretch || false, e(a, r), M.Clamp(a, r), a;
};
M.Linear = function(e) {
  return e;
};
M.EaseIn = function(e) {
  return e * e;
};
M.EaseOut = function(e) {
  return -e * (e - 2);
};
M.EaseInOut = function(e) {
  return e * e * (3 - 2 * e);
};
M.InEaseOut = function(e) {
  var r = 2 * e - 1;
  return 0.5 * r * r * r + 0.5;
};
M.EaseInWeak = function(e) {
  return Math.pow(e, 1.55);
};
M.EaseInStrong = function(e) {
  return e * e * e * e * e * e * e;
};
M.Terrain = dr;
M.Clamp = function(e, r) {
  var a = 1 / 0, t = -1 / 0, n = e.length, f;
  for (r.easing = r.easing || M.Linear, f = 0; f < n; f++)
    e[f] < a && (a = e[f]), e[f] > t && (t = e[f]);
  var u = t - a, h = typeof r.maxHeight != "number" ? t : r.maxHeight, m = typeof r.minHeight != "number" ? a : r.minHeight, i = r.stretch ? h : t < h ? t : h, g = r.stretch ? m : a > m ? a : m, o = i - g;
  for (i < g && (i = h, o = i - g), f = 0; f < n; f++)
    e[f] = r.easing((e[f] - a) / u) * o + m;
};
M.Edges = function(e, r, a, t, n, f) {
  var u = Math.floor(t / (r.xSize / r.xSegments)) || 1, h = Math.floor(t / (r.ySize / r.ySegments)) || 1, m = a ? r.maxHeight : r.minHeight, i = a ? Math.max : Math.min, g = r.xSegments + 1, o = r.ySegments + 1, l, c, d, y, v;
  for (n = n || M.EaseInOut, typeof f != "object" && (f = { top: true, bottom: true, left: true, right: true }), l = 0; l < g; l++)
    for (c = 0; c < h; c++)
      d = n(1 - c / h), y = c * g + l, v = (r.ySegments - c) * g + l, f.top && (e[y] = i(e[y], (m - e[y]) * d + e[y])), f.bottom && (e[v] = i(e[v], (m - e[v]) * d + e[v]));
  for (l = 0; l < o; l++)
    for (c = 0; c < u; c++)
      d = n(1 - c / u), y = l * g + c, v = (r.ySegments - l) * g + (r.xSegments - c), f.left && (e[y] = i(e[y], (m - e[y]) * d + e[y])), f.right && (e[v] = i(e[v], (m - e[v]) * d + e[v]));
  M.Clamp(e, {
    maxHeight: r.maxHeight,
    minHeight: r.minHeight,
    stretch: true
  });
};
M.RadialEdges = function(e, r, a, t, n) {
  var f = a ? r.maxHeight : r.minHeight, u = a ? Math.max : Math.min, h = r.xSegments + 1, m = r.ySegments + 1, i = h * 0.5, g = m * 0.5, o = r.xSize / r.xSegments, l = r.ySize / r.ySegments, c = Math.min(r.xSize, r.ySize) * 0.5 - t, d, y, v, H, S;
  for (d = 0; d < h; d++)
    for (y = 0; y < g; y++)
      H = y * h + d, S = Math.min(c, Math.sqrt((i - d) * o * (i - d) * o + (g - y) * l * (g - y) * l) - t), !(S < 0) && (v = n(S / c), e[H] = u(e[H], (f - e[H]) * v + e[H]), H = (r.ySegments - y) * h + d, e[H] = u(e[H], (f - e[H]) * v + e[H]));
};
M.Smooth = function(e, r, a) {
  for (var t = new Float32Array(e.length), n = 0, f = r.xSegments + 1, u = r.ySegments + 1; n < f; n++)
    for (var h = 0; h < u; h++) {
      for (var m = 0, i = 0, g = -1; g <= 1; g++)
        for (var o = -1; o <= 1; o++) {
          var l = (h + g) * f + n + o;
          typeof e[l] < "u" && n + o >= 0 && h + g >= 0 && n + o < f && h + g < u && (m += e[l], i++);
        }
      t[h * f + n] = m / i;
    }
  a = a || 0;
  for (var c = 1 / (1 + a), d = 0, y = e.length; d < y; d++)
    e[d] = (t[d] + e[d] * a) * c;
};
M.SmoothMedian = function(e, r) {
  for (var a = new Float32Array(e.length), t = [], n = [], f = function(H, S) {
    return t[H] - t[S];
  }, u = 0, h = r.xSegments + 1, m = r.ySegments + 1; u < h; u++)
    for (var i = 0; i < m; i++) {
      t.length = 0, n.length = 0;
      for (var g = -1; g <= 1; g++)
        for (var o = -1; o <= 1; o++) {
          var l = (i + g) * h + u + o;
          typeof e[l] < "u" && u + o >= 0 && i + g >= 0 && u + o < h && i + g < m && (t.push(e[l]), n.push(l));
        }
      n.sort(f);
      var c = Math.floor(n.length * 0.5), d;
      n.length % 2 === 1 ? d = e[n[c]] : d = (e[n[c - 1]] + e[n[c]]) * 0.5, a[i * h + u] = d;
    }
  for (var y = 0, v = e.length; y < v; y++)
    e[y] = a[y];
};
M.SmoothConservative = function(e, r, a) {
  for (var t = new Float32Array(e.length), n = 0, f = r.xSegments + 1, u = r.ySegments + 1; n < f; n++)
    for (var h = 0; h < u; h++) {
      for (var m = -1 / 0, i = 1 / 0, g = -1; g <= 1; g++)
        for (var o = -1; o <= 1; o++) {
          var l = (h + g) * f + n + o;
          typeof e[l] < "u" && g && o && n + o >= 0 && h + g >= 0 && n + o < f && h + g < u && (e[l] < i && (i = e[l]), e[l] > m && (m = e[l]));
        }
      var c = h * f + n;
      if (typeof a == "number") {
        var d = (m - i) * 0.5, y = i + d;
        m = y + d * a, i = y - d * a;
      }
      t[c] = e[c] > m ? m : e[c] < i ? i : e[c];
    }
  for (var v = 0, H = e.length; v < H; v++)
    e[v] = t[v];
};
M.Step = function(e, r) {
  var a = 0, t = 0, n = e.length, f = Math.floor(n / r), u = new Array(n), h = new Array(r);
  for (typeof r > "u" && (r = Math.floor(Math.pow(n * 0.5, 0.25))), a = 0; a < n; a++)
    u[a] = e[a];
  for (u.sort(function(l, c) {
    return l - c;
  }), a = 0; a < r; a++) {
    var m = u.slice(a * f, (a + 1) * f), i = 0, g = m.length;
    for (t = 0; t < g; t++)
      i += m[t];
    h[a] = {
      min: m[0],
      max: m[m.length - 1],
      avg: i / g
    };
  }
  for (a = 0; a < n; a++) {
    var o = e[a];
    for (t = 0; t < r; t++)
      if (o >= h[t].min && o <= h[t].max) {
        e[a] = h[t].avg;
        break;
      }
  }
};
M.Turbulence = function(e, r) {
  for (var a = r.maxHeight - r.minHeight, t = 0, n = e.length; t < n; t++)
    e[t] = r.minHeight + Math.abs((e[t] - r.minHeight) * 2 - a);
};
const Y = {};
function C(e, r, a) {
  this.x = e, this.y = r, this.z = a;
}
C.prototype.dot2 = function(e, r) {
  return this.x * e + this.y * r;
};
C.prototype.dot3 = function(e, r, a) {
  return this.x * e + this.y * r + this.z * a;
};
var wr = [
  new C(1, 1, 0),
  new C(-1, 1, 0),
  new C(1, -1, 0),
  new C(-1, -1, 0),
  new C(1, 0, 1),
  new C(-1, 0, 1),
  new C(1, 0, -1),
  new C(-1, 0, -1),
  new C(0, 1, 1),
  new C(0, -1, 1),
  new C(0, 1, -1),
  new C(0, -1, -1)
], lr = [
  151,
  160,
  137,
  91,
  90,
  15,
  131,
  13,
  201,
  95,
  96,
  53,
  194,
  233,
  7,
  225,
  140,
  36,
  103,
  30,
  69,
  142,
  8,
  99,
  37,
  240,
  21,
  10,
  23,
  190,
  6,
  148,
  247,
  120,
  234,
  75,
  0,
  26,
  197,
  62,
  94,
  252,
  219,
  203,
  117,
  35,
  11,
  32,
  57,
  177,
  33,
  88,
  237,
  149,
  56,
  87,
  174,
  20,
  125,
  136,
  171,
  168,
  68,
  175,
  74,
  165,
  71,
  134,
  139,
  48,
  27,
  166,
  77,
  146,
  158,
  231,
  83,
  111,
  229,
  122,
  60,
  211,
  133,
  230,
  220,
  105,
  92,
  41,
  55,
  46,
  245,
  40,
  244,
  102,
  143,
  54,
  65,
  25,
  63,
  161,
  1,
  216,
  80,
  73,
  209,
  76,
  132,
  187,
  208,
  89,
  18,
  169,
  200,
  196,
  135,
  130,
  116,
  188,
  159,
  86,
  164,
  100,
  109,
  198,
  173,
  186,
  3,
  64,
  52,
  217,
  226,
  250,
  124,
  123,
  5,
  202,
  38,
  147,
  118,
  126,
  255,
  82,
  85,
  212,
  207,
  206,
  59,
  227,
  47,
  16,
  58,
  17,
  182,
  189,
  28,
  42,
  223,
  183,
  170,
  213,
  119,
  248,
  152,
  2,
  44,
  154,
  163,
  70,
  221,
  153,
  101,
  155,
  167,
  43,
  172,
  9,
  129,
  22,
  39,
  253,
  19,
  98,
  108,
  110,
  79,
  113,
  224,
  232,
  178,
  185,
  112,
  104,
  218,
  246,
  97,
  228,
  251,
  34,
  242,
  193,
  238,
  210,
  144,
  12,
  191,
  179,
  162,
  241,
  81,
  51,
  145,
  235,
  249,
  14,
  239,
  107,
  49,
  192,
  214,
  31,
  181,
  199,
  106,
  157,
  184,
  84,
  204,
  176,
  115,
  121,
  50,
  45,
  127,
  4,
  150,
  254,
  138,
  236,
  205,
  93,
  222,
  114,
  67,
  29,
  24,
  72,
  243,
  141,
  128,
  195,
  78,
  66,
  215,
  61,
  156,
  180
], G = new Array(512), E = new Array(512);
Y.seed = function(e) {
  e > 0 && e < 1 && (e *= 65536), e = Math.floor(e), e < 256 && (e |= e << 8);
  for (var r = 0; r < 256; r++) {
    var a;
    r & 1 ? a = lr[r] ^ e & 255 : a = lr[r] ^ e >> 8 & 255, G[r] = G[r + 256] = a, E[r] = E[r + 256] = wr[a % 12];
  }
};
Y.seed(Math.random());
var sr = 0.5 * (Math.sqrt(3) - 1), $ = (3 - Math.sqrt(3)) / 6;
Y.simplex = function(e, r) {
  var a, t, n, f = (e + r) * sr, u = Math.floor(e + f), h = Math.floor(r + f), m = (u + h) * $, i = e - u + m, g = r - h + m, o, l;
  i > g ? (o = 1, l = 0) : (o = 0, l = 1);
  var c = i - o + $, d = g - l + $, y = i - 1 + 2 * $, v = g - 1 + 2 * $;
  u &= 255, h &= 255;
  var H = E[u + G[h]], S = E[u + o + G[h + l]], w = E[u + 1 + G[h + 1]], x = 0.5 - i * i - g * g;
  x < 0 ? a = 0 : (x *= x, a = x * x * H.dot2(i, g));
  var I = 0.5 - c * c - d * d;
  I < 0 ? t = 0 : (I *= I, t = I * I * S.dot2(c, d));
  var z = 0.5 - y * y - v * v;
  return z < 0 ? n = 0 : (z *= z, n = z * z * w.dot2(y, v)), 70 * (a + t + n);
};
function Mr(e) {
  return e * e * e * (e * (e * 6 - 15) + 10);
}
function fr(e, r, a) {
  return (1 - a) * e + a * r;
}
Y.perlin = function(e, r) {
  var a = Math.floor(e), t = Math.floor(r);
  e = e - a, r = r - t, a = a & 255, t = t & 255;
  var n = E[a + G[t]].dot2(e, r), f = E[a + G[t + 1]].dot2(e, r - 1), u = E[a + 1 + G[t]].dot2(e - 1, r), h = E[a + 1 + G[t + 1]].dot2(e - 1, r - 1), m = Mr(e);
  return fr(
    fr(n, u, m),
    fr(f, h, m),
    Mr(r)
  );
};
M.MultiPass = function(e, r, a) {
  var t = {};
  for (var n in r)
    r.hasOwnProperty(n) && (t[n] = r[n]);
  for (var f = r.maxHeight - r.minHeight, u = 0, h = a.length; u < h; u++) {
    var m = typeof a[u].amplitude > "u" ? 1 : a[u].amplitude, i = 0.5 * (f - f * m);
    t.maxHeight = r.maxHeight - i, t.minHeight = r.minHeight + i, t.frequency = typeof a[u].frequency > "u" ? r.frequency : a[u].frequency, a[u].method(e, t);
  }
};
M.Curve = function(e, r, a) {
  for (var t = (r.maxHeight - r.minHeight) * 0.5, n = r.frequency / (Math.min(r.xSegments, r.ySegments) + 1), f = 0, u = r.xSegments + 1, h = r.ySegments + 1; f < u; f++)
    for (var m = 0; m < h; m++)
      e[m * u + f] += a(f * n, m * n) * t;
};
M.Cosine = function(e, r) {
  for (var a = (r.maxHeight - r.minHeight) * 0.5, t = r.frequency * Math.PI / (Math.min(r.xSegments, r.ySegments) + 1), n = Math.random() * Math.PI * 2, f = 0, u = r.xSegments + 1; f < u; f++)
    for (var h = 0, m = r.ySegments + 1; h < m; h++)
      e[h * u + f] += a * (Math.cos(f * t + n) + Math.cos(h * t + n));
};
M.CosineLayers = function(e, r) {
  M.MultiPass(e, r, [
    { method: M.Cosine, frequency: 2.5 },
    { method: M.Cosine, amplitude: 0.1, frequency: 12 },
    { method: M.Cosine, amplitude: 0.05, frequency: 15 },
    { method: M.Cosine, amplitude: 0.025, frequency: 20 }
  ]);
};
M.DiamondSquare = function(e, r) {
  var a = xr(Math.max(r.xSegments, r.ySegments) + 1), t = a + 1, n = [], f = r.maxHeight - r.minHeight, u, h, m = r.xSegments + 1, i = r.ySegments + 1;
  for (u = 0; u <= a; u++)
    n[u] = new Float64Array(a + 1);
  for (var g = a; g >= 2; g /= 2) {
    var o = Math.round(g * 0.5), l = Math.round(g), c, d, y, v;
    for (f /= 2, c = 0; c < a; c += l)
      for (d = 0; d < a; d += l)
        v = Math.random() * f * 2 - f, y = n[c][d] + // top left
        n[c + l][d] + // top right
        n[c][d + l] + // bottom left
        n[c + l][d + l], y *= 0.25, n[c + o][d + o] = y + v;
    for (c = 0; c < a; c += o)
      for (d = (c + o) % g; d < a; d += g)
        v = Math.random() * f * 2 - f, y = n[(c - o + t) % t][d] + // middle left
        n[(c + o) % t][d] + // middle right
        n[c][(d + o) % t] + // middle top
        n[c][(d - o + t) % t], y *= 0.25, y += v, n[c][d] = y, c === 0 && (n[a][d] = y), d === 0 && (n[c][a] = y);
  }
  for (u = 0; u < m; u++)
    for (h = 0; h < i; h++)
      e[h * m + u] += n[u][h];
  var H = 1 / 0, S = -1 / 0;
  for (u = 0; u < e.length; u++)
    e[u] < H && (H = e[u]), e[u] > S && (S = e[u]);
};
M.Fault = function(e, r) {
  for (var a = Math.sqrt(r.xSegments * r.xSegments + r.ySegments * r.ySegments), t = a * r.frequency, n = (r.maxHeight - r.minHeight) * 0.5, f = n / t, u = Math.min(r.xSize / r.xSegments, r.ySize / r.ySegments) * r.frequency, h = 0; h < t; h++)
    for (var m = Math.random(), i = Math.sin(m * Math.PI * 2), g = Math.cos(m * Math.PI * 2), o = Math.random() * a - a * 0.5, l = 0, c = r.xSegments + 1; l < c; l++)
      for (var d = 0, y = r.ySegments + 1; d < y; d++) {
        var v = i * l + g * d - o;
        v > u ? e[d * c + l] += f : v < -u ? e[d * c + l] -= f : e[d * c + l] += Math.cos(v / u * Math.PI * 2) * f;
      }
};
M.Hill = function(e, r, a, t) {
  var n = r.frequency * 2, f = n * n * 10, u = r.maxHeight - r.minHeight, h = u / (n * n), m = u / n, i = Math.min(r.xSize, r.ySize), g = i / (n * n), o = i / n;
  a = a || M.Influences.Hill;
  for (var l = { x: 0, y: 0 }, c = 0; c < f; c++) {
    var d = Math.random() * (o - g) + g, y = Math.random() * (m - h) + h;
    r.xSize + d, r.ySize + d, l.x = Math.random(), l.y = Math.random(), typeof t == "function" && t(l), M.Influence(
      e,
      r,
      a,
      l.x,
      l.y,
      d,
      y,
      s.AdditiveBlending,
      M.EaseInStrong
    );
  }
};
M.HillIsland = /* @__PURE__ */ function() {
  var e = function(r) {
    var a = Math.random() * Math.PI * 2;
    r.x = 0.5 + Math.cos(a) * r.x * 0.4, r.y = 0.5 + Math.sin(a) * r.y * 0.4;
  };
  return function(r, a, t) {
    M.Hill(r, a, t, e);
  };
}();
(function() {
  function e(r, a, t, n, f) {
    for (var u = t * n + a, h = 0; h < 3; h++) {
      var m = Math.floor(Math.random() * 8);
      switch (m) {
        case 0:
          a++;
          break;
        case 1:
          a--;
          break;
        case 2:
          t++;
          break;
        case 3:
          t--;
          break;
        case 4:
          a++, t++;
          break;
        case 5:
          a++, t--;
          break;
        case 6:
          a--, t++;
          break;
        case 7:
          a--, t--;
          break;
      }
      var i = t * n + a;
      if (typeof r[i] < "u") {
        if (r[i] < r[u]) {
          e(r, a, t, n, f);
          return;
        }
      } else if (Math.random() < 0.2) {
        r[u] += f;
        return;
      }
    }
    r[u] += f;
  }
  M.Particles = function(r, a) {
    for (var t = Math.sqrt(a.xSegments * a.xSegments + a.ySegments * a.ySegments) * a.frequency * 300, n = a.xSegments + 1, f = (a.maxHeight - a.minHeight) / t * 1e3, u = Math.floor(Math.random() * a.xSegments), h = Math.floor(Math.random() * a.ySegments), m = Math.random() * 0.2 - 0.1, i = Math.random() * 0.2 - 0.1, g = 0; g < t; g++) {
      e(r, u, h, n, f);
      var o = Math.random() * Math.PI * 2;
      g % 1e3 === 0 && (m = Math.random() * 0.2 - 0.1, i = Math.random() * 0.2 - 0.1), g % 100 === 0 && (u = Math.floor(a.xSegments * (0.5 + m) + Math.cos(o) * Math.random() * a.xSegments * (0.5 - Math.abs(m))), h = Math.floor(a.ySegments * (0.5 + i) + Math.sin(o) * Math.random() * a.ySegments * (0.5 - Math.abs(i))));
    }
  };
})();
M.Perlin = function(e, r) {
  Y.seed(Math.random());
  for (var a = (r.maxHeight - r.minHeight) * 0.5, t = (Math.min(r.xSegments, r.ySegments) + 1) / r.frequency, n = 0, f = r.xSegments + 1, u = r.ySegments + 1; n < f; n++)
    for (var h = 0; h < u; h++) {
      var m = h * f + n, i = Y.perlin(n / t, h / t);
      e[m] += i * a;
    }
  for (var g = 1 / 0, o = -1 / 0, n = 0; n < e.length; n++)
    e[n] < g && (g = e[n]), e[n] > o && (o = e[n]);
};
M.PerlinDiamond = function(e, r) {
  M.MultiPass(e, r, [
    { method: M.Perlin },
    { method: M.DiamondSquare, amplitude: 0.75 },
    { method: function(a, t) {
      return M.SmoothMedian(a, t);
    } }
  ]);
};
M.PerlinLayers = function(e, r) {
  M.MultiPass(e, r, [
    { method: M.Perlin, frequency: 1.25 },
    { method: M.Perlin, amplitude: 0.05, frequency: 2.5 },
    { method: M.Perlin, amplitude: 0.35, frequency: 5 },
    { method: M.Perlin, amplitude: 0.15, frequency: 10 }
  ]);
};
M.Simplex = function(e, r) {
  Y.seed(Math.random());
  for (var a = (r.maxHeight - r.minHeight) * 0.5, t = (Math.min(r.xSegments, r.ySegments) + 1) * 2 / r.frequency, n = 0, f = r.xSegments + 1; n < f; n++)
    for (var u = 0, h = r.ySegments + 1; u < h; u++)
      e[u * f + n] += Y.simplex(n / t, u / t) * a;
};
M.SimplexLayers = function(e, r) {
  M.MultiPass(e, r, [
    { method: M.Simplex, frequency: 1.25 },
    { method: M.Simplex, amplitude: 0.5, frequency: 2.5 },
    { method: M.Simplex, amplitude: 0.25, frequency: 5 },
    { method: M.Simplex, amplitude: 0.125, frequency: 10 },
    { method: M.Simplex, amplitude: 0.0625, frequency: 20 }
  ]);
};
(function() {
  function e(r, a, t, n, f, u) {
    if (!(t > n)) {
      var h = 0, m = 0, i = n, g = n, o = Math.floor(n / t), l = -o, c = -o;
      for (h = 0; h <= i; h += o) {
        for (m = 0; m <= g; m += o) {
          var d = m * i + h;
          if (u[d] = Math.random() * f, !(l < 0 && c < 0)) {
            for (var y = u[d], v = u[m * i + (h - o)] || y, H = u[(m - o) * i + h] || y, S = u[(m - o) * i + (h - o)] || y, w = l; w < h; w++)
              for (var x = c; x < m; x++)
                if (!(w === l && x === c)) {
                  var I = x * i + w;
                  if (!(I < 0)) {
                    var z = (w - l) / o, P = (x - c) / o, q = z * H + (1 - z) * S, V = z * y + (1 - z) * v;
                    u[I] = P * V + (1 - P) * q;
                  }
                }
            c = m;
          }
        }
        l = h, c = -o;
      }
      for (h = 0, i = a.xSegments + 1; h < i; h++)
        for (m = 0, g = a.ySegments + 1; m < g; m++) {
          var T = m * i + h, O = m * n + h;
          r[T] += u[O];
        }
    }
  }
  M.Value = function(r, a) {
    for (var t = M.ceilPowerOfTwo(Math.max(a.xSegments, a.ySegments) + 1), n = new Float64Array((t + 1) * (t + 1)), f = a.maxHeight - a.minHeight, u = 2; u < 7; u++)
      e(r, a, Math.pow(2, u), t, f * Math.pow(2, 2.4 - u * 1.2), n);
    M.Clamp(r, {
      maxHeight: a.maxHeight,
      minHeight: a.minHeight,
      stretch: true
    });
  };
})();
M.Weierstrass = function(e, r) {
  for (var a = (r.maxHeight - r.minHeight) * 0.5, t = Math.random() < 0.5 ? 1 : -1, n = Math.random() < 0.5 ? 1 : -1, f = 0.5 + Math.random() * 1, u = 0.5 + Math.random() * 1, h = 0.025 + Math.random() * 0.1, m = -1 + Math.random() * 2, i = 0.5 + Math.random() * 1, g = 0.5 + Math.random() * 1, o = 0.025 + Math.random() * 0.1, l = -1 + Math.random() * 2, c = 0, d = r.xSegments + 1; c < d; c++)
    for (var y = 0, v = r.ySegments + 1; y < v; y++) {
      for (var H = 0, S = 0; S < 20; S++) {
        var w = Math.pow(1 + f, -S) * Math.sin(Math.pow(1 + u, S) * (c + 0.25 * Math.cos(y) + m * y) * h), x = Math.pow(1 + i, -S) * Math.sin(Math.pow(1 + g, S) * (y + 0.25 * Math.cos(c) + l * c) * o);
        H -= Math.exp(t * w * w + n * x * x);
      }
      e[y * d + c] += H * a;
    }
  M.Clamp(e, r);
};
M.fromHeightmap = function(e, r, a) {
  var t = document.createElement("canvas"), n = t.getContext("2d"), f = r.ySegments + 1, u = r.xSegments + 1, h = r.maxHeight - r.minHeight;
  t.width = u, t.height = f;
  var m = a || r.heightmap;
  if (!m) {
    console.error("No heightmap image provided");
    return;
  }
  n.drawImage(m, 0, 0, t.width, t.height);
  for (var i = n.getImageData(0, 0, t.width, t.height).data, g = 0; g < f; g++)
    for (var o = 0; o < u; o++) {
      var l = g * u + o, c = l * 4;
      e[l] = (i[c] + i[c + 1] + i[c + 2]) / 765 * h + r.minHeight;
    }
};
M.toHeightmap = function(e, r) {
  var a = typeof r.maxHeight < "u", t = typeof r.minHeight < "u", n = a ? r.maxHeight : -1 / 0, f = t ? r.minHeight : 1 / 0;
  if (!a || !t) {
    for (var u = n, h = f, m = 2, i = e.length; m < i; m += 3)
      e[m] > u && (u = e[m]), e[m] < h && (h = e[m]);
    a || (n = u), t || (f = h);
  }
  var g = r.heightmap instanceof HTMLCanvasElement ? r.heightmap : document.createElement("canvas"), o = g.getContext("2d"), l = r.ySegments + 1, c = r.xSegments + 1, d = n - f;
  g.width = c, g.height = l;
  for (var y = o.createImageData(g.width, g.height), v = y.data, H = 0; H < l; H++)
    for (var S = 0; S < c; S++) {
      var w = H * c + S, x = w * 4;
      v[x] = v[x + 1] = v[x + 2] = Math.round((e[w * 3 + 2] - f) / d * 255), v[x + 3] = 255;
    }
  return o.putImageData(y, 0, 0), g;
};
M.Influences = {
  Mesa: function(e) {
    return 1.25 * Math.min(0.8, Math.exp(-(e * e)));
  },
  Hole: function(e) {
    return -M.Influences.Mesa(e);
  },
  Hill: function(e) {
    return e < 0 ? (e + 1) * (e + 1) * (3 - 2 * (e + 1)) : 1 - e * e * (3 - 2 * e);
  },
  Valley: function(e) {
    return -M.Influences.Hill(e);
  },
  Dome: function(e) {
    return -(e + 1) * (e - 1);
  },
  // Not meaningful in Additive or Subtractive mode
  Flat: function(e) {
    return 0;
  },
  Volcano: function(e) {
    return 0.94 - 0.32 * (Math.abs(2 * e) + Math.cos(2 * Math.PI * Math.abs(e) + 0.4));
  }
};
M.Influence = function(e, r, a, t, n, f, u, h, m) {
  a = a || M.Influences.Hill, t = typeof t > "u" ? 0.5 : t, n = typeof n > "u" ? 0.5 : n, f = typeof f > "u" ? 64 : f, u = typeof u > "u" ? 64 : u, h = typeof h > "u" ? s.NormalBlending : h, m = m || s.Terrain.EaseIn;
  for (var i = r.xSegments + 1, g = r.ySegments + 1, o = i * t, l = g * n, c = r.xSize / r.xSegments, d = r.ySize / r.ySegments, y = f / c, v = f / d, H = 1 / f, S = Math.ceil(o - y), w = Math.floor(o + y), x = Math.ceil(l - v), I = Math.floor(l + v), z = S; z < w; z++)
    for (var P = x; P < I; P++) {
      var q = P * i + z, V = (z - o) * c, T = (P - l) * d, O = Math.sqrt(V * V + T * T), W = O * H, L = V * H, B = T * H, D = a(W, L, B) * u * (1 - m(W, L, B));
      O > f || typeof e[q] > "u" || (h === s.AdditiveBlending ? e[q] += D : h === s.SubtractiveBlending ? e[q] -= D : h === s.MultiplyBlending ? e[q] *= D : h === s.NoBlending ? e[q] = D : h === s.NormalBlending ? e[q] = m(W, L, B) * e[q] + D : typeof h == "function" && (e[q] = h(e[q].z, D, W, L, B)));
    }
};
M.ScatterMeshes = function(e, r) {
  if (!r.mesh) {
    console.error("options.mesh is required for THREE.Terrain.ScatterMeshes but was not passed");
    return;
  }
  r.scene || (r.scene = new s.Object3D());
  var a = {
    spread: 0.025,
    smoothSpread: 0,
    sizeVariance: 0.1,
    randomness: Math.random,
    maxSlope: 0.6283185307179586,
    // 36deg or 36 / 180 * Math.PI, about the angle of repose of earth
    maxTilt: 1 / 0,
    w: 0,
    h: 0
  };
  for (var t in a)
    a.hasOwnProperty(t) && (r[t] = typeof r[t] > "u" ? a[t] : r[t]);
  var n = typeof r.spread == "number", f, u, h = 1 / r.smoothSpread, m = r.sizeVariance * 2, i = new s.Vector3(), g = new s.Vector3(), o = new s.Vector3(), l = new s.Vector3(), c = r.mesh.up.clone().applyAxisAngle(new s.Vector3(1, 0, 0), 0.5 * Math.PI);
  n && (f = r.randomness(), u = typeof f == "number" ? Math.random : function(P) {
    return f[P];
  }), e = e.toNonIndexed();
  for (var d = e.attributes.position.array, y = 0; y < e.attributes.position.array.length; y += 9) {
    i.set(d[y + 0], d[y + 1], d[y + 2]), g.set(d[y + 3], d[y + 4], d[y + 5]), o.set(d[y + 6], d[y + 7], d[y + 8]), s.Triangle.getNormal(i, g, o, l);
    var v = false;
    if (n) {
      var H = u(y / 9);
      H < r.spread ? v = true : H < r.spread + r.smoothSpread && (v = s.Terrain.EaseInOut((H - r.spread) * h) * r.spread > Math.random());
    } else
      v = r.spread(i, y / 9, l, y);
    if (v) {
      if (l.angleTo(c) > r.maxSlope)
        continue;
      var S = r.mesh.clone();
      if (S.position.addVectors(i, g).add(o).divideScalar(3), r.maxTilt > 0) {
        var w = S.position.clone().add(l);
        S.lookAt(w);
        var x = l.angleTo(c);
        if (x > r.maxTilt) {
          var I = r.maxTilt / x;
          S.rotation.x *= I, S.rotation.y *= I, S.rotation.z *= I;
        }
      }
      if (S.rotation.x += 90 / 180 * Math.PI, S.rotateY(Math.random() * 2 * Math.PI), r.sizeVariance) {
        var z = Math.random() * m - r.sizeVariance;
        S.scale.x = S.scale.z = 1 + z, S.scale.y += z;
      }
      S.updateMatrix(), r.scene.add(S);
    }
  }
  return r.scene;
};
M.ScatterHelper = function(e, r, a, t) {
  a = a || 1, t = t || 0.25, r.frequency = r.frequency || 2.5;
  var n = {};
  for (var f in r)
    r.hasOwnProperty(f) && (n[f] = r[f]);
  n.xSegments *= 2, n.stretch = true, n.maxHeight = 1, n.minHeight = 0;
  for (var u = M.heightmapArray(e, n), h = 0, m = u.length; h < m; h++)
    (h % a || Math.random() > t) && (u[h] = 1);
  return function() {
    return u;
  };
};
M.Analyze = function(e, r) {
  if (!e || !e.geometry || !e.geometry.attributes || !e.geometry.attributes.position || e.geometry.attributes.position.count < 3)
    return console.warn("Not enough vertices to analyze or invalid mesh"), hr();
  try {
    var a = e.geometry.clone();
    a.index && (a = a.toNonIndexed());
    var t = M.toArray1D(a.attributes.position.array);
    if (!t || t.length === 0)
      return console.warn("Could not extract elevations from geometry"), hr(r);
    var n = Array.from(t).sort(function(A, F) {
      return A - F;
    }), f = t.length, u = R(n, 1), h = R(n, 0), m = R(n, 0.5), i = cr(n), g = 0, o = 0, l = 0, c = 0, d = e.up.clone().applyAxisAngle(new s.Vector3(1, 0, 0), 0.5 * Math.PI), y = [];
    try {
      y = vr(a, r).map(function(A) {
        return A.angleTo(d) * 180 / Math.PI;
      }).sort(function(A, F) {
        return A - F;
      });
    } catch (A) {
      console.warn("Error calculating slopes:", A), y = [0];
    }
    var v = y.length, H = R(y, 1), S = R(y, 0), w = R(y, 0.5), x = cr(y), I = e.position.clone().setZ(i), z, P;
    try {
      z = Sr(a.attributes.position.array, I), P = z.angleTo(d) * 180 / Math.PI;
    } catch (A) {
      console.warn("Error calculating plane normal:", A), z = new s.Vector3(0, 0, 1), P = 0;
    }
    for (var q = 0, V = 0, T = 0, O = 0, W = r.xSize / r.xSegments * (r.ySize / r.ySegments) * 0.5, L = 0, B = 0, D = 0, Z = new Float32Array(f), k = new Float32Array(v), N = 0, b; N < f; N++)
      b = n[N] - i, g += b * b, o += b * b * b, Z[N] = Math.abs(n[N] - m), l += Z[N], c += b * b * b * b;
    for (f > 1 && (o = o / f / Math.pow(g / (f - 1), 1.5), l = (i - m) / (l / f || 1), c = c * f / (g * g || 1) - 3, g = Math.sqrt(g / f)), Array.prototype.sort.call(Z, function(A, F) {
      return A - F;
    }), N = 0; N < v; N++)
      b = y[N] - x, q += b * b, V += b * b * b, k[N] = Math.abs(y[N] - w), T += k[N], O += b * b * b * b, L += W / Math.cos(y[N] * Math.PI / 180 || 1e-3);
    v > 1 && (V = V / v / Math.pow(q / (v - 1), 1.5), T = (x - w) / (T / v || 1), O = O * v / (q * q || 1) - 3, q = Math.sqrt(q / v)), Array.prototype.sort.call(k, function(A, F) {
      return A - F;
    });
    try {
      for (var J = r.xSegments + 1, er = r.ySegments + 1, X = 0; X < J; X++)
        for (var _ = 0; _ < er; _++) {
          for (var ar = -1 / 0, tr = 1 / 0, p = a.attributes.position.array[(_ * J + X) * 3 + 2], nr = 0, j = 0, Q = -1; Q <= 1; Q++)
            for (var U = -1; U <= 1; U++)
              if (X + U >= 0 && _ + Q >= 0 && X + U < J && _ + Q < er && !(Q === 0 && U === 0)) {
                var K = a.attributes.position.array[((_ + Q) * J + X + U) * 3 + 2];
                nr += K, j++, K > ar && (ar = K), K < tr && (tr = K);
              }
          j && (B += (nr / j - p) * (nr / j - p)), (p > ar || p < tr) && D++;
        }
      B = Math.sqrt(B / f);
      var gr = Math.ceil(J * 0.5) * Math.ceil(er * 0.5) * 2;
      D /= gr > 0 ? gr : 1;
    } catch (A) {
      console.warn("Error calculating roughness:", A), B = 0, D = 0;
    }
    return {
      elevation: {
        sampleSize: f,
        max: u,
        min: h,
        range: u - h,
        midrange: (u - h) * 0.5 + h,
        median: m,
        iqr: R(n, 0.75) - R(n, 0.25),
        mean: i,
        stdev: g,
        mad: R(Z, 0.5),
        pearsonSkew: o,
        groeneveldMeedenSkew: l,
        kurtosis: c,
        modes: mr(
          n,
          Math.ceil(r.maxHeight - r.minHeight),
          r.minHeight,
          r.maxHeight
        ),
        percentile: function(A) {
          return R(n, A);
        },
        percentRank: function(A) {
          return ur(n, A);
        },
        drawHistogram: function(A, F) {
          ir(
            rr(
              n,
              F,
              r.minHeight,
              r.maxHeight
            ),
            A,
            r.minHeight,
            r.maxHeight
          );
        }
      },
      slope: {
        sampleSize: v,
        max: H,
        min: S,
        range: H - S,
        midrange: (H - S) * 0.5 + S,
        median: w,
        iqr: R(y, 0.75) - R(y, 0.25),
        mean: x,
        stdev: q,
        mad: R(k, 0.5),
        pearsonSkew: V,
        groeneveldMeedenSkew: T,
        kurtosis: O,
        modes: mr(y, 90, 0, 90),
        percentile: function(A) {
          return R(y, A);
        },
        percentRank: function(A) {
          return ur(y, A);
        },
        drawHistogram: function(A, F) {
          ir(
            rr(
              y,
              F,
              0,
              90
            ),
            A,
            0,
            90,
            "\xB0"
          );
        }
      },
      roughness: {
        planimetricAreaRatio: r.xSize * r.ySize / (L || r.xSize * r.ySize),
        terrainRuggednessIndex: B,
        jaggedness: D
      },
      fittedPlane: {
        centroid: I,
        normal: z,
        slope: P,
        pctExplained: Hr(
          a.attributes.position.array,
          I,
          z,
          r.maxHeight - r.minHeight
        )
      }
    };
  } catch (A) {
    return console.error("Error during terrain analysis:", A), hr();
  }
};
function hr(e) {
  var r = function(a) {
    if (a && a.getContext) {
      var t = a.getContext("2d");
      a.width = 300, a.height = 200, t.clearRect(0, 0, a.width, a.height), t.fillStyle = "rgba(144, 176, 192, 1)", t.font = "12px Arial", t.fillText("No data available for analysis", 10, 100);
    }
  };
  return {
    elevation: {
      sampleSize: 0,
      max: 0,
      min: 0,
      range: 0,
      midrange: 0,
      median: 0,
      iqr: 0,
      mean: 0,
      stdev: 0,
      mad: 0,
      pearsonSkew: 0,
      groeneveldMeedenSkew: 0,
      kurtosis: 0,
      modes: [],
      percentile: function() {
        return 0;
      },
      percentRank: function() {
        return 0;
      },
      drawHistogram: r
    },
    slope: {
      sampleSize: 0,
      max: 0,
      min: 0,
      range: 0,
      midrange: 0,
      median: 0,
      iqr: 0,
      mean: 0,
      stdev: 0,
      mad: 0,
      pearsonSkew: 0,
      groeneveldMeedenSkew: 0,
      kurtosis: 0,
      modes: [],
      percentile: function() {
        return 0;
      },
      percentRank: function() {
        return 0;
      },
      drawHistogram: r
    },
    roughness: {
      planimetricAreaRatio: 1,
      terrainRuggednessIndex: 0,
      jaggedness: 0
    },
    fittedPlane: {
      centroid: new s.Vector3(),
      normal: new s.Vector3(0, 0, 1),
      slope: 0,
      pctExplained: 0
    }
  };
}
M.percentile = R;
function R(e, r) {
  if (e.length === 0) return 0;
  if (typeof r != "number") throw new TypeError("p must be a number");
  if (r <= 0) return e[0];
  if (r >= 1) return e[e.length - 1];
  var a = e.length * r, t = Math.floor(a), n = t + 1, f = a % 1;
  return n >= e.length ? e[t] : e[t] * (1 - f) + e[n] * f;
}
M.percentRank = ur;
function ur(e, r) {
  if (typeof r != "number") throw new TypeError("v must be a number");
  for (var a = 0, t = e.length; a < t; a++)
    if (r <= e[a]) {
      for (; a < t && r === e[a]; )
        a++;
      return a === 0 ? 0 : (r !== e[a - 1] && (a += (r - e[a - 1]) / (e[a] - e[a - 1])), a / t);
    }
  return 1;
}
M.faceNormals = vr;
function vr(e, r) {
  var a = e.clone();
  a.index && (a = a.toNonIndexed());
  for (var t = a.attributes.position.array, n = t.length / 9, f = new Array(n), u = new s.Vector3(), h = new s.Vector3(), m = new s.Vector3(), i = 0; i < n; i++) {
    var g = i * 9;
    u.set(
      t[g],
      t[g + 1],
      t[g + 2]
    ), h.set(
      t[g + 3],
      t[g + 4],
      t[g + 5]
    ), m.set(
      t[g + 6],
      t[g + 7],
      t[g + 8]
    );
    var o = new s.Vector3().crossVectors(
      new s.Vector3().subVectors(h, u),
      new s.Vector3().subVectors(m, u)
    ).normalize();
    f[i] = o;
  }
  return f;
}
M.getFittedPlaneNormal = Sr;
function Sr(e, r) {
  var a = e.length / 3, t = 0, n = 0, f = 0, u = 0, h = 0, m = 0;
  if (a < 3) throw new Error("At least three points are required to fit a plane");
  for (var i = new s.Vector3(), g = 0, o = e.length; g < o; g += 3) {
    var l = e[g] - r.x, c = e[g + 1] - r.y, d = e[g + 2] - r.z;
    t += l * l, n += l * c, f += l * d, u += c * c, h += c * d, m += d * d;
  }
  var y = u * m - h * h, v = t * m - f * f, H = t * u - n * n;
  return y >= v && y >= H ? i.set(y, n * m - f * h, f * u - n * h) : v >= y && v >= H ? i.set(n * m - f * h, v, n * f - h * t) : i.set(f * u - n * h, n * f - h * t, H), i.z < 0 && i.negate(), i.normalize();
}
M.bucketNumbersLinearly = rr;
function rr(e, r, a, t) {
  var n = 0, f = e.length;
  if (typeof a > "u")
    for (a = 1 / 0, t = -1 / 0, n = 0; n < f; n++)
      e[n] < a && (a = e[n]), e[n] > t && (t = e[n]);
  a === t && (t = a + 1);
  var u = (t - a) / r, h = new Array(r);
  for (n = 0; n < r; n++)
    h[n] = [];
  for (n = 0; n < f; n++) {
    var m = Math.max(a, Math.min(t, e[n]));
    if (m === t)
      h[r - 1].push(m);
    else {
      var i = Math.floor((m - a) / u);
      i = Math.max(0, Math.min(r - 1, i)), h[i].push(m);
    }
  }
  return h;
}
M.getModes = mr;
function mr(e, r, a, t) {
  if (!e || e.length === 0)
    return [];
  a === t && (t = a + 1);
  for (var n = rr(e, r, a, t), f = 0, u = [], h = 0, m = n.length; h < m; h++)
    n[h].length > f ? (f = n[h].length, u = [a + (h + 0.5) / r * (t - a)]) : n[h].length === f && f > 0 && u.push(a + (h + 0.5) / r * (t - a));
  if (u.length === 0)
    return [];
  for (var i = 0; i < u.length; i++)
    Math.abs(u[i] - Math.round(u[i])) < 1e-3 ? u[i] = Math.round(u[i]) : u[i] = parseFloat(u[i].toFixed(3));
  return u;
}
M.drawHistogram = ir;
function ir(e, r, a, t, n) {
  if (!r || !r.getContext) {
    console.warn("Invalid canvas for histogram drawing");
    return;
  }
  var f = r.getContext("2d"), u = 280, h = 180, m = 10, i = 4, g = typeof t > "u" ? -1 / 0 : t, o = typeof a > "u" ? 1 / 0 : a, l = e.length, c;
  if (r.width = u + m * 2, r.height = h + m * 2, f.clearRect(0, 0, r.width, r.height), typeof n > "u" && (n = ""), g === -1 / 0 || o === 1 / 0)
    for (c = 0; c < l; c++)
      for (var d = 0, y = e[c].length; d < y; d++)
        e[c][d] > g && (g = e[c][d]), e[c][d] < o && (o = e[c][d]);
  o === g && (g = o + 1);
  var v = 0, H = 0;
  for (c = 0; c < l; c++)
    e[c].length > v && (v = e[c].length), H += e[c].length;
  if (H === 0 || v === 0) {
    f.fillStyle = "rgba(144, 176, 192, 1)", f.font = "12px Arial", f.fillText("No data available", m + 10, m + h / 2), f.strokeStyle = "rgba(13, 42, 64, 1)", f.lineWidth = 2, f.beginPath(), f.moveTo(m, m), f.lineTo(m, h + m), f.moveTo(m, h + m), f.lineTo(u + m, h + m), f.stroke();
    return;
  }
  var S = (h - i) / v, w = (u - (e.length + 1) * i) / e.length;
  for (w >= 1 && (w = Math.floor(w)), S >= 1 && (S = Math.floor(S)), f.fillStyle = "rgba(13, 42, 64, 1)", c = 0; c < l; c++)
    f.fillRect(
      m + i + c * (w + i),
      m + h - (i + e[c].length * S),
      w,
      S * e[c].length
    );
  for (f.fillStyle = "rgba(144, 176, 192, 1)", f.font = "12px Arial", c = 0; c < l; c++) {
    var x = Math.floor((c + 0.5) / e.length * (g - o) + o) + "" + n;
    f.fillText(
      x,
      m + i + c * (w + i) + Math.floor((w - f.measureText(x).width) * 0.5),
      m + h - 8,
      w
    );
  }
  var I = H > 0 ? Math.round(100 * v / H) + "%" : "0%";
  f.fillText(
    I,
    m + i,
    m + i + 6
  ), f.strokeStyle = "rgba(13, 42, 64, 1)", f.lineWidth = 2, f.beginPath(), f.moveTo(m, m), f.lineTo(m, h + m), f.moveTo(m, h + m), f.lineTo(u + m, h + m), f.stroke();
}
M.percentVariationExplainedByFittedPlane = Hr;
function Hr(e, r, a, t) {
  if (!e || e.length < 3 || !r || !a || !a.isVector3)
    return 0;
  t = Math.abs(t) || 1;
  var n = e.length, f = 0, u, h;
  try {
    for (var m = 0; m < n; m += 3) {
      var i = e[m + 0] - r.x, g = e[m + 1] - r.y, o = e[m + 2] - r.z;
      u = a.x * i + a.y * g + a.z * o, h = Math.abs(u) / Math.sqrt(a.x * a.x + a.y * a.y + a.z * a.z), f += h * h;
    }
    return Math.max(0, Math.min(1, 1 - Math.sqrt(f / n) * 2 / t));
  } catch (l) {
    return console.warn("Error calculating plane variation:", l), 0;
  }
}
M.mean = cr;
function cr(e) {
  for (var r = 0, a = e.length, t = 0; t < a; t++)
    r += e[t];
  return r / a;
}
M.Brownian = function(e, r) {
  var a = [], t = [], n = Math.min(r.xSize, r.ySize), f = Math.sqrt(n) / n, u = Math.sqrt(r.maxHeight - r.minHeight), h = r.xSegments + 1, m = r.ySegments + 1, i = Math.floor(Math.random() * r.xSegments), g = Math.floor(Math.random() * r.ySegments), o = i, l = g, c = e.length, d = Array.from(e).map(function(B) {
    return { z: B };
  }), y = d[g * h + i], v = Math.random() * Math.PI * 2, H = Math.cos(v), S = Math.sin(v), w, x, I, z, P, q, V;
  for (y.z = Math.random() * (r.maxHeight - r.minHeight) + r.minHeight, t.push(y); t.length !== c; ) {
    for (w = -1; w <= 1; w++)
      for (x = -1; x <= 1; x++)
        I = (g + w) * h + i + x, typeof d[I] < "u" && t.indexOf(d[I]) === -1 && i + x >= 0 && g + w >= 0 && i + x < h && g + w < m && w && x && a.push(d[I]);
    if (Math.random() < f)
      y = a.splice(Math.floor(Math.random() * a.length), 1)[0], v = Math.random() * Math.PI * 2, H = Math.cos(v), S = Math.sin(v), V = d.indexOf(y), i = V % h, g = Math.floor(V / h), o = i, l = g;
    else {
      for (var T = o, O = l; Math.round(T) === i && Math.round(O) === g; )
        T += H, O += S;
      i = Math.round(T), g = Math.round(T);
      for (var W = 0; i >= 0 && g >= 0 && i < h && g < m && t.indexOf(d[g * h + i]) !== -1 && W < 9; W++) {
        for (v = Math.random() * Math.PI * 2, H = Math.cos(v), S = Math.sin(v); Math.round(T) === i && Math.round(O) === g; )
          T += H, O += S;
        i = Math.round(T), g = Math.round(O);
      }
      if (i >= 0 && g >= 0 && i < h && g < m && t.indexOf(d[g * h + i]) === -1) {
        o = T, l = O, y = d[g * h + i];
        var L = a.indexOf(y);
        L !== -1 && a.splice(L, 1);
      } else
        y = a.splice(Math.floor(Math.random() * a.length), 1)[0], v = Math.random() * Math.PI * 2, H = Math.cos(v), S = Math.sin(v), V = d.indexOf(y), i = V % h, g = Math.floor(V / h), o = i, l = g;
    }
    for (z = 0, P = 0, w = -1; w <= 1; w++)
      for (x = -1; x <= 1; x++)
        I = (g + w) * h + i + x, typeof d[I] < "u" && t.indexOf(d[I]) !== -1 && i + x >= 0 && g + w >= 0 && i + x < h && g + w < m && w && x && (z += d[I].z, P++);
    P && ((!q || Math.random() < f) && (q = Math.random()), y.z = z / P + M.EaseInWeak(q) * u * 2 - u), t.push(y);
  }
  for (i = d.length - 1; i >= 0; i--)
    e[i] = d[i].z;
  M.Smooth(e, r), M.Smooth(e, r);
};
function or(e, r, a) {
  if (!e.length || !r.length) return e;
  var t = 0, n = 0, f = 0, u = 0, h = e.length, m = e[0].length, i = r.length, g = r[0].length;
  if (typeof a > "u")
    for (a = new Array(h), t = 0; t < h; t++)
      a[t] = new Float64Array(m);
  for (t = 0; t < h; t++)
    for (n = 0; n < m; n++) {
      var o = 0;
      for (a[t][n] = 0, f = 0; f < i; f++)
        for (u = 0; u < g; u++)
          typeof e[t + f] < "u" && typeof e[t + f][n + u] < "u" && (o = e[t + f][n + u]), a[t][n] += o * r[f][u];
    }
  return a;
}
function Ir(e, r) {
  return Math.exp(-0.5 * e * e / (r * r)) / (r * 2.5066282746310007);
}
function Ar(e, r) {
  typeof r != "number" && (r = 7);
  var a = new Float64Array(r), t = Math.floor(r * 0.5), n = r % 2, f;
  if (!e || !r) return a;
  for (f = 0; f <= t; f++)
    a[f] = Ir(e * (f - t - n * 0.5), e);
  for (; f < r; f++)
    a[f] = a[r - 1 - f];
  return a;
}
function zr(e, r, a) {
  typeof r > "u" && (r = 1), typeof a > "u" && (a = 7);
  for (var t = Ar(r, a), n = a || t.length, f = [t], u = new Array(n), h = 0; h < n; h++)
    u[h] = [t[h]];
  return or(or(e, f), u);
}
M.Gaussian = function(e, r, a, t) {
  M.fromArray2D(e, zr(M.toArray2D(e, r), a, t));
};
M.GaussianBoxBlur = function(e, r, a, t) {
  qr(
    e,
    r.xSegments + 1,
    r.ySegments + 1,
    a,
    t
  );
};
function qr(e, r, a, t, n, f) {
  typeof t > "u" && (t = 1), typeof n > "u" && (n = 3), typeof f > "u" && (f = new Float32Array(e.length));
  for (var u = br(t, n), h = 0; h < n; h++)
    Tr(e, f, r, a, (u[h] - 1) / 2);
  return f;
}
function br(e, r) {
  var a = Math.sqrt(12 * e * e / r + 1), t = Math.floor(a);
  t % 2 === 0 && t--;
  for (var n = t + 2, f = (12 * e * e - r * t * t - 4 * r * t - 3 * r) / (-4 * t - 4), u = Math.round(f), h = new Int16Array(r), m = 0; m < r; m++)
    h[m] = m < u ? t : n;
  return h;
}
function Tr(e, r, a, t, n) {
  for (var f = 0, u = e.length; f < u; f++)
    r[f] = e[f];
  Pr(r, e, a, t, n), Vr(e, r, a, t, n);
}
function Pr(e, r, a, t, n) {
  for (var f = 1 / (n + n + 1), u = 0; u < t; u++) {
    var h = u * a, m = h, i = h + n, g = e[h], o = e[h + a - 1], l = (n + 1) * g, c;
    for (c = 0; c < n; c++)
      l += e[h + c];
    for (c = 0; c <= n; c++)
      l += e[i++] - g, r[h++] = l * f;
    for (c = n + 1; c < a - n; c++)
      l += e[i++] - e[m++], r[h++] = l * f;
    for (c = a - n; c < a; c++)
      l += o - e[m++], r[h++] = l * f;
  }
}
function Vr(e, r, a, t, n) {
  for (var f = 1 / (n + n + 1), u = 0; u < a; u++) {
    var h = u, m = h, i = h + n * a, g = e[h], o = e[h + a * (t - 1)], l = (n + 1) * g, c;
    for (c = 0; c < n; c++)
      l += e[h + c * a];
    for (c = 0; c <= n; c++)
      l += e[i] - g, r[h] = l * f, i += a, h += a;
    for (c = n + 1; c < t - n; c++)
      l += e[i] - e[m], r[h] = l * f, m += a, i += a, h += a;
    for (c = t - n; c < t; c++)
      l += o - e[m], r[h] = l * f, m += a, h += a;
  }
}
M.Worley || (M.Worley = {});
s.Vector2.prototype.distanceToManhattan = function(e) {
  return Math.abs(this.x - e.x) + Math.abs(this.y - e.y);
};
s.Vector2.prototype.distanceToChebyshev = function(e) {
  var r = Math.abs(this.x - e.x), a = Math.abs(this.y - e.y);
  return r <= a ? a : r;
};
s.Vector2.prototype.distanceToQuadratic = function(e) {
  var r = Math.abs(this.x - e.x), a = Math.abs(this.y - e.y);
  return r * r + r * a + a * a;
};
function Or(e, r, a) {
  for (var t = 1 / 0, n = "distanceTo" + a, f = 0; f < r.length; f++) {
    var u = r[f][n](e);
    u < t && (t = u);
  }
  return t;
}
M.Worley = function(e, r) {
  for (var a = r.worleyDistribution || M.Worley.randomPoints || function(i, g, o) {
    o = o || Math.floor(Math.sqrt(i * g * 0.025)) || 1;
    for (var l = new Array(o), c = 0; c < o; c++)
      l[c] = new s.Vector2(
        Math.random() * i,
        Math.random() * g
      );
    return l;
  }, t = a(r.xSegments, r.ySegments, r.worleyPoints), n = r.worleyDistanceTransformation || function(i) {
    return -i;
  }, f = new s.Vector2(0, 0), u = 0, h = r.xSegments + 1; u < h; u++)
    for (var m = 0; m < r.ySegments + 1; m++)
      f.x = u, f.y = m, e[m * h + u] = n(Or(f, t, r.distanceType || ""));
  M.Clamp(e, {
    maxHeight: r.maxHeight,
    minHeight: r.minHeight,
    stretch: true
  });
};
M.Worley.randomPoints = function(e, r, a) {
  a = a || Math.floor(Math.sqrt(e * r * 0.025)) || 1;
  for (var t = new Array(a), n = 0; n < a; n++)
    t[n] = new s.Vector2(
      Math.random() * e,
      Math.random() * r
    );
  return t;
};
function Rr(e) {
  return e.splice(Math.floor(Math.random() * e.length), 1)[0];
}
function yr(e, r, a) {
  var t = Math.floor(r.x / a), n = Math.floor(r.y / a);
  e[t] || (e[t] = []), e[t][n] = r;
}
function Nr(e, r, a) {
  return e.x >= 0 && // jscs:ignore requireSpaceAfterKeywords
  e.y >= 0 && e.x <= r + 1 && e.y <= a + 1;
}
function Cr(e, r, a, t) {
  for (var n = Math.floor(r.x / t), f = Math.floor(r.y / t), u = n - 1; u <= n + 1; u++)
    for (var h = f - 1; h <= f + 1; h++)
      if (u !== n && h !== f && typeof e[u] < "u" && typeof e[u][h] < "u") {
        var m = u * t, i = h * t;
        if (Math.sqrt((r.x - m) * (r.x - m) + (r.y - i) * (r.y - i)) < a)
          return true;
      }
  return false;
}
function Br(e, r) {
  var a = r * (Math.random() + 1), t = 2 * Math.PI * Math.random();
  return new s.Vector2(
    e.x + a * Math.cos(t),
    e.y + a * Math.sin(t)
  );
}
M.Worley.PoissonDisks = function(e, r, a, t) {
  a = a || Math.floor(Math.sqrt(e * r * 0.2)) || 1, t = Math.sqrt((e + r) * 2.5), t > a * 0.67 && (t = a * 0.67);
  var n = t / Math.sqrt(2);
  n < 2 && (n = 2);
  var f = [], u = [], h = [], m = new s.Vector2(
    Math.random() * e,
    Math.random() * r
  );
  u.push(m), h.push(m), yr(f, m, n);
  for (var i = 0; u.length; ) {
    for (var g = Rr(u), o = 0; o < a; o++) {
      var l = Br(g, t);
      if (Nr(l, e, r) && !Cr(f, l, t, n) && (u.push(l), h.push(l), yr(f, l, n), h.length >= a))
        break;
    }
    if (h.length >= a || ++i > a * a)
      break;
  }
  return h;
};
typeof window < "u" && (window.THREE || (window.THREE = {}), window.THREE.Terrain = dr, Object.assign(window.THREE.Terrain, M));
export {
  M as TerrainNS,
  dr as default
};
