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

/* Calculate Elements Closest Neighbor From an Array of Potentials */
var nearestNeighbor = function (a, neighbors) {
  var distanceList = _.map(neighbors[0], function (pt) {
    var b= d3.select(pt).dataObj(),
        dx = a.x2 - b.x2,
        dy = a.y2 - b.y2;

    return { distance: Math.sqrt( dx*dx + dy*dy ), element:pt }
  });
  distanceList = _.sortBy(distanceList, 'distance');
  return distanceList[0];
};

/* X, Y Coordinates of Transformed Elements */
var getPosition = function (selection) {
  var element = selection.node(),
      tag = element.tagName,
      x = +((tag === 'circle') ? element.getAttribute('cx') : element.getAttribute('x')),
      y = +((tag === 'circle') ? element.getAttribute('cy') : element.getAttribute('y')),
      ctm = element.getCTM(),
      xn = ctm.e + x*ctm.a,
      yn = ctm.f + y*ctm.d;
  return { x: xn, y: yn };
}

/* Reposition Splice Nodes & From pointA >> pointB */
var forceDrag = function (selection, pointA, pointB) {
  var event = {
        x: pointB.x,
        y: pointB.y,
        dx: pointB.x - pointA.x,
        dy: pointB.y - pointA.y
      };

  event_Dragging(selection, event);
  event_DragStop(selection, event);
};


/* Super Sketchy But Getting there */
var zoomTo = function (selection) {
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
};

/* Play Animation Array */
var animate = function (queue, i) {
  if(i < queue.length - 1){
    i = i + 1;
    return queue[i]().each("end", function() { animate(queue, i) })
  } else {
    return true;
  }
}
