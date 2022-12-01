
function drawEdge( ctx, edge, scale=1, offset=[0,0] ){
    
    // override with user-provided callback
    callback = get_callback( ctx, "drawEdge" )
    if (callback != null) {
        return callback(ctx, edge, scale, offset)
    }
    
    //default
    var a = edge.a
    var b = edge.b
    ctx.lineWidth = 1;
    drawArrow(ctx, a[0],a[1],b[0],b[1], scale, offset)
}


function drawArrow(context, fromx, fromy, tox, toy, scale=1, offset=[0,0]) {
    
    fromx = (fromx+offset[0])*scale
    fromy = (fromy+offset[1])*scale
    tox = (tox+offset[0])*scale
    toy = (toy+offset[1])*scale
    
    context.lineCap = "round";
    var shrink = 50 * scale; // length reduction in pixels
    var rawd = Math.sqrt( Math.pow(tox-fromx,2) + Math.pow(toy-fromy,2) )
    var ratio = (rawd-shrink)/rawd
    tox = fromx + (tox-fromx)*ratio
    toy = fromy + (toy-fromy)*ratio
   
    
    var headlen = 10; // length of head in pixels
    var dx = tox - fromx;
    var dy = toy - fromy;
    var angle = Math.atan2(dy, dx);

    context.beginPath();
    context.moveTo(fromx, fromy);
    context.lineTo(tox, toy);
    context.stroke();

    context.beginPath();
    context.setLineDash([]);
    context.moveTo(tox, toy);
    context.lineTo(tox - headlen * Math.cos(angle - Math.PI / 6), toy - headlen * Math.sin(angle - Math.PI / 6));
    context.moveTo(tox, toy);
    context.lineTo(tox - headlen * Math.cos(angle + Math.PI / 6), toy - headlen * Math.sin(angle + Math.PI / 6));
    context.stroke();
}