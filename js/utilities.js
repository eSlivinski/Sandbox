d3.selection.prototype.moveToFront = function() {
  return this.each(function(){
    this.parentNode.appendChild(this);
  });
};

d3.selection.prototype.moveToBack = function() {
    return this.each(function() {
        var firstChild = this.parentNode.firstChild;
        if (firstChild) {
            this.parentNode.insertBefore(this, firstChild);
        }
    });
};

d3.selection.prototype.dataObj = function(prop) {
    var data = this.data()[0];
    return (!prop) ? data :
      (_.isArray(prop)) ? _.pick(data, prop) : _.get(data, prop);
};

var distance = function (a, b) {
  return Math.sqrt(Math.pow(b.x - a.x2, 2) + Math.pow(a.y2 - b.y, 2))
};

var nearestNeighbor = function (a, neighbors) {
  return _.chain(neighbors[0])
    .map(function (pt) {
      return {
        element: pt,
        distance: distance(a, d3.select(pt).data()[0])
      };
    })
    .sortBy('distance')
    .first()
    .value();
};

function getPosition (selection) {
  var element = selection.node(),
      tag = element.tagName,
      x = +((tag === 'circle') ? element.getAttribute('cx') : element.getAttribute('x')),
      y = +((tag === 'circle') ? element.getAttribute('cy') : element.getAttribute('y')),
      ctm = element.getCTM(),
      xn = ctm.e + x*ctm.a,
      yn = ctm.f + y*ctm.d;
  return { x: xn, y: yn };
}


/* Super Sketchy But Getting there */
function zoomTo (selection) {
    var pos = getPosition(selection),
        coords = selection.node().getBoundingClientRect(),
        dx = (coords.right - coords.left),
        dy = (coords.bottom - coords.top),
        x = (coords.right + pos.x - coords.width)/2,
        y = (coords.bottom + coords.top)/2 + (coords.height * 2),
        scale = (0.9 / Math.max(dx / w, dy / h)),
        translateX = w / 2 - scale * x,
        translateY = h / 2 - scale * y;

    return [scale, [translateX, translateY]];
}
