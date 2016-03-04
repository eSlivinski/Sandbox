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

  var position = getPosition(selection);

  d3.select('.splice[node_index="' + selection.data()[0].index + '"]')
    .attr('x2', position.x)
    .attr('y2', position.y);
};

var event_DragStop = function (selection, event) {
  selection.classed('dragging', false);

  var data = selection.data()[0]

  var connectionPts = d3.selectAll('.connector')
    .filter(function(d) {
      return ( !d.circuit_id
               && d.cable_id !== data.cable_id );
    });

  var b = nearestNeighbor(data, connectionPts);

  if (b && b.distance <= 20) {
    d3.select(b.element)
      .classed('joined', true);

    selection.classed('joined', true);

    console.log(b)
  }
  setNodeStyle();
};
