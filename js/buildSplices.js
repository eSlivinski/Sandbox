d3.select('#spliceDiagram svg').remove();

var ranges= {
  fiber_colors: ['blue', 'orange', 'green', 'brown', 'slate', 'white', 'red', 'black', 'yellow', 'violet', 'rose', 'aqua'],
  fiber_color_display: ['blue', 'darkorange', 'green', 'sienna', 'grey', 'snow', 'red', '#333', 'yellow', 'purple', 'palevioletred', 'aqua'],
  fiber_color_abrev: ['BL', 'OR', 'GR', 'BR', 'SL', 'WH', 'RD', 'BK', 'YL', 'VI', 'RS', 'AQ' ]
};

var bufferwidth= 25, spliceGap = 275, w = 600, h = 1500;

var highlightedSplice,
    dragging = false;

var colorScale = d3.scale.ordinal()
  .domain(ranges.fiber_color_abrev)
  .range(ranges.fiber_color_display);

var fiberScale = d3.scale.linear()
  .range([0, h]);

var cableScale = d3.scale.ordinal()
  .range([0, w/2 + spliceGap]);

function makeDiagram (connectionData) {
    spliceDiagram = d3.select('#spliceDiagram')
      .append('svg')
      .attr('width', w + spliceGap)
      .attr('height', h)
      .append('g')
      .attr('transform', 'translate(0,0)');

    var fiberCable = spliceDiagram.selectAll('.cables')
      .data(connectionData)
      .enter().append('g')
      .attr('transform', function(d, i) { return 'translate(' + (cableScale(d.cable_id)) + ',0)'; });

    var buffer = fiberCable.selectAll('.buffer')
      .data(function(d) { return d.children; })
      .enter().append('g')
      .attr('class', 'buffer')
      .attr('transform', function(d, i) { return 'translate(0,' + fiberScale(d.children[0].fiber_number) + ')'; })
    .append('rect')
      .attr('width', w/2)
      .attr('height', function(d, i) { return fiberScale(d.children.length + 1); })
      .attr('fill', function(d,i) { return colorScale(d.tube_buffer); });


    strand = fiberCable.selectAll('.fiber-strand')
      .data(function(d) { return d.grandchildren; })
      .enter().append('g')
      .attr('class', 'fiber-strand')
      .attr('transform', function(d, i) {
        var bwidth = (d.cable_id == 1) ? 0 : bufferwidth;
        return 'translate(' + bwidth + ',' + fiberScale(d.fiber_number) + ')';
      });

    strand.append('rect')
      .attr('width', function() { return w/2 - bufferwidth; })
      .attr('height', function(d, i) { return fiberScale(13); })
      .attr('stroke', 'black')
      .attr('fill', 'white');

    strand.append('circle')
      .attr('transform', function(d) {
        var bwidth = (d.cable_id == 1) ? 0 : (w/2 - bufferwidth);
        return 'translate(' + bwidth + ',' + fiberScale(2)/2 + ')';
      })
      .attr('r', function(d) { return fiberScale(2)/2; })
      .on('mouseover', setNodeHoverStyle)
      .on('mouseout', resetNodeHoverStyle)
      .each(function(d) { _.extend(d, getPosition(d3.select(this))); })
      .call(drag);;

    strand
      .on('mouseover', highlightSplices)
      .on('mouseout', removeSpliceHighlight);
  drawSplices();
}

function drawSplices () {
  var cable1 = d3.selectAll('.fiber-strand circle').filter(function(d) { return (d.cable_id == 0); }),
      cable2 = d3.selectAll('.fiber-strand circle').filter(function(d) { return (d.cable_id == 1); });

  cable1.each(function(data) {
    if (!data.circuit_id) return;
    var pointA = getPosition(d3.select(this));

    var matching = cable2.filter(function(d, i) { return d.circuit_id == data.circuit_id; })
      .each(function(d) {
        var pointB = getPosition(d3.select(this));
        drawLine(pointA, pointB, _.pick(d, 'circuit_id'));
      });
  });

  highlightSplices();
}

