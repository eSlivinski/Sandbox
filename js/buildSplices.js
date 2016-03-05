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

var highlight= '#FF5722' /* Deep Orange */,
    snappingThreshold = 20;

var bufferwidth= 75, spliceGap = 275, w = 600, h = 1500;

var highlightedSplice;

var colorScale = d3.scale.ordinal()
  .domain(ranges.fiber_color_abrev)
  .range(ranges.fiber_color_display);

var colorScaleLight = d3.scale.ordinal()
  .domain(ranges.fiber_color_abrev)
  .range(ranges.fiber_color_light);

var fiberScale = d3.scale.ordinal();

var cableScale = d3.scale.ordinal()
  .domain([0,0.5,1])
  .rangeRoundBands([0, w+spliceGap])

var bufferScale = d3.scale.ordinal()
    .rangeBands([0, h]);

var alignScale = d3.scale.ordinal()
  .domain([0, 1])
  .rangeBands([bufferwidth, 0]);

function makeDiagram (connectionData) {
    spliceDiagram = d3.select('#spliceDiagram')
      .append('svg')
      .attr('width', w + spliceGap)
      .attr('height', h)
    .append('g')
      .attr('transform', 'translate(0,0)')
      .call(zoom.event);

    var spliceContainer = spliceDiagram.append('g')
      .attr('class', 'spliceContainer');

    var fiberCable = spliceDiagram.selectAll('.cables')
      .data(connectionData)
    .enter().append('g')
      .attr('class', 'cables')
      .attr('transform', function (d, i) { return 'translate(' + (cableScale(d.cable_id)) + ',0)'; });

    var buffer = fiberCable.selectAll('.buffer')
      .data(function (d) { return d.children; })
    .enter().append('g')
      .attr('class', 'buffer')
      .attr('transform', function (d, i) { return 'translate(0,' + bufferScale(d.buffer_number) + ')'; });

    buffer.append('rect')
      .attr('width', cableScale.rangeBand())
      .attr('height', function (d, i) { return bufferScale.rangeBand(); })
      .call(buffer_DefaultStyle)
      .on('click', function (d, i) { handleZoom(d3.select(this)); })
      .on('mouseover', function() { d3.select(this.parentNode).moveToFront(); });


    var strand = buffer.selectAll('.fiber-strand')
      .data(function (d) { return d.children; })
    .enter().append('g')
      .attr('class', 'fiber-strand')
      .attr('transform', function (d, i) {
        var bwidth = (d.cable_id == 1) ? 0 : bufferwidth;
        return 'translate(' + bwidth + ',' + fiberScale(d.buffer_strand_index) + ')';
      });

    strand.append('rect')
      .attr('width', function () { return w/2 - bufferwidth; })
      .attr('height', function () { return fiberScale.rangeBand(); })
      .call(fiber_DefaultStyle)
      .on('mouseover', function() { d3.select(this.parentNode).moveToFront(); });

    strand.append('circle')
      .attr('class', 'connector')
      .attr('transform', function (d) {
        var bwidth = (d.cable_id == 1) ? 0 : (w/2 - bufferwidth);
        return 'translate(' + bwidth + ',' + fiberScale.rangeBand()/2 + ')';
      })
      .attr('r', function (d) { return fiberScale.rangeBand()/2; })
      .each(function (d) {
        var position = getPosition(d3.select(this));
        _.extend(d, {
          x: position.x, y: position.y,
          x2: position.x, y2: position.y
        });
        drawLine(d, {x: d.x2, y: d.y2 }, d);
      })
      .call(drag)
      .call(node_DefaultStyle)
      .on('mouseover', function(data) {
        if (!d3.select(this).classed('joined')) {
          d3.select(this).call(node_HoverStyle);
        }
      })
      .on('mouseout', function() { setNodeStyle(d3.select(this)); });

    strand
      .on('mouseover', highlightSplices)
      .on('mouseout', removeSpliceHighlight);

    drawSplices()

}
var forceDrag = function (selectionA, selectionB) {
  var parentPosition = getPosition(d3.select(selectionA.node().parentNode));
  var pointA = getPosition(selectionA),
      pointB = getPosition(selectionB),
      event = {
        x: pointB.x - parentPosition.x,
        y: pointB.y - parentPosition.y,
        dx: selectionA.dataObj('x') + (pointB.x - parentPosition.x),
        dy: selectionA.dataObj('y') + (pointB.y - parentPosition.y)
      };
    console.log(pointA, pointB, parentPosition, event)

  event_Dragging(selectionA, event);
  event_DragStop(selectionA, event);
}

function drawSplices () {
  var cable1 = d3.selectAll('.fiber-strand circle')
    .filter(function (d) { return (!d.cable_id && d.circuit_id); });
  //
  // var cable2 = d3.selectAll('.fiber-strand circle')
  //   .filter(function (d) { return (d.cable_id && d.circuit_id); });

  d3.selectAll('.fiber-strand circle')
    .filter(function (d) {
      return ( !d.cable_id
               && d.circuit_id);
    })
    .each(function (data) {
      var selection = d3.select(this)
      var matching = d3.selectAll('.fiber-strand circle')
        .filter(function (d) {
          return ( !!d.cable_id
                   && d.circuit_id
                   && data.circuit_id === d.circuit_id );
        })
        .each(function (d) {
          forceDrag(selection, d3.select(this));
        })
      //   .classed('joined', true)
      //   .call(setNodeStyle);
      //
      // if (matching.size()) {
      //   selection.classed('joined', true)
      //   .call(setNodeStyle);
      // }
  });

  highlightSplices();
}


function drawLine (pointA, pointB, data) {
  d3.select('.spliceContainer').selectAll('splices')
    .data([ data ])
    .enter().append('line')
    .attr('x1', pointA.x).attr('y1', pointA.y)
    .attr('x2', pointB.x).attr('y2', pointB.y)
    .attr('class', 'splice')
    .attr('node_index', data.index)
    .call(splice_DefaultStyle);
}

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
    var cableAttr = _.pick(buffers[0], ['cable_id', 'fiber_capacity']);
    return _.extend(cableAttr, { children: buffers });
  });
  _.each(connections, function (cable) {
    cable.grandchildren = _.chain(cable.children)
      .map(function (buffer) { return buffer.children; })
      .flatten().value();
    cable.fibers
  });


  bufferScale
    .domain(_.chain(connections).map('children').flatten().map('buffer_number').flatten().uniq().sortBy().value());

  fiberScale
    .rangeBands([0, bufferScale.rangeBand()])
    .domain(_.chain(connections).map('grandchildren').flatten().map('buffer_strand_index').flatten().uniq().sortBy().value());

  // cableScale.domain(_.map(connections, 'cable_id'));
  makeDiagram(connections);

} init();
