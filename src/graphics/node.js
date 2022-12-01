
// trace the outer edge of a node
function build_path_for_node_on_canvas( ctx, x, y, node_data, scale=1, offset=[0,0] ){
    
    // override with user-provided callback
    callback = get_callback( ctx, "build_path_for_node_on_canvas" )
    if (callback != null) {
        return callback(ctx, x, y, node_data, scale, offset)
    }
    
    // default
    x = (x+offset[0]) * scale
    y = (y+offset[1]) * scale
    ctx.beginPath()
    var radius = 45*scale
    ctx.arc(x, y, radius, 0, 2 * Math.PI, false)
}

// draw a node
function drawNode(ctx, node, scale=1, offset=[0,0] ) {
    
    // override with user-provided callback
    callback = get_callback( ctx, "drawNode" )
    if (callback != null) {
        return callback(ctx, node, scale, offset)
    }
    
    // default
    var x = node.x
    var y = node.y
    var node_data = node.data

    var stroke = 'black'
    var strokeWidth = 1
    var fill = '#AFA'
    
    // draw shape
    ctx.fillStyle = fill
    ctx.lineWidth = strokeWidth
    ctx.strokeStyle = stroke
    build_path_for_node_on_canvas( ctx, x, y, node_data, scale, offset )
    if (fill) {
        ctx.fill()
    }
    if (stroke) {
        ctx.stroke()
    }
    
    // draw label
    if( scale > .5 ) {
        x = (x+offset[0]) * scale
        y = (y+offset[1]) * scale
        ctx.fillStyle = 'black';
        ctx.textAlign = "center";
        ctx.fillText(node_data.node_id, x, y);
    }
}