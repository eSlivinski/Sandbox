var ranges= {
  fiber_color_display: [
    '#2196F3' /* BL */,
    '#FF9800' /* OR */,
    '#8BC34A' /* GR */,
    '#795548' /* BR */,
    '#607D8B' /* SL */,
    '#F5F5F5' /* WH */,
    '#f44336' /* RD */,
    '#333333' /* BK */,
    '#FFEB3B' /* YL */,
    '#673AB7' /* VI */,
    '#E91E63' /* RS */,
    '#00BCD4' /* AQ */
  ],
  fiber_color_light: [
    '#BBDEFB'/* BL */,
    '#FFE0B2'/* OR */,
    '#DCEDC8'/* GR */,
    '#BCAAA4'/* BR */,
    '#B0BEC5'/* SL */,
    '#FAFAFA'/* WH */,
    '#ffcdd2'/* RD */,
    '#999999'/* BK */,
    '#FFF9C4'/* YL */,
    '#D1C4E9'/* VI */,
    '#F8BBD0'/* RS */,
    '#B2EBF2'/* AQ */
  ],
  fiber_color_abrev: ['BL', 'OR', 'GR', 'BR', 'SL', 'WH', 'RD', 'BK', 'YL', 'VI', 'RS', 'AQ' ]
};

var highlight= '#FF5722',    // Deep Orange
    snappingThreshold = 20;  // Minimum distance between spliced cables

var bufferwidth= 75,
    spliceGap = 75,
    w = 200,
    h = 900;

var highlightedSplice;

var colorScale = d3.scale.ordinal()
  .domain(ranges.fiber_color_abrev)
  .range(ranges.fiber_color_display);

var colorScaleLight = d3.scale.ordinal()
  .domain(ranges.fiber_color_abrev)
  .range(ranges.fiber_color_light);

var fiberScale = d3.scale.ordinal();

var bufferScale = d3.scale.ordinal()
    .rangeBands([0, h]);

/* Create Elements */
var makeDiagram = function (connectionData) {
    var spliceDiagram = d3.select('#spliceDiagram')
      .append('svg')
      .attr('width', w + spliceGap)
      .attr('height', h)
      .append('g')
      .attr('transform', 'translate(0,0)')
      .call(zoom.event); // Make Sure the top of the diagram is at the top of the screen

    var fiberCable = spliceDiagram.selectAll('.cables')
      .data(connectionData)
      .enter().append('g')
      .attr('class', 'cables')
      .attr('transform', function (d, i) {
        return 'translate(' + (d.cable_id * (w/2+spliceGap)) + ',0)';
      });

    var bufferGroup = fiberCable.selectAll('.buffer-group')
      .data(function (d) { return d.children; })
      .enter().append('g')
      .attr('class', 'buffer-group')
      .attr('transform', function (d, i) {
        d.x = 0;
        d.y = bufferScale(d.buffer_number);
        return 'translate(' + [ d.x, d.y ] + ')';
       });

    var buffer = bufferGroup.append('rect')
      .attr('class', 'buffer')
      .attr('width', function(d) {
        d.w = w/2;
        return d.w;
      })
      .attr('height', function (d, i) {
        d.h = bufferScale.rangeBand();
        return 0;
      });

    var strand = bufferGroup.selectAll('.fiber-strand')
      .data(function (d) { return d.children; })
      .enter().append('rect')
      .attr('transform', function (d) {
        d.x = (d.cable_id == 1) ? 0 : bufferwidth;
        d.y = fiberScale(d.buffer_strand_index);
        return 'translate(' + [ d.x, d.y ] + ')';
      })
      .attr('width', function (d) {
        d.w = w/2 - bufferwidth;
        return d.w;
      })
      .attr('height', function (d) {
        d.h = fiberScale.rangeBand();
        return 0;
      })
      .attr('class', 'fiber-strand');

    var nodeContainer = spliceDiagram.selectAll('.spliceNodes')
      .data(connectionData)
      .enter().append('g')
      .attr('class','spliceNodes');

    var nodes = nodeContainer.selectAll('.splice-node')
      .data(function (d) { return d.grandchildren; })
      .enter().append('circle')
      .attr('datum', function(d) {
        var bufferPos = (d.cable_id) ? spliceGap : 0;
        d.x2 =  w/2 + bufferPos;
        d.y2 = (d.fiber_number-1) * h/d.fiber_capacity + h/d.fiber_capacity/2;
        drawLine({x:d.x2, y: d.y2 }, {x:d.x2, y: d.y2 }, d);
      })
      .attr('transform', function(d, i) { return 'translate(' + [d.x2, d.y2] + ')'; })
      .attr('class', 'splice-node')
      .attr('r', function(d) {
        d.r = h/d.fiber_capacity/2;
        return 0;
      })
      .call(drag)
      .call(matchSplices);

  initialAnimation();
};

