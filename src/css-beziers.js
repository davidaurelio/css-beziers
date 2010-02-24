/**
 * Represents a two-dimensional cubic bezier curve with the starting
 * point (0, 0) and the end point (1, 1). The two control points p1 and p2
 * have x and y coordinates between 0 and 1.
 *
 * This type of bezier curves can be used as CSS transform timing functions.
 */
function CubicBezier(p1x, p1y, p2x, p2y){
    if (!(p1x >= 0) || !(p1x <= 1)) {
        throw new RangeError("'p1x' must be a number between 0 and 1");
    }
    if (!(p1y >= 0) || !(p1y <= 1)) {
        throw new RangeError("'p1y' must be a number between 0 and 1");
    }
    if (!(p2x >= 0) || !(p2x <= 1)) {
        throw new RangeError("'p2x' must be a number between 0 and 1");
    }
    if (!(p2y >= 0) || !(p2y <= 1)) {
        throw new RangeError("'p2y' must be a number between 0 and 1");
    }

    // Control points
    this._p1 = { x: p1x, y: p1y };
    this._p2 = { x: p2x, y: p2y };

    // Pre-calculating coefficients for point computation.
    this._c = { x: 3*p1x, y: 3*p1y };
    this._b = {
        x: 3*(p2x - p1x) - this._c.x,
        y: 3*(p2y - p1y) - this._c.y
    };
    this._a = {
        x: 1 - this._c.x - this._b.x,
        y: 1 - this._c.y - this._b.y
    };
}

/**
 * Computes the point for a given t value.
 *
 * @param {number} t
 * @returns {Object} Returns an object with x and y properties
 */
CubicBezier.prototype.getPointForT = function(t) {
    // Special cases: starting and ending points
    if (t == 0 || t == 1) {
        return { x: t, y: t }
    }
    // check for correct t value (must be between 0 and 1)
    else if (!(t > 0) || !(t < 1)) {
        throw new RangeError("'t' must be a number between 0 and 1");
    }

    var point = {
        x: t*(3*this._a.x*t + 2*this._b.x) + this._c.x,
        y: t*(3*this._a.y*t + 2*this._b.y) + this._c.y
    };

    return point;
};

/**
 * Computes auxiliary points using De Casteljau's algorithm.
 *
 * @param {number} t must be greater than 0 and lower than 1.
 * @returns {Object} with members i0, i1, i2 (first iteration),
 *     j1, j2 (second iteration) and k (the exact point for t)
 */
CubicBezier.prototype._getAuxPoints = function(t){
    if (!(t > 0) || !(t < 1)) {
        throw new RangeError("'t' must be a number between 0 and 1");
    }

    // First series of auxiliary points
    var i0 = { // first control point of the left curve
            x: t * this._p1.x,
            y: t * this._p1.y
        },
        i1 = {
            x: this._p1.x + t*(this._p2.x - this._p1.x),
            y: this._p1.y + t*(this._p2.x - this._p1.y)
        },
        i2  = { // second control point of the right curve
            x: this._p2.x + t*(1 - this._p2.x),
            y: this._p2.y + t*(1 - this._p2.y)
        };

    // Second series of auxiliary points
    var j0 = { // second control point of the left curve
            x: i0.x + t*(i1.x - i0.x),
            y: i0.y + t*(i1.y - i0.y)
        },
        j1 = { // first control point of the right curve
            x: i1.x + t*(i2.x - i1.x),
            y: i1.y + t*(i2.y - i1.y)
        };

    // The division point (ending point of left curve, starting point of right curve)
    var k = {
            x: j0.x + t*(j1.x - j0.x),
            y: j0.y + t*(j1.y - j0.y)
        };

    return {
        i0: i0,
        i1: i1,
        i2: i2,
        j0: j0,
        j1: j1,
        k: k
    }
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
CubicBezier.prototype.divideAt(t) = function(t){
    var left = {},
        right = {},
        points = this._getAuxPoints(t);

    var i0 = points. i0,
        i1 = points. i1,
        i2 = points. i2,
        j0 = points. j0,
        j1 = points. j1,
        k = points. k;

    // Normalize derived points, so that the new curves starting/ending point
    // coordinates are (0, 0) respectively (1, 1)
    var factorX = k.x,
        factorY = k.y;

    left.p1 = {
        x: i0.x * factorX,
        y: i0.y * factorY
    };
    left.p2 = {
        x: j0.x * factorX,
        y: j0.y * factorY
    };

    right.p1 = {
        x: (j1.x - k.x) * (1 - factorX),
        x: (j1.y - k.y) * (1 - factorY)
    };

    return [
        new CubicBezier(left.p1.x, left.p1.y, left.p2.x, left.p2.y),
        new CubicBezier(right.p1.x, right.p1.y, right.p2.x, right.p2.y),
    ];
};
