/* STYLES */

/* Splice Nodes */
var node_DefaultStyle = function (selection) {
  selection
  .transition().duration(200)
  .attr('fill', 'black')
  .attr('stroke', 'black')
  .attr('stroke-width', 0);
};

var node_HoverStyle = function (selection) {
  selection
  .transition().duration(200)
  .attr('fill', highlight)
  .attr('stroke', highlight)
  .attr('stroke-width', 5);
}

var node_DraggingStyle = function (selection) {
  selection
  .transition().duration(200)
  .attr('fill', 'white')
  .attr('stroke', highlight)
  .attr('stroke-width', 3);
};

var node_DragStyle = function (selection) {
  selection
  .transition().duration(200)
  .attr('fill', highlight)
  .attr('stroke', highlight)
  .attr('stroke-width', 3);
}

var node_JoinedStyle = function (selection) {
  selection
  .transition().duration(200)
  .attr('fill', highlight)
  .attr('stroke', highlight)
  .attr('stroke-width', 3);
}

/* Splice Paths */
var splice_JoinedStyle = function (selection) {
  selection
  .transition().duration(200)
  .attr('fill', highlight)
  .attr('stroke-width', 0);
}

var splice_DefaultStyle = function (selection) {
  selection
  .transition().duration(200)
  .attr('stroke', 'black')
  .attr('stroke-width', 3)
  .attr('opacity', 1);
};

var splice_CircuitHighlightStyle = function (selection) {
  selection
  .transition().duration(200)
  .attr('stroke-width', 4)
  .attr('opacity', 1);
};

var splice_CircuitFadeStyle = function (selection) {
  selection
  .transition().duration(200)
  .attr('stroke-width', 1)
  .attr('opacity', 0.3);
};


/* Fiber Strands */
var fiber_DefaultStyle = function (selection) {
  selection
  .transition().duration(200)
  .attr('fill', function (d) { return colorScale(d.fiber_color); })
  .attr('stroke', function (d) { return d3.hsl(colorScale(d.fiber_color)).darker(); })
  .attr('stroke-width', 0);
};

var fiber_CircuitHighlightStyle = function (selection) {
  selection
  .transition().duration(200)
  .attr('fill', function (d) { return colorScale(d.fiber_color); })
  .attr('stroke-width', 0);
};

var fiber_CircuitFadeStyle = function (selection) {
  selection
  .transition().duration(200)
  .attr('fill', function (d) { return colorScaleLight(d.fiber_color); })
  .attr('stroke-width', 0);
};


/* Tube Buffers */
var buffer_DefaultStyle = function (selection) {
  selection
    .transition().duration(200)
    .attr('fill', function (d) { return colorScale(d.tube_buffer); })
    .attr('stroke', function (d) { return d3.hsl(colorScale(d.tube_buffer)).darker(); })

};


/* STYLE HANDLERS */

var setNodeStyle = function (selection) {
  var nodes = (selection) ? selection : d3.selectAll('.splice-node'),
      activeCable = false;

  if (d3.selectAll('.splice-node.dragging').size()) {
    activeCable = d3.select('.splice-node.dragging').data()[0].cable_id;
  }

  nodes.each(function (d) {
    var selection = d3.select(this);
    var style = (selection.classed('joined')) ? node_JoinedStyle :
        (activeCable === false) ? node_DefaultStyle :
        (selection.classed('dragging')) ? node_DragStyle :
        (d.cable_id !== activeCable) ? node_DraggingStyle : node_DefaultStyle;

    selection.call(style);
  });
};

var highlightSplices = function (data) {
  highlightedSplice = (data) ? data.circuit_id : false;

  if (!highlightedSplice) {

    d3.selectAll('.splice')
      .call(splice_DefaultStyle);

    d3.selectAll('.fiber-strand')
      .call(fiber_DefaultStyle);

    return;
  }

  d3.selectAll('.splice')
    .filter(function (d) { return d.circuit_id === highlightedSplice; })
    .call(splice_CircuitHighlightStyle);

  d3.selectAll('.splice')
    .filter(function (d) { return d.circuit_id !== highlightedSplice; })
    .call(splice_CircuitFadeStyle);

  d3.selectAll('.splice-node')
    .filter(function (d) { return d.circuit_id === highlightedSplice; })
    .call(node_HoverStyle);

  d3.selectAll('.splice-node')
    .filter(function (d) { return d.circuit_id !== highlightedSplice; })
    .call(node_DefaultStyle);

  d3.selectAll('.fiber-strand')
    .filter(function (d) { return d.circuit_id === highlightedSplice; })
    .call(fiber_CircuitHighlightStyle);

  d3.selectAll('.fiber-strand')
    .filter(function (d) { return d.circuit_id !== highlightedSplice; })
    .call(fiber_CircuitFadeStyle);
};

var removeSpliceHighlight = function (data) {
  setTimeout(function () {
    if (highlightedSplice === data.circuit_id) {
      highlightedSplice = false;
      highlightSplices();
    }
  }, 100);
};
