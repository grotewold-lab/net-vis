

// pick a good location for a new node
// used in update_network_with_json
function pick_new_node_location( ctx, new_node_data, new_edges ){
    if( ctx.nodes.length == 0 ){
        return [0,0]   
    }
    
    var gid = new_node_data.node_id
    
    // check for existing neighbor
    var n = new_edges.length
    for( var i = 0; i < n ; i++ ) {
        var ne = new_edges[i]
        var neighbor = null
        if( ne.node_id == gid ){
            neighbor = get_node( ctx, ne.target_id )
        } else if( ne.target_id == gid ) {
            neighbor = get_node( ctx, ne.node_id )
        }
        if(neighbor){
            return pick_neighbor_location( ctx, neighbor )
        }
    }
    
    // no existing neighbors, so pick an arbitrary open spot
    return pick_neighbor_location( ctx, ctx.nodes[0] )
}

// pick an open location nearby an existing node
// used in pick_new_node_location()
function pick_neighbor_location( ctx, existing_node ){
    
    // spiral outward until an open location is found
    var a = 0
    var r = 100
    var maxr = 100000
    var dr = 50
    while( r < maxr ) {
        var tx = existing_node.x + r*Math.cos(a)
        var ty = existing_node.y + r*Math.sin(a)
        if( is_location_open(ctx,tx,ty) ){
            return [tx,ty] // found a good spot
        }
        if( a > Math.PI*2 ){
            a = 0
            r += dr
        } else {
            a += dr/r
        }
    }
    
    // give up and return some location
    return [200,200]
}

// return true if there is space for a new node centered at the given location
// used in pick_neighbor_location
function is_location_open( ctx, x, y ){
    var maxr2 = 100*100
    var n = ctx.nodes.length
    for( var i = 0; i < n ; i++ ) {
        var node = ctx.nodes[i]
        var r2 = Math.pow(x-node.x,2) + Math.pow(y-node.y,2)
        if( r2 < maxr2 ){
            return false;   
        }
    }
    return true
}