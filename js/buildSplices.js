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

var colorScale = d3.scale.ordinal()
  .domain(ranges.fiber_color_abrev)
  .range(ranges.fiber_color_display);

// var x = d3.scale.linear().range([0, w]),
//     y = d3.scale.linear().range([h, 0]);
//
// var line = d3.svg.line()
//     .x(function(d) { return x(d.x); })
//     .y(function(d) { return y(d.y); });

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
      .attr('class', 'fiber-strand-rect')
      .attr('width', function() { return w/2 - bufferwidth; })
      .attr('height', function(d, i) { return h/d.buffer_count/d.fiber_count; })
      .attr('fill', function(d,i) {
        var fillColor = d3.hsl(colorScale(d.fiber_color)),
            altColor = (d.fiber_color == 'WH') ? '#55555' : '#fefefe',
            inUse = d3.scale.linear().domain([1,10]).range([fillColor, altColor]);
        return (d.circuit_id) ? inUse(7) : fillColor;
      });

    strand.append('circle')
      .attr('r', function(d) { return h/d.buffer_count/d.fiber_count/2; })
      .attr('transform', function(d) {
        var bwidth = (d.cable_id % 2) ? 0 : (w/2 - bufferwidth);
        return 'translate(' + bwidth + ',' + h/d.buffer_count/d.fiber_count/2 + ')';
      })
      .on('click', function(data) {
        var circuitID = data.circuit_id;
        if (!data.circuit_id) return;
          var clickedCoords = getCircleCoords(d3.select(this));

          var matching = d3.selectAll('.fiber-strand circle')
            .filter(function(d, i) { return ((d.cable_id !== data.cable_id) && (d.circuit_id == circuitID)); })
            .each(function(selection) {
              var coords = getCircleCoords(d3.select(this));
              drawLine(clickedCoords, coords, circuitID);
            });
      });
}

function getCircleCoords (selection) {
  var element = selection.node(),
      x = +element.getAttribute('cx'),
      y = +element.getAttribute('cy'),
      coords = getElementCoords(element, {x:x, y:y});
  return coords;
}

function getElementCoords (element, coords) {
    var ctm = element.getCTM(),
    xn = ctm.e + coords.x*ctm.a,
    yn = ctm.f + coords.y*ctm.d;
    return { x: xn, y: yn };
}

function drawLine (pointA, pointB, circuitID) {
  spliceDiagram.selectAll('.splices')
    .data([ { circuit_id : circuitID } ])
    .enter().append('line')
    .attr('x1', pointA.x).attr('y1', pointA.y)
    .attr('x2', pointB.x).attr('y2', pointB.y)
    .attr('stroke-width', 2)
    .attr('stroke', 'black')
}




function formatData() {
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
}

(function() {
  formatData();
})();
