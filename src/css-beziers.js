/**
 * Represents a two-dimensional cubic bezier curve with the starting
 * point (0, 0) and the end point (1, 1).
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

    // Pre-calculating values for point computation.
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
CubicBezier.prototype.pointForT = function(t) {
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
 * Divides the bezier curve into two bezier functions.
 *
 * @param {number} t
 * @returns {CubicBezier[]} Returns an array containing two bezier curves
 *     to the left and the right of t.
 */
CubicBezier.prototype.divideAt(t) = function(t){
    // Dividing the bezier curve using De Casteljau's algorithm


};
