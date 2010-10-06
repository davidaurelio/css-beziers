/**
 * @license
 *
 * Copyright (C) 2008 Apple Inc. All Rights Reserved.
 * Copyright (C) 2010 David Aurelio. All Rights Reserved.
 * Copyright (C) 2010 uxebu Consulting Ltd. & Co. KG. All Rights Reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 * 1. Redistributions of source code must retain the above copyright
 *    notice, this list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright
 *    notice, this list of conditions and the following disclaimer in the
 *    documentation and/or other materials provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY APPLE INC., DAVID AURELIO, AND UXEBU
 * CONSULTING LTD. & CO. KG ``AS IS'' AND ANY EXPRESS OR IMPLIED
 * WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF
 * MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
 * IN NO EVENT SHALL APPLE INC. OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT,
 * INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
 * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION)
 * HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT,
 * STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING
 * IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 * POSSIBILITY OF SUCH DAMAGE.
 */

/**
 * Represents a two-dimensional cubic bezier curve with the starting
 * point (0, 0) and the end point (1, 1). The two control points p1 and p2
 * have x and y coordinates between 0 and 1.
 *
 * This type of bezier curves can be used as CSS transform timing functions.
 */
function CubicBezier(p1x, p1y, p2x, p2y) {
    if (!(p1x >= 0 && p1x <= 1)) {
        throw new RangeError("'p1x' must be a number between 0 and 1. " +
                             "Got " + p1x + "instead.");
    }
    if (!(p1y >= 0 && p1y <= 1)) {
        throw new RangeError("'p1y' must be a number between 0 and 1. " +
                             "Got " + p1y + "instead.");
    }
    if (!(p2x >= 0 && p2x <= 1)) {
        throw new RangeError("'p2x' must be a number between 0 and 1. " +
                             "Got " + p2x + "instead.");
    }
    if (!(p2y >= 0 && p2y <= 1)) {
        throw new RangeError("'p2y' must be a number between 0 and 1. " +
                             "Got " + p2y + "instead.");
    }

    // Control points
    this._p1x = p1x;
    this._p1y = p1y;
    this._p2x = p2x;
    this._p2y = p2y;
}

CubicBezier.prototype._getCoordinateForT = function(t, p1, p2) {
    var c = 3 * p1,
        b = 3 * (p2 - p1) - c,
        a = 1 - c - b;

    return ((a * t + b) * t + c) * t;
};

CubicBezier.prototype._getCoordinateDerivateForT = function(t, p1, p2) {
    var c = 3 * p1,
        b = 3 * (p2 - p1) - c,
        a = 1 - c - b;

    return (3 * a * t + 2 * b) * t + c;
};

CubicBezier.prototype._getTForCoordinate = function(c, p1, p2, epsilon) {
    if (!isFinite(epsilon) || epsilon <= 0) {
        throw new RangeError("'epsilon' must be a number greater than 0.");
    }

    // First try a few iterations of Newton's method -- normally very fast.
    for (var t2 = c, i = 0, c2, d2; i < 8; i++) {
        c2 = this._getCoordinateForT(t2, p1, p2) - c;
        if (Math.abs(c2) < epsilon) {
            return t2;
        }
        d2 = this._getCoordinateDerivateForT(t2, p1, p2);
        if (Math.abs(d2) < 1e-6) {
            break;
        }
        t2 = t2 - c2 / d2;
    }

    // Fall back to the bisection method for reliability.
    t2 = c;
    var t0 = 0,
        t1 = 1;

    if (t2 < t0) {
        return t0;
    }
    if (t2 > t1) {
        return t1;
    }

    while (t0 < t1) {
        c2 = this._getCoordinateForT(t2, p1, p2);
        if (Math.abs(c2 - c) < epsilon) {
            return t2;
        }
        if (c > c2) {
            t0 = t2;
        }
        else{
            t1 = t2;
        }
        t2 = (t1 - t0) * 0.5 + t0;
    }

    // Failure.
    return t2;
};

/**
 * Computes the point for a given t value.
 *
 * @param {number} t
 * @returns {Object} Returns an object with x and y properties
 */
CubicBezier.prototype.getPointForT = function(t) {
    // Special cases: starting and ending points
    if (t === 0 || t === 1) {
        return { x: t, y: t };
    }
    // check for correct t value (must be between 0 and 1)
    else if (!(t > 0) || !(t < 1)) {
        throw new RangeError("'t' must be a number between 0 and 1"
                             + "Got " + t + " instead.");
    }

    return {
        x: this._getCoordinateForT(t, this._p1x, this._p2x),
        y: this._getCoordinateForT(t, this._p1y, this._p2y)
    }
};

CubicBezier.prototype.getTforX = function(x, epsilon) {
    return this._getTForCoordinate(x, this._p1x, this._p2x, epsilon);
};

