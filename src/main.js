
function show_network_with_static_json( ctx, w, h, json_data, callbacks=null ){

    ctx.view_offset = [0,0]
    ctx.view_scale = 1
    ctx.callbacks = callbacks
    
    var nodes = json_data['nodes']
    var edges = json_data['edges']
    
    var n_nodes = nodes.length
    var da = Math.PI*2 / n_nodes
    var dist = 200
    
    var node_coords = {}
    var node_data_by_gid = {}
    for( var i = 0 ; i < n_nodes ; i++ ){        
        var x = w/2 + dist*Math.cos(i*da);
        var y = h/2 + dist*Math.sin(i*da);
        var gid = nodes[i].node_id
        node_coords[gid] = [x,y]
        node_data_by_gid[gid] = nodes[i]
    }
    
    
    // build edges
    ctx.strokeStyle = 'black'
    ctx.edges = []
    for( var i = 0 ; i < edges.length ; i++ ){
        var a = node_coords[edges[i].node_id]
        var b = node_coords[edges[i].target_id]
        
        var d = [b[0]-a[0],b[1]-a[1]]
        ctx.edges[i] = {
            a: a,
            b: b,
            d: d,
            det: d[0]*d[0] + d[1]*d[1],
            data: edges[i]
        }
    }
    
    // build nodes
    ctx.node_coords = node_coords
    ctx.nodes = []
    for( var i = 0 ; i < n_nodes ; i++ ){
        var label = nodes[i].node_id;
        var xy = node_coords[label]
    
        ctx.nodes[i] = {
            x: xy[0],
            y: xy[1],
            data: nodes[i]
        }
    }    

    update_display( ctx )
}

function show_network_with_api( ctx, w, h, api_url, success_func=null, callbacks=null ){
    
    ctx.api_url = api_url
    ctx.draw_num = 0
    
    // request json data from api
    $.ajax({
        
        url: api_url + "/0", 
        
        // show network when data is received
        success: function(response_data){
            json_data = JSON.parse(response_data)
            ctx.load_more_button = {x:700,y:0,w:100,h:20}
            show_network_with_static_json( ctx, w, h, json_data, callbacks )
            if( success_func != null ){
                success_func(response_data);   
            }
        }
        
    })
}

function show_network_with_callback( ctx, w, h, callback_function, callbacks=null ) {
       
    // get json data from the callback function
    json_data = callback_function()
    show_network_with_static_json( ctx, w, h, json_data, callbacks )
}

function update_display( ctx ){

    // clear display
    ctx.clearRect(0, 0, ctx.canvasWidth, ctx.canvasHeight);  
    
    // draw edges
    n_edges = ctx.edges.length
    for( var i = 0 ; i < n_edges ; i++ ){
        drawEdge(ctx, ctx.edges[i], ctx.view_scale, ctx.view_offset)
    }

    // draw nodes
    ctx.font = '12px monospaced';
    ctx.lineWidth = 1;
    ctx.setLineDash([]);
    n_nodes = ctx.nodes.length
    for( var i = 0 ; i < n_nodes ; i++ ){
        var node = ctx.nodes[i]
        drawNode(ctx, node, ctx.view_scale, ctx.view_offset )
    }

    if( ctx.show_legend ){
        drawLegend( ctx )
    } else {
        drawHelpIcon( ctx ) 
    }
    
    if( ctx.load_more_button ){
        drawLoadMoreButton(ctx)
    }
    
}

function load_more_data_from_api(ctx){
    
    ctx.draw_num += 1;
    
    // request json data from api
    $.ajax({
        
        url: ctx.api_url + "/" + ctx.draw_num, 
        
        // update network when data is received
        success: function(response_data){
            json_data = JSON.parse(response_data)
            update_network_with_json(ctx,json_data)
        }
        
    })
}

function update_network_with_json( ctx, json_data ){
    var new_nodes = json_data['nodes']
    var new_edges = json_data['edges']
    
    
    // identify which nodes are actually new
    var actually_new_nodes = []
    var n = new_nodes.length
    for( var i = 0 ; i < n ; i++ ){
        var existing_node = get_node( ctx, new_nodes[i].node_id )
        if( existing_node == null ) {
            actually_new_nodes.push(new_nodes[i])
        }
    }    
    
    // insert new nodes into visualization
    var n = actually_new_nodes.length
    for( var i = 0 ; i < n ; i++ ){
        var node_data = actually_new_nodes[i]
        var p = pick_new_node_location( ctx, node_data, new_edges)
        ctx.nodes.push({
            x: p[0],
            y: p[1],
            data: node_data
        })
        ctx.node_coords[node_data.node_id] = p
    }
    
    // insert new edges into visualization
    var n = new_edges.length
    for( var i = 0 ; i < n ; i++ ){
        var a = ctx.node_coords[new_edges[i].node_id]
        var b = ctx.node_coords[new_edges[i].target_id]
        var d = [b[0]-a[0],b[1]-a[1]]
        ctx.edges.push({
            a: a,
            b: b,
            d: d,
            det: d[0]*d[0] + d[1]*d[1],
            data: new_edges[i]
        })
    }
    
    update_display(ctx)
}

// get an existing node by identifier
function get_node( ctx, node_id ){
    var n = ctx.nodes.length
    for( var i = 0 ; i < n_nodes ; i++ ){
        var node = ctx.nodes[i]
        if( node.data.node_id == node_id ) {
            return node   
        }
    }    
    return null
}


function update_edges(ctx){
    
    for( var i = 0 ; i < ctx.edges.length ; i++ ){
        var edge = ctx.edges[i]
        var a = ctx.node_coords[edge.data.node_id]
        var b = ctx.node_coords[edge.data.target_id]
        
        var d = [b[0]-a[0],b[1]-a[1]]
        ctx.edges[i] = {
            a: a,
            b: b,
            d: d,
            det: d[0]*d[0] + d[1]*d[1],
            data: edge.data
        }
    }
    
}


// get url to visit after clicking on a node
function get_url_for_node( ctx, node_data ){
    
    // override with user-provided callback
    callback = get_callback( ctx, "get_url_for_node" )
    if (callback != null) {
        return callback(node_data)
    }
    
    // default
    return null
}

// build html content to show when hovering over a node
function get_details_for_node( ctx, node_data ){
    
    // override with user-provided callback
    callback = get_callback( ctx, "get_details_for_node" )
    if (callback != null) {
        return callback(node_data)
    }
    
    // default
    return node_data.node_id;
}

// build html content to show when hovering over an edge
function get_details_for_edge( ctx, edge_data ){
    
    // override with user-provided callback
    callback = get_callback( ctx, "get_details_for_edge" )
    if (callback != null) {
        return callback(edge_data)
    }
    
    // default
    return [
       '<b>Edge</b>',
       'From: ' + edge_data.node_id,
       'To: ' + edge_data.target_id,
    ].join('<br>')
}