function highlightSplices (d, i) {
  highlightedSplice = (d) ? d.circuit_id : false;

  d3.selectAll('.splice')
    .transition().duration(200)
    .attr('stroke-width', function(d) { return (!highlightedSplice) ? 3 : (d.circuit_id == highlightedSplice) ? 4 : 1; })
    .attr('opacity', function(d) { return (!highlightedSplice || d.circuit_id == highlightedSplice) ? 1 : 0.3; });

  d3.selectAll('.fiber-strand rect')
    .transition().duration(200)
    .attr('fill', function(d,i) {
      var fillColor = d3.hsl(colorScale(d.fiber_color)),
          altColor = (d.fiber_color == 'WH') ? '#ddd' : '#fefefe',
          inUse = d3.scale.linear().domain([1,10]).range([fillColor, altColor]);
      return ((!highlightedSplice && d.circuit_id) || (highlightedSplice && highlightedSplice !== d.circuit_id)) ? inUse(7) : fillColor;
    })
    .attr('stroke-width', function(d) {
      return (highlightedSplice && (highlightedSplice === d.circuit_id)) ? 1 : 0;
    });
}

function removeSpliceHighlight (d, i) {
  setTimeout(function () {
    if (highlightedSplice === d.circuit_id) {
      highlightedSplice = false;
      highlightSplices();
    }
  }, 100);
}

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

function drawLine (pointA, pointB, data) {
  spliceDiagram.selectAll('splices')
    .data([ data ])
    .enter().append('line')
    .attr('x1', pointA.x).attr('y1', pointA.y)
    .attr('x2', pointB.x).attr('y2', pointB.y)
    .attr('class', 'splice')
    .attr('stroke', 'black');
}

var drag = d3.behavior.drag()
  .on('dragstart', function(d,i) { dragging = _.pick(d, ['fiber_number', 'cable_id']); })
  .on('dragend', function(d,i) { dragging = false; })
  .on('drag', function(d,i) {
    d3.select(this).attr('transform', function(d,i) {
      d3.selectAll('.splice').filter(function(d) { return JSON.stringify(d) == JSON.stringify(dragging); }).remove();
      drawLine(d, {x: d3.event.x + bufferwidth, y: d3.event.y + fiberScale(d.fiber_number) }, dragging);

      return 'translate(' + d3.event.x +',' + d3.event.y + ')'
    });
  });

/* Super Sketchy But Getting there */
function zoomTo() {
  d3.selectAll('.buffer rect')
  .filter(function(d) { return d.cable_id == 0 && d.buffer_number == 2 })
  .each(function(d) {
    var coords = getPosition(d3.select(this)),
      bufferHieght = fiberScale(_.last(d.children).fiber_number) * 3;
    spliceDiagram.attr('transform', 'translate('+ coords.x +','+ ((350 - coords.y) - (bufferHieght/2)) +') scale(3)');
  })
}

function setNodeHoverStyle (d, i) {
  var selection = d3.select(this),
    draggAttr = _.pick(d, ['fiber_number', 'cable_id']),
    isMatch = (dragging && !d.circuit_id && JSON.stringify(draggAttr) !== JSON.stringify(dragging));

  selection
    .transition().duration(800)
    .attr('stroke-width', function(d) { return isMatch ? 3 : 0; })
    .attr('stroke', function(d) { return isMatch ? 'red' : 'transparent'; });
}

function resetNodeHoverStyle (d, i) {
  d3.select(this)
    .transition().duration(800)
    .attr('stroke-width', 3)
    .attr('stroke', 'transparent');
}

(function () {
  connections = _.map(connections, function(cable, i) {
    var buffers = _.map(_.values(cable), function(buffer) {
      var strands = _.each(buffer, function(strand) { strand.cable_id = i });
      var bufferAttr = _.pick(strands[0], ['buffer_count', 'buffer_number', 'cable_id', 'tube_buffer']);
      return _.extend(bufferAttr, { children: strands });
    });
    var cableAttr = _.pick(buffers[0], ['cable_id']);
    return _.extend(cableAttr, { children: buffers });
  });
  _.each(connections, function(cable){
    cable.grandchildren = _.chain(cable.children)
      .map(function(buffer) { return buffer.children; })
      .flatten().value();
  });

  fiberScale.domain([1, 145]);
  cableScale.domain([0, 1]);

  makeDiagram(connections);
})();