CubicBezier.prototype.getTforY = function(y, epsilon) {
    return this._getTForCoordinate(y, this._p1y, this._p2y, epsilon);
};

/**
 * Computes auxiliary points using De Casteljau's algorithm.
 *
 * @param {number} t must be greater than 0 and lower than 1.
 * @returns {Array} containing i0, i1, i2 (first iteration),
 *     j1, j2 (second iteration) and k (the exact point for t)
 */
CubicBezier.prototype._getAuxPoints = function(t) {
    if (!(t > 0) || !(t < 1)) {
        throw new RangeError("'t' must be greater than 0 and lower than 1");
    }

    var p1x = this._p1x, p1y = this._p1y, p2x = this._p2x, p2y = this._p2y;

    // First series of auxiliary points
    var i0x = t * p1x, i0y = t * p1y; // first control point of the left curve
    var i1x = p1x + t*(p2x - p1x), i1y = p1y + t*(p2y - p1y);
    var i2x = p2x + t*(1 - p2x), i2y = p2y + t*(1 - p2y); // second control point of the right curve

    // Second series of auxiliary points
    var j0x = i0x + t*(i1x - i0x), j0y = i0y + t*(i1y - i0y); // second control point of the left curve

    var j1x = i1x + t*(i2x - i1x), j1y = i1y + t*(i2y - i1y); // first control point of the right curve

    // The division point (ending point of left curve, starting point of right curve)
    var kx = j0x + t*(j1x - j0x), ky = j0y + t*(j1y - j0y);

    return [i0x, i0y, i1x, i1y, i2x, i2y, j0x, j0y, j1x, j1y, kx, ky];
};

/**
 * Divides the bezier curve into two bezier functions.
 *
 * De Casteljau's algorithm is used to compute the new starting, ending, and
 * control points.
 *
 * @param {number} t must be greater than 0 and lower than 1.
 *     t == 1 or t == 0 are the starting/ending points of the curve, so no
 *     division is needed.
 *
 * @returns {CubicBezier[]} Returns an array containing two bezier curves
 *     to the left and the right of t.
 */
CubicBezier.prototype.divideAtT = function(t) {
    if (t < 0 || t > 1) {
        throw new RangeError("'t' must be a number between 0 and 1. "
                             + "Got " + t + " instead.");
    }

    // Special cases t = 0, t = 1: Curve can be cloned for one side, the other
    // side is a linear curve (with duration 0)
    if (t === 0 || t === 1) {
        var curves = [];
        curves[t] = CubicBezier.linear();
        curves[1-t] = this.clone();
        return curves;
    }

    var points = this._getAuxPoints(t);
    var kx = points[10], ky = points[11];

    // Normalize derived points, so that the new curves starting/ending point
    // coordinates are (0, 0) respectively (1, 1)
    var leftP1x = points[0] / kx, leftP1y = points[1] / ky;
    var leftP2x = points[6] / kx, leftP2y = points[7] / ky;

    var rightP1x = (points[8] - kx) / (1 - kx), rightP1y = (points[9] - ky) / (1 - ky);
    var rightP2x = (points[4] - kx) / (1 - kx), rightP2y = (points[5] - ky) / (1 - ky);

    return [
        new CubicBezier(leftP1x, leftP1y, leftP2x, leftP2y),
        new CubicBezier(rightP1x, rightP1y, rightP2x, rightP2y)
    ];
};

CubicBezier.prototype.divideAtX = function(x, epsilon) {
    if (x < 0 || x > 1) {
        throw new RangeError("'x' must be a number between 0 and 1. "
                             + "Got " + x + " instead.");
    }

    var t = this.getTforX(x, epsilon);
    return this.divideAtT(t);
};

CubicBezier.prototype.divideAtY = function(y, epsilon) {
    if (y < 0 || y > 1) {
        throw new RangeError("'y' must be a number between 0 and 1. "
                             + "Got " + y + " instead.");
    }

    var t = this.getTforY(y, epsilon);
    return this.divideAtT(t);
};

CubicBezier.prototype.clone = function() {
    return new CubicBezier(this._p1x, this._p1y, this._p2x, this._p2y);
};

CubicBezier.prototype.toString = function() {
    return "cubic-bezier(" + [
        this._p1x,
        this._p1y,
        this._p2x,
        this._p2y
    ].join(", ") + ")";
};

CubicBezier.linear = function() {
    return new CubicBezier
};

CubicBezier.ease = function() {
    return new CubicBezier(0.25, 0.1, 0.25, 1.0);
};
CubicBezier.linear = function() {
    return new CubicBezier(0.0, 0.0, 1.0, 1.0);
};
CubicBezier.easeIn = function() {
    return new CubicBezier(0.42, 0, 1.0, 1.0);
};
CubicBezier.easeOut = function() {
    return new CubicBezier(0, 0, 0.58, 1.0);
};
CubicBezier.easeInOut = function() {
    return new CubicBezier(0.42, 0, 0.58, 1.0);
};
