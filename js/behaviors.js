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
}

var collapse = function(selection) {
  var isCollapsed = false,
      compression = 0.3,
      collapseSpeed = 500;

  selection.attr('datum', function(d) {
    isCollapsed = !!d.collapsed;
    d.collapsed = !isCollapsed;
  });

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
        .classed('collapsed', !isCollapsed)
        .transition()
        .duration(500)
        .attr('r', function(d) {
          return (!d.r || !isCollapsed) ? 0 : d.r;
        })
  };

  var collapseFibers = function() {
    return selection.selectAll('.fiber-strand')
      .classed('collapsed', !isCollapsed)
      .transition()
      .duration(700).delay(function(d, i) {
        return i * 700/d.fiber_count;
      })
      .attr('transform', function (d, i) {
        var pos = _.cloneDeep([d.x, d.y]);
        if (!isCollapsed) {
          pos[1] = d.h * compression * i;
        }
        return 'translate(' + pos + ')';
      })
      .attr('height', function (d) {
        return (isCollapsed) ? d.h : (d.h * compression);
      })
      // .attr('opacity', 0);
  };

  var collapseBuffers = function() {
    return selection.selectAll('.buffer')
      .classed('collapsed', !isCollapsed)
      .transition()
      .duration(500)
      .attr('height', function (d, i) {
        var height = h/d.buffer_count;
        if (!isCollapsed) {
          height = height * compression;
        }
        return height;
      });
  };

  expandBuffers = function () {
    var lookup = {};

    d3.selectAll('.buffer.collapsed')
      .each(function(d) {
        if (!lookup[d.cable_id]) {
          lookup[d.cable_id] = [ d.buffer_number ];
          var parentCable = d3.select(this).node().parentNode.parentNode;
          d3.select(parentCable).attr('datum', function(d) {
            d.bufferHeights = {};
          })
        } else {
          lookup[d.cable_id].push(d.buffer_number);
        }
      })


    return d3.selectAll('.buffer')
        .filter(function(d) { return !!lookup[d.cable_id]; })
        .transition().delay(200).duration(500)
        .attr('height', function(d) {
          compHt = (d.h * compression);
          totalComp = lookup[d.cable_id].length;
          totalExp = d.buffer_count - totalComp;
          excessHt = totalComp * d.h * (1 - compression);
          expHt = d.h + excessHt/totalExp;

          d.h2 = (lookup[d.cable_id].indexOf(d.buffer_number)<0) ? expHt : compHt;
          var parentCable = d3.select(this).node().parentNode.parentNode;

          d3.select(parentCable)
            .attr('datum', function(data) {
            data.bufferHeights[d.buffer_number] = d.h2;
            // console.log(data.bufferHeights)
          })
          .attr('fill', 'green')
          return d.h2;
        })
    //     ;
    // d3.selectAll('.cables').each(function(data) {
    //   var thisCable = d3.select(this);
    //   var collapsedBuffers = thisCable.selectAll('.buffer.collapsed');
    //   var totalCollapsed = collapsedBuffers.size();
    //
    //   if (!totalCollapsed) return;
    //
    //   var expandedBuffers = thisCable.selectAll('.buffer:not(.collapsed)');
    //   var totalExpanded = expandedBuffers.size();
    //   // var b = expandedBuffers.datum();
    //
    //   var compressedHeight = h/12 * compression
    //   var excessHeight = totalCollapsed * h/12 * (1 - compression);
    //   var expandedHeight = h/12 + excessHeight/totalExpanded
    //
    //   var bufferHeights = [];
    //   console.log('bufferHeights')
    //   thisCable.selectAll('.buffer')
    //   .each(function(d, i) {
    //     var thisBuffer = d3.select(this);
    //     var bufferGroup = d3.select(this.parentNode);
    //     var y2 = 0;
    //     thisBuffer
    //     // .attr('datum', function(d) {
    //     //   d.h2 = (thisBuffer.classed('collapsed')) ? compressedHeight : expandedHeight;
    //     //   y2 = (!bufferHeights.length) ? 0 : d3.sum(bufferHeights);
    //     //   bufferHeights.push(d.h2);
    //     // })
    //     .transition()
    //
    //     // .attr('transform', function(d) { return 'translate(' + [d.x, d.y2] + ')' })
    //     .attr('height', function(d) {
    //       d.h2 = (!!thisBuffer.classed('collapsed')) ? compressedHeight : expandedHeight;
    //       return d.h2
    //     });
    //
    //     // bufferGroup
    //     // .attr('transform', function(d) { return 'translate(' + [d.x, y2] + ')' })
    //   })
    //
    //
    // })
  }

  moveBuffers = function() {
    return d3.selectAll('.buffer-group')
    .filter(function(d) {
      var bufferHeights = d3.select(this.parentNode).dataObj('bufferHeights')

      return !!bufferHeights
    })
    .transition()
    .attr('transform', function(d) {
      var bufferHeights = d3.select(this.parentNode).dataObj('bufferHeights');
      var above = _.chain(_.range(1, d.buffer_number))
        .map(function(index) { return bufferHeights[index] })
        .sum().value();
      return 'translate('+ [d.x, above] +')'

    })
  }

  var queue = [collapseNodes, collapseFibers, collapseBuffers, expandBuffers, moveBuffers];
  if (isCollapsed) {
    queue.reverse();
  }
  animate(queue, -1);
};
