/* Connector Nodes */
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


/* Splice Paths */
var node_JoinedStyle = function (selection) {
  selection
  .transition().duration(200)
  .attr('fill', highlight)
  .attr('stroke-width', 0);
}

var splice_DefaultStyle = function (selection) {
  selection
  .transition().duration(200)
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
  .attr('fill', function (d, i) { return colorScale(d.fiber_color); })
  .attr('stroke-width', 0);
};

var fiber_CircuitHighlightStyle = function (selection) {
  selection
  .transition().duration(200)
  .attr('fill', function (d, i) { return colorScale(d.fiber_color); })
  .attr('stroke-width', 0);
};

var fiber_CircuitFadeStyle = function (selection) {
  selection
  .transition().duration(200)
  .attr('fill', function (d, i) { return colorScaleLight(d.fiber_color); })
  .attr('stroke-width', 0);
};



function setNodeStyle (selection) {
  var connectors = (selection) ? selection : d3.selectAll('.connector');
      draggingNode = d3.select('.connector.dragging');
      draggingData = draggingNode.data()[0];

  connectors
    .each(function(d, i) {
      var selection = d3.select(this);
      return (selection.classed('joined')) ? node_JoinedStyle(selection) :
      (selection.classed('dragging')) ? node_DragStyle(selection) :
      (draggingNode.size() && !d.circuit_id && draggingData.cable_id !== d.cable_id) ? node_DraggingStyle(selection) : node_DefaultStyle(selection);
    })
}



function highlightSplices (data, i) {
  highlightedSplice = (data) ? data.circuit_id : false;

  if (!highlightedSplice) {
    splice_DefaultStyle(d3.selectAll('.splice'));
    fiber_DefaultStyle(d3.selectAll('.fiber-strand rect'));
    return;
  }

  var splice_in = d3.selectAll('.splice').filter(function (d) { return d.circuit_id === highlightedSplice; })
  var splice_out = d3.selectAll('.splice').filter(function (d) { return d.circuit_id !== highlightedSplice; })

  var fiber_in = d3.selectAll('.fiber-strand rect').filter(function (d) { return d.circuit_id === highlightedSplice; })
  var fiber_out = d3.selectAll('.fiber-strand rect').filter(function (d) { return d.circuit_id !== highlightedSplice; })

  splice_CircuitHighlightStyle(splice_in);
  splice_CircuitFadeStyle(splice_out);

  fiber_CircuitHighlightStyle(fiber_in);
  fiber_CircuitFadeStyle(fiber_out);
}

function removeSpliceHighlight (d, i) {
  setTimeout(function () {
    if (highlightedSplice === d.circuit_id) {
      highlightedSplice = false;
      highlightSplices();
    }
  }, 100);
}
