d3.select('#spliceDiagram svg').remove();

var ranges= {
  fiber_colors: ['blue', 'orange', 'green', 'brown', 'slate', 'white', 'red', 'black', 'yellow', 'violet', 'rose', 'aqua'],
  fiber_color_display: ['blue', 'darkorange', 'green', 'sienna', 'grey', 'snow', 'red', '#333', 'yellow', 'purple', 'palevioletred', 'aqua'],
  fiber_color_abrev: ['BL', 'OR', 'GR', 'BR', 'SL', 'WH', 'RD', 'BK', 'YL', 'VI', 'RS', 'AQ' ]
};

var bufferwidth= 25,
    spliceGap = 275,
    w = 600,
    h = 1500;

var highlightedSplice;

var colorScale = d3.scale.ordinal()
  .domain(ranges.fiber_color_abrev)
  .range(ranges.fiber_color_display);

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
      .attr('class', function(d,i) { return 'cables cable-'+ (i+1) +'' })
      .attr('transform', function(d, i) {
        return (i % 2) ? 'translate(' + ((w/2) + spliceGap) + ',0)':'translate(0,0)';
      });

    var buffer = fiberCable.selectAll('.buffer')
      .data(function(d) { return d.children; })
      .enter().append('g')
      .attr('class', 'buffer')
      .attr('transform', function(d, i) { return 'translate(0,' + (i * (h/d.children[0].buffer_count)) + ')'; });

    buffer.append('rect')
      .attr('width', w/2)
      .attr('height', function(d, i) { return h/d.children[0].buffer_count; })
      .attr('fill', function(d,i) { return colorScale(d.tube_buffer); });


    strand = buffer.selectAll('.fiber-strand')
      .data(function(d) { return d.children; })
      .enter().append('g')
      .attr('class', 'fiber-strand')
      .attr('transform', function(d, i) {
        var bwidth = (d.cable_id % 2) ? 0 : bufferwidth;
        return 'translate(' + bwidth + ',' + (i * (h/d.buffer_count/d.fiber_count)) + ')';
      });

    strand.append('rect')
      .attr('width', function() { return w/2 - bufferwidth; })
      .attr('height', function(d, i) { return h/d.buffer_count/d.fiber_count; })
      .attr('stroke', 'black')
      .attr('fill', 'white');

    strand.append('circle')
      .attr('r', function(d) { return h/d.buffer_count/d.fiber_count/2; })
      .attr('transform', function(d) {
        var bwidth = (d.cable_id % 2) ? 0 : (w/2 - bufferwidth);
        return 'translate(' + bwidth + ',' + h/d.buffer_count/d.fiber_count/2 + ')';
      });

    strand
      .on('mouseover', function(d) {
        highlightedSplice = d.circuit_id;
        highlightSplices();
      })
      .on('mouseout', function(d) {
        setTimeout(function () {
          if (highlightedSplice === d.circuit_id) {
            highlightedSplice = false;
            highlightSplices();
          }
        }, 100);
      });

  drawSplices();
}

function drawSplices () {
  var cable1 = d3.selectAll('.fiber-strand circle').filter(function(d) { return !(d.cable_id % 2); }),
      cable2 = d3.selectAll('.fiber-strand circle').filter(function(d) { return (d.cable_id % 2); });

  cable1.each(function(data) {
    if (!data.circuit_id) return;
    var pointA = getCircleCoords(d3.select(this));

    var matching = cable2.filter(function(d, i) { return d.circuit_id == data.circuit_id; })
      .each(function(d) {
        var pointB = getCircleCoords(d3.select(this));
        drawLine(pointA, pointB, d.circuit_id);
      });
  });

  highlightSplices();
}

function highlightSplices () {
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

function getCircleCoords (selection) {
  var element = selection.node(),
      x = +element.getAttribute('cx'),
      y = +element.getAttribute('cy'),
      coords = getElementPosition(element, {x:x, y:y});
  return coords;
}

function getElementPosition (element, coords) {
  var ctm = element.getCTM(),
    xn = ctm.e + coords.x*ctm.a,
    yn = ctm.f + coords.y*ctm.d;
  return { x: xn, y: yn };
}

function drawLine (pointA, pointB, circuitID) {
  spliceDiagram.selectAll('splices')
    .data([ { circuit_id : circuitID } ])
    .enter().append('line')
    .attr('x1', pointA.x).attr('y1', pointA.y)
    .attr('x2', pointB.x).attr('y2', pointB.y)
    .attr('class', 'splice')
    .attr('stroke', 'black');
}

function zoomTo(v) {
  var k = diameter / v[2]; view = v;
  node.attr("transform", function(d) { return "translate(" + (d.x - v[0]) * k + "," + (d.y - v[1]) * k + ")"; });
  circle.attr("r", function(d) { return d.r * k; });
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

  makeDiagram(connections);
})();