/* Decide what strands are already joined */
var matchSplices = function () {
  d3.selectAll('.splice-node')
    .filter(function (d) {
      return ( !d.cable_id
               && d.circuit_id);
    })
    .each(function (data) {
      var selection = d3.select(this)
      var matching = d3.selectAll('.splice-node')
        .filter(function (d) {
          return ( !!d.cable_id
                   && d.circuit_id
                   && data.circuit_id === d.circuit_id );
        })
        .each(function (d, i) {
          var pointA = getPosition(selection),
              pointB = getPosition(d3.select(this));
          forceDrag(selection, pointA, pointB);
        });
  });
}

/* Connect Points A and B - Bind Data */
var drawLine = function (pointA, pointB, data) {
  d3.select('.spliceNodes').selectAll('splice')
    .data([ data ])
    .enter().append('line')
    .attr('x1', pointA.x).attr('y1', pointA.y)
    .attr('x2', pointB.x).attr('y2', pointB.y)
    .attr('class', 'splice')
    .attr('node_index', data.index)
    .attr('stroke-width', 0)
    .moveToBack();
};

/* Pretty */
var initialAnimation = function () {
  d3.transition()
    .delay(600)
    .each(function() {
      d3.selectAll('.buffer')
        .call(buffer_DefaultStyle);
      d3.selectAll('.fiber-strand')
        .call(fiber_DefaultStyle);
    })
    .transition()
    .each(function() {
      d3.selectAll('.buffer')
      .transition().duration(700)
      .attr('height', function(d) { return d.h; });
      d3.selectAll('.fiber-strand')
      .transition().duration(700)
      .attr('height', function(d) { return d.h; });
    })
    .transition()
    .each(function() {
      d3.selectAll('.splice-node')
        .call(setNodeStyle);
      d3.selectAll('.splice-node')
        .transition().duration(700)
        .attr('r', function(d) { return d.r; });
    })
    .transition()
    .each(function() {
      d3.selectAll('.splice')
        .transition()
        .duration(700)
        .call(splice_DefaultStyle);
    })
    .each('end', function() {
        d3.selectAll('.buffer')
          // .on('click', function() { d3.select(this.parentNode).call(collapse) })
          .on('mouseover', function() { d3.select(this.parentNode).moveToFront(); });

        d3.selectAll('.fiber-strand')
          .on('mouseover', highlightSplices)
          .on('mouseout', removeSpliceHighlight);
    });
};

/* Build Data Structure */
function init () {
  d3.select('#spliceDiagram svg').remove();

  connections = _.map(connections, function (cable, index) {
    var buffers = _.map(_.values(cable), function (buffer) {
      var strands = _.each(buffer, function (strand) {
        strand.cable_id = index;
        strand.fiber_capacity = strand.buffer_count * strand.fiber_count;
        strand.index = (strand.fiber_number + (index * strand.fiber_capacity));
      });
      var bufferAttr = _.pick(strands[0], ['buffer_count', 'buffer_number', 'cable_id', 'tube_buffer', 'fiber_capacity']);
      return _.extend(bufferAttr, { children: strands });
    });
    var cableAttr = _.pick(buffers[0], ['cable_id', 'fiber_capacity', 'buffer_count']);
    return _.extend(cableAttr, { children: buffers });
  });
  _.each(connections, function (cable) {
    cable.grandchildren = _.chain(cable.children)
      .map(function (buffer) { return buffer.children; })
      .flatten().value();
    cable.fibers
  });

  var bufferIndexes = _.chain(connections)
    .map('children').flatten()
    .map('buffer_number').flatten()
    .uniq().sortBy().value();

  var strandIndexes = _.chain(connections)
    .map('grandchildren').flatten()
    .map('buffer_strand_index').flatten()
    .uniq().sortBy().value();


  /* Complete Scale Definitions */
  bufferScale
    .domain(bufferIndexes);

  fiberScale
    .rangeBands([0, h/_.chain(connections).map('buffer_count').max().value()])
    .domain(strandIndexes);


  makeDiagram(connections);

} init();
