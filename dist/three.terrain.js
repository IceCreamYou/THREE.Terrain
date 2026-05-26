import * as e from "three";
//#region src/core.js
var t = {};
function n(e) {
	return 2 ** Math.ceil(Math.log(e) / Math.log(2));
}
var r = function(n) {
	var r = {
		after: null,
		easing: t.Linear,
		heightmap: t.DiamondSquare,
		material: null,
		maxHeight: 100,
		minHeight: -100,
		optimization: t.NONE,
		frequency: 2.5,
		steps: 1,
		stretch: !0,
		turbulent: !1,
		xSegments: 63,
		xSize: 1024,
		ySegments: 63,
		ySize: 1024
	};
	for (var i in n ||= {}, r) r.hasOwnProperty(i) && (n[i] = n[i] === void 0 ? r[i] : n[i]);
	n.material = n.material || new e.MeshBasicMaterial({ color: 15623731 });
	var a = new e.Object3D();
	a.rotation.x = -.5 * Math.PI;
	var o = new e.Mesh(new e.PlaneGeometry(n.xSize, n.ySize, n.xSegments, n.ySegments), n.material), s = t.toArray1D(o.geometry.attributes.position.array);
	return n.heightmap instanceof HTMLCanvasElement || n.heightmap instanceof Image ? t.fromHeightmap(s, n, n.heightmap) : typeof n.heightmap == "function" ? n.heightmap(s, n) : console.warn("An invalid value was passed for `options.heightmap`: " + n.heightmap), t.fromArray1D(o.geometry.attributes.position.array, s), t.Normalize(o, n), a.add(o), a;
};
t.Normalize = function(e, n) {
	var r = t.toArray1D(e.geometry.attributes.position.array);
	n.turbulent && t.Turbulence(r, n), n.steps > 1 && (t.Step(r, n.steps), t.Smooth(r, n)), t.Clamp(r, n), typeof n.after == "function" && n.after(r, n), t.fromArray1D(e.geometry.attributes.position.array, r), e.geometry.computeBoundingSphere(), e.geometry.computeVertexNormals();
}, t.NONE = 0, t.GEOMIPMAP = 1, t.GEOCLIPMAP = 2, t.POLYGONREDUCTION = 3, t.toArray2D = function(e, t) {
	var n = Array(t.xSegments + 1), r = t.xSegments + 1, i = t.ySegments + 1, a, o;
	for (a = 0; a < r; a++) for (n[a] = new Float32Array(t.ySegments + 1), o = 0; o < i; o++) n[a][o] = e[o * r + a];
	return n;
}, t.fromArray2D = function(e, t) {
	for (var n = 0, r = t.length; n < r; n++) for (var i = 0, a = t[n].length; i < a; i++) e[i * r + n] = t[n][i];
}, t.toArray1D = function(e) {
	for (var t = new Float32Array(e.length / 3), n = 0, r = t.length; n < r; n++) t[n] = e[n * 3 + 2];
	return t;
}, t.fromArray1D = function(e, t) {
	for (var n = 0, r = Math.min(e.length / 3, t.length); n < r; n++) e[n * 3 + 2] = t[n];
}, t.heightmapArray = function(e, n) {
	var r = Array((n.xSegments + 1) * (n.ySegments + 1));
	return r.length, r.fill(0), n.minHeight = n.minHeight || 0, n.maxHeight = n.maxHeight === void 0 ? 1 : n.maxHeight, n.stretch = n.stretch || !1, e(r, n), t.Clamp(r, n), r;
}, t.Linear = function(e) {
	return e;
}, t.EaseIn = function(e) {
	return e * e;
}, t.EaseOut = function(e) {
	return -e * (e - 2);
}, t.EaseInOut = function(e) {
	return e * e * (3 - 2 * e);
}, t.InEaseOut = function(e) {
	var t = 2 * e - 1;
	return .5 * t * t * t + .5;
}, t.EaseInWeak = function(e) {
	return e ** 1.55;
}, t.EaseInStrong = function(e) {
	return e * e * e * e * e * e * e;
}, t.Terrain = r, t.Clamp = function(e, n) {
	var r = Infinity, i = -Infinity, a = e.length, o;
	for (n.easing = n.easing || t.Linear, o = 0; o < a; o++) e[o] < r && (r = e[o]), e[o] > i && (i = e[o]);
	var s = i - r, c = typeof n.maxHeight == "number" ? n.maxHeight : i, l = typeof n.minHeight == "number" ? n.minHeight : r, u = n.stretch ? c : i < c ? i : c, d = n.stretch ? l : r > l ? r : l, f = u - d;
	for (u < d && (u = c, f = u - d), o = 0; o < a; o++) e[o] = n.easing((e[o] - r) / s) * f + l;
}, t.Edges = function(e, n, r, i, a, o) {
	var s = Math.floor(i / (n.xSize / n.xSegments)) || 1, c = Math.floor(i / (n.ySize / n.ySegments)) || 1, l = r ? n.maxHeight : n.minHeight, u = r ? Math.max : Math.min, d = n.xSegments + 1, f = n.ySegments + 1, p, m, h, g, _;
	for (a ||= t.EaseInOut, typeof o != "object" && (o = {
		top: !0,
		bottom: !0,
		left: !0,
		right: !0
	}), p = 0; p < d; p++) for (m = 0; m < c; m++) h = a(1 - m / c), g = m * d + p, _ = (n.ySegments - m) * d + p, o.top && (e[g] = u(e[g], (l - e[g]) * h + e[g])), o.bottom && (e[_] = u(e[_], (l - e[_]) * h + e[_]));
	for (p = 0; p < f; p++) for (m = 0; m < s; m++) h = a(1 - m / s), g = p * d + m, _ = (n.ySegments - p) * d + (n.xSegments - m), o.left && (e[g] = u(e[g], (l - e[g]) * h + e[g])), o.right && (e[_] = u(e[_], (l - e[_]) * h + e[_]));
	t.Clamp(e, {
		maxHeight: n.maxHeight,
		minHeight: n.minHeight,
		stretch: !0
	});
}, t.RadialEdges = function(e, t, n, r, i) {
	var a = n ? t.maxHeight : t.minHeight, o = n ? Math.max : Math.min, s = t.xSegments + 1, c = t.ySegments + 1, l = s * .5, u = c * .5, d = t.xSize / t.xSegments, f = t.ySize / t.ySegments, p = Math.min(t.xSize, t.ySize) * .5 - r, m, h, g, _, v;
	for (m = 0; m < s; m++) for (h = 0; h < u; h++) _ = h * s + m, v = Math.min(p, Math.sqrt((l - m) * d * (l - m) * d + (u - h) * f * (u - h) * f) - r), !(v < 0) && (g = i(v / p), e[_] = o(e[_], (a - e[_]) * g + e[_]), _ = (t.ySegments - h) * s + m, e[_] = o(e[_], (a - e[_]) * g + e[_]));
}, t.Smooth = function(e, t, n) {
	for (var r = new Float32Array(e.length), i = 0, a = t.xSegments + 1, o = t.ySegments + 1; i < a; i++) for (var s = 0; s < o; s++) {
		for (var c = 0, l = 0, u = -1; u <= 1; u++) for (var d = -1; d <= 1; d++) {
			var f = (s + u) * a + i + d;
			e[f] !== void 0 && i + d >= 0 && s + u >= 0 && i + d < a && s + u < o && (c += e[f], l++);
		}
		r[s * a + i] = c / l;
	}
	n ||= 0;
	for (var p = 1 / (1 + n), m = 0, h = e.length; m < h; m++) e[m] = (r[m] + e[m] * n) * p;
}, t.SmoothMedian = function(e, t) {
	for (var n = new Float32Array(e.length), r = [], i = [], a = function(e, t) {
		return r[e] - r[t];
	}, o = 0, s = t.xSegments + 1, c = t.ySegments + 1; o < s; o++) for (var l = 0; l < c; l++) {
		r.length = 0, i.length = 0;
		for (var u = -1; u <= 1; u++) for (var d = -1; d <= 1; d++) {
			var f = (l + u) * s + o + d;
			e[f] !== void 0 && o + d >= 0 && l + u >= 0 && o + d < s && l + u < c && (r.push(e[f]), i.push(f));
		}
		i.sort(a);
		var p = Math.floor(i.length * .5), m = i.length % 2 == 1 ? e[i[p]] : (e[i[p - 1]] + e[i[p]]) * .5;
		n[l * s + o] = m;
	}
	for (var h = 0, g = e.length; h < g; h++) e[h] = n[h];
}, t.SmoothConservative = function(e, t, n) {
	for (var r = new Float32Array(e.length), i = 0, a = t.xSegments + 1, o = t.ySegments + 1; i < a; i++) for (var s = 0; s < o; s++) {
		for (var c = -Infinity, l = Infinity, u = -1; u <= 1; u++) for (var d = -1; d <= 1; d++) {
			var f = (s + u) * a + i + d;
			e[f] !== void 0 && u && d && i + d >= 0 && s + u >= 0 && i + d < a && s + u < o && (e[f] < l && (l = e[f]), e[f] > c && (c = e[f]));
		}
		var p = s * a + i;
		if (typeof n == "number") {
			var m = (c - l) * .5, h = l + m;
			c = h + m * n, l = h - m * n;
		}
		r[p] = e[p] > c ? c : e[p] < l ? l : e[p];
	}
	for (var g = 0, _ = e.length; g < _; g++) e[g] = r[g];
}, t.Step = function(e, t) {
	var n = 0, r = 0, i = e.length, a = Math.floor(i / t), o = Array(i), s = Array(t);
	for (t === void 0 && (t = Math.floor((i * .5) ** .25)), n = 0; n < i; n++) o[n] = e[n];
	for (o.sort(function(e, t) {
		return e - t;
	}), n = 0; n < t; n++) {
		var c = o.slice(n * a, (n + 1) * a), l = 0, u = c.length;
		for (r = 0; r < u; r++) l += c[r];
		s[n] = {
			min: c[0],
			max: c[c.length - 1],
			avg: l / u
		};
	}
	for (n = 0; n < i; n++) {
		var d = e[n];
		for (r = 0; r < t; r++) if (d >= s[r].min && d <= s[r].max) {
			e[n] = s[r].avg;
			break;
		}
	}
}, t.Turbulence = function(e, t) {
	for (var n = t.maxHeight - t.minHeight, r = 0, i = e.length; r < i; r++) e[r] = t.minHeight + Math.abs((e[r] - t.minHeight) * 2 - n);
};
//#endregion
//#region src/noise.js
var i = {};
function a(e, t, n) {
	this.x = e, this.y = t, this.z = n;
}
a.prototype.dot2 = function(e, t) {
	return this.x * e + this.y * t;
}, a.prototype.dot3 = function(e, t, n) {
	return this.x * e + this.y * t + this.z * n;
};
var o = [
	new a(1, 1, 0),
	new a(-1, 1, 0),
	new a(1, -1, 0),
	new a(-1, -1, 0),
	new a(1, 0, 1),
	new a(-1, 0, 1),
	new a(1, 0, -1),
	new a(-1, 0, -1),
	new a(0, 1, 1),
	new a(0, -1, 1),
	new a(0, 1, -1),
	new a(0, -1, -1)
], s = [
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
], c = Array(512), l = Array(512);
i.seed = function(e) {
	e > 0 && e < 1 && (e *= 65536), e = Math.floor(e), e < 256 && (e |= e << 8);
	for (var t = 0; t < 256; t++) {
		var n = t & 1 ? s[t] ^ e & 255 : s[t] ^ e >> 8 & 255;
		c[t] = c[t + 256] = n, l[t] = l[t + 256] = o[n % 12];
	}
}, i.seed(Math.random());
var u = .5 * (Math.sqrt(3) - 1), d = (3 - Math.sqrt(3)) / 6;
i.simplex = function(e, t) {
	var n, r, i, a = (e + t) * u, o = Math.floor(e + a), s = Math.floor(t + a), f = (o + s) * d, p = e - o + f, m = t - s + f, h, g;
	p > m ? (h = 1, g = 0) : (h = 0, g = 1);
	var _ = p - h + d, v = m - g + d, y = p - 1 + 2 * d, b = m - 1 + 2 * d;
	o &= 255, s &= 255;
	var x = l[o + c[s]], S = l[o + h + c[s + g]], C = l[o + 1 + c[s + 1]], w = .5 - p * p - m * m;
	w < 0 ? n = 0 : (w *= w, n = w * w * x.dot2(p, m));
	var T = .5 - _ * _ - v * v;
	T < 0 ? r = 0 : (T *= T, r = T * T * S.dot2(_, v));
	var E = .5 - y * y - b * b;
	return E < 0 ? i = 0 : (E *= E, i = E * E * C.dot2(y, b)), 70 * (n + r + i);
};
function f(e) {
	return e * e * e * (e * (e * 6 - 15) + 10);
}
function p(e, t, n) {
	return (1 - n) * e + n * t;
}
i.perlin = function(e, t) {
	var n = Math.floor(e), r = Math.floor(t);
	e -= n, t -= r, n &= 255, r &= 255;
	var i = l[n + c[r]].dot2(e, t), a = l[n + c[r + 1]].dot2(e, t - 1), o = l[n + 1 + c[r]].dot2(e - 1, t), s = l[n + 1 + c[r + 1]].dot2(e - 1, t - 1), u = f(e);
	return p(p(i, o, u), p(a, s, u), f(t));
}, t.MultiPass = function(e, t, n) {
	var r = {};
	for (var i in t) t.hasOwnProperty(i) && (r[i] = t[i]);
	for (var a = t.maxHeight - t.minHeight, o = 0, s = n.length; o < s; o++) {
		var c = .5 * (a - a * (n[o].amplitude === void 0 ? 1 : n[o].amplitude));
		r.maxHeight = t.maxHeight - c, r.minHeight = t.minHeight + c, r.frequency = n[o].frequency === void 0 ? t.frequency : n[o].frequency, n[o].method(e, r);
	}
}, t.Curve = function(e, t, n) {
	for (var r = (t.maxHeight - t.minHeight) * .5, i = t.frequency / (Math.min(t.xSegments, t.ySegments) + 1), a = 0, o = t.xSegments + 1, s = t.ySegments + 1; a < o; a++) for (var c = 0; c < s; c++) e[c * o + a] += n(a * i, c * i) * r;
}, t.Cosine = function(e, t) {
	for (var n = (t.maxHeight - t.minHeight) * .5, r = t.frequency * Math.PI / (Math.min(t.xSegments, t.ySegments) + 1), i = Math.random() * Math.PI * 2, a = 0, o = t.xSegments + 1; a < o; a++) for (var s = 0, c = t.ySegments + 1; s < c; s++) e[s * o + a] += n * (Math.cos(a * r + i) + Math.cos(s * r + i));
}, t.CosineLayers = function(e, n) {
	t.MultiPass(e, n, [
		{
			method: t.Cosine,
			frequency: 2.5
		},
		{
			method: t.Cosine,
			amplitude: .1,
			frequency: 12
		},
		{
			method: t.Cosine,
			amplitude: .05,
			frequency: 15
		},
		{
			method: t.Cosine,
			amplitude: .025,
			frequency: 20
		}
	]);
}, t.DiamondSquare = function(e, t) {
	var r = n(Math.max(t.xSegments, t.ySegments) + 1), i = r + 1, a = [], o = t.maxHeight - t.minHeight, s, c, l = t.xSegments + 1, u = t.ySegments + 1;
	for (s = 0; s <= r; s++) a[s] = new Float64Array(r + 1);
	for (var d = r; d >= 2; d /= 2) {
		var f = Math.round(d * .5), p = Math.round(d), m, h, g, _;
		for (o /= 2, m = 0; m < r; m += p) for (h = 0; h < r; h += p) _ = Math.random() * o * 2 - o, g = a[m][h] + a[m + p][h] + a[m][h + p] + a[m + p][h + p], g *= .25, a[m + f][h + f] = g + _;
		for (m = 0; m < r; m += f) for (h = (m + f) % d; h < r; h += d) _ = Math.random() * o * 2 - o, g = a[(m - f + i) % i][h] + a[(m + f) % i][h] + a[m][(h + f) % i] + a[m][(h - f + i) % i], g *= .25, g += _, a[m][h] = g, m === 0 && (a[r][h] = g), h === 0 && (a[m][r] = g);
	}
	for (s = 0; s < l; s++) for (c = 0; c < u; c++) e[c * l + s] += a[s][c];
	var v = Infinity, y = -Infinity;
	for (s = 0; s < e.length; s++) e[s] < v && (v = e[s]), e[s] > y && (y = e[s]);
}, t.Fault = function(e, t) {
	for (var n = Math.sqrt(t.xSegments * t.xSegments + t.ySegments * t.ySegments), r = n * t.frequency, i = (t.maxHeight - t.minHeight) * .5 / r, a = Math.min(t.xSize / t.xSegments, t.ySize / t.ySegments) * t.frequency, o = 0; o < r; o++) for (var s = Math.random(), c = Math.sin(s * Math.PI * 2), l = Math.cos(s * Math.PI * 2), u = Math.random() * n - n * .5, d = 0, f = t.xSegments + 1; d < f; d++) for (var p = 0, m = t.ySegments + 1; p < m; p++) {
		var h = c * d + l * p - u;
		h > a ? e[p * f + d] += i : h < -a ? e[p * f + d] -= i : e[p * f + d] += Math.cos(h / a * Math.PI * 2) * i;
	}
}, t.Hill = function(n, r, i, a) {
	var o = r.frequency * 2, s = o * o * 10, c = r.maxHeight - r.minHeight, l = c / (o * o), u = c / o, d = Math.min(r.xSize, r.ySize), f = d / (o * o), p = d / o;
	i ||= t.Influences.Hill;
	for (var m = {
		x: 0,
		y: 0
	}, h = 0; h < s; h++) {
		var g = Math.random() * (p - f) + f, _ = Math.random() * (u - l) + l;
		0 - g, r.xSize + g, r.ySize + g, m.x = Math.random(), m.y = Math.random(), typeof a == "function" && a(m), t.Influence(n, r, i, m.x, m.y, g, _, e.AdditiveBlending, t.EaseInStrong);
	}
}, t.HillIsland = (function() {
	var e = function(e) {
		var t = Math.random() * Math.PI * 2;
		e.x = .5 + Math.cos(t) * e.x * .4, e.y = .5 + Math.sin(t) * e.y * .4;
	};
	return function(n, r, i) {
		t.Hill(n, r, i, e);
	};
})(), (function() {
	function e(t, n, r, i, a) {
		for (var o = r * i + n, s = 0; s < 3; s++) {
			switch (Math.floor(Math.random() * 8)) {
				case 0:
					n++;
					break;
				case 1:
					n--;
					break;
				case 2:
					r++;
					break;
				case 3:
					r--;
					break;
				case 4:
					n++, r++;
					break;
				case 5:
					n++, r--;
					break;
				case 6:
					n--, r++;
					break;
				case 7:
					n--, r--;
					break;
			}
			var c = r * i + n;
			if (t[c] !== void 0) {
				if (t[c] < t[o]) {
					e(t, n, r, i, a);
					return;
				}
			} else if (Math.random() < .2) {
				t[o] += a;
				return;
			}
		}
		t[o] += a;
	}
	t.Particles = function(t, n) {
		for (var r = Math.sqrt(n.xSegments * n.xSegments + n.ySegments * n.ySegments) * n.frequency * 300, i = n.xSegments + 1, a = (n.maxHeight - n.minHeight) / r * 1e3, o = Math.floor(Math.random() * n.xSegments), s = Math.floor(Math.random() * n.ySegments), c = Math.random() * .2 - .1, l = Math.random() * .2 - .1, u = 0; u < r; u++) {
			e(t, o, s, i, a);
			var d = Math.random() * Math.PI * 2;
			u % 1e3 == 0 && (c = Math.random() * .2 - .1, l = Math.random() * .2 - .1), u % 100 == 0 && (o = Math.floor(n.xSegments * (.5 + c) + Math.cos(d) * Math.random() * n.xSegments * (.5 - Math.abs(c))), s = Math.floor(n.ySegments * (.5 + l) + Math.sin(d) * Math.random() * n.ySegments * (.5 - Math.abs(l))));
		}
	};
})(), t.Perlin = function(e, t) {
	i.seed(Math.random());
	for (var n = (t.maxHeight - t.minHeight) * .5, r = (Math.min(t.xSegments, t.ySegments) + 1) / t.frequency, a = 0, o = t.xSegments + 1, s = t.ySegments + 1; a < o; a++) for (var c = 0; c < s; c++) {
		var l = c * o + a, u = i.perlin(a / r, c / r);
		e[l] += u * n;
	}
	for (var d = Infinity, f = -Infinity, a = 0; a < e.length; a++) e[a] < d && (d = e[a]), e[a] > f && (f = e[a]);
}, t.PerlinDiamond = function(e, n) {
	t.MultiPass(e, n, [
		{ method: t.Perlin },
		{
			method: t.DiamondSquare,
			amplitude: .75
		},
		{ method: function(e, n) {
			return t.SmoothMedian(e, n);
		} }
	]);
}, t.PerlinLayers = function(e, n) {
	t.MultiPass(e, n, [
		{
			method: t.Perlin,
			frequency: 1.25
		},
		{
			method: t.Perlin,
			amplitude: .05,
			frequency: 2.5
		},
		{
			method: t.Perlin,
			amplitude: .35,
			frequency: 5
		},
		{
			method: t.Perlin,
			amplitude: .15,
			frequency: 10
		}
	]);
}, t.Simplex = function(e, t) {
	i.seed(Math.random());
	for (var n = (t.maxHeight - t.minHeight) * .5, r = (Math.min(t.xSegments, t.ySegments) + 1) * 2 / t.frequency, a = 0, o = t.xSegments + 1; a < o; a++) for (var s = 0, c = t.ySegments + 1; s < c; s++) e[s * o + a] += i.simplex(a / r, s / r) * n;
}, t.SimplexLayers = function(e, n) {
	t.MultiPass(e, n, [
		{
			method: t.Simplex,
			frequency: 1.25
		},
		{
			method: t.Simplex,
			amplitude: .5,
			frequency: 2.5
		},
		{
			method: t.Simplex,
			amplitude: .25,
			frequency: 5
		},
		{
			method: t.Simplex,
			amplitude: .125,
			frequency: 10
		},
		{
			method: t.Simplex,
			amplitude: .0625,
			frequency: 20
		}
	]);
}, (function() {
	function e(e, t, n, r, i, a) {
		if (!(n > r)) {
			var o = 0, s = 0, c = r, l = r, u = Math.floor(r / n), d = -u, f = -u;
			for (o = 0; o <= c; o += u) {
				for (s = 0; s <= l; s += u) {
					var p = s * c + o;
					if (a[p] = Math.random() * i, !(d < 0 && f < 0)) {
						for (var m = a[p], h = a[s * c + (o - u)] || m, g = a[(s - u) * c + o] || m, _ = a[(s - u) * c + (o - u)] || m, v = d; v < o; v++) for (var y = f; y < s; y++) if (!(v === d && y === f)) {
							var b = y * c + v;
							if (!(b < 0)) {
								var x = (v - d) / u, S = (y - f) / u, C = x * g + (1 - x) * _;
								a[b] = S * (x * m + (1 - x) * h) + (1 - S) * C;
							}
						}
						f = s;
					}
				}
				d = o, f = -u;
			}
			for (o = 0, c = t.xSegments + 1; o < c; o++) for (s = 0, l = t.ySegments + 1; s < l; s++) {
				var w = s * c + o, T = s * r + o;
				e[w] += a[T];
			}
		}
	}
	t.Value = function(r, i) {
		for (var a = n(Math.max(i.xSegments, i.ySegments) + 1), o = new Float64Array((a + 1) * (a + 1)), s = i.maxHeight - i.minHeight, c = 2; c < 7; c++) e(r, i, 2 ** c, a, s * 2 ** (2.4 - c * 1.2), o);
		t.Clamp(r, {
			maxHeight: i.maxHeight,
			minHeight: i.minHeight,
			stretch: !0
		});
	};
})(), t.Weierstrass = function(e, n) {
	for (var r = (n.maxHeight - n.minHeight) * .5, i = Math.random() < .5 ? 1 : -1, a = Math.random() < .5 ? 1 : -1, o = .5 + Math.random() * 1, s = .5 + Math.random() * 1, c = .025 + Math.random() * .1, l = -1 + Math.random() * 2, u = .5 + Math.random() * 1, d = .5 + Math.random() * 1, f = .025 + Math.random() * .1, p = -1 + Math.random() * 2, m = 0, h = n.xSegments + 1; m < h; m++) for (var g = 0, _ = n.ySegments + 1; g < _; g++) {
		for (var v = 0, y = 0; y < 20; y++) {
			var b = (1 + o) ** +-y * Math.sin((1 + s) ** +y * (m + .25 * Math.cos(g) + l * g) * c), x = (1 + u) ** +-y * Math.sin((1 + d) ** +y * (g + .25 * Math.cos(m) + p * m) * f);
			v -= Math.exp(i * b * b + a * x * x);
		}
		e[g * h + m] += v * r;
	}
	t.Clamp(e, n);
}, t.fromHeightmap = function(e, t, n) {
	var r = document.createElement("canvas"), i = r.getContext("2d"), a = t.ySegments + 1, o = t.xSegments + 1, s = t.maxHeight - t.minHeight;
	r.width = o, r.height = a;
	var c = n || t.heightmap;
	if (!c) {
		console.error("No heightmap image provided");
		return;
	}
	i.drawImage(c, 0, 0, r.width, r.height);
	for (var l = i.getImageData(0, 0, r.width, r.height).data, u = 0; u < a; u++) for (var d = 0; d < o; d++) {
		var f = u * o + d, p = f * 4;
		e[f] = (l[p] + l[p + 1] + l[p + 2]) / 765 * s + t.minHeight;
	}
}, t.toHeightmap = function(e, t) {
	var n = t.maxHeight !== void 0, r = t.minHeight !== void 0, i = n ? t.maxHeight : -Infinity, a = r ? t.minHeight : Infinity;
	if (!n || !r) {
		for (var o = i, s = a, c = 2, l = e.length; c < l; c += 3) e[c] > o && (o = e[c]), e[c] < s && (s = e[c]);
		n || (i = o), r || (a = s);
	}
	var u = t.heightmap instanceof HTMLCanvasElement ? t.heightmap : document.createElement("canvas"), d = u.getContext("2d"), f = t.ySegments + 1, p = t.xSegments + 1, m = i - a;
	u.width = p, u.height = f;
	for (var h = d.createImageData(u.width, u.height), g = h.data, _ = 0; _ < f; _++) for (var v = 0; v < p; v++) {
		var y = _ * p + v, b = y * 4;
		g[b] = g[b + 1] = g[b + 2] = Math.round((e[y * 3 + 2] - a) / m * 255), g[b + 3] = 255;
	}
	return d.putImageData(h, 0, 0), u;
}, t.Influences = {
	Mesa: function(e) {
		return 1.25 * Math.min(.8, Math.exp(-(e * e)));
	},
	Hole: function(e) {
		return -t.Influences.Mesa(e);
	},
	Hill: function(e) {
		return e < 0 ? (e + 1) * (e + 1) * (3 - 2 * (e + 1)) : 1 - e * e * (3 - 2 * e);
	},
	Valley: function(e) {
		return -t.Influences.Hill(e);
	},
	Dome: function(e) {
		return -(e + 1) * (e - 1);
	},
	Flat: function(e) {
		return 0;
	},
	Volcano: function(e) {
		return .94 - .32 * (Math.abs(2 * e) + Math.cos(2 * Math.PI * Math.abs(e) + .4));
	}
}, t.Influence = function(n, r, i, a, o, s, c, l, u) {
	i ||= t.Influences.Hill, a = a === void 0 ? .5 : a, o = o === void 0 ? .5 : o, s = s === void 0 ? 64 : s, c = c === void 0 ? 64 : c, l = l === void 0 ? e.NormalBlending : l, u ||= t.EaseIn;
	for (var d = r.xSegments + 1, f = r.ySegments + 1, p = d * a, m = f * o, h = r.xSize / r.xSegments, g = r.ySize / r.ySegments, _ = s / h, v = s / g, y = 1 / s, b = Math.ceil(p - _), x = Math.floor(p + _), S = Math.ceil(m - v), C = Math.floor(m + v), w = b; w < x; w++) for (var T = S; T < C; T++) {
		var E = T * d + w, D = (w - p) * h, O = (T - m) * g, k = Math.sqrt(D * D + O * O), A = k * y, j = D * y, M = O * y, N = i(A, j, M) * c * (1 - u(A, j, M));
		k > s || n[E] === void 0 || (l === e.AdditiveBlending ? n[E] += N : l === e.SubtractiveBlending ? n[E] -= N : l === e.MultiplyBlending ? n[E] *= N : l === e.NoBlending ? n[E] = N : l === e.NormalBlending ? n[E] = u(A, j, M) * n[E] + N : typeof l == "function" && (n[E] = l(n[E].z, N, A, j, M)));
	}
};
//#endregion
//#region src/materials.js
function m(t, n) {
	function r(e) {
		return e === (e | 0) ? e + ".0" : e + "";
	}
	for (var i = "", a = "", o = t[0].texture.repeat, s = t[0].texture.offset, c = 0, l = t.length; c < l; c++) if (t[c].texture.wrapS = t[c].texture.wrapT = e.RepeatWrapping, t[c].texture.source && (t[c].texture.colorSpace = e.SRGBColorSpace), t[c].texture.needsUpdate = !0, i += "uniform sampler2D texture_" + c + ";\n", c !== 0) {
		var u = t[c].levels, d = t[c].glsl, f = u !== void 0, p = t[c].texture.repeat, m = t[c].texture.offset;
		if (f) {
			u[1] - u[0] < 1 && --u[0], u[3] - u[2] < 1 && (u[3] += 1);
			for (var h = 0; h < u.length; h++) u[h] = r(u[h]);
		}
		var g = f ? "1.0 - smoothstep(" + u[0] + ", " + u[1] + ", vPosition.z) + smoothstep(" + u[2] + ", " + u[3] + ", vPosition.z)" : d;
		a += "        color = mix( texture2D( texture_" + c + ", MyvUv * vec2( " + r(p.x) + ", " + r(p.y) + " ) + vec2( " + r(m.x) + ", " + r(m.y) + " ) ), color, max(min(" + g + ", 1.0), 0.0));\n";
	}
	var _ = "// Calculate terrain slope for texture blending\n    float slope = acos(max(min(dot(normalize(myNormal), vec3(0.0, 0.0, 1.0)), 1.0), -1.0));\n    diffuseColor = vec4( diffuse, opacity );\n    vec4 color = texture2D( texture_0, MyvUv * vec2( " + r(o.x) + ", " + r(o.y) + " ) + vec2( " + r(s.x) + ", " + r(s.y) + " ) ); // base\n" + a + "    // Enhance saturation of the final color\n    vec3 grayScale = vec3(dot(color.rgb, vec3(0.299, 0.587, 0.114)));\n    color.rgb = mix(grayScale, color.rgb, 1.3);\n    diffuseColor = color;\n", v = i + "\nvarying vec2 MyvUv;\nvarying vec3 vPosition;\nvarying vec3 myNormal;\n", y = n || new e.MeshPhongMaterial({
		side: e.DoubleSide,
		shininess: 5,
		specular: new e.Color(1118481),
		flatShading: !1
	});
	return y.onBeforeCompile = function(e) {
		e.vertexShader = e.vertexShader.replace("#include <common>", "varying vec2 MyvUv;\nvarying vec3 vPosition;\nvarying vec3 myNormal;\n#include <common>"), e.vertexShader = e.vertexShader.replace("#include <uv_vertex>", "MyvUv = uv;\nvPosition = position;\nmyNormal = normal;\n#include <uv_vertex>"), e.vertexShader = e.vertexShader.replace("#include <worldpos_vertex>", "#include <worldpos_vertex>\n#ifdef USE_INSTANCING\nmyNormal = mat3(instanceMatrix) * myNormal;\n#endif"), e.fragmentShader = e.fragmentShader.replace("#include <common>", v + "\n#include <common>"), e.fragmentShader = e.fragmentShader.replace("#include <map_fragment>", _);
		for (var n = 0, r = t.length; n < r; n++) e.uniforms["texture_" + n] = {
			type: "t",
			value: t[n].texture
		};
	}, y;
}
//#endregion
//#region src/analysis.js
t.generateBlendedMaterial = m, t.ScatterMeshes = function(n, r) {
	if (!r.mesh) {
		console.error("options.mesh is required for THREE.Terrain.ScatterMeshes but was not passed");
		return;
	}
	r.scene ||= new e.Object3D();
	var i = {
		spread: .025,
		smoothSpread: 0,
		sizeVariance: .1,
		randomness: Math.random,
		maxSlope: .6283185307179586,
		maxTilt: Infinity,
		w: 0,
		h: 0
	};
	for (var a in i) i.hasOwnProperty(a) && (r[a] = r[a] === void 0 ? i[a] : r[a]);
	var o = typeof r.spread == "number", s, c, l = 1 / r.smoothSpread, u = r.sizeVariance * 2, d = new e.Vector3(), f = new e.Vector3(), p = new e.Vector3(), m = new e.Vector3(), h = r.mesh.up.clone().applyAxisAngle(new e.Vector3(1, 0, 0), .5 * Math.PI);
	o && (s = r.randomness(), c = typeof s == "number" ? Math.random : function(e) {
		return s[e];
	}), n = n.toNonIndexed();
	for (var g = n.attributes.position.array, _ = 0; _ < n.attributes.position.array.length; _ += 9) {
		d.set(g[_ + 0], g[_ + 1], g[_ + 2]), f.set(g[_ + 3], g[_ + 4], g[_ + 5]), p.set(g[_ + 6], g[_ + 7], g[_ + 8]), e.Triangle.getNormal(d, f, p, m);
		var v = !1;
		if (o) {
			var y = c(_ / 9);
			y < r.spread ? v = !0 : y < r.spread + r.smoothSpread && (v = t.EaseInOut((y - r.spread) * l) * r.spread > Math.random());
		} else v = r.spread(d, _ / 9, m, _);
		if (v) {
			if (m.angleTo(h) > r.maxSlope) continue;
			var b = r.mesh.clone();
			if (b.position.addVectors(d, f).add(p).divideScalar(3), r.maxTilt > 0) {
				var x = b.position.clone().add(m);
				b.lookAt(x);
				var S = m.angleTo(h);
				if (S > r.maxTilt) {
					var C = r.maxTilt / S;
					b.rotation.x *= C, b.rotation.y *= C, b.rotation.z *= C;
				}
			}
			if (b.rotation.x += 90 / 180 * Math.PI, b.rotateY(Math.random() * 2 * Math.PI), r.sizeVariance) {
				var w = Math.random() * u - r.sizeVariance;
				b.scale.x = b.scale.z = 1 + w, b.scale.y += w;
			}
			b.updateMatrix(), r.scene.add(b);
		}
	}
	return r.scene;
}, t.ScatterHelper = function(e, n, r, i) {
	r ||= 1, i ||= .25, n.frequency = n.frequency || 2.5;
	var a = {};
	for (var o in n) n.hasOwnProperty(o) && (a[o] = n[o]);
	a.xSegments *= 2, a.stretch = !0, a.maxHeight = 1, a.minHeight = 0;
	for (var s = t.heightmapArray(e, a), c = 0, l = s.length; c < l; c++) (c % r || Math.random() > i) && (s[c] = 1);
	return function() {
		return s;
	};
}, t.Analyze = function(n, r) {
	if (!n || !n.geometry || !n.geometry.attributes || !n.geometry.attributes.position || n.geometry.attributes.position.count < 3) return console.warn("Not enough vertices to analyze or invalid mesh"), h(r);
	try {
		var i = n.geometry.clone();
		i.index && (i = i.toNonIndexed());
		var a = t.toArray1D(i.attributes.position.array);
		if (!a || a.length === 0) return console.warn("Could not extract elevations from geometry"), h(r);
		var o = Array.from(a).sort(function(e, t) {
			return e - t;
		}), s = a.length, c = g(o, 1), l = g(o, 0), u = g(o, .5), d = w(o), f = 0, p = 0, m = 0, T = 0, E = n.up.clone().applyAxisAngle(new e.Vector3(1, 0, 0), .5 * Math.PI), D = [];
		try {
			D = v(i, r).map(function(e) {
				return e.angleTo(E) * 180 / Math.PI;
			}).sort(function(e, t) {
				return e - t;
			});
		} catch (e) {
			console.warn("Error calculating slopes:", e), D = [0];
		}
		var O = D.length, k = g(D, 1), A = g(D, 0), j = g(D, .5), M = w(D), N = n.position.clone().setZ(d), P, F;
		try {
			P = y(i.attributes.position.array, N), F = P.angleTo(E) * 180 / Math.PI;
		} catch (t) {
			console.warn("Error calculating plane normal:", t), P = new e.Vector3(0, 0, 1), F = 0;
		}
		for (var I = 0, L = 0, R = 0, z = 0, ee = r.xSize / r.xSegments * (r.ySize / r.ySegments) * .5, te = 0, B = 0, V = 0, H = new Float32Array(s), U = new Float32Array(O), W = 0, G; W < s; W++) G = o[W] - d, f += G * G, p += G * G * G, H[W] = Math.abs(o[W] - u), m += H[W], T += G * G * G * G;
		for (s > 1 && (p = p / s / (f / (s - 1)) ** 1.5, m = (d - u) / (m / s || 1), T = T * s / (f * f || 1) - 3, f = Math.sqrt(f / s)), Array.prototype.sort.call(H, function(e, t) {
			return e - t;
		}), W = 0; W < O; W++) G = D[W] - M, I += G * G, L += G * G * G, U[W] = Math.abs(D[W] - j), R += U[W], z += G * G * G * G, te += ee / Math.cos(D[W] * Math.PI / 180 || .001);
		O > 1 && (L = L / O / (I / (O - 1)) ** 1.5, R = (M - j) / (R / O || 1), z = z * O / (I * I || 1) - 3, I = Math.sqrt(I / O)), Array.prototype.sort.call(U, function(e, t) {
			return e - t;
		});
		try {
			for (var K = r.xSegments + 1, ne = r.ySegments + 1, q = 0; q < K; q++) for (var J = 0; J < ne; J++) {
				for (var re = -Infinity, ie = Infinity, Y = i.attributes.position.array[(J * K + q) * 3 + 2], ae = 0, X = 0, Z = -1; Z <= 1; Z++) for (var Q = -1; Q <= 1; Q++) if (q + Q >= 0 && J + Z >= 0 && q + Q < K && J + Z < ne && !(Z === 0 && Q === 0)) {
					var $ = i.attributes.position.array[((J + Z) * K + q + Q) * 3 + 2];
					ae += $, X++, $ > re && (re = $), $ < ie && (ie = $);
				}
				X && (B += (ae / X - Y) * (ae / X - Y)), (Y > re || Y < ie) && V++;
			}
			B = Math.sqrt(B / s);
			var oe = Math.ceil(K * .5) * Math.ceil(ne * .5) * 2;
			V /= oe > 0 ? oe : 1;
		} catch (e) {
			console.warn("Error calculating roughness:", e), B = 0, V = 0;
		}
		return {
			elevation: {
				sampleSize: s,
				max: c,
				min: l,
				range: c - l,
				midrange: (c - l) * .5 + l,
				median: u,
				iqr: g(o, .75) - g(o, .25),
				mean: d,
				stdev: f,
				mad: g(H, .5),
				pearsonSkew: p,
				groeneveldMeedenSkew: m,
				kurtosis: T,
				modes: x(o, Math.ceil(r.maxHeight - r.minHeight), r.minHeight, r.maxHeight),
				percentile: function(e) {
					return g(o, e);
				},
				percentRank: function(e) {
					return _(o, e);
				},
				drawHistogram: function(e, t) {
					S(b(o, t, r.minHeight, r.maxHeight), e, r.minHeight, r.maxHeight);
				}
			},
			slope: {
				sampleSize: O,
				max: k,
				min: A,
				range: k - A,
				midrange: (k - A) * .5 + A,
				median: j,
				iqr: g(D, .75) - g(D, .25),
				mean: M,
				stdev: I,
				mad: g(U, .5),
				pearsonSkew: L,
				groeneveldMeedenSkew: R,
				kurtosis: z,
				modes: x(D, 90, 0, 90),
				percentile: function(e) {
					return g(D, e);
				},
				percentRank: function(e) {
					return _(D, e);
				},
				drawHistogram: function(e, t) {
					S(b(D, t, 0, 90), e, 0, 90, "°");
				}
			},
			roughness: {
				planimetricAreaRatio: r.xSize * r.ySize / (te || r.xSize * r.ySize),
				terrainRuggednessIndex: B,
				jaggedness: V
			},
			fittedPlane: {
				centroid: N,
				normal: P,
				slope: F,
				pctExplained: C(i.attributes.position.array, N, P, r.maxHeight - r.minHeight)
			}
		};
	} catch (e) {
		return console.error("Error during terrain analysis:", e), h(r);
	}
};
function h(t) {
	var n = function(e) {
		if (e && e.getContext) {
			var t = e.getContext("2d");
			e.width = 300, e.height = 200, t.clearRect(0, 0, e.width, e.height), t.fillStyle = "rgba(144, 176, 192, 1)", t.font = "12px Arial", t.fillText("No data available for analysis", 10, 100);
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
			drawHistogram: n
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
			drawHistogram: n
		},
		roughness: {
			planimetricAreaRatio: 1,
			terrainRuggednessIndex: 0,
			jaggedness: 0
		},
		fittedPlane: {
			centroid: new e.Vector3(),
			normal: new e.Vector3(0, 0, 1),
			slope: 0,
			pctExplained: 0
		}
	};
}
t.percentile = g;
function g(e, t) {
	if (e.length === 0) return 0;
	if (typeof t != "number") throw TypeError("p must be a number");
	if (t <= 0) return e[0];
	if (t >= 1) return e[e.length - 1];
	var n = e.length * t, r = Math.floor(n), i = r + 1, a = n % 1;
	return i >= e.length ? e[r] : e[r] * (1 - a) + e[i] * a;
}
t.percentRank = _;
function _(e, t) {
	if (typeof t != "number") throw TypeError("v must be a number");
	for (var n = 0, r = e.length; n < r; n++) if (t <= e[n]) {
		for (; n < r && t === e[n];) n++;
		return n === 0 ? 0 : (t !== e[n - 1] && (n += (t - e[n - 1]) / (e[n] - e[n - 1])), n / r);
	}
	return 1;
}
t.faceNormals = v;
function v(t, n) {
	var r = t.clone();
	r.index && (r = r.toNonIndexed());
	for (var i = r.attributes.position.array, a = i.length / 9, o = Array(a), s = new e.Vector3(), c = new e.Vector3(), l = new e.Vector3(), u = 0; u < a; u++) {
		var d = u * 9;
		s.set(i[d], i[d + 1], i[d + 2]), c.set(i[d + 3], i[d + 4], i[d + 5]), l.set(i[d + 6], i[d + 7], i[d + 8]), o[u] = new e.Vector3().crossVectors(new e.Vector3().subVectors(c, s), new e.Vector3().subVectors(l, s)).normalize();
	}
	return o;
}
t.getFittedPlaneNormal = y;
function y(t, n) {
	var r = t.length / 3, i = 0, a = 0, o = 0, s = 0, c = 0, l = 0;
	if (r < 3) throw Error("At least three points are required to fit a plane");
	for (var u = new e.Vector3(), d = 0, f = t.length; d < f; d += 3) {
		var p = t[d] - n.x, m = t[d + 1] - n.y, h = t[d + 2] - n.z;
		i += p * p, a += p * m, o += p * h, s += m * m, c += m * h, l += h * h;
	}
	var g = s * l - c * c, _ = i * l - o * o, v = i * s - a * a;
	return g >= _ && g >= v ? u.set(g, a * l - o * c, o * s - a * c) : _ >= g && _ >= v ? u.set(a * l - o * c, _, a * o - c * i) : u.set(o * s - a * c, a * o - c * i, v), u.z < 0 && u.negate(), u.normalize();
}
t.bucketNumbersLinearly = b;
function b(e, t, n, r) {
	var i = 0, a = e.length;
	if (n === void 0) for (n = Infinity, r = -Infinity, i = 0; i < a; i++) e[i] < n && (n = e[i]), e[i] > r && (r = e[i]);
	n === r && (r = n + 1);
	var o = (r - n) / t, s = Array(t);
	for (i = 0; i < t; i++) s[i] = [];
	for (i = 0; i < a; i++) {
		var c = Math.max(n, Math.min(r, e[i]));
		if (c === r) s[t - 1].push(c);
		else {
			var l = Math.floor((c - n) / o);
			l = Math.max(0, Math.min(t - 1, l)), s[l].push(c);
		}
	}
	return s;
}
t.getModes = x;
function x(e, t, n, r) {
	if (!e || e.length === 0) return [];
	n === r && (r = n + 1);
	for (var i = b(e, t, n, r), a = 0, o = [], s = 0, c = i.length; s < c; s++) i[s].length > a ? (a = i[s].length, o = [n + (s + .5) / t * (r - n)]) : i[s].length === a && a > 0 && o.push(n + (s + .5) / t * (r - n));
	if (o.length === 0) return [];
	for (var l = 0; l < o.length; l++) Math.abs(o[l] - Math.round(o[l])) < .001 ? o[l] = Math.round(o[l]) : o[l] = parseFloat(o[l].toFixed(3));
	return o;
}
t.drawHistogram = S;
function S(e, t, n, r, i) {
	if (!t || !t.getContext) {
		console.warn("Invalid canvas for histogram drawing");
		return;
	}
	var a = t.getContext("2d"), o = 280, s = 180, c = 10, l = 4, u = r === void 0 ? -Infinity : r, d = n === void 0 ? Infinity : n, f = e.length, p;
	if (t.width = o + c * 2, t.height = s + c * 2, a.clearRect(0, 0, t.width, t.height), i === void 0 && (i = ""), u === -Infinity || d === Infinity) for (p = 0; p < f; p++) for (var m = 0, h = e[p].length; m < h; m++) e[p][m] > u && (u = e[p][m]), e[p][m] < d && (d = e[p][m]);
	d === u && (u = d + 1);
	var g = 0, _ = 0;
	for (p = 0; p < f; p++) e[p].length > g && (g = e[p].length), _ += e[p].length;
	if (_ === 0 || g === 0) {
		a.fillStyle = "rgba(144, 176, 192, 1)", a.font = "12px Arial", a.fillText("No data available", c + 10, c + s / 2), a.strokeStyle = "rgba(13, 42, 64, 1)", a.lineWidth = 2, a.beginPath(), a.moveTo(c, c), a.lineTo(c, s + c), a.moveTo(c, s + c), a.lineTo(o + c, s + c), a.stroke();
		return;
	}
	var v = (s - l) / g, y = (o - (e.length + 1) * l) / e.length;
	for (y >= 1 && (y = Math.floor(y)), v >= 1 && (v = Math.floor(v)), a.fillStyle = "rgba(13, 42, 64, 1)", p = 0; p < f; p++) a.fillRect(c + l + p * (y + l), c + s - (l + e[p].length * v), y, v * e[p].length);
	for (a.fillStyle = "rgba(144, 176, 192, 1)", a.font = "12px Arial", p = 0; p < f; p++) {
		var b = Math.floor((p + .5) / e.length * (u - d) + d) + "" + i;
		a.fillText(b, c + l + p * (y + l) + Math.floor((y - a.measureText(b).width) * .5), c + s - 8, y);
	}
	var x = _ > 0 ? Math.round(100 * g / _) + "%" : "0%";
	a.fillText(x, c + l, c + l + 6), a.strokeStyle = "rgba(13, 42, 64, 1)", a.lineWidth = 2, a.beginPath(), a.moveTo(c, c), a.lineTo(c, s + c), a.moveTo(c, s + c), a.lineTo(o + c, s + c), a.stroke();
}
t.percentVariationExplainedByFittedPlane = C;
function C(e, t, n, r) {
	if (!e || e.length < 3 || !t || !n || !n.isVector3) return 0;
	r = Math.abs(r) || 1;
	var i = e.length, a = 0, o, s;
	try {
		for (var c = 0; c < i; c += 3) {
			var l = e[c + 0] - t.x, u = e[c + 1] - t.y, d = e[c + 2] - t.z;
			o = n.x * l + n.y * u + n.z * d, s = Math.abs(o) / Math.sqrt(n.x * n.x + n.y * n.y + n.z * n.z), a += s * s;
		}
		return Math.max(0, Math.min(1, 1 - Math.sqrt(a / i) * 2 / r));
	} catch (e) {
		return console.warn("Error calculating plane variation:", e), 0;
	}
}
t.mean = w;
function w(e) {
	for (var t = 0, n = e.length, r = 0; r < n; r++) t += e[r];
	return t / n;
}
//#endregion
//#region src/brownian.js
t.Brownian = function(e, n) {
	var r = [], i = [], a = Math.min(n.xSize, n.ySize), o = Math.sqrt(a) / a, s = Math.sqrt(n.maxHeight - n.minHeight), c = n.xSegments + 1, l = n.ySegments + 1, u = Math.floor(Math.random() * n.xSegments), d = Math.floor(Math.random() * n.ySegments), f = u, p = d, m = e.length, h = Array.from(e).map(function(e) {
		return { z: e };
	}), g = h[d * c + u], _ = Math.random() * Math.PI * 2, v = Math.cos(_), y = Math.sin(_), b, x, S, C, w, T, E;
	for (g.z = Math.random() * (n.maxHeight - n.minHeight) + n.minHeight, i.push(g); i.length !== m;) {
		for (b = -1; b <= 1; b++) for (x = -1; x <= 1; x++) S = (d + b) * c + u + x, h[S] !== void 0 && i.indexOf(h[S]) === -1 && u + x >= 0 && d + b >= 0 && u + x < c && d + b < l && b && x && r.push(h[S]);
		if (Math.random() < o) g = r.splice(Math.floor(Math.random() * r.length), 1)[0], _ = Math.random() * Math.PI * 2, v = Math.cos(_), y = Math.sin(_), E = h.indexOf(g), u = E % c, d = Math.floor(E / c), f = u, p = d;
		else {
			for (var D = f, O = p; Math.round(D) === u && Math.round(O) === d;) D += v, O += y;
			u = Math.round(D), d = Math.round(D);
			for (var k = 0; u >= 0 && d >= 0 && u < c && d < l && i.indexOf(h[d * c + u]) !== -1 && k < 9; k++) {
				for (_ = Math.random() * Math.PI * 2, v = Math.cos(_), y = Math.sin(_); Math.round(D) === u && Math.round(O) === d;) D += v, O += y;
				u = Math.round(D), d = Math.round(O);
			}
			if (u >= 0 && d >= 0 && u < c && d < l && i.indexOf(h[d * c + u]) === -1) {
				f = D, p = O, g = h[d * c + u];
				var A = r.indexOf(g);
				A !== -1 && r.splice(A, 1);
			} else g = r.splice(Math.floor(Math.random() * r.length), 1)[0], _ = Math.random() * Math.PI * 2, v = Math.cos(_), y = Math.sin(_), E = h.indexOf(g), u = E % c, d = Math.floor(E / c), f = u, p = d;
		}
		for (C = 0, w = 0, b = -1; b <= 1; b++) for (x = -1; x <= 1; x++) S = (d + b) * c + u + x, h[S] !== void 0 && i.indexOf(h[S]) !== -1 && u + x >= 0 && d + b >= 0 && u + x < c && d + b < l && b && x && (C += h[S].z, w++);
		w && ((!T || Math.random() < o) && (T = Math.random()), g.z = C / w + t.EaseInWeak(T) * s * 2 - s), i.push(g);
	}
	for (u = h.length - 1; u >= 0; u--) e[u] = h[u].z;
	t.Smooth(e, n), t.Smooth(e, n);
};
//#endregion
//#region src/gaussian.js
function T(e, t, n) {
	if (!e.length || !t.length) return e;
	var r = 0, i = 0, a = 0, o = 0, s = e.length, c = e[0].length, l = t.length, u = t[0].length;
	if (n === void 0) for (n = Array(s), r = 0; r < s; r++) n[r] = new Float64Array(c);
	for (r = 0; r < s; r++) for (i = 0; i < c; i++) {
		var d = 0;
		for (n[r][i] = 0, a = 0; a < l; a++) for (o = 0; o < u; o++) e[r + a] !== void 0 && e[r + a][i + o] !== void 0 && (d = e[r + a][i + o]), n[r][i] += d * t[a][o];
	}
	return n;
}
function E(e, t) {
	return Math.exp(-.5 * e * e / (t * t)) / (t * 2.5066282746310007);
}
function D(e, t) {
	typeof t != "number" && (t = 7);
	var n = new Float64Array(t), r = Math.floor(t * .5), i = t % 2, a;
	if (!e || !t) return n;
	for (a = 0; a <= r; a++) n[a] = E(e * (a - r - i * .5), e);
	for (; a < t; a++) n[a] = n[t - 1 - a];
	return n;
}
function O(e, t, n) {
	t === void 0 && (t = 1), n === void 0 && (n = 7);
	for (var r = D(t, n), i = n || r.length, a = [r], o = Array(i), s = 0; s < i; s++) o[s] = [r[s]];
	return T(T(e, a), o);
}
//#endregion
//#region src/weightedBoxBlurGaussian.js
t.Gaussian = function(e, n, r, i) {
	t.fromArray2D(e, O(t.toArray2D(e, n), r, i));
}, t.GaussianBoxBlur = function(e, t, n, r) {
	k(e, t.xSegments + 1, t.ySegments + 1, n, r);
};
function k(e, t, n, r, i, a) {
	r === void 0 && (r = 1), i === void 0 && (i = 3), a === void 0 && (a = new Float32Array(e.length));
	for (var o = A(r, i), s = 0; s < i; s++) j(e, a, t, n, (o[s] - 1) / 2);
	return a;
}
function A(e, t) {
	var n = Math.sqrt(12 * e * e / t + 1), r = Math.floor(n);
	r % 2 == 0 && r--;
	for (var i = r + 2, a = (12 * e * e - t * r * r - 4 * t * r - 3 * t) / (-4 * r - 4), o = Math.round(a), s = new Int16Array(t), c = 0; c < t; c++) s[c] = c < o ? r : i;
	return s;
}
function j(e, t, n, r, i) {
	for (var a = 0, o = e.length; a < o; a++) t[a] = e[a];
	M(t, e, n, r, i), N(e, t, n, r, i);
}
function M(e, t, n, r, i) {
	for (var a = 1 / (i + i + 1), o = 0; o < r; o++) {
		var s = o * n, c = s, l = s + i, u = e[s], d = e[s + n - 1], f = (i + 1) * u, p;
		for (p = 0; p < i; p++) f += e[s + p];
		for (p = 0; p <= i; p++) f += e[l++] - u, t[s++] = f * a;
		for (p = i + 1; p < n - i; p++) f += e[l++] - e[c++], t[s++] = f * a;
		for (p = n - i; p < n; p++) f += d - e[c++], t[s++] = f * a;
	}
}
function N(e, t, n, r, i) {
	for (var a = 1 / (i + i + 1), o = 0; o < n; o++) {
		var s = o, c = s, l = s + i * n, u = e[s], d = e[s + n * (r - 1)], f = (i + 1) * u, p;
		for (p = 0; p < i; p++) f += e[s + p * n];
		for (p = 0; p <= i; p++) f += e[l] - u, t[s] = f * a, l += n, s += n;
		for (p = i + 1; p < r - i; p++) f += e[l] - e[c], t[s] = f * a, c += n, l += n, s += n;
		for (p = r - i; p < r; p++) f += d - e[c], t[s] = f * a, c += n, s += n;
	}
}
t.Worley ||= {}, e.Vector2.prototype.distanceToManhattan = function(e) {
	return Math.abs(this.x - e.x) + Math.abs(this.y - e.y);
}, e.Vector2.prototype.distanceToChebyshev = function(e) {
	var t = Math.abs(this.x - e.x), n = Math.abs(this.y - e.y);
	return t <= n ? n : t;
}, e.Vector2.prototype.distanceToQuadratic = function(e) {
	var t = Math.abs(this.x - e.x), n = Math.abs(this.y - e.y);
	return t * t + t * n + n * n;
};
function P(e, t, n) {
	for (var r = Infinity, i = "distanceTo" + n, a = 0; a < t.length; a++) {
		var o = t[a][i](e);
		o < r && (r = o);
	}
	return r;
}
t.Worley = function(n, r) {
	for (var i = (r.worleyDistribution || t.Worley.randomPoints || function(t, n, r) {
		r = r || Math.floor(Math.sqrt(t * n * .025)) || 1;
		for (var i = Array(r), a = 0; a < r; a++) i[a] = new e.Vector2(Math.random() * t, Math.random() * n);
		return i;
	})(r.xSegments, r.ySegments, r.worleyPoints), a = r.worleyDistanceTransformation || function(e) {
		return -e;
	}, o = new e.Vector2(0, 0), s = 0, c = r.xSegments + 1; s < c; s++) for (var l = 0; l < r.ySegments + 1; l++) o.x = s, o.y = l, n[l * c + s] = a(P(o, i, r.distanceType || ""));
	t.Clamp(n, {
		maxHeight: r.maxHeight,
		minHeight: r.minHeight,
		stretch: !0
	});
}, t.Worley.randomPoints = function(t, n, r) {
	r = r || Math.floor(Math.sqrt(t * n * .025)) || 1;
	for (var i = Array(r), a = 0; a < r; a++) i[a] = new e.Vector2(Math.random() * t, Math.random() * n);
	return i;
};
function F(e) {
	return e.splice(Math.floor(Math.random() * e.length), 1)[0];
}
function I(e, t, n) {
	var r = Math.floor(t.x / n), i = Math.floor(t.y / n);
	e[r] || (e[r] = []), e[r][i] = t;
}
function L(e, t, n) {
	return e.x >= 0 && e.y >= 0 && e.x <= t + 1 && e.y <= n + 1;
}
function R(e, t, n, r) {
	for (var i = Math.floor(t.x / r), a = Math.floor(t.y / r), o = i - 1; o <= i + 1; o++) for (var s = a - 1; s <= a + 1; s++) if (o !== i && s !== a && e[o] !== void 0 && e[o][s] !== void 0) {
		var c = o * r, l = s * r;
		if (Math.sqrt((t.x - c) * (t.x - c) + (t.y - l) * (t.y - l)) < n) return !0;
	}
	return !1;
}
function z(t, n) {
	var r = n * (Math.random() + 1), i = 2 * Math.PI * Math.random();
	return new e.Vector2(t.x + r * Math.cos(i), t.y + r * Math.sin(i));
}
//#endregion
//#region src/index.js
t.Worley.PoissonDisks = function(t, n, r, i) {
	r = r || Math.floor(Math.sqrt(t * n * .2)) || 1, i = Math.sqrt((t + n) * 2.5), i > r * .67 && (i = r * .67);
	var a = i / Math.sqrt(2);
	a < 2 && (a = 2);
	var o = [], s = [], c = [], l = new e.Vector2(Math.random() * t, Math.random() * n);
	s.push(l), c.push(l), I(o, l, a);
	for (var u = 0; s.length;) {
		for (var d = F(s), f = 0; f < r; f++) {
			var p = z(d, i);
			if (L(p, t, n) && !R(o, p, i, a) && (s.push(p), c.push(p), I(o, p, a), c.length >= r)) break;
		}
		if (c.length >= r || ++u > r * r) break;
	}
	return c;
}, typeof window < "u" && (window.THREE || (window.THREE = {}), window.THREE.Terrain = r, Object.assign(window.THREE.Terrain, t));
//#endregion
export { t as TerrainNS, r as default, m as generateBlendedMaterial };
