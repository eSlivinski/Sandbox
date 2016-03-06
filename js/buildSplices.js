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
    spliceGap = 275,
    w = 600,
    h = 1500;

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

function makeDiagram (connectionData) {
    spliceDiagram = d3.select('#spliceDiagram')
      .append('svg')
      .attr('width', w + spliceGap)
      .attr('height', h)
    .append('g')
      .attr('transform', 'translate(0,0)')
      .call(zoom.event);

    var fiberCable = spliceDiagram.selectAll('.cables')
      .data(connectionData)
    .enter().append('g')
      .attr('class', 'cables')
      .attr('transform', function (d, i) {
        return 'translate(' + (i*(w/2+spliceGap)) + ',0)';
      });

    var buffer = fiberCable.selectAll('.buffer-group')
      .data(function (d) { return d.children; })
    .enter().append('g')
      .attr('class', 'buffer-group')
      .attr('transform', function (d, i) {
        d.x = 0;
        d.y = bufferScale(d.buffer_number);
        return 'translate(' + [ d.x, d.y ] + ')';
       });

    buffer.append('rect')
      .attr('class', 'buffer')
      .attr('width', w/2)
      .attr('height', function (d, i) {
        d.h = h/d.buffer_count;
        return d.h;
      })
      .call(buffer_DefaultStyle)
      .on('click', function() { d3.select(this.parentNode).call(collapse) })
      // .on('click', function (d, i) { d3.select(this).call(handleZoom); })
      .on('mouseover', function() { d3.select(this.parentNode).moveToFront(); });


    strand = buffer.selectAll('.fiber-strand')
      .data(function (d) { return d.children; })
      .enter().append('rect')
      .attr('transform', function (d, i) {
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
        return d.h;
      })
      .attr('class', 'fiber-strand')
      .call(fiber_DefaultStyle)
      .on('mouseover', highlightSplices)
      .on('mouseout', removeSpliceHighlight);


    nodeContainer = spliceDiagram.selectAll('.spliceNodes')
      .data(connectionData)
      .enter().append('g')
      .attr('class','spliceNodes');

    nodeContainer.selectAll('.splice-node')
      .data(function (d) { return d.grandchildren; })
      .enter().append('circle')
      .attr('transform', function(d, i) {
        var bufferPos = (d.cable_id) ? spliceGap : 0;
        d.x2 =  w/2 + bufferPos;
        d.y2 = (d.fiber_number-1) * h/d.fiber_capacity + h/d.fiber_capacity/2;
        drawLine({x:d.x2, y: d.y2 }, {x:d.x2, y: d.y2 }, d);
        return 'translate(' + [d.x2, d.y2] + ')';
      })
      .attr('class', 'splice-node')
      .attr('r', 0)
      .call(drag)
      .call(drawSplices);

      // nodeContainer.selectAll('path')
      //   .data(function (d) { return d.grandchildren; })
      //   .enter().append('line')
      //   .attr('x1', function(d, i) {
      //     var bufferPos = (d.cable_id) ? spliceGap : 0;
      //     d.x2 =  w/2 + bufferPos;
      //     return d.x2;
      //   })
      //   .attr('y1', function(d) {
      //     d.y2 = (d.fiber_number-1) * h/d.fiber_capacity + h/d.fiber_capacity/2;
      //     rerturn d.y2;
      //   })
      //   .attr('x2', function(d) { return 10+x2; })
      //   .attr('y2', function(d) { return 10+y2; })

    // strand.append('circle')
    //   .attr('class', 'connector')
    //   .attr('transform', function (d) {
    //     var bwidth = (d.cable_id == 1) ? 0 : (w/2 - bufferwidth);
    //     return 'translate(' + bwidth + ',' + fiberScale.rangeBand()/2 + ')';
    //   })
    //   .attr('r', function (d) { return fiberScale.rangeBand()/2; })
    //   .each(function (d) {
    //     var position = getPosition(d3.select(this));
    //     _.extend(d, {
    //       x: position.x, y: position.y,
    //       x2: position.x, y2: position.y
    //     });
    //     drawLine(d, {x: d.x2, y: d.y2 }, d);
    //   })
    //   .call(drag)
    //   .call(node_DefaultStyle)
    //   .on('mouseover', function(data) {
    //     if (!d3.select(this).classed('joined')) {
    //       d3.select(this).call(node_HoverStyle);
    //     }
    //   })
    //   .on('mouseout', function() { setNodeStyle(d3.select(this)); });
    //
    // strand
    //   .on('mouseover', highlightSplices)
    //   .on('mouseout', removeSpliceHighlight);

    // drawSplices()

    setTimeout(function () {
      d3.selectAll('.splice-node')
        .call(setNodeStyle)
        .transition().duration(1000).delay(200)
        .attr('r', function(d) {
          d.r = h/d.fiber_capacity/2;
          return d.r;
        });
    }, 500);

}

function drawSplices () {
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
        .each(function (d) {
          forceDrag(selection, d3.select(this));
        });
  });

  highlightSplices();
}


function drawLine (pointA, pointB, data) {
  d3.select('.spliceNodes').selectAll('splice')
    .data([ data ])
    .enter().append('line')
    .attr('x1', pointA.x).attr('y1', pointA.y)
    .attr('x2', pointB.x).attr('y2', pointB.y)
    .attr('class', 'splice')
    .attr('node_index', data.index)
    .call(splice_DefaultStyle)
    .moveToBack();
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
    var cableAttr = _.pick(buffers[0], ['cable_id', 'fiber_capacity', 'buffer_count']);
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
    .rangeBands([0, h/_.chain(connections).map('buffer_count').max().value()])
    .domain(_.chain(connections).map('grandchildren').flatten().map('buffer_strand_index').flatten().uniq().sortBy().value());

  // cableScale.domain(_.map(connections, 'cable_id'));
  makeDiagram(connections);

} init();
