var zoom = d3.behavior.zoom()
    .translate([0, 0])
    .scale(1)
    .scaleExtent([1, 8])
    .on("zoom", zoomed);

/* Add Mousedown Events to Improve Behavior */
var drag = d3.behavior.drag()
  .on('dragstart', function (data, i) {
    var dragPt = d3.select(this).classed('dragging', true);
    setNodeStyle();
  })
  .on('dragend', function (data) {
    var dragPt = d3.select(this).classed('dragging', false);

    var connectionPts = d3.selectAll('.connector')
      .filter(function(d) { return !d.circuit_id && d.cable_id !== data.cable_id; });

    var nearestNeighbor = _.chain(connectionPts[0])
      .map(function (pt) { return { element: pt, distance: distance(data, d3.select(pt).data()[0]) }; })
      .sortBy('distance')
      .first()
      .value();

    if (nearestNeighbor && nearestNeighbor.distance <= 20) {
      d3.select(nearestNeighbor.element).classed('joined', true);
      dragPt.classed('joined', true);

      preformSplice(d3.select(nearestNeighbor.element), dragPt);
    }
    setNodeStyle();
  })
  .on('drag', function (data) {
    var selection = d3.select(this)
      .attr('transform', function (d, i) {
        d.x2 += d3.event.dx,
        d.y2 += d3.event.dy;

      return 'translate(' + d3.event.x +',' + d3.event.y + ')'
    });

    var position = getPosition(selection);

    d3.select('.splice[node_index="' + data.index + '"]')
      .attr('x2', position.x)
      .attr('y2', position.y);
  });


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
