/* Zooming Diagram Container */
var zoom = d3.behavior.zoom()
    .translate([0, 0])
    .scale(1)
    .scaleExtent([1, 8])
    .on("zoom", zoomed);

function zoomed() {
    d3.select('#spliceDiagram g')
      .attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
}

function handleZoom (selection) {
  var zooming = spliceDiagram.classed('zooming'),
      transition = (!zooming) ? zoomTo(selection) : [1, [0,0]];

  spliceDiagram
    .classed('zooming', !zooming)
    .transition().duration(750)
    .call(zoom.translate(transition[1]).scale(transition[0]).event);
}


/* Dragging Connectors */
var drag = d3.behavior.drag()
  .on('dragstart', function () { event_DragStart(d3.select(this), d3.event); })
  .on('drag', function () { event_Dragging(d3.select(this), d3.event); })
  .on('dragend', function () { event_DragStop(d3.select(this), d3.event); });

var event_DragStart = function (selection, event) {
  selection.classed('dragging', true);
  setNodeStyle();
};

var event_Dragging = function(selection, event) {
  selection.attr('transform', function (d, i) {
    d.x2 += event.dx,
    d.y2 += event.dy;

    return 'translate(' + event.x +',' + event.y + ')'
  });
};

var event_DragStop = function (selection, event) {
  selection.classed('dragging', false);

  var data = selection.dataObj()

  var connectionPts = d3.selectAll('.splice-node')
    .filter(function(d) {
      return ( d.cable_id !== data.cable_id );
    })
  var nearest = nearestNeighbor(data, connectionPts);

  if (nearest.element && nearest.distance <= snappingThreshold) {
    var matched = d3.select(nearest.element)
      .call(join, data);

    selection
      .call(join, matched.dataObj());
  }
};

var join = function (selection, data) {
  selection
  .classed('joined', true)
  .attr('datum', function (d) { d.joinData = data; })
  .attr('fill', highlight)
};

var collapse = function(selection) {
  var isCollapsed = false,
      compression = 0.3,
      collapseSpeed = 500;

  selection
    .attr('datum', function(d) {
      isCollapsed = !!d.collapsed;
      d.collapsed = !isCollapsed;
    })
    .classed('collapsed', !isCollapsed);

  var fiberCable = d3.select(selection.node().parentNode),
      collapsedBuffers = fiberCable.selectAll('.buffer-group.collapsed'),
      expandedBuffers = fiberCable.selectAll('.buffer-group:not(.collapsed)'),
      totalCollapsed = collapsedBuffers.size(),
      totalExpanded = expandedBuffers.size(),
      collapsedHeight = bufferScale.rangeBand() * compression,
      excessHeight = totalCollapsed * bufferScale.rangeBand() * (1 - compression),
      expandedHeight = bufferScale.rangeBand() + excessHeight/totalExpanded;

  var bufferHeightLookup = {};

  fiberCable.selectAll('.buffer-group')
    .each(function(d) {
      bufferHeightLookup[d.buffer_number] = (d.collapsed) ? collapsedHeight : expandedHeight;
    })

  var collapseNodes = function() {
    return d3.selectAll('.splice-node')
        .filter(function(d) {
          return (
            ( d.buffer_number === selection.dataObj('buffer_number')
              && d.cable_id === selection.dataObj('cable_id') )
            || ( d.joinData
                 && d.joinData.buffer_number === selection.dataObj('buffer_number')
                 && d.joinData.cable_id === selection.dataObj('cable_id') ) );
        })
        .transition().duration(500)
        .attr('r', function(d) { return (!d.r || !isCollapsed) ? 0 : d.r; });
  };

  var collapseFibers = function() {
    return selection.selectAll('.fiber-strand')
      .transition().duration(700)
      .delay(function(d, i) { return i * 700/d.fiber_count; })
      .attr('transform', function (d, i) {
        d.h2 = bufferHeightLookup[d.buffer_number] / d.fiber_count;
        d.y2 = i * d.h2;
        return 'translate(' + [ d.x, d.y2 ] + ')';
      })
      .attr('height', function (d) { return d.h2; })
  };

  var collapseBuffers = function() {
    return selection.selectAll('.buffer')
      .transition().duration(500)
      .attr('height', function (d, i) {
        return bufferHeightLookup[d.buffer_number];
      });
  };

  var expandBufferGroup = function() {
    return d3.transition()
      .duration(750)
      .ease("linear")
      .each(function() {
        fiberCable.selectAll('.buffer')
          .transition()
          .delay(200)
          .attr('height', function(d) { return bufferHeightLookup[d.buffer_number]; });

        fiberCable.selectAll('.buffer-group')
          .transition()
          .attr('transform', function(d) {
            d.y2 = _.chain(_.range(1, d.buffer_number))
                    .map(function(index) { return bufferHeightLookup[index]; })
                    .sum()
                    .value();
            return 'translate('+ [d.x, d.y2] +')';
          });
        fiberCable.selectAll('.fiber-strand:not(.collapsed)')
          .transition()
          .attr('transform', function (d, i) {
            d.h2 = bufferHeightLookup[d.buffer_number] / d.fiber_count;
            d.y2 = (d.buffer_strand_index - 1) * d.h2;
            return 'translate(' + [ d.x, d.y2 ] + ')';
          })
          .attr('height', function (d) {
            return d.h2;
          });
      });
  };

  var queue = [ collapseNodes, collapseFibers, collapseBuffers, expandBufferGroup];

  if (isCollapsed) { queue.reverse(); }

  animate(queue, -1);

};
