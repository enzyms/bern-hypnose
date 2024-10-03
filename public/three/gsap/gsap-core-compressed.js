function _assertThisInitialized(t) {
    if (void 0 === t) throw ReferenceError("this hasn't been initialised - super() hasn't been called");
    return t;
}
function _inheritsLoose(t, e) {
    (t.prototype = Object.create(e.prototype)), (t.prototype.constructor = t), (t.__proto__ = e);
}
/*!
 * GSAP 3.12.5
 * https://gsap.com
 *
 * @license Copyright 2008-2024, GreenSock. All rights reserved.
 * Subject to the terms at https://gsap.com/standard-license or for
 * Club GSAP members, the agreement issued with that membership.
 * @author: Jack Doyle, jack@greensock.com
 */ var _suppressOverwrites,
    _reverting,
    _context,
    _globalTimeline,
    _win,
    _coreInitted,
    _doc,
    _coreReady,
    _lastRenderedFrame,
    _quickTween,
    _tickerActive,
    _config = { autoSleep: 120, force3D: 'auto', nullTargetWarn: 1, units: { lineHeight: '' } },
    _defaults = { duration: 0.5, overwrite: !1, delay: 0 },
    _bigNum = 1e8,
    _tinyNum = 1 / _bigNum,
    _2PI = 2 * Math.PI,
    _HALF_PI = _2PI / 4,
    _gsID = 0,
    _sqrt = Math.sqrt,
    _cos = Math.cos,
    _sin = Math.sin,
    _isString = function t(e) {
        return 'string' == typeof e;
    },
    _isFunction = function t(e) {
        return 'function' == typeof e;
    },
    _isNumber = function t(e) {
        return 'number' == typeof e;
    },
    _isUndefined = function t(e) {
        return void 0 === e;
    },
    _isObject = function t(e) {
        return 'object' == typeof e;
    },
    _isNotFalse = function t(e) {
        return !1 !== e;
    },
    _windowExists = function t() {
        return 'undefined' != typeof window;
    },
    _isFuncOrString = function t(e) {
        return _isFunction(e) || _isString(e);
    },
    _isTypedArray = ('function' == typeof ArrayBuffer && ArrayBuffer.isView) || function () {},
    _isArray = Array.isArray,
    _strictNumExp = /(?:-?\.?\d|\.)+/gi,
    _numExp = /[-+=.]*\d+[.e\-+]*\d*[e\-+]*\d*/g,
    _numWithUnitExp = /[-+=.]*\d+[.e-]*\d*[a-z%]*/g,
    _complexStringNumExp = /[-+=.]*\d+\.?\d*(?:e-|e\+)?\d*/gi,
    _relExp = /[+-]=-?[.\d]+/,
    _delimitedValueExp = /[^,'"\[\]\s]+/gi,
    _unitExp = /^[+\-=e\s\d]*\d+[.\d]*([a-z]*|%)\s*$/i,
    _globals = {},
    _installScope = {},
    _install = function t(e) {
        return (_installScope = _merge(e, _globals)) && gsap;
    },
    _missingPlugin = function t(e, i) {
        return console.warn('Invalid property', e, 'set to', i, 'Missing plugin? gsap.registerPlugin()');
    },
    _warn = function t(e, i) {
        return !i && console.warn(e);
    },
    _addGlobal = function t(e, i) {
        return (e && (_globals[e] = i) && _installScope && (_installScope[e] = i)) || _globals;
    },
    _emptyFunc = function t() {
        return 0;
    },
    _startAtRevertConfig = { suppressEvents: !0, isStart: !0, kill: !1 },
    _revertConfigNoKill = { suppressEvents: !0, kill: !1 },
    _revertConfig = { suppressEvents: !0 },
    _reservedProps = {},
    _lazyTweens = [],
    _lazyLookup = {},
    _plugins = {},
    _effects = {},
    _nextGCFrame = 30,
    _harnessPlugins = [],
    _callbackNames = '',
    _harness = function t(e) {
        var i,
            r,
            n = e[0];
        if ((_isObject(n) || _isFunction(n) || (e = [e]), !(i = (n._gsap || {}).harness))) {
            for (r = _harnessPlugins.length; r-- && !_harnessPlugins[r].targetTest(n); );
            i = _harnessPlugins[r];
        }
        for (r = e.length; r--; ) (e[r] && (e[r]._gsap || (e[r]._gsap = new GSCache(e[r], i)))) || e.splice(r, 1);
        return e;
    },
    _getCache = function t(e) {
        return e._gsap || _harness(toArray(e))[0]._gsap;
    },
    _getProperty = function t(e, i, r) {
        return (r = e[i]) && _isFunction(r) ? e[i]() : (_isUndefined(r) && e.getAttribute && e.getAttribute(i)) || r;
    },
    _forEachName = function t(e, i) {
        return (e = e.split(',')).forEach(i) || e;
    },
    _round = function t(e) {
        return Math.round(1e5 * e) / 1e5 || 0;
    },
    _roundPrecise = function t(e) {
        return Math.round(1e7 * e) / 1e7 || 0;
    },
    _parseRelative = function t(e, i) {
        var r = i.charAt(0),
            n = parseFloat(i.substr(2));
        return (e = parseFloat(e)), '+' === r ? e + n : '-' === r ? e - n : '*' === r ? e * n : e / n;
    },
    _arrayContainsAny = function t(e, i) {
        for (var r = i.length, n = 0; 0 > e.indexOf(i[n]) && ++n < r; );
        return n < r;
    },
    _lazyRender = function t() {
        var e,
            i,
            r = _lazyTweens.length,
            n = _lazyTweens.slice(0);
        for (e = 0, _lazyLookup = {}, _lazyTweens.length = 0; e < r; e++) (i = n[e]) && i._lazy && (i.render(i._lazy[0], i._lazy[1], !0)._lazy = 0);
    },
    _lazySafeRender = function t(e, i, r, n) {
        _lazyTweens.length && !_reverting && _lazyRender(),
            e.render(i, r, n || (_reverting && i < 0 && (e._initted || e._startAt))),
            _lazyTweens.length && !_reverting && _lazyRender();
    },
    _numericIfPossible = function t(e) {
        var i = parseFloat(e);
        return (i || 0 === i) && (e + '').match(_delimitedValueExp).length < 2 ? i : _isString(e) ? e.trim() : e;
    },
    _passThrough = function t(e) {
        return e;
    },
    _setDefaults = function t(e, i) {
        for (var r in i) r in e || (e[r] = i[r]);
        return e;
    },
    _setKeyframeDefaults = function t(e) {
        return function (t, i) {
            for (var r in i) r in t || ('duration' === r && e) || 'ease' === r || (t[r] = i[r]);
        };
    },
    _merge = function t(e, i) {
        for (var r in i) e[r] = i[r];
        return e;
    },
    _mergeDeep = function t(e, i) {
        for (var r in i) '__proto__' !== r && 'constructor' !== r && 'prototype' !== r && (e[r] = _isObject(i[r]) ? t(e[r] || (e[r] = {}), i[r]) : i[r]);
        return e;
    },
    _copyExcluding = function t(e, i) {
        var r,
            n = {};
        for (r in e) r in i || (n[r] = e[r]);
        return n;
    },
    _inheritDefaults = function t(e) {
        var i = e.parent || _globalTimeline,
            r = e.keyframes ? _setKeyframeDefaults(_isArray(e.keyframes)) : _setDefaults;
        if (_isNotFalse(e.inherit)) for (; i; ) r(e, i.vars.defaults), (i = i.parent || i._dp);
        return e;
    },
    _arraysMatch = function t(e, i) {
        for (var r = e.length, n = r === i.length; n && r-- && e[r] === i[r]; );
        return r < 0;
    },
    _addLinkedListItem = function t(e, i, r, n, s) {
        void 0 === r && (r = '_first'), void 0 === n && (n = '_last');
        var a,
            o = e[n];
        if (s) for (a = i[s]; o && o[s] > a; ) o = o._prev;
        return (
            o ? ((i._next = o._next), (o._next = i)) : ((i._next = e[r]), (e[r] = i)),
            i._next ? (i._next._prev = i) : (e[n] = i),
            (i._prev = o),
            (i.parent = i._dp = e),
            i
        );
    },
    _removeLinkedListItem = function t(e, i, r, n) {
        void 0 === r && (r = '_first'), void 0 === n && (n = '_last');
        var s = i._prev,
            a = i._next;
        s ? (s._next = a) : e[r] === i && (e[r] = a), a ? (a._prev = s) : e[n] === i && (e[n] = s), (i._next = i._prev = i.parent = null);
    },
    _removeFromParent = function t(e, i) {
        e.parent && (!i || e.parent.autoRemoveChildren) && e.parent.remove && e.parent.remove(e), (e._act = 0);
    },
    _uncache = function t(e, i) {
        if (e && (!i || i._end > e._dur || i._start < 0)) for (var r = e; r; ) (r._dirty = 1), (r = r.parent);
        return e;
    },
    _recacheAncestors = function t(e) {
        for (var i = e.parent; i && i.parent; ) (i._dirty = 1), i.totalDuration(), (i = i.parent);
        return e;
    },
    _rewindStartAt = function t(e, i, r, n) {
        return (
            e._startAt && (_reverting ? e._startAt.revert(_revertConfigNoKill) : (e.vars.immediateRender && !e.vars.autoRevert) || e._startAt.render(i, !0, n))
        );
    },
    _hasNoPausedAncestors = function t(e) {
        return !e || (e._ts && t(e.parent));
    },
    _elapsedCycleDuration = function t(e) {
        return e._repeat ? _animationCycle(e._tTime, (e = e.duration() + e._rDelay)) * e : 0;
    },
    _animationCycle = function t(e, i) {
        var r = Math.floor((e /= i));
        return e && r === e ? r - 1 : r;
    },
    _parentToChildTotalTime = function t(e, i) {
        return (e - i._start) * i._ts + (i._ts >= 0 ? 0 : i._dirty ? i.totalDuration() : i._tDur);
    },
    _setEnd = function t(e) {
        return (e._end = _roundPrecise(e._start + (e._tDur / Math.abs(e._ts || e._rts || _tinyNum) || 0)));
    },
    _alignPlayhead = function t(e, i) {
        var r = e._dp;
        return (
            r &&
                r.smoothChildTiming &&
                e._ts &&
                ((e._start = _roundPrecise(r._time - (e._ts > 0 ? i / e._ts : -(((e._dirty ? e.totalDuration() : e._tDur) - i) / e._ts)))),
                _setEnd(e),
                r._dirty || _uncache(r, e)),
            e
        );
    },
    _postAddChecks = function t(e, i) {
        var r;
        if (
            ((i._time || (!i._dur && i._initted) || (i._start < e._time && (i._dur || !i.add))) &&
                ((r = _parentToChildTotalTime(e.rawTime(), i)), (!i._dur || _clamp(0, i.totalDuration(), r) - i._tTime > _tinyNum) && i.render(r, !0)),
            _uncache(e, i)._dp && e._initted && e._time >= e._dur && e._ts)
        ) {
            if (e._dur < e.duration()) for (r = e; r._dp; ) r.rawTime() >= 0 && r.totalTime(r._tTime), (r = r._dp);
            e._zTime = -_tinyNum;
        }
    },
    _addToTimeline = function t(e, i, r, n) {
        return (
            i.parent && _removeFromParent(i),
            (i._start = _roundPrecise((_isNumber(r) ? r : r || e !== _globalTimeline ? _parsePosition(e, r, i) : e._time) + i._delay)),
            (i._end = _roundPrecise(i._start + (i.totalDuration() / Math.abs(i.timeScale()) || 0))),
            _addLinkedListItem(e, i, '_first', '_last', e._sort ? '_start' : 0),
            _isFromOrFromStart(i) || (e._recent = i),
            n || _postAddChecks(e, i),
            e._ts < 0 && _alignPlayhead(e, e._tTime),
            e
        );
    },
    _scrollTrigger = function t(e, i) {
        return (_globals.ScrollTrigger || _missingPlugin('scrollTrigger', i)) && _globals.ScrollTrigger.create(i, e);
    },
    _attemptInitTween = function t(e, i, r, n, s) {
        return (_initTween(e, i, s), e._initted)
            ? !r && e._pt && !_reverting && ((e._dur && !1 !== e.vars.lazy) || (!e._dur && e.vars.lazy)) && _lastRenderedFrame !== _ticker.frame
                ? (_lazyTweens.push(e), (e._lazy = [s, n]), 1)
                : void 0
            : 1;
    },
    _parentPlayheadIsBeforeStart = function t(e) {
        var i = e.parent;
        return i && i._ts && i._initted && !i._lock && (0 > i.rawTime() || t(i));
    },
    _isFromOrFromStart = function t(e) {
        var i = e.data;
        return 'isFromStart' === i || 'isStart' === i;
    },
    _renderZeroDurationTween = function t(e, i, r, n) {
        var s,
            a,
            o,
            u = e.ratio,
            l =
                i < 0 ||
                (!i &&
                    ((!e._start && _parentPlayheadIsBeforeStart(e) && !(!e._initted && _isFromOrFromStart(e))) ||
                        ((e._ts < 0 || e._dp._ts < 0) && !_isFromOrFromStart(e))))
                    ? 0
                    : 1,
            c = e._rDelay,
            h = 0;
        if (
            (c &&
                e._repeat &&
                ((h = _clamp(0, e._tDur, i)),
                (a = _animationCycle(h, c)),
                e._yoyo && 1 & a && (l = 1 - l),
                a !== _animationCycle(e._tTime, c) && ((u = 1 - l), e.vars.repeatRefresh && e._initted && e.invalidate())),
            l !== u || _reverting || n || e._zTime === _tinyNum || (!i && e._zTime))
        ) {
            if (!e._initted && _attemptInitTween(e, i, n, r, h)) return;
            for (
                o = e._zTime, e._zTime = i || (r ? _tinyNum : 0), r || (r = i && !o), e.ratio = l, e._from && (l = 1 - l), e._time = 0, e._tTime = h, s = e._pt;
                s;

            )
                s.r(l, s.d), (s = s._next);
            i < 0 && _rewindStartAt(e, i, r, !0),
                e._onUpdate && !r && _callback(e, 'onUpdate'),
                h && e._repeat && !r && e.parent && _callback(e, 'onRepeat'),
                (i >= e._tDur || i < 0) &&
                    e.ratio === l &&
                    (l && _removeFromParent(e, 1), r || _reverting || (_callback(e, l ? 'onComplete' : 'onReverseComplete', !0), e._prom && e._prom()));
        } else e._zTime || (e._zTime = i);
    },
    _findNextPauseTween = function t(e, i, r) {
        var n;
        if (r > i)
            for (n = e._first; n && n._start <= r; ) {
                if ('isPause' === n.data && n._start > i) return n;
                n = n._next;
            }
        else
            for (n = e._last; n && n._start >= r; ) {
                if ('isPause' === n.data && n._start < i) return n;
                n = n._prev;
            }
    },
    _setDuration = function t(e, i, r, n) {
        var s = e._repeat,
            a = _roundPrecise(i) || 0,
            o = e._tTime / e._tDur;
        return (
            o && !n && (e._time *= a / e._dur),
            (e._dur = a),
            (e._tDur = s ? (s < 0 ? 1e10 : _roundPrecise(a * (s + 1) + e._rDelay * s)) : a),
            o > 0 && !n && _alignPlayhead(e, (e._tTime = e._tDur * o)),
            e.parent && _setEnd(e),
            r || _uncache(e.parent, e),
            e
        );
    },
    _onUpdateTotalDuration = function t(e) {
        return e instanceof Timeline ? _uncache(e) : _setDuration(e, e._dur);
    },
    _zeroPosition = { _start: 0, endTime: _emptyFunc, totalDuration: _emptyFunc },
    _parsePosition = function t(e, i, r) {
        var n,
            s,
            a,
            o = e.labels,
            u = e._recent || _zeroPosition,
            l = e.duration() >= _bigNum ? u.endTime(!1) : e._dur;
        return _isString(i) && (isNaN(i) || i in o)
            ? ((s = i.charAt(0)), (a = '%' === i.substr(-1)), (n = i.indexOf('=')), '<' === s || '>' === s)
                ? (n >= 0 && (i = i.replace(/=/, '')),
                  ('<' === s ? u._start : u.endTime(u._repeat >= 0)) + (parseFloat(i.substr(1)) || 0) * (a ? (n < 0 ? u : r).totalDuration() / 100 : 1))
                : n < 0
                  ? (i in o || (o[i] = l), o[i])
                  : ((s = parseFloat(i.charAt(n - 1) + i.substr(n + 1))),
                    a && r && (s = (s / 100) * (_isArray(r) ? r[0] : r).totalDuration()),
                    n > 1 ? t(e, i.substr(0, n - 1), r) + s : l + s)
            : null == i
              ? l
              : +i;
    },
    _createTweenType = function t(e, i, r) {
        var n,
            s,
            a = _isNumber(i[1]),
            o = (a ? 2 : 1) + (e < 2 ? 0 : 1),
            u = i[o];
        if ((a && (u.duration = i[1]), (u.parent = r), e)) {
            for (n = u, s = r; s && !('immediateRender' in n); ) (n = s.vars.defaults || {}), (s = _isNotFalse(s.vars.inherit) && s.parent);
            (u.immediateRender = _isNotFalse(n.immediateRender)), e < 2 ? (u.runBackwards = 1) : (u.startAt = i[o - 1]);
        }
        return new Tween(i[0], u, i[o + 1]);
    },
    _conditionalReturn = function t(e, i) {
        return e || 0 === e ? i(e) : i;
    },
    _clamp = function t(e, i, r) {
        return r < e ? e : r > i ? i : r;
    },
    getUnit = function t(e, i) {
        return _isString(e) && (i = _unitExp.exec(e)) ? i[1] : '';
    },
    clamp = function t(e, i, r) {
        return _conditionalReturn(r, function (t) {
            return _clamp(e, i, t);
        });
    },
    _slice = [].slice,
    _isArrayLike = function t(e, i) {
        return e && _isObject(e) && 'length' in e && ((!i && !e.length) || (e.length - 1 in e && _isObject(e[0]))) && !e.nodeType && e !== _win;
    },
    _flatten = function t(e, i, r) {
        return (
            void 0 === r && (r = []),
            e.forEach(function (t) {
                var e;
                return (_isString(t) && !i) || _isArrayLike(t, 1) ? (e = r).push.apply(e, toArray(t)) : r.push(t);
            }) || r
        );
    },
    toArray = function t(e, i, r) {
        return _context && !i && _context.selector
            ? _context.selector(e)
            : _isString(e) && !r && (_coreInitted || !_wake())
              ? _slice.call((i || _doc).querySelectorAll(e), 0)
              : _isArray(e)
                ? _flatten(e, r)
                : _isArrayLike(e)
                  ? _slice.call(e, 0)
                  : e
                    ? [e]
                    : [];
    },
    selector = function t(e) {
        return (
            (e = toArray(e)[0] || _warn('Invalid scope') || {}),
            function (t) {
                var i = e.current || e.nativeElement || e;
                return toArray(t, i.querySelectorAll ? i : i === e ? _warn('Invalid scope') || _doc.createElement('div') : e);
            }
        );
    },
    shuffle = function t(e) {
        return e.sort(function () {
            return 0.5 - Math.random();
        });
    },
    distribute = function t(e) {
        if (_isFunction(e)) return e;
        var i = _isObject(e) ? e : { each: e },
            r = _parseEase(i.ease),
            n = i.from || 0,
            s = parseFloat(i.base) || 0,
            a = {},
            o = n > 0 && n < 1,
            u = isNaN(n) || o,
            l = i.axis,
            c = n,
            h = n;
        return (
            _isString(n) ? (c = h = { center: 0.5, edges: 0.5, end: 1 }[n] || 0) : !o && u && ((c = n[0]), (h = n[1])),
            function (t, e, o) {
                var p,
                    d,
                    f,
                    m,
                    g,
                    $,
                    v,
                    T,
                    y,
                    _ = (o || i).length,
                    w = a[_];
                if (!w) {
                    if (!(y = 'auto' === i.grid ? 0 : (i.grid || [1, _bigNum])[1])) {
                        for (v = -_bigNum; v < (v = o[y++].getBoundingClientRect().left) && y < _; );
                        y < _ && y--;
                    }
                    for (
                        $ = 0,
                            w = a[_] = [],
                            p = u ? Math.min(y, _) * c - 0.5 : n % y,
                            d = y === _bigNum ? 0 : u ? (_ * h) / y - 0.5 : (n / y) | 0,
                            v = 0,
                            T = _bigNum;
                        $ < _;
                        $++
                    )
                        (f = ($ % y) - p),
                            (m = d - (($ / y) | 0)),
                            (w[$] = g = l ? Math.abs('y' === l ? m : f) : _sqrt(f * f + m * m)),
                            g > v && (v = g),
                            g < T && (T = g);
                    'random' === n && shuffle(w),
                        (w.max = v - T),
                        (w.min = T),
                        (w.v = _ =
                            (parseFloat(i.amount) || parseFloat(i.each) * (y > _ ? _ - 1 : l ? ('y' === l ? _ / y : y) : Math.max(y, _ / y)) || 0) *
                            ('edges' === n ? -1 : 1)),
                        (w.b = _ < 0 ? s - _ : s),
                        (w.u = getUnit(i.amount || i.each) || 0),
                        (r = r && _ < 0 ? _invertEase(r) : r);
                }
                return (_ = (w[t] - w.min) / w.max || 0), _roundPrecise(w.b + (r ? r(_) : _) * w.v) + w.u;
            }
        );
    },
    _roundModifier = function t(e) {
        var i = Math.pow(10, ((e + '').split('.')[1] || '').length);
        return function (t) {
            var r = _roundPrecise(Math.round(parseFloat(t) / e) * e * i);
            return (r - (r % 1)) / i + (_isNumber(t) ? 0 : getUnit(t));
        };
    },
    snap = function t(e, i) {
        var r,
            n,
            s = _isArray(e);
        return (
            !s &&
                _isObject(e) &&
                ((r = s = e.radius || _bigNum), e.values ? ((e = toArray(e.values)), (n = !_isNumber(e[0])) && (r *= r)) : (e = _roundModifier(e.increment))),
            _conditionalReturn(
                i,
                s
                    ? _isFunction(e)
                        ? function (t) {
                              return Math.abs((n = e(t)) - t) <= r ? n : t;
                          }
                        : function (t) {
                              for (var i, s, a = parseFloat(n ? t.x : t), o = parseFloat(n ? t.y : 0), u = _bigNum, l = 0, c = e.length; c--; )
                                  (i = n ? (i = e[c].x - a) * i + (s = e[c].y - o) * s : Math.abs(e[c] - a)) < u && ((u = i), (l = c));
                              return (l = !r || u <= r ? e[l] : t), n || l === t || _isNumber(t) ? l : l + getUnit(t);
                          }
                    : _roundModifier(e)
            )
        );
    },
    random = function t(e, i, r, n) {
        return _conditionalReturn(_isArray(e) ? !i : !0 === r ? ((r = 0), !1) : !n, function () {
            return _isArray(e)
                ? e[~~(Math.random() * e.length)]
                : (n = (r = r || 1e-5) < 1 ? Math.pow(10, (r + '').length - 2) : 1) &&
                      Math.floor(Math.round((e - r / 2 + Math.random() * (i - e + 0.99 * r)) / r) * r * n) / n;
        });
    },
    pipe = function t() {
        for (var e = arguments.length, i = Array(e), r = 0; r < e; r++) i[r] = arguments[r];
        return function (t) {
            return i.reduce(function (t, e) {
                return e(t);
            }, t);
        };
    },
    unitize = function t(e, i) {
        return function (t) {
            return e(parseFloat(t)) + (i || getUnit(t));
        };
    },
    normalize = function t(e, i, r) {
        return mapRange(e, i, 0, 1, r);
    },
    _wrapArray = function t(e, i, r) {
        return _conditionalReturn(r, function (t) {
            return e[~~i(t)];
        });
    },
    wrap = function t(e, i, r) {
        var n = i - e;
        return _isArray(e)
            ? _wrapArray(e, t(0, e.length), i)
            : _conditionalReturn(r, function (t) {
                  return ((n + ((t - e) % n)) % n) + e;
              });
    },
    wrapYoyo = function t(e, i, r) {
        var n = i - e,
            s = 2 * n;
        return _isArray(e)
            ? _wrapArray(e, t(0, e.length - 1), i)
            : _conditionalReturn(r, function (t) {
                  return (t = (s + ((t - e) % s)) % s || 0), e + (t > n ? s - t : t);
              });
    },
    _replaceRandom = function t(e) {
        for (var i, r, n, s, a = 0, o = ''; ~(i = e.indexOf('random(', a)); )
            (n = e.indexOf(')', i)),
                (s = '[' === e.charAt(i + 7)),
                (r = e.substr(i + 7, n - i - 7).match(s ? _delimitedValueExp : _strictNumExp)),
                (o += e.substr(a, i - a) + random(s ? r : +r[0], s ? 0 : +r[1], +r[2] || 1e-5)),
                (a = n + 1);
        return o + e.substr(a, e.length - a);
    },
    mapRange = function t(e, i, r, n, s) {
        var a = i - e,
            o = n - r;
        return _conditionalReturn(s, function (t) {
            return r + (((t - e) / a) * o || 0);
        });
    },
    interpolate = function t(e, i, r, n) {
        var s = isNaN(e + i)
            ? 0
            : function (t) {
                  return (1 - t) * e + t * i;
              };
        if (!s) {
            var a,
                o,
                u,
                l,
                c,
                h = _isString(e),
                p = {};
            if ((!0 === r && (n = 1) && (r = null), h)) (e = { p: e }), (i = { p: i });
            else if (_isArray(e) && !_isArray(i)) {
                for (o = 1, u = [], c = (l = e.length) - 2; o < l; o++) u.push(t(e[o - 1], e[o]));
                l--,
                    (s = function t(e) {
                        var i = Math.min(c, ~~(e *= l));
                        return u[i](e - i);
                    }),
                    (r = i);
            } else n || (e = _merge(_isArray(e) ? [] : {}, e));
            if (!u) {
                for (a in i) _addPropTween.call(p, e, a, 'get', i[a]);
                s = function t(i) {
                    return _renderPropTweens(i, p) || (h ? e.p : e);
                };
            }
        }
        return _conditionalReturn(r, s);
    },
    _getLabelInDirection = function t(e, i, r) {
        var n,
            s,
            a,
            o = e.labels,
            u = _bigNum;
        for (n in o) (s = o[n] - i) < 0 == !!r && s && u > (s = Math.abs(s)) && ((a = n), (u = s));
        return a;
    },
    _callback = function t(e, i, r) {
        var n,
            s,
            a,
            o = e.vars,
            u = o[i],
            l = _context,
            c = e._ctx;
        if (u)
            return (
                (n = o[i + 'Params']),
                (s = o.callbackScope || e),
                r && _lazyTweens.length && _lazyRender(),
                c && (_context = c),
                (a = n ? u.apply(s, n) : u.call(s)),
                (_context = l),
                a
            );
    },
    _interrupt = function t(e) {
        return _removeFromParent(e), e.scrollTrigger && e.scrollTrigger.kill(!!_reverting), 1 > e.progress() && _callback(e, 'onInterrupt'), e;
    },
    _registerPluginQueue = [],
    _createPlugin = function t(e) {
        if (e) {
            if (((e = (!e.name && e.default) || e), _windowExists() || e.headless)) {
                var i = e.name,
                    r = _isFunction(e),
                    n =
                        i && !r && e.init
                            ? function () {
                                  this._props = [];
                              }
                            : e,
                    s = { init: _emptyFunc, render: _renderPropTweens, add: _addPropTween, kill: _killPropTweensOf, modifier: _addPluginModifier, rawVars: 0 },
                    a = { targetTest: 0, get: 0, getSetter: _getSetter, aliases: {}, register: 0 };
                if ((_wake(), e !== n)) {
                    if (_plugins[i]) return;
                    _setDefaults(n, _setDefaults(_copyExcluding(e, s), a)),
                        _merge(n.prototype, _merge(s, _copyExcluding(e, a))),
                        (_plugins[(n.prop = i)] = n),
                        e.targetTest && (_harnessPlugins.push(n), (_reservedProps[i] = 1)),
                        (i = ('css' === i ? 'CSS' : i.charAt(0).toUpperCase() + i.substr(1)) + 'Plugin');
                }
                _addGlobal(i, n), e.register && e.register(gsap, n, PropTween);
            } else _registerPluginQueue.push(e);
        }
    },
    _255 = 255,
    _colorLookup = {
        aqua: [0, _255, _255],
        lime: [0, _255, 0],
        silver: [192, 192, 192],
        black: [0, 0, 0],
        maroon: [128, 0, 0],
        teal: [0, 128, 128],
        blue: [0, 0, _255],
        navy: [0, 0, 128],
        white: [_255, _255, _255],
        olive: [128, 128, 0],
        yellow: [_255, _255, 0],
        orange: [_255, 165, 0],
        gray: [128, 128, 128],
        purple: [128, 0, 128],
        green: [0, 128, 0],
        red: [_255, 0, 0],
        pink: [_255, 192, 203],
        cyan: [0, _255, _255],
        transparent: [_255, _255, _255, 0]
    },
    _hue = function t(e, i, r) {
        return (
            ((6 * (e += e < 0 ? 1 : e > 1 ? -1 : 0) < 1 ? i + (r - i) * e * 6 : e < 0.5 ? r : 3 * e < 2 ? i + (r - i) * (2 / 3 - e) * 6 : i) * _255 + 0.5) | 0
        );
    },
    splitColor = function t(e, i, r) {
        var n,
            s,
            a,
            o,
            u,
            l,
            c,
            h,
            p,
            d,
            f = e ? (_isNumber(e) ? [e >> 16, (e >> 8) & _255, e & _255] : 0) : _colorLookup.black;
        if (!f) {
            if ((',' === e.substr(-1) && (e = e.substr(0, e.length - 1)), _colorLookup[e])) f = _colorLookup[e];
            else if ('#' === e.charAt(0)) {
                if (
                    (e.length < 6 &&
                        ((n = e.charAt(1)),
                        (e = '#' + n + n + (s = e.charAt(2)) + s + (a = e.charAt(3)) + a + (5 === e.length ? e.charAt(4) + e.charAt(4) : ''))),
                    9 === e.length)
                )
                    return [(f = parseInt(e.substr(1, 6), 16)) >> 16, (f >> 8) & _255, f & _255, parseInt(e.substr(7), 16) / 255];
                f = [(e = parseInt(e.substr(1), 16)) >> 16, (e >> 8) & _255, e & _255];
            } else if ('hsl' === e.substr(0, 3)) {
                if (((f = d = e.match(_strictNumExp)), i)) {
                    if (~e.indexOf('=')) return (f = e.match(_numExp)), r && f.length < 4 && (f[3] = 1), f;
                } else
                    (o = (+f[0] % 360) / 360),
                        (u = +f[1] / 100),
                        (s = (l = +f[2] / 100) <= 0.5 ? l * (u + 1) : l + u - l * u),
                        (n = 2 * l - s),
                        f.length > 3 && (f[3] *= 1),
                        (f[0] = _hue(o + 1 / 3, n, s)),
                        (f[1] = _hue(o, n, s)),
                        (f[2] = _hue(o - 1 / 3, n, s));
            } else f = e.match(_strictNumExp) || _colorLookup.transparent;
            f = f.map(Number);
        }
        return (
            i &&
                !d &&
                ((n = f[0] / _255),
                (l = ((c = Math.max(n, (s = f[1] / _255), (a = f[2] / _255))) + (h = Math.min(n, s, a))) / 2),
                c === h
                    ? (o = u = 0)
                    : ((p = c - h),
                      (u = l > 0.5 ? p / (2 - c - h) : p / (c + h)),
                      (o = c === n ? (s - a) / p + (s < a ? 6 : 0) : c === s ? (a - n) / p + 2 : (n - s) / p + 4),
                      (o *= 60)),
                (f[0] = ~~(o + 0.5)),
                (f[1] = ~~(100 * u + 0.5)),
                (f[2] = ~~(100 * l + 0.5))),
            r && f.length < 4 && (f[3] = 1),
            f
        );
    },
    _colorOrderData = function t(e) {
        var i = [],
            r = [],
            n = -1;
        return (
            e.split(_colorExp).forEach(function (t) {
                var e = t.match(_numWithUnitExp) || [];
                i.push.apply(i, e), r.push((n += e.length + 1));
            }),
            (i.c = r),
            i
        );
    },
    _formatColors = function t(e, i, r) {
        var n,
            s,
            a,
            o,
            u = '',
            l = (e + u).match(_colorExp),
            c = i ? 'hsla(' : 'rgba(',
            h = 0;
        if (!l) return e;
        if (
            ((l = l.map(function (t) {
                return (t = splitColor(t, i, 1)) && c + (i ? t[0] + ',' + t[1] + '%,' + t[2] + '%,' + t[3] : t.join(',')) + ')';
            })),
            r && ((a = _colorOrderData(e)), (n = r.c).join(u) !== a.c.join(u)))
        )
            for (o = (s = e.replace(_colorExp, '1').split(_numWithUnitExp)).length - 1; h < o; h++)
                u += s[h] + (~n.indexOf(h) ? l.shift() || c + '0,0,0,0)' : (a.length ? a : l.length ? l : r).shift());
        if (!s) for (o = (s = e.split(_colorExp)).length - 1; h < o; h++) u += s[h] + l[h];
        return u + s[o];
    },
    _colorExp = (function () {
        var t,
            e = '(?:\\b(?:(?:rgb|rgba|hsl|hsla)\\(.+?\\))|\\B#(?:[0-9a-f]{3,4}){1,2}\\b';
        for (t in _colorLookup) e += '|' + t + '\\b';
        return RegExp(e + ')', 'gi');
    })(),
    _hslExp = /hsl[a]?\(/,
    _colorStringFilter = function t(e) {
        var i,
            r = e.join(' ');
        if (((_colorExp.lastIndex = 0), _colorExp.test(r)))
            return (i = _hslExp.test(r)), (e[1] = _formatColors(e[1], i)), (e[0] = _formatColors(e[0], i, _colorOrderData(e[1]))), !0;
    },
    _ticker = (function () {
        var t,
            e,
            i,
            r,
            n,
            s,
            a = Date.now,
            o = 500,
            u = 33,
            l = a(),
            c = l,
            h = 1e3 / 240,
            p = h,
            d = [],
            f = function i(f) {
                var m,
                    g,
                    $,
                    v,
                    T = a() - c,
                    y = !0 === f;
                if (
                    ((T > o || T < 0) && (l += T - u),
                    (c += T),
                    ((m = ($ = c - l) - p) > 0 || y) &&
                        ((v = ++r.frame), (n = $ - 1e3 * r.time), (r.time = $ /= 1e3), (p += m + (m >= h ? 4 : h - m)), (g = 1)),
                    y || (t = e(i)),
                    g)
                )
                    for (s = 0; s < d.length; s++) d[s]($, n, v, f);
            };
        return (r = {
            time: 0,
            frame: 0,
            tick: function t() {
                f(!0);
            },
            deltaRatio: function t(e) {
                return n / (1e3 / (e || 60));
            },
            wake: function n() {
                _coreReady &&
                    (!_coreInitted &&
                        _windowExists() &&
                        ((_doc = (_win = _coreInitted = window).document || {}),
                        (_globals.gsap = gsap),
                        (_win.gsapVersions || (_win.gsapVersions = [])).push(gsap.version),
                        _install(_installScope || _win.GreenSockGlobals || (!_win.gsap && _win) || {}),
                        _registerPluginQueue.forEach(_createPlugin)),
                    (i = 'undefined' != typeof requestAnimationFrame && requestAnimationFrame),
                    t && r.sleep(),
                    (e =
                        i ||
                        function (t) {
                            return setTimeout(t, (p - 1e3 * r.time + 1) | 0);
                        }),
                    (_tickerActive = 1),
                    f(2));
            },
            sleep: function r() {
                (i ? cancelAnimationFrame : clearTimeout)(t), (_tickerActive = 0), (e = _emptyFunc);
            },
            lagSmoothing: function t(e, i) {
                u = Math.min(i || 33, (o = e || 1 / 0));
            },
            fps: function t(e) {
                (h = 1e3 / (e || 240)), (p = 1e3 * r.time + h);
            },
            add: function t(e, i, n) {
                var s = i
                    ? function (t, i, n, a) {
                          e(t, i, n, a), r.remove(s);
                      }
                    : e;
                return r.remove(e), d[n ? 'unshift' : 'push'](s), _wake(), s;
            },
            remove: function t(e, i) {
                ~(i = d.indexOf(e)) && d.splice(i, 1) && s >= i && s--;
            },
            _listeners: d
        });
    })(),
    _wake = function t() {
        return !_tickerActive && _ticker.wake();
    },
    _easeMap = {},
    _customEaseExp = /^[\d.\-M][\d.\-,\s]/,
    _quotesExp = /["']/g,
    _parseObjectInString = function t(e) {
        for (var i, r, n, s = {}, a = e.substr(1, e.length - 3).split(':'), o = a[0], u = 1, l = a.length; u < l; u++)
            (r = a[u]),
                (i = u !== l - 1 ? r.lastIndexOf(',') : r.length),
                (n = r.substr(0, i)),
                (s[o] = isNaN(n) ? n.replace(_quotesExp, '').trim() : +n),
                (o = r.substr(i + 1).trim());
        return s;
    },
    _valueInParentheses = function t(e) {
        var i = e.indexOf('(') + 1,
            r = e.indexOf(')'),
            n = e.indexOf('(', i);
        return e.substring(i, ~n && n < r ? e.indexOf(')', r + 1) : r);
    },
    _configEaseFromString = function t(e) {
        var i = (e + '').split('('),
            r = _easeMap[i[0]];
        return r && i.length > 1 && r.config
            ? r.config.apply(null, ~e.indexOf('{') ? [_parseObjectInString(i[1])] : _valueInParentheses(e).split(',').map(_numericIfPossible))
            : _easeMap._CE && _customEaseExp.test(e)
              ? _easeMap._CE('', e)
              : r;
    },
    _invertEase = function t(e) {
        return function (t) {
            return 1 - e(1 - t);
        };
    },
    _propagateYoyoEase = function t(e, i) {
        for (var r, n = e._first; n; )
            n instanceof Timeline
                ? t(n, i)
                : !n.vars.yoyoEase ||
                  (n._yoyo && n._repeat) ||
                  n._yoyo === i ||
                  (n.timeline ? t(n.timeline, i) : ((r = n._ease), (n._ease = n._yEase), (n._yEase = r), (n._yoyo = i))),
                (n = n._next);
    },
    _parseEase = function t(e, i) {
        return (e && (_isFunction(e) ? e : _easeMap[e] || _configEaseFromString(e))) || i;
    },
    _insertEase = function t(e, i, r, n) {
        void 0 === r &&
            (r = function t(e) {
                return 1 - i(1 - e);
            }),
            void 0 === n &&
                (n = function t(e) {
                    return e < 0.5 ? i(2 * e) / 2 : 1 - i((1 - e) * 2) / 2;
                });
        var s,
            a = { easeIn: i, easeOut: r, easeInOut: n };
        return (
            _forEachName(e, function (t) {
                for (var e in ((_easeMap[t] = _globals[t] = a), (_easeMap[(s = t.toLowerCase())] = r), a))
                    _easeMap[s + ('easeIn' === e ? '.in' : 'easeOut' === e ? '.out' : '.inOut')] = _easeMap[t + '.' + e] = a[e];
            }),
            a
        );
    },
    _easeInOutFromOut = function t(e) {
        return function (t) {
            return t < 0.5 ? (1 - e(1 - 2 * t)) / 2 : 0.5 + e((t - 0.5) * 2) / 2;
        };
    },
    _configElastic = function t(e, i, r) {
        var n = i >= 1 ? i : 1,
            s = (r || (e ? 0.3 : 0.45)) / (i < 1 ? i : 1),
            a = (s / _2PI) * (Math.asin(1 / n) || 0),
            o = function t(e) {
                return 1 === e ? 1 : n * Math.pow(2, -10 * e) * _sin((e - a) * s) + 1;
            },
            u =
                'out' === e
                    ? o
                    : 'in' === e
                      ? function (t) {
                            return 1 - o(1 - t);
                        }
                      : _easeInOutFromOut(o);
        return (
            (s = _2PI / s),
            (u.config = function (i, r) {
                return t(e, i, r);
            }),
            u
        );
    },
    _configBack = function t(e, i) {
        void 0 === i && (i = 1.70158);
        var r = function t(e) {
                return e ? --e * e * ((i + 1) * e + i) + 1 : 0;
            },
            n =
                'out' === e
                    ? r
                    : 'in' === e
                      ? function (t) {
                            return 1 - r(1 - t);
                        }
                      : _easeInOutFromOut(r);
        return (
            (n.config = function (i) {
                return t(e, i);
            }),
            n
        );
    };
_forEachName('Linear,Quad,Cubic,Quart,Quint,Strong', function (t, e) {
    var i = e < 5 ? e + 1 : e;
    _insertEase(
        t + ',Power' + (i - 1),
        e
            ? function (t) {
                  return Math.pow(t, i);
              }
            : function (t) {
                  return t;
              },
        function (t) {
            return 1 - Math.pow(1 - t, i);
        },
        function (t) {
            return t < 0.5 ? Math.pow(2 * t, i) / 2 : 1 - Math.pow((1 - t) * 2, i) / 2;
        }
    );
}),
    (_easeMap.Linear.easeNone = _easeMap.none = _easeMap.Linear.easeIn),
    _insertEase('Elastic', _configElastic('in'), _configElastic('out'), _configElastic()),
    (function (t, e) {
        var i = 1 / e,
            r = 2 * i,
            n = 2.5 * i,
            s = function s(a) {
                return a < i
                    ? t * a * a
                    : a < r
                      ? t * Math.pow(a - 1.5 / e, 2) + 0.75
                      : a < n
                        ? t * (a -= 2.25 / e) * a + 0.9375
                        : t * Math.pow(a - 2.625 / e, 2) + 0.984375;
            };
        _insertEase(
            'Bounce',
            function (t) {
                return 1 - s(1 - t);
            },
            s
        );
    })(7.5625, 2.75),
    _insertEase('Expo', function (t) {
        return t ? Math.pow(2, 10 * (t - 1)) : 0;
    }),
    _insertEase('Circ', function (t) {
        return -(_sqrt(1 - t * t) - 1);
    }),
    _insertEase('Sine', function (t) {
        return 1 === t ? 1 : -_cos(t * _HALF_PI) + 1;
    }),
    _insertEase('Back', _configBack('in'), _configBack('out'), _configBack()),
    (_easeMap.SteppedEase =
        _easeMap.steps =
        _globals.SteppedEase =
            {
                config: function t(e, i) {
                    void 0 === e && (e = 1);
                    var r = 1 / e,
                        n = e + (i ? 0 : 1),
                        s = i ? 1 : 0,
                        a = 1 - _tinyNum;
                    return function (t) {
                        return (((n * _clamp(0, a, t)) | 0) + s) * r;
                    };
                }
            }),
    (_defaults.ease = _easeMap['quad.out']),
    _forEachName('onComplete,onUpdate,onStart,onRepeat,onReverseComplete,onInterrupt', function (t) {
        return (_callbackNames += t + ',' + t + 'Params,');
    });
export var GSCache = function t(e, i) {
    (this.id = _gsID++),
        (e._gsap = this),
        (this.target = e),
        (this.harness = i),
        (this.get = i ? i.get : _getProperty),
        (this.set = i ? i.getSetter : _getSetter);
};
export var Animation = (function () {
    function t(t) {
        (this.vars = t),
            (this._delay = +t.delay || 0),
            (this._repeat = t.repeat === 1 / 0 ? -2 : t.repeat || 0) && ((this._rDelay = t.repeatDelay || 0), (this._yoyo = !!t.yoyo || !!t.yoyoEase)),
            (this._ts = 1),
            _setDuration(this, +t.duration, 1, 1),
            (this.data = t.data),
            _context && ((this._ctx = _context), _context.data.push(this)),
            _tickerActive || _ticker.wake();
    }
    var e = t.prototype;
    return (
        (e.delay = function t(e) {
            return e || 0 === e
                ? (this.parent && this.parent.smoothChildTiming && this.startTime(this._start + e - this._delay), (this._delay = e), this)
                : this._delay;
        }),
        (e.duration = function t(e) {
            return arguments.length ? this.totalDuration(this._repeat > 0 ? e + (e + this._rDelay) * this._repeat : e) : this.totalDuration() && this._dur;
        }),
        (e.totalDuration = function t(e) {
            return arguments.length
                ? ((this._dirty = 0), _setDuration(this, this._repeat < 0 ? e : (e - this._repeat * this._rDelay) / (this._repeat + 1)))
                : this._tDur;
        }),
        (e.totalTime = function t(e, i) {
            if ((_wake(), !arguments.length)) return this._tTime;
            var r = this._dp;
            if (r && r.smoothChildTiming && this._ts) {
                for (_alignPlayhead(this, e), !r._dp || r.parent || _postAddChecks(r, this); r && r.parent; )
                    r.parent._time !== r._start + (r._ts >= 0 ? r._tTime / r._ts : -((r.totalDuration() - r._tTime) / r._ts)) && r.totalTime(r._tTime, !0),
                        (r = r.parent);
                !this.parent &&
                    this._dp.autoRemoveChildren &&
                    ((this._ts > 0 && e < this._tDur) || (this._ts < 0 && e > 0) || (!this._tDur && !e)) &&
                    _addToTimeline(this._dp, this, this._start - this._delay);
            }
            return (
                (this._tTime === e &&
                    (this._dur || i) &&
                    (!this._initted || Math.abs(this._zTime) !== _tinyNum) &&
                    (e || this._initted || (!this.add && !this._ptLookup))) ||
                    (this._ts || (this._pTime = e), _lazySafeRender(this, e, i)),
                this
            );
        }),
        (e.time = function t(e, i) {
            return arguments.length
                ? this.totalTime(Math.min(this.totalDuration(), e + _elapsedCycleDuration(this)) % (this._dur + this._rDelay) || (e ? this._dur : 0), i)
                : this._time;
        }),
        (e.totalProgress = function t(e, i) {
            return arguments.length
                ? this.totalTime(this.totalDuration() * e, i)
                : this.totalDuration()
                  ? Math.min(1, this._tTime / this._tDur)
                  : this.rawTime() > 0
                    ? 1
                    : 0;
        }),
        (e.progress = function t(e, i) {
            return arguments.length
                ? this.totalTime(this.duration() * (this._yoyo && !(1 & this.iteration()) ? 1 - e : e) + _elapsedCycleDuration(this), i)
                : this.duration()
                  ? Math.min(1, this._time / this._dur)
                  : this.rawTime() > 0
                    ? 1
                    : 0;
        }),
        (e.iteration = function t(e, i) {
            var r = this.duration() + this._rDelay;
            return arguments.length ? this.totalTime(this._time + (e - 1) * r, i) : this._repeat ? _animationCycle(this._tTime, r) + 1 : 1;
        }),
        (e.timeScale = function t(e, i) {
            if (!arguments.length) return this._rts === -_tinyNum ? 0 : this._rts;
            if (this._rts === e) return this;
            var r = this.parent && this._ts ? _parentToChildTotalTime(this.parent._time, this) : this._tTime;
            return (
                (this._rts = +e || 0),
                (this._ts = this._ps || e === -_tinyNum ? 0 : this._rts),
                this.totalTime(_clamp(-Math.abs(this._delay), this._tDur, r), !1 !== i),
                _setEnd(this),
                _recacheAncestors(this)
            );
        }),
        (e.paused = function t(e) {
            return arguments.length
                ? (this._ps !== e &&
                      ((this._ps = e),
                      e
                          ? ((this._pTime = this._tTime || Math.max(-this._delay, this.rawTime())), (this._ts = this._act = 0))
                          : (_wake(),
                            (this._ts = this._rts),
                            this.totalTime(
                                this.parent && !this.parent.smoothChildTiming ? this.rawTime() : this._tTime || this._pTime,
                                1 === this.progress() && Math.abs(this._zTime) !== _tinyNum && (this._tTime -= _tinyNum)
                            ))),
                  this)
                : this._ps;
        }),
        (e.startTime = function t(e) {
            if (arguments.length) {
                this._start = e;
                var i = this.parent || this._dp;
                return i && (i._sort || !this.parent) && _addToTimeline(i, this, e - this._delay), this;
            }
            return this._start;
        }),
        (e.endTime = function t(e) {
            return this._start + (_isNotFalse(e) ? this.totalDuration() : this.duration()) / Math.abs(this._ts || 1);
        }),
        (e.rawTime = function t(e) {
            var i = this.parent || this._dp;
            return i
                ? e && (!this._ts || (this._repeat && this._time && 1 > this.totalProgress()))
                    ? this._tTime % (this._dur + this._rDelay)
                    : this._ts
                      ? _parentToChildTotalTime(i.rawTime(e), this)
                      : this._tTime
                : this._tTime;
        }),
        (e.revert = function t(e) {
            void 0 === e && (e = _revertConfig);
            var i = _reverting;
            return (
                (_reverting = e),
                (this._initted || this._startAt) && (this.timeline && this.timeline.revert(e), this.totalTime(-0.01, e.suppressEvents)),
                'nested' !== this.data && !1 !== e.kill && this.kill(),
                (_reverting = i),
                this
            );
        }),
        (e.globalTime = function t(e) {
            for (var i = this, r = arguments.length ? e : i.rawTime(); i; ) (r = i._start + r / (Math.abs(i._ts) || 1)), (i = i._dp);
            return !this.parent && this._sat ? this._sat.globalTime(e) : r;
        }),
        (e.repeat = function t(e) {
            return arguments.length ? ((this._repeat = e === 1 / 0 ? -2 : e), _onUpdateTotalDuration(this)) : -2 === this._repeat ? 1 / 0 : this._repeat;
        }),
        (e.repeatDelay = function t(e) {
            if (arguments.length) {
                var i = this._time;
                return (this._rDelay = e), _onUpdateTotalDuration(this), i ? this.time(i) : this;
            }
            return this._rDelay;
        }),
        (e.yoyo = function t(e) {
            return arguments.length ? ((this._yoyo = e), this) : this._yoyo;
        }),
        (e.seek = function t(e, i) {
            return this.totalTime(_parsePosition(this, e), _isNotFalse(i));
        }),
        (e.restart = function t(e, i) {
            return this.play().totalTime(e ? -this._delay : 0, _isNotFalse(i));
        }),
        (e.play = function t(e, i) {
            return null != e && this.seek(e, i), this.reversed(!1).paused(!1);
        }),
        (e.reverse = function t(e, i) {
            return null != e && this.seek(e || this.totalDuration(), i), this.reversed(!0).paused(!1);
        }),
        (e.pause = function t(e, i) {
            return null != e && this.seek(e, i), this.paused(!0);
        }),
        (e.resume = function t() {
            return this.paused(!1);
        }),
        (e.reversed = function t(e) {
            return arguments.length ? (!!e !== this.reversed() && this.timeScale(-this._rts || (e ? -_tinyNum : 0)), this) : this._rts < 0;
        }),
        (e.invalidate = function t() {
            return (this._initted = this._act = 0), (this._zTime = -_tinyNum), this;
        }),
        (e.isActive = function t() {
            var e,
                i = this.parent || this._dp,
                r = this._start;
            return !!(!i || (this._ts && this._initted && i.isActive() && (e = i.rawTime(!0)) >= r && e < this.endTime(!0) - _tinyNum));
        }),
        (e.eventCallback = function t(e, i, r) {
            var n = this.vars;
            return arguments.length > 1 ? (i ? ((n[e] = i), r && (n[e + 'Params'] = r), 'onUpdate' === e && (this._onUpdate = i)) : delete n[e], this) : n[e];
        }),
        (e.then = function t(e) {
            var i = this;
            return new Promise(function (t) {
                var r = _isFunction(e) ? e : _passThrough,
                    n = function e() {
                        var n = i.then;
                        (i.then = null), _isFunction(r) && (r = r(i)) && (r.then || r === i) && (i.then = n), t(r), (i.then = n);
                    };
                (i._initted && 1 === i.totalProgress() && i._ts >= 0) || (!i._tTime && i._ts < 0) ? n() : (i._prom = n);
            });
        }),
        (e.kill = function t() {
            _interrupt(this);
        }),
        t
    );
})();
_setDefaults(Animation.prototype, {
    _time: 0,
    _start: 0,
    _end: 0,
    _tTime: 0,
    _tDur: 0,
    _dirty: 0,
    _repeat: 0,
    _yoyo: !1,
    parent: null,
    _initted: !1,
    _rDelay: 0,
    _ts: 1,
    _dp: 0,
    ratio: 0,
    _zTime: -_tinyNum,
    _prom: 0,
    _ps: !1,
    _rts: 1
});
export var Timeline = (function (t) {
    function e(e, i) {
        var r;
        return (
            void 0 === e && (e = {}),
            ((r = t.call(this, e) || this).labels = {}),
            (r.smoothChildTiming = !!e.smoothChildTiming),
            (r.autoRemoveChildren = !!e.autoRemoveChildren),
            (r._sort = _isNotFalse(e.sortChildren)),
            _globalTimeline && _addToTimeline(e.parent || _globalTimeline, _assertThisInitialized(r), i),
            e.reversed && r.reverse(),
            e.paused && r.paused(!0),
            e.scrollTrigger && _scrollTrigger(_assertThisInitialized(r), e.scrollTrigger),
            r
        );
    }
    _inheritsLoose(e, t);
    var i = e.prototype;
    return (
        (i.to = function t(e, i, r) {
            return _createTweenType(0, arguments, this), this;
        }),
        (i.from = function t(e, i, r) {
            return _createTweenType(1, arguments, this), this;
        }),
        (i.fromTo = function t(e, i, r, n) {
            return _createTweenType(2, arguments, this), this;
        }),
        (i.set = function t(e, i, r) {
            return (
                (i.duration = 0),
                (i.parent = this),
                _inheritDefaults(i).repeatDelay || (i.repeat = 0),
                (i.immediateRender = !!i.immediateRender),
                new Tween(e, i, _parsePosition(this, r), 1),
                this
            );
        }),
        (i.call = function t(e, i, r) {
            return _addToTimeline(this, Tween.delayedCall(0, e, i), r);
        }),
        (i.staggerTo = function t(e, i, r, n, s, a, o) {
            return (
                (r.duration = i),
                (r.stagger = r.stagger || n),
                (r.onComplete = a),
                (r.onCompleteParams = o),
                (r.parent = this),
                new Tween(e, r, _parsePosition(this, s)),
                this
            );
        }),
        (i.staggerFrom = function t(e, i, r, n, s, a, o) {
            return (r.runBackwards = 1), (_inheritDefaults(r).immediateRender = _isNotFalse(r.immediateRender)), this.staggerTo(e, i, r, n, s, a, o);
        }),
        (i.staggerFromTo = function t(e, i, r, n, s, a, o, u) {
            return (n.startAt = r), (_inheritDefaults(n).immediateRender = _isNotFalse(n.immediateRender)), this.staggerTo(e, i, n, s, a, o, u);
        }),
        (i.render = function t(e, i, r) {
            var n,
                s,
                a,
                o,
                u,
                l,
                c,
                h,
                p,
                d,
                f,
                m,
                g = this._time,
                $ = this._dirty ? this.totalDuration() : this._tDur,
                v = this._dur,
                T = e <= 0 ? 0 : _roundPrecise(e),
                y = this._zTime < 0 != e < 0 && (this._initted || !v);
            if ((this !== _globalTimeline && T > $ && e >= 0 && (T = $), T !== this._tTime || r || y)) {
                if (
                    (g !== this._time && v && ((T += this._time - g), (e += this._time - g)),
                    (n = T),
                    (p = this._start),
                    (l = !(h = this._ts)),
                    y && (v || (g = this._zTime), (e || !i) && (this._zTime = e)),
                    this._repeat)
                ) {
                    if (((f = this._yoyo), (u = v + this._rDelay), this._repeat < -1 && e < 0)) return this.totalTime(100 * u + e, i, r);
                    if (
                        ((n = _roundPrecise(T % u)),
                        T === $ ? ((o = this._repeat), (n = v)) : ((o = ~~(T / u)) && o === T / u && ((n = v), o--), n > v && (n = v)),
                        (d = _animationCycle(this._tTime, u)),
                        !g && this._tTime && d !== o && this._tTime - d * u - this._dur <= 0 && (d = o),
                        f && 1 & o && ((n = v - n), (m = 1)),
                        o !== d && !this._lock)
                    ) {
                        var _ = f && 1 & d,
                            w = _ === (f && 1 & o);
                        if (
                            (o < d && (_ = !_),
                            (g = _ ? 0 : T % v ? v : T),
                            (this._lock = 1),
                            (this.render(g || (m ? 0 : _roundPrecise(o * u)), i, !v)._lock = 0),
                            (this._tTime = T),
                            !i && this.parent && _callback(this, 'onRepeat'),
                            this.vars.repeatRefresh && !m && (this.invalidate()._lock = 1),
                            (g && g !== this._time) ||
                                !this._ts !== l ||
                                (this.vars.onRepeat && !this.parent && !this._act) ||
                                ((v = this._dur),
                                ($ = this._tDur),
                                w && ((this._lock = 2), (g = _ ? v : -0.0001), this.render(g, !0), this.vars.repeatRefresh && !m && this.invalidate()),
                                (this._lock = 0),
                                !this._ts && !l))
                        )
                            return this;
                        _propagateYoyoEase(this, m);
                    }
                }
                if (
                    (this._hasPause &&
                        !this._forcing &&
                        this._lock < 2 &&
                        (c = _findNextPauseTween(this, _roundPrecise(g), _roundPrecise(n))) &&
                        (T -= n - (n = c._start)),
                    (this._tTime = T),
                    (this._time = n),
                    (this._act = !h),
                    this._initted || ((this._onUpdate = this.vars.onUpdate), (this._initted = 1), (this._zTime = e), (g = 0)),
                    !g && n && !i && !o && (_callback(this, 'onStart'), this._tTime !== T))
                )
                    return this;
                if (n >= g && e >= 0)
                    for (s = this._first; s; ) {
                        if (((a = s._next), (s._act || n >= s._start) && s._ts && c !== s)) {
                            if (s.parent !== this) return this.render(e, i, r);
                            if (
                                (s.render(s._ts > 0 ? (n - s._start) * s._ts : (s._dirty ? s.totalDuration() : s._tDur) + (n - s._start) * s._ts, i, r),
                                n !== this._time || (!this._ts && !l))
                            ) {
                                (c = 0), a && (T += this._zTime = -_tinyNum);
                                break;
                            }
                        }
                        s = a;
                    }
                else {
                    s = this._last;
                    for (var b = e < 0 ? e : n; s; ) {
                        if (((a = s._prev), (s._act || b <= s._end) && s._ts && c !== s)) {
                            if (s.parent !== this) return this.render(e, i, r);
                            if (
                                (s.render(
                                    s._ts > 0 ? (b - s._start) * s._ts : (s._dirty ? s.totalDuration() : s._tDur) + (b - s._start) * s._ts,
                                    i,
                                    r || (_reverting && (s._initted || s._startAt))
                                ),
                                n !== this._time || (!this._ts && !l))
                            ) {
                                (c = 0), a && (T += this._zTime = b ? -_tinyNum : _tinyNum);
                                break;
                            }
                        }
                        s = a;
                    }
                }
                if (c && !i && (this.pause(), (c.render(n >= g ? 0 : -_tinyNum)._zTime = n >= g ? 1 : -1), this._ts))
                    return (this._start = p), _setEnd(this), this.render(e, i, r);
                this._onUpdate && !i && _callback(this, 'onUpdate', !0),
                    ((T === $ && this._tTime >= this.totalDuration()) || (!T && g)) &&
                        (p === this._start || Math.abs(h) !== Math.abs(this._ts)) &&
                        !this._lock &&
                        ((e || !v) && ((T === $ && this._ts > 0) || (!T && this._ts < 0)) && _removeFromParent(this, 1),
                        i ||
                            (e < 0 && !g) ||
                            (!T && !g && $) ||
                            (_callback(this, T === $ && e >= 0 ? 'onComplete' : 'onReverseComplete', !0),
                            this._prom && !(T < $ && this.timeScale() > 0) && this._prom()));
            }
            return this;
        }),
        (i.add = function t(e, i) {
            var r = this;
            if ((_isNumber(i) || (i = _parsePosition(this, i, e)), !(e instanceof Animation))) {
                if (_isArray(e))
                    return (
                        e.forEach(function (t) {
                            return r.add(t, i);
                        }),
                        this
                    );
                if (_isString(e)) return this.addLabel(e, i);
                if (!_isFunction(e)) return this;
                e = Tween.delayedCall(0, e);
            }
            return this !== e ? _addToTimeline(this, e, i) : this;
        }),
        (i.getChildren = function t(e, i, r, n) {
            void 0 === e && (e = !0), void 0 === i && (i = !0), void 0 === r && (r = !0), void 0 === n && (n = -_bigNum);
            for (var s = [], a = this._first; a; )
                a._start >= n && (a instanceof Tween ? i && s.push(a) : (r && s.push(a), e && s.push.apply(s, a.getChildren(!0, i, r)))), (a = a._next);
            return s;
        }),
        (i.getById = function t(e) {
            for (var i = this.getChildren(1, 1, 1), r = i.length; r--; ) if (i[r].vars.id === e) return i[r];
        }),
        (i.remove = function t(e) {
            return _isString(e)
                ? this.removeLabel(e)
                : _isFunction(e)
                  ? this.killTweensOf(e)
                  : (_removeLinkedListItem(this, e), e === this._recent && (this._recent = this._last), _uncache(this));
        }),
        (i.totalTime = function e(i, r) {
            return arguments.length
                ? ((this._forcing = 1),
                  !this._dp &&
                      this._ts &&
                      (this._start = _roundPrecise(_ticker.time - (this._ts > 0 ? i / this._ts : -((this.totalDuration() - i) / this._ts)))),
                  t.prototype.totalTime.call(this, i, r),
                  (this._forcing = 0),
                  this)
                : this._tTime;
        }),
        (i.addLabel = function t(e, i) {
            return (this.labels[e] = _parsePosition(this, i)), this;
        }),
        (i.removeLabel = function t(e) {
            return delete this.labels[e], this;
        }),
        (i.addPause = function t(e, i, r) {
            var n = Tween.delayedCall(0, i || _emptyFunc, r);
            return (n.data = 'isPause'), (this._hasPause = 1), _addToTimeline(this, n, _parsePosition(this, e));
        }),
        (i.removePause = function t(e) {
            var i = this._first;
            for (e = _parsePosition(this, e); i; ) i._start === e && 'isPause' === i.data && _removeFromParent(i), (i = i._next);
        }),
        (i.killTweensOf = function t(e, i, r) {
            for (var n = this.getTweensOf(e, r), s = n.length; s--; ) _overwritingTween !== n[s] && n[s].kill(e, i);
            return this;
        }),
        (i.getTweensOf = function t(e, i) {
            for (var r, n = [], s = toArray(e), a = this._first, o = _isNumber(i); a; )
                a instanceof Tween
                    ? _arrayContainsAny(a._targets, s) &&
                      (o ? (!_overwritingTween || (a._initted && a._ts)) && a.globalTime(0) <= i && a.globalTime(a.totalDuration()) > i : !i || a.isActive()) &&
                      n.push(a)
                    : (r = a.getTweensOf(s, i)).length && n.push.apply(n, r),
                    (a = a._next);
            return n;
        }),
        (i.tweenTo = function t(e, i) {
            i = i || {};
            var r,
                n = this,
                s = _parsePosition(n, e),
                a = i,
                o = a.startAt,
                u = a.onStart,
                l = a.onStartParams,
                c = a.immediateRender,
                h = Tween.to(
                    n,
                    _setDefaults(
                        {
                            ease: i.ease || 'none',
                            lazy: !1,
                            immediateRender: !1,
                            time: s,
                            overwrite: 'auto',
                            duration: i.duration || Math.abs((s - (o && 'time' in o ? o.time : n._time)) / n.timeScale()) || _tinyNum,
                            onStart: function t() {
                                if ((n.pause(), !r)) {
                                    var e = i.duration || Math.abs((s - (o && 'time' in o ? o.time : n._time)) / n.timeScale());
                                    h._dur !== e && _setDuration(h, e, 0, 1).render(h._time, !0, !0), (r = 1);
                                }
                                u && u.apply(h, l || []);
                            }
                        },
                        i
                    )
                );
            return c ? h.render(0) : h;
        }),
        (i.tweenFromTo = function t(e, i, r) {
            return this.tweenTo(i, _setDefaults({ startAt: { time: _parsePosition(this, e) } }, r));
        }),
        (i.recent = function t() {
            return this._recent;
        }),
        (i.nextLabel = function t(e) {
            return void 0 === e && (e = this._time), _getLabelInDirection(this, _parsePosition(this, e));
        }),
        (i.previousLabel = function t(e) {
            return void 0 === e && (e = this._time), _getLabelInDirection(this, _parsePosition(this, e), 1);
        }),
        (i.currentLabel = function t(e) {
            return arguments.length ? this.seek(e, !0) : this.previousLabel(this._time + _tinyNum);
        }),
        (i.shiftChildren = function t(e, i, r) {
            void 0 === r && (r = 0);
            for (var n, s = this._first, a = this.labels; s; ) s._start >= r && ((s._start += e), (s._end += e)), (s = s._next);
            if (i) for (n in a) a[n] >= r && (a[n] += e);
            return _uncache(this);
        }),
        (i.invalidate = function e(i) {
            var r = this._first;
            for (this._lock = 0; r; ) r.invalidate(i), (r = r._next);
            return t.prototype.invalidate.call(this, i);
        }),
        (i.clear = function t(e) {
            void 0 === e && (e = !0);
            for (var i, r = this._first; r; ) (i = r._next), this.remove(r), (r = i);
            return this._dp && (this._time = this._tTime = this._pTime = 0), e && (this.labels = {}), _uncache(this);
        }),
        (i.totalDuration = function t(e) {
            var i,
                r,
                n,
                s = 0,
                a = this,
                o = a._last,
                u = _bigNum;
            if (arguments.length) return a.timeScale((a._repeat < 0 ? a.duration() : a.totalDuration()) / (a.reversed() ? -e : e));
            if (a._dirty) {
                for (n = a.parent; o; )
                    (i = o._prev),
                        o._dirty && o.totalDuration(),
                        (r = o._start) > u && a._sort && o._ts && !a._lock ? ((a._lock = 1), (_addToTimeline(a, o, r - o._delay, 1)._lock = 0)) : (u = r),
                        r < 0 &&
                            o._ts &&
                            ((s -= r),
                            ((!n && !a._dp) || (n && n.smoothChildTiming)) && ((a._start += r / a._ts), (a._time -= r), (a._tTime -= r)),
                            a.shiftChildren(-r, !1, -Infinity),
                            (u = 0)),
                        o._end > s && o._ts && (s = o._end),
                        (o = i);
                _setDuration(a, a === _globalTimeline && a._time > s ? a._time : s, 1, 1), (a._dirty = 0);
            }
            return a._tDur;
        }),
        (e.updateRoot = function t(e) {
            if (
                (_globalTimeline._ts && (_lazySafeRender(_globalTimeline, _parentToChildTotalTime(e, _globalTimeline)), (_lastRenderedFrame = _ticker.frame)),
                _ticker.frame >= _nextGCFrame)
            ) {
                _nextGCFrame += _config.autoSleep || 120;
                var i = _globalTimeline._first;
                if ((!i || !i._ts) && _config.autoSleep && _ticker._listeners.length < 2) {
                    for (; i && !i._ts; ) i = i._next;
                    i || _ticker.sleep();
                }
            }
        }),
        e
    );
})(Animation);
_setDefaults(Timeline.prototype, { _lock: 0, _hasPause: 0, _forcing: 0 });
var _overwritingTween,
    _forceAllPropTweens,
    _addComplexStringPropTween = function t(e, i, r, n, s, a, o) {
        var u,
            l,
            c,
            h,
            p,
            d,
            f,
            m,
            g = new PropTween(this._pt, e, i, 0, 1, _renderComplexString, null, s),
            $ = 0,
            v = 0;
        for (
            g.b = r,
                g.e = n,
                r += '',
                n += '',
                (f = ~n.indexOf('random(')) && (n = _replaceRandom(n)),
                a && (a((m = [r, n]), e, i), (r = m[0]), (n = m[1])),
                l = r.match(_complexStringNumExp) || [];
            (u = _complexStringNumExp.exec(n));

        )
            (h = u[0]),
                (p = n.substring($, u.index)),
                c ? (c = (c + 1) % 5) : 'rgba(' === p.substr(-5) && (c = 1),
                h !== l[v++] &&
                    ((d = parseFloat(l[v - 1]) || 0),
                    (g._pt = {
                        _next: g._pt,
                        p: p || 1 === v ? p : ',',
                        s: d,
                        c: '=' === h.charAt(1) ? _parseRelative(d, h) - d : parseFloat(h) - d,
                        m: c && c < 4 ? Math.round : 0
                    }),
                    ($ = _complexStringNumExp.lastIndex));
        return (g.c = $ < n.length ? n.substring($, n.length) : ''), (g.fp = o), (_relExp.test(n) || f) && (g.e = 0), (this._pt = g), g;
    },
    _addPropTween = function t(e, i, r, n, s, a, o, u, l, c) {
        _isFunction(n) && (n = n(s || 0, e, a));
        var h,
            p = e[i],
            d = 'get' !== r ? r : _isFunction(p) ? (l ? e[i.indexOf('set') || !_isFunction(e['get' + i.substr(3)]) ? i : 'get' + i.substr(3)](l) : e[i]()) : p,
            f = _isFunction(p) ? (l ? _setterFuncWithParam : _setterFunc) : _setterPlain;
        if (
            (_isString(n) &&
                (~n.indexOf('random(') && (n = _replaceRandom(n)),
                '=' === n.charAt(1) && ((h = _parseRelative(d, n) + (getUnit(d) || 0)) || 0 === h) && (n = h)),
            !c || d !== n || _forceAllPropTweens)
        )
            return isNaN(d * n) || '' === n
                ? (p || i in e || _missingPlugin(i, n), _addComplexStringPropTween.call(this, e, i, d, n, f, u || _config.stringFilter, l))
                : ((h = new PropTween(this._pt, e, i, +d || 0, n - (d || 0), 'boolean' == typeof p ? _renderBoolean : _renderPlain, 0, f)),
                  l && (h.fp = l),
                  o && h.modifier(o, this, e),
                  (this._pt = h));
    },
    _processVars = function t(e, i, r, n, s) {
        if ((_isFunction(e) && (e = _parseFuncOrString(e, s, i, r, n)), !_isObject(e) || (e.style && e.nodeType) || _isArray(e) || _isTypedArray(e)))
            return _isString(e) ? _parseFuncOrString(e, s, i, r, n) : e;
        var a,
            o = {};
        for (a in e) o[a] = _parseFuncOrString(e[a], s, i, r, n);
        return o;
    },
    _checkPlugin = function t(e, i, r, n, s, a) {
        var o, u, l, c;
        if (
            _plugins[e] &&
            !1 !== (o = new _plugins[e]()).init(s, o.rawVars ? i[e] : _processVars(i[e], n, s, a, r), r, n, a) &&
            ((r._pt = u = new PropTween(r._pt, s, e, 0, 1, o.render, o, 0, o.priority)), r !== _quickTween)
        )
            for (l = r._ptLookup[r._targets.indexOf(s)], c = o._props.length; c--; ) l[o._props[c]] = u;
        return o;
    },
    _initTween = function t(e, i, r) {
        var n,
            s,
            a,
            o,
            u,
            l,
            c,
            h,
            p,
            d,
            f,
            m,
            g,
            $ = e.vars,
            v = $.ease,
            T = $.startAt,
            y = $.immediateRender,
            _ = $.lazy,
            w = $.onUpdate,
            b = $.runBackwards,
            x = $.yoyoEase,
            P = $.keyframes,
            k = $.autoRevert,
            E = e._dur,
            A = e._startAt,
            S = e._targets,
            C = e.parent,
            D = C && 'nested' === C.data ? C.vars.targets : S,
            F = 'auto' === e._overwrite && !_suppressOverwrites,
            N = e.timeline;
        if (
            (!N || (P && v) || (v = 'none'),
            (e._ease = _parseEase(v, _defaults.ease)),
            (e._yEase = x ? _invertEase(_parseEase(!0 === x ? v : x, _defaults.ease)) : 0),
            x && e._yoyo && !e._repeat && ((x = e._yEase), (e._yEase = e._ease), (e._ease = x)),
            (e._from = !N && !!$.runBackwards),
            !N || (P && !$.stagger))
        ) {
            if (
                ((m = (h = S[0] ? _getCache(S[0]).harness : 0) && $[h.prop]),
                (n = _copyExcluding($, _reservedProps)),
                A &&
                    (A._zTime < 0 && A.progress(1),
                    i < 0 && b && y && !k ? A.render(-1, !0) : A.revert(b && E ? _revertConfigNoKill : _startAtRevertConfig),
                    (A._lazy = 0)),
                T)
            ) {
                if (
                    (_removeFromParent(
                        (e._startAt = Tween.set(
                            S,
                            _setDefaults(
                                {
                                    data: 'isStart',
                                    overwrite: !1,
                                    parent: C,
                                    immediateRender: !0,
                                    lazy: !A && _isNotFalse(_),
                                    startAt: null,
                                    delay: 0,
                                    onUpdate:
                                        w &&
                                        function () {
                                            return _callback(e, 'onUpdate');
                                        },
                                    stagger: 0
                                },
                                T
                            )
                        ))
                    ),
                    (e._startAt._dp = 0),
                    (e._startAt._sat = e),
                    i < 0 && (_reverting || (!y && !k)) && e._startAt.revert(_revertConfigNoKill),
                    y && E && i <= 0 && r <= 0)
                ) {
                    i && (e._zTime = i);
                    return;
                }
            } else if (b && E && !A) {
                if (
                    (i && (y = !1),
                    (a = _setDefaults({ overwrite: !1, data: 'isFromStart', lazy: y && !A && _isNotFalse(_), immediateRender: y, stagger: 0, parent: C }, n)),
                    m && (a[h.prop] = m),
                    _removeFromParent((e._startAt = Tween.set(S, a))),
                    (e._startAt._dp = 0),
                    (e._startAt._sat = e),
                    i < 0 && (_reverting ? e._startAt.revert(_revertConfigNoKill) : e._startAt.render(-1, !0)),
                    (e._zTime = i),
                    y)
                ) {
                    if (!i) return;
                } else t(e._startAt, _tinyNum, _tinyNum);
            }
            for (s = 0, e._pt = e._ptCache = 0, _ = (E && _isNotFalse(_)) || (_ && !E); s < S.length; s++) {
                if (
                    ((c = (u = S[s])._gsap || _harness(S)[s]._gsap),
                    (e._ptLookup[s] = d = {}),
                    _lazyLookup[c.id] && _lazyTweens.length && _lazyRender(),
                    (f = D === S ? s : D.indexOf(u)),
                    h &&
                        !1 !== (p = new h()).init(u, m || n, e, f, D) &&
                        ((e._pt = o = new PropTween(e._pt, u, p.name, 0, 1, p.render, p, 0, p.priority)),
                        p._props.forEach(function (t) {
                            d[t] = o;
                        }),
                        p.priority && (l = 1)),
                    !h || m)
                )
                    for (a in n)
                        _plugins[a] && (p = _checkPlugin(a, n, e, f, u, D))
                            ? p.priority && (l = 1)
                            : (d[a] = o = _addPropTween.call(e, u, a, 'get', n[a], f, D, 0, $.stringFilter));
                e._op && e._op[s] && e.kill(u, e._op[s]),
                    F && e._pt && ((_overwritingTween = e), _globalTimeline.killTweensOf(u, d, e.globalTime(i)), (g = !e.parent), (_overwritingTween = 0)),
                    e._pt && _ && (_lazyLookup[c.id] = 1);
            }
            l && _sortPropTweensByPriority(e), e._onInit && e._onInit(e);
        }
        (e._onUpdate = w), (e._initted = (!e._op || e._pt) && !g), P && i <= 0 && N.render(_bigNum, !0, !0);
    },
    _updatePropTweens = function t(e, i, r, n, s, a, o, u) {
        var l,
            c,
            h,
            p,
            d = ((e._pt && e._ptCache) || (e._ptCache = {}))[i];
        if (!d)
            for (d = e._ptCache[i] = [], h = e._ptLookup, p = e._targets.length; p--; ) {
                if ((l = h[p][i]) && l.d && l.d._pt) for (l = l.d._pt; l && l.p !== i && l.fp !== i; ) l = l._next;
                if (!l)
                    return (
                        (_forceAllPropTweens = 1),
                        (e.vars[i] = '+=0'),
                        _initTween(e, o),
                        (_forceAllPropTweens = 0),
                        u ? _warn(i + ' not eligible for reset') : 1
                    );
                d.push(l);
            }
        for (p = d.length; p--; )
            ((l = (c = d[p])._pt || c).s = (n || 0 === n) && !s ? n : l.s + (n || 0) + a * l.c),
                (l.c = r - l.s),
                c.e && (c.e = _round(r) + getUnit(c.e)),
                c.b && (c.b = l.s + getUnit(c.b));
    },
    _addAliasesToVars = function t(e, i) {
        var r,
            n,
            s,
            a,
            o = e[0] ? _getCache(e[0]).harness : 0,
            u = o && o.aliases;
        if (!u) return i;
        for (n in ((r = _merge({}, i)), u)) if (n in r) for (s = (a = u[n].split(',')).length; s--; ) r[a[s]] = r[n];
        return r;
    },
    _parseKeyframe = function t(e, i, r, n) {
        var s,
            a,
            o = i.ease || n || 'power1.inOut';
        if (_isArray(i))
            (a = r[e] || (r[e] = [])),
                i.forEach(function (t, e) {
                    return a.push({ t: (e / (i.length - 1)) * 100, v: t, e: o });
                });
        else for (s in i) (a = r[s] || (r[s] = [])), 'ease' === s || a.push({ t: parseFloat(e), v: i[s], e: o });
    },
    _parseFuncOrString = function t(e, i, r, n, s) {
        return _isFunction(e) ? e.call(i, r, n, s) : _isString(e) && ~e.indexOf('random(') ? _replaceRandom(e) : e;
    },
    _staggerTweenProps = _callbackNames + 'repeat,repeatDelay,yoyo,repeatRefresh,yoyoEase,autoRevert',
    _staggerPropsToSkip = {};
_forEachName(_staggerTweenProps + ',id,stagger,delay,duration,paused,scrollTrigger', function (t) {
    return (_staggerPropsToSkip[t] = 1);
});
export var Tween = (function (t) {
    function e(e, i, r, n) {
        'number' == typeof i && ((r.duration = i), (i = r), (r = null));
        var s,
            a,
            o,
            u,
            l,
            c,
            h,
            p,
            d,
            f = (s = t.call(this, n ? i : _inheritDefaults(i)) || this).vars,
            m = f.duration,
            g = f.delay,
            $ = f.immediateRender,
            v = f.stagger,
            T = f.overwrite,
            y = f.keyframes,
            _ = f.defaults,
            w = f.scrollTrigger,
            b = f.yoyoEase,
            x = i.parent || _globalTimeline,
            P = (_isArray(e) || _isTypedArray(e) ? _isNumber(e[0]) : 'length' in i) ? [e] : toArray(e);
        if (
            ((s._targets = P.length ? _harness(P) : _warn('GSAP target ' + e + ' not found. https://gsap.com', !_config.nullTargetWarn) || []),
            (s._ptLookup = []),
            (s._overwrite = T),
            y || v || _isFuncOrString(m) || _isFuncOrString(g))
        ) {
            if (
                ((i = s.vars),
                (a = s.timeline = new Timeline({ data: 'nested', defaults: _ || {}, targets: x && 'nested' === x.data ? x.vars.targets : P })).kill(),
                (a.parent = a._dp = _assertThisInitialized(s)),
                (a._start = 0),
                v || _isFuncOrString(m) || _isFuncOrString(g))
            ) {
                if (((l = P.length), (p = v && distribute(v)), _isObject(v))) for (c in v) ~_staggerTweenProps.indexOf(c) && (d || (d = {}), (d[c] = v[c]));
                for (o = 0; o < l; o++)
                    ((u = _copyExcluding(i, _staggerPropsToSkip)).stagger = 0),
                        b && (u.yoyoEase = b),
                        d && _merge(u, d),
                        (h = P[o]),
                        (u.duration = +_parseFuncOrString(m, _assertThisInitialized(s), o, h, P)),
                        (u.delay = (+_parseFuncOrString(g, _assertThisInitialized(s), o, h, P) || 0) - s._delay),
                        !v && 1 === l && u.delay && ((s._delay = g = u.delay), (s._start += g), (u.delay = 0)),
                        a.to(h, u, p ? p(o, h, P) : 0),
                        (a._ease = _easeMap.none);
                a.duration() ? (m = g = 0) : (s.timeline = 0);
            } else if (y) {
                _inheritDefaults(_setDefaults(a.vars.defaults, { ease: 'none' })), (a._ease = _parseEase(y.ease || i.ease || 'none'));
                var k,
                    E,
                    A,
                    S = 0;
                if (_isArray(y))
                    y.forEach(function (t) {
                        return a.to(P, t, '>');
                    }),
                        a.duration();
                else {
                    for (c in ((u = {}), y)) 'ease' === c || 'easeEach' === c || _parseKeyframe(c, y[c], u, y.easeEach);
                    for (c in u)
                        for (
                            o = 0,
                                k = u[c].sort(function (t, e) {
                                    return t.t - e.t;
                                }),
                                S = 0;
                            o < k.length;
                            o++
                        )
                            ((A = { ease: (E = k[o]).e, duration: ((E.t - (o ? k[o - 1].t : 0)) / 100) * m })[c] = E.v), a.to(P, A, S), (S += A.duration);
                    a.duration() < m && a.to({}, { duration: m - a.duration() });
                }
            }
            m || s.duration((m = a.duration()));
        } else s.timeline = 0;
        return (
            !0 !== T || _suppressOverwrites || ((_overwritingTween = _assertThisInitialized(s)), _globalTimeline.killTweensOf(P), (_overwritingTween = 0)),
            _addToTimeline(x, _assertThisInitialized(s), r),
            i.reversed && s.reverse(),
            i.paused && s.paused(!0),
            ($ ||
                (!m &&
                    !y &&
                    s._start === _roundPrecise(x._time) &&
                    _isNotFalse($) &&
                    _hasNoPausedAncestors(_assertThisInitialized(s)) &&
                    'nested' !== x.data)) &&
                ((s._tTime = -_tinyNum), s.render(Math.max(0, -g) || 0)),
            w && _scrollTrigger(_assertThisInitialized(s), w),
            s
        );
    }
    _inheritsLoose(e, t);
    var i = e.prototype;
    return (
        (i.render = function t(e, i, r) {
            var n,
                s,
                a,
                o,
                u,
                l,
                c,
                h,
                p,
                d = this._time,
                f = this._tDur,
                m = this._dur,
                g = e < 0,
                $ = e > f - _tinyNum && !g ? f : e < _tinyNum ? 0 : e;
            if (m) {
                if ($ !== this._tTime || !e || r || (!this._initted && this._tTime) || (this._startAt && this._zTime < 0 !== g)) {
                    if (((n = $), (h = this.timeline), this._repeat)) {
                        if (((o = m + this._rDelay), this._repeat < -1 && g)) return this.totalTime(100 * o + e, i, r);
                        if (
                            ((n = _roundPrecise($ % o)),
                            $ === f ? ((a = this._repeat), (n = m)) : ((a = ~~($ / o)) && a === _roundPrecise($ / o) && ((n = m), a--), n > m && (n = m)),
                            (l = this._yoyo && 1 & a) && ((p = this._yEase), (n = m - n)),
                            (u = _animationCycle(this._tTime, o)),
                            n === d && !r && this._initted && a === u)
                        )
                            return (this._tTime = $), this;
                        a !== u &&
                            (h && this._yEase && _propagateYoyoEase(h, l),
                            this.vars.repeatRefresh &&
                                !l &&
                                !this._lock &&
                                this._time !== o &&
                                this._initted &&
                                ((this._lock = r = 1), (this.render(_roundPrecise(o * a), !0).invalidate()._lock = 0)));
                    }
                    if (!this._initted) {
                        if (_attemptInitTween(this, g ? e : n, r, i, $)) return (this._tTime = 0), this;
                        if (d !== this._time && !(r && this.vars.repeatRefresh && a !== u)) return this;
                        if (m !== this._dur) return this.render(e, i, r);
                    }
                    if (
                        ((this._tTime = $),
                        (this._time = n),
                        !this._act && this._ts && ((this._act = 1), (this._lazy = 0)),
                        (this.ratio = c = (p || this._ease)(n / m)),
                        this._from && (this.ratio = c = 1 - c),
                        n && !d && !i && !a && (_callback(this, 'onStart'), this._tTime !== $))
                    )
                        return this;
                    for (s = this._pt; s; ) s.r(c, s.d), (s = s._next);
                    (h && h.render(e < 0 ? e : h._dur * h._ease(n / this._dur), i, r)) || (this._startAt && (this._zTime = e)),
                        this._onUpdate && !i && (g && _rewindStartAt(this, e, i, r), _callback(this, 'onUpdate')),
                        this._repeat && a !== u && this.vars.onRepeat && !i && this.parent && _callback(this, 'onRepeat'),
                        ($ === this._tDur || !$) &&
                            this._tTime === $ &&
                            (g && !this._onUpdate && _rewindStartAt(this, e, !0, !0),
                            (e || !m) && (($ === this._tDur && this._ts > 0) || (!$ && this._ts < 0)) && _removeFromParent(this, 1),
                            !i &&
                                !(g && !d) &&
                                ($ || d || l) &&
                                (_callback(this, $ === f ? 'onComplete' : 'onReverseComplete', !0),
                                this._prom && !($ < f && this.timeScale() > 0) && this._prom()));
                }
            } else _renderZeroDurationTween(this, e, i, r);
            return this;
        }),
        (i.targets = function t() {
            return this._targets;
        }),
        (i.invalidate = function e(i) {
            return (
                (i && this.vars.runBackwards) || (this._startAt = 0),
                (this._pt = this._op = this._onUpdate = this._lazy = this.ratio = 0),
                (this._ptLookup = []),
                this.timeline && this.timeline.invalidate(i),
                t.prototype.invalidate.call(this, i)
            );
        }),
        (i.resetTo = function t(e, i, r, n, s) {
            _tickerActive || _ticker.wake(), this._ts || this.play();
            var a,
                o = Math.min(this._dur, (this._dp._time - this._start) * this._ts);
            return (this._initted || _initTween(this, o), _updatePropTweens(this, e, i, r, n, (a = this._ease(o / this._dur)), o, s))
                ? this.resetTo(e, i, r, n, 1)
                : (_alignPlayhead(this, 0),
                  this.parent || _addLinkedListItem(this._dp, this, '_first', '_last', this._dp._sort ? '_start' : 0),
                  this.render(0));
        }),
        (i.kill = function t(e, i) {
            if ((void 0 === i && (i = 'all'), !e && (!i || 'all' === i))) return (this._lazy = this._pt = 0), this.parent ? _interrupt(this) : this;
            if (this.timeline) {
                var r = this.timeline.totalDuration();
                return (
                    this.timeline.killTweensOf(e, i, _overwritingTween && !0 !== _overwritingTween.vars.overwrite)._first || _interrupt(this),
                    this.parent && r !== this.timeline.totalDuration() && _setDuration(this, (this._dur * this.timeline._tDur) / r, 0, 1),
                    this
                );
            }
            var n,
                s,
                a,
                o,
                u,
                l,
                c,
                h = this._targets,
                p = e ? toArray(e) : h,
                d = this._ptLookup,
                f = this._pt;
            if ((!i || 'all' === i) && _arraysMatch(h, p)) return 'all' === i && (this._pt = 0), _interrupt(this);
            for (
                n = this._op = this._op || [],
                    'all' !== i &&
                        (_isString(i) &&
                            ((u = {}),
                            _forEachName(i, function (t) {
                                return (u[t] = 1);
                            }),
                            (i = u)),
                        (i = _addAliasesToVars(h, i))),
                    c = h.length;
                c--;

            )
                if (~p.indexOf(h[c]))
                    for (u in ((s = d[c]), 'all' === i ? ((n[c] = i), (o = s), (a = {})) : ((a = n[c] = n[c] || {}), (o = i)), o))
                        (l = s && s[u]) && (('kill' in l.d && !0 !== l.d.kill(u)) || _removeLinkedListItem(this, l, '_pt'), delete s[u]),
                            'all' !== a && (a[u] = 1);
            return this._initted && !this._pt && f && _interrupt(this), this;
        }),
        (e.to = function t(i, r) {
            return new e(i, r, arguments[2]);
        }),
        (e.from = function t(e, i) {
            return _createTweenType(1, arguments);
        }),
        (e.delayedCall = function t(i, r, n, s) {
            return new e(r, 0, {
                immediateRender: !1,
                lazy: !1,
                overwrite: !1,
                delay: i,
                onComplete: r,
                onReverseComplete: r,
                onCompleteParams: n,
                onReverseCompleteParams: n,
                callbackScope: s
            });
        }),
        (e.fromTo = function t(e, i, r) {
            return _createTweenType(2, arguments);
        }),
        (e.set = function t(i, r) {
            return (r.duration = 0), r.repeatDelay || (r.repeat = 0), new e(i, r);
        }),
        (e.killTweensOf = function t(e, i, r) {
            return _globalTimeline.killTweensOf(e, i, r);
        }),
        e
    );
})(Animation);
_setDefaults(Tween.prototype, { _targets: [], _lazy: 0, _startAt: 0, _op: 0, _onInit: 0 }),
    _forEachName('staggerTo,staggerFrom,staggerFromTo', function (t) {
        Tween[t] = function () {
            var e = new Timeline(),
                i = _slice.call(arguments, 0);
            return i.splice('staggerFromTo' === t ? 5 : 4, 0, 0), e[t].apply(e, i);
        };
    });
var _setterPlain = function t(e, i, r) {
        return (e[i] = r);
    },
    _setterFunc = function t(e, i, r) {
        return e[i](r);
    },
    _setterFuncWithParam = function t(e, i, r, n) {
        return e[i](n.fp, r);
    },
    _setterAttribute = function t(e, i, r) {
        return e.setAttribute(i, r);
    },
    _getSetter = function t(e, i) {
        return _isFunction(e[i]) ? _setterFunc : _isUndefined(e[i]) && e.setAttribute ? _setterAttribute : _setterPlain;
    },
    _renderPlain = function t(e, i) {
        return i.set(i.t, i.p, Math.round((i.s + i.c * e) * 1e6) / 1e6, i);
    },
    _renderBoolean = function t(e, i) {
        return i.set(i.t, i.p, !!(i.s + i.c * e), i);
    },
    _renderComplexString = function t(e, i) {
        var r = i._pt,
            n = '';
        if (!e && i.b) n = i.b;
        else if (1 === e && i.e) n = i.e;
        else {
            for (; r; ) (n = r.p + (r.m ? r.m(r.s + r.c * e) : Math.round((r.s + r.c * e) * 1e4) / 1e4) + n), (r = r._next);
            n += i.c;
        }
        i.set(i.t, i.p, n, i);
    },
    _renderPropTweens = function t(e, i) {
        for (var r = i._pt; r; ) r.r(e, r.d), (r = r._next);
    },
    _addPluginModifier = function t(e, i, r, n) {
        for (var s, a = this._pt; a; ) (s = a._next), a.p === n && a.modifier(e, i, r), (a = s);
    },
    _killPropTweensOf = function t(e) {
        for (var i, r, n = this._pt; n; ) (r = n._next), (n.p !== e || n.op) && n.op !== e ? n.dep || (i = 1) : _removeLinkedListItem(this, n, '_pt'), (n = r);
        return !i;
    },
    _setterWithModifier = function t(e, i, r, n) {
        n.mSet(e, i, n.m.call(n.tween, r, n.mt), n);
    },
    _sortPropTweensByPriority = function t(e) {
        for (var i, r, n, s, a = e._pt; a; ) {
            for (i = a._next, r = n; r && r.pr > a.pr; ) r = r._next;
            (a._prev = r ? r._prev : s) ? (a._prev._next = a) : (n = a), (a._next = r) ? (r._prev = a) : (s = a), (a = i);
        }
        e._pt = n;
    };
export var PropTween = (function () {
    function t(t, e, i, r, n, s, a, o, u) {
        (this.t = e),
            (this.s = r),
            (this.c = n),
            (this.p = i),
            (this.r = s || _renderPlain),
            (this.d = a || this),
            (this.set = o || _setterPlain),
            (this.pr = u || 0),
            (this._next = t),
            t && (t._prev = this);
    }
    return (
        (t.prototype.modifier = function t(e, i, r) {
            (this.mSet = this.mSet || this.set), (this.set = _setterWithModifier), (this.m = e), (this.mt = r), (this.tween = i);
        }),
        t
    );
})();
_forEachName(
    _callbackNames +
        'parent,duration,ease,delay,overwrite,runBackwards,startAt,yoyo,immediateRender,repeat,repeatDelay,data,paused,reversed,lazy,callbackScope,stringFilter,id,yoyoEase,stagger,inherit,repeatRefresh,keyframes,autoRevert,scrollTrigger',
    function (t) {
        return (_reservedProps[t] = 1);
    }
),
    (_globals.TweenMax = _globals.TweenLite = Tween),
    (_globals.TimelineLite = _globals.TimelineMax = Timeline),
    (_globalTimeline = new Timeline({ sortChildren: !1, defaults: _defaults, autoRemoveChildren: !0, id: 'root', smoothChildTiming: !0 })),
    (_config.stringFilter = _colorStringFilter);
var _media = [],
    _listeners = {},
    _emptyArray = [],
    _lastMediaTime = 0,
    _contextID = 0,
    _dispatch = function t(e) {
        return (_listeners[e] || _emptyArray).map(function (t) {
            return t();
        });
    },
    _onMediaChange = function t() {
        var e = Date.now(),
            i = [];
        e - _lastMediaTime > 2 &&
            (_dispatch('matchMediaInit'),
            _media.forEach(function (t) {
                var e,
                    r,
                    n,
                    s,
                    a = t.queries,
                    o = t.conditions;
                for (r in a) (e = _win.matchMedia(a[r]).matches) && (n = 1), e !== o[r] && ((o[r] = e), (s = 1));
                s && (t.revert(), n && i.push(t));
            }),
            _dispatch('matchMediaRevert'),
            i.forEach(function (t) {
                return t.onMatch(t, function (e) {
                    return t.add(null, e);
                });
            }),
            (_lastMediaTime = e),
            _dispatch('matchMedia'));
    },
    Context = (function () {
        function t(t, e) {
            (this.selector = e && selector(e)), (this.data = []), (this._r = []), (this.isReverted = !1), (this.id = _contextID++), t && this.add(t);
        }
        var e = t.prototype;
        return (
            (e.add = function t(e, i, r) {
                _isFunction(e) && ((r = i), (i = e), (e = _isFunction));
                var n = this,
                    s = function t() {
                        var e,
                            s = _context,
                            a = n.selector;
                        return (
                            s && s !== n && s.data.push(n),
                            r && (n.selector = selector(r)),
                            (_context = n),
                            (e = i.apply(n, arguments)),
                            _isFunction(e) && n._r.push(e),
                            (_context = s),
                            (n.selector = a),
                            (n.isReverted = !1),
                            e
                        );
                    };
                return (
                    (n.last = s),
                    e === _isFunction
                        ? s(n, function (t) {
                              return n.add(null, t);
                          })
                        : e
                          ? (n[e] = s)
                          : s
                );
            }),
            (e.ignore = function t(e) {
                var i = _context;
                (_context = null), e(this), (_context = i);
            }),
            (e.getTweens = function e() {
                var i = [];
                return (
                    this.data.forEach(function (e) {
                        return e instanceof t ? i.push.apply(i, e.getTweens()) : e instanceof Tween && !(e.parent && 'nested' === e.parent.data) && i.push(e);
                    }),
                    i
                );
            }),
            (e.clear = function t() {
                this._r.length = this.data.length = 0;
            }),
            (e.kill = function t(e, i) {
                var r = this;
                if (
                    (e
                        ? (function () {
                              for (var t, i = r.getTweens(), n = r.data.length; n--; )
                                  'isFlip' === (t = r.data[n]).data &&
                                      (t.revert(),
                                      t.getChildren(!0, !0, !1).forEach(function (t) {
                                          return i.splice(i.indexOf(t), 1);
                                      }));
                              for (
                                  i
                                      .map(function (t) {
                                          return { g: t._dur || t._delay || (t._sat && !t._sat.vars.immediateRender) ? t.globalTime(0) : -1 / 0, t: t };
                                      })
                                      .sort(function (t, e) {
                                          return e.g - t.g || -1 / 0;
                                      })
                                      .forEach(function (t) {
                                          return t.t.revert(e);
                                      }),
                                      n = r.data.length;
                                  n--;

                              )
                                  (t = r.data[n]) instanceof Timeline
                                      ? 'nested' !== t.data && (t.scrollTrigger && t.scrollTrigger.revert(), t.kill())
                                      : t instanceof Tween || !t.revert || t.revert(e);
                              r._r.forEach(function (t) {
                                  return t(e, r);
                              }),
                                  (r.isReverted = !0);
                          })()
                        : this.data.forEach(function (t) {
                              return t.kill && t.kill();
                          }),
                    this.clear(),
                    i)
                )
                    for (var n = _media.length; n--; ) _media[n].id === this.id && _media.splice(n, 1);
            }),
            (e.revert = function t(e) {
                this.kill(e || {});
            }),
            t
        );
    })(),
    MatchMedia = (function () {
        function t(t) {
            (this.contexts = []), (this.scope = t), _context && _context.data.push(this);
        }
        var e = t.prototype;
        return (
            (e.add = function t(e, i, r) {
                _isObject(e) || (e = { matches: e });
                var n,
                    s,
                    a,
                    o = new Context(0, r || this.scope),
                    u = (o.conditions = {});
                for (s in (_context && !o.selector && (o.selector = _context.selector), this.contexts.push(o), (i = o.add('onMatch', i)), (o.queries = e), e))
                    'all' === s
                        ? (a = 1)
                        : (n = _win.matchMedia(e[s])) &&
                          (0 > _media.indexOf(o) && _media.push(o),
                          (u[s] = n.matches) && (a = 1),
                          n.addListener ? n.addListener(_onMediaChange) : n.addEventListener('change', _onMediaChange));
                return (
                    a &&
                        i(o, function (t) {
                            return o.add(null, t);
                        }),
                    this
                );
            }),
            (e.revert = function t(e) {
                this.kill(e || {});
            }),
            (e.kill = function t(e) {
                this.contexts.forEach(function (t) {
                    return t.kill(e, !0);
                });
            }),
            t
        );
    })(),
    _gsap = {
        registerPlugin: function t() {
            for (var e = arguments.length, i = Array(e), r = 0; r < e; r++) i[r] = arguments[r];
            i.forEach(function (t) {
                return _createPlugin(t);
            });
        },
        timeline: function t(e) {
            return new Timeline(e);
        },
        getTweensOf: function t(e, i) {
            return _globalTimeline.getTweensOf(e, i);
        },
        getProperty: function t(e, i, r, n) {
            _isString(e) && (e = toArray(e)[0]);
            var s = _getCache(e || {}).get,
                a = r ? _passThrough : _numericIfPossible;
            return (
                'native' === r && (r = ''),
                e
                    ? i
                        ? a(((_plugins[i] && _plugins[i].get) || s)(e, i, r, n))
                        : function (t, i, r) {
                              return a(((_plugins[t] && _plugins[t].get) || s)(e, t, i, r));
                          }
                    : e
            );
        },
        quickSetter: function t(e, i, r) {
            if ((e = toArray(e)).length > 1) {
                var n = e.map(function (t) {
                        return gsap.quickSetter(t, i, r);
                    }),
                    s = n.length;
                return function (t) {
                    for (var e = s; e--; ) n[e](t);
                };
            }
            e = e[0] || {};
            var a = _plugins[i],
                o = _getCache(e),
                u = (o.harness && (o.harness.aliases || {})[i]) || i,
                l = a
                    ? function (t) {
                          var i = new a();
                          (_quickTween._pt = 0),
                              i.init(e, r ? t + r : t, _quickTween, 0, [e]),
                              i.render(1, i),
                              _quickTween._pt && _renderPropTweens(1, _quickTween);
                      }
                    : o.set(e, u);
            return a
                ? l
                : function (t) {
                      return l(e, u, r ? t + r : t, o, 1);
                  };
        },
        quickTo: function t(e, i, r) {
            var n,
                s = gsap.to(e, _merge((((n = {})[i] = '+=0.1'), (n.paused = !0), n), r || {})),
                a = function t(e, r, n) {
                    return s.resetTo(i, e, r, n);
                };
            return (a.tween = s), a;
        },
        isTweening: function t(e) {
            return _globalTimeline.getTweensOf(e, !0).length > 0;
        },
        defaults: function t(e) {
            return e && e.ease && (e.ease = _parseEase(e.ease, _defaults.ease)), _mergeDeep(_defaults, e || {});
        },
        config: function t(e) {
            return _mergeDeep(_config, e || {});
        },
        registerEffect: function t(e) {
            var i = e.name,
                r = e.effect,
                n = e.plugins,
                s = e.defaults,
                a = e.extendTimeline;
            (n || '').split(',').forEach(function (t) {
                return t && !_plugins[t] && !_globals[t] && _warn(i + ' effect requires ' + t + ' plugin.');
            }),
                (_effects[i] = function (t, e, i) {
                    return r(toArray(t), _setDefaults(e || {}, s), i);
                }),
                a &&
                    (Timeline.prototype[i] = function (t, e, r) {
                        return this.add(_effects[i](t, _isObject(e) ? e : (r = e) && {}, this), r);
                    });
        },
        registerEase: function t(e, i) {
            _easeMap[e] = _parseEase(i);
        },
        parseEase: function t(e, i) {
            return arguments.length ? _parseEase(e, i) : _easeMap;
        },
        getById: function t(e) {
            return _globalTimeline.getById(e);
        },
        exportRoot: function t(e, i) {
            void 0 === e && (e = {});
            var r,
                n,
                s = new Timeline(e);
            for (
                s.smoothChildTiming = _isNotFalse(e.smoothChildTiming),
                    _globalTimeline.remove(s),
                    s._dp = 0,
                    s._time = s._tTime = _globalTimeline._time,
                    r = _globalTimeline._first;
                r;

            )
                (n = r._next),
                    (i || !(!r._dur && r instanceof Tween && r.vars.onComplete === r._targets[0])) && _addToTimeline(s, r, r._start - r._delay),
                    (r = n);
            return _addToTimeline(_globalTimeline, s, 0), s;
        },
        context: function t(e, i) {
            return e ? new Context(e, i) : _context;
        },
        matchMedia: function t(e) {
            return new MatchMedia(e);
        },
        matchMediaRefresh: function t() {
            return (
                _media.forEach(function (t) {
                    var e,
                        i,
                        r = t.conditions;
                    for (i in r) r[i] && ((r[i] = !1), (e = 1));
                    e && t.revert();
                }) || _onMediaChange()
            );
        },
        addEventListener: function t(e, i) {
            var r = _listeners[e] || (_listeners[e] = []);
            ~r.indexOf(i) || r.push(i);
        },
        removeEventListener: function t(e, i) {
            var r = _listeners[e],
                n = r && r.indexOf(i);
            n >= 0 && r.splice(n, 1);
        },
        utils: {
            wrap: wrap,
            wrapYoyo: wrapYoyo,
            distribute: distribute,
            random: random,
            snap: snap,
            normalize: normalize,
            getUnit: getUnit,
            clamp: clamp,
            splitColor: splitColor,
            toArray: toArray,
            selector: selector,
            mapRange: mapRange,
            pipe: pipe,
            unitize: unitize,
            interpolate: interpolate,
            shuffle: shuffle
        },
        install: _install,
        effects: _effects,
        ticker: _ticker,
        updateRoot: Timeline.updateRoot,
        plugins: _plugins,
        globalTimeline: _globalTimeline,
        core: {
            PropTween: PropTween,
            globals: _addGlobal,
            Tween: Tween,
            Timeline: Timeline,
            Animation: Animation,
            getCache: _getCache,
            _removeLinkedListItem: _removeLinkedListItem,
            reverting: function t() {
                return _reverting;
            },
            context: function t(e) {
                return e && _context && (_context.data.push(e), (e._ctx = _context)), _context;
            },
            suppressOverwrites: function t(e) {
                return (_suppressOverwrites = e);
            }
        }
    };
_forEachName('to,from,fromTo,delayedCall,set,killTweensOf', function (t) {
    return (_gsap[t] = Tween[t]);
}),
    _ticker.add(Timeline.updateRoot),
    (_quickTween = _gsap.to({}, { duration: 0 }));
var _getPluginPropTween = function t(e, i) {
        for (var r = e._pt; r && r.p !== i && r.op !== i && r.fp !== i; ) r = r._next;
        return r;
    },
    _addModifiers = function t(e, i) {
        var r,
            n,
            s,
            a = e._targets;
        for (r in i)
            for (n = a.length; n--; )
                (s = e._ptLookup[n][r]) && (s = s.d) && (s._pt && (s = _getPluginPropTween(s, r)), s && s.modifier && s.modifier(i[r], e, a[n], r));
    },
    _buildModifierPlugin = function t(e, i) {
        return {
            name: e,
            rawVars: 1,
            init: function t(e, r, n) {
                n._onInit = function (t) {
                    var e, n;
                    if (
                        (_isString(r) &&
                            ((e = {}),
                            _forEachName(r, function (t) {
                                return (e[t] = 1);
                            }),
                            (r = e)),
                        i)
                    ) {
                        for (n in ((e = {}), r)) e[n] = i(r[n]);
                        r = e;
                    }
                    _addModifiers(t, r);
                };
            }
        };
    };
export var gsap =
    _gsap.registerPlugin(
        {
            name: 'attr',
            init: function t(e, i, r, n, s) {
                var a, o, u;
                for (a in ((this.tween = r), i))
                    (u = e.getAttribute(a) || ''),
                        ((o = this.add(e, 'setAttribute', (u || 0) + '', i[a], n, s, 0, 0, a)).op = a),
                        (o.b = u),
                        this._props.push(a);
            },
            render: function t(e, i) {
                for (var r = i._pt; r; ) _reverting ? r.set(r.t, r.p, r.b, r) : r.r(e, r.d), (r = r._next);
            }
        },
        {
            name: 'endArray',
            init: function t(e, i) {
                for (var r = i.length; r--; ) this.add(e, r, e[r] || 0, i[r], 0, 0, 0, 0, 0, 1);
            }
        },
        _buildModifierPlugin('roundProps', _roundModifier),
        _buildModifierPlugin('modifiers'),
        _buildModifierPlugin('snap', snap)
    ) || _gsap;
(Tween.version = Timeline.version = gsap.version = '3.12.5'), (_coreReady = 1), _windowExists() && _wake();
var Power0 = _easeMap.Power0,
    Power1 = _easeMap.Power1,
    Power2 = _easeMap.Power2,
    Power3 = _easeMap.Power3,
    Power4 = _easeMap.Power4,
    Linear = _easeMap.Linear,
    Quad = _easeMap.Quad,
    Cubic = _easeMap.Cubic,
    Quart = _easeMap.Quart,
    Quint = _easeMap.Quint,
    Strong = _easeMap.Strong,
    Elastic = _easeMap.Elastic,
    Back = _easeMap.Back,
    SteppedEase = _easeMap.SteppedEase,
    Bounce = _easeMap.Bounce,
    Sine = _easeMap.Sine,
    Expo = _easeMap.Expo,
    Circ = _easeMap.Circ;
export {
    Power0,
    Power1,
    Power2,
    Power3,
    Power4,
    Linear,
    Quad,
    Cubic,
    Quart,
    Quint,
    Strong,
    Elastic,
    Back,
    SteppedEase,
    Bounce,
    Sine,
    Expo,
    Circ,
    Tween as TweenMax,
    Tween as TweenLite,
    Timeline as TimelineMax,
    Timeline as TimelineLite,
    gsap as default,
    wrap,
    wrapYoyo,
    distribute,
    random,
    snap,
    normalize,
    getUnit,
    clamp,
    splitColor,
    toArray,
    selector,
    mapRange,
    pipe,
    unitize,
    interpolate,
    shuffle,
    _getProperty,
    _numExp,
    _numWithUnitExp,
    _isString,
    _isUndefined,
    _renderComplexString,
    _relExp,
    _setDefaults,
    _removeLinkedListItem,
    _forEachName,
    _sortPropTweensByPriority,
    _colorStringFilter,
    _replaceRandom,
    _checkPlugin,
    _plugins,
    _ticker,
    _config,
    _roundModifier,
    _round,
    _missingPlugin,
    _getSetter,
    _getCache,
    _colorExp,
    _parseRelative
};
