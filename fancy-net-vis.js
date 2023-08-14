// this is the source code for a flexible, general visualzation tool

function add_node_selection_listener(ctx,callback){
    ctx.node_selection_listeners.push(callback)
}

function add_mouse_listener_to_canvas(canvas,ctx){

    $("#hovermenu").detach().appendTo(document.documentElement);

    is_mouse_down = false
    is_mouse_dragging = false  
    held_node = null
    held_pos = null

    canvas.parentElement.onmousemove = function(e) {
        ctx.show_legend = false
        
        // get mouse position in terms of coordinates
        // that were used for drawing on the canvas
        var rect = this.getBoundingClientRect(),
        x = e.clientX - rect.left,
        y = e.clientY - rect.top;
        ctx.mouseCanvasX = x
        ctx.mouseCanvasY = y

        // handle dragging with mouse button held down
        if( is_mouse_down ){
            is_mouse_dragging = true
            
            if( held_node != null ){
                
                // drag node
                held_node.x = x/ctx.view_scale - ctx.view_offset[0]
                held_node.y = y/ctx.view_scale - ctx.view_offset[1]
                ctx.node_coords[held_node.data.gene_id] = [held_node.x,held_node.y]
                update_edges(ctx)
            }
            
            if( held_pos != null ){
                
                // pan camera by dragging background
                ctx.view_offset[0] = (x-held_pos[0])/ctx.view_scale;
                ctx.view_offset[1] = (y-held_pos[1])/ctx.view_scale;
            }
        } else {
            
            // show legend if hovering over help icon
            if( is_mouse_on_button(x,y,ctx.help_icon) ){
                ctx.show_legend = true
            }
        }
        

        // make hover caption invisible by default
        var hovermenu = $('#hovermenu');
        hovermenu.removeClass('visible');
        ctx.upperCanvasEl.style.cursor = 'default';
        
        // check for nodes at mouse position
        // starting with the "top" (most visible) nodes
        ctx.hover_node = get_node_at_mouse_pos( ctx, x, y )
                
        if( ctx.hover_node != null ){
            // got a hit, show caption  and stop checking
            hovermenu.addClass('visible');
            hovermenu.css({top: e.pageY+10, left: e.pageX+10});
            var selected = (ctx.hover_node == ctx.selected_node)
            hovermenu.html( get_hover_html_for_node(ctx.hover_node.data, selected) )
            if( !selected ){
                ctx.upperCanvasEl.style.cursor = 'pointer';
            }
            update_display( ctx )
            return
        }
        
        // compute virtual mouse position
        x = x/ctx.view_scale - ctx.view_offset[0]
        y = y/ctx.view_scale - ctx.view_offset[1]
        ctx.mouseVirtualX = x
        ctx.mouseVirtualY = y
        
        // check for edges near mouse position
        i = ctx.edges.length-1;
        while(edge = ctx.edges[i--]) {
            
            // find distance^2 from mouse to edge
            dp = [x-edge.a[0], y-edge.a[1]]
            a = (dp[0]*edge.d[0] + dp[1]*edge.d[1])/edge.det
            if( (a<0) || (a>1) ){
                continue   
            }
            np = [edge.a[0] + a*edge.d[0], edge.a[1] + a*edge.d[1]]
            d2 = Math.pow(np[0]-x,2) + Math.pow(np[1]-y,2)
            
            if( d2 < 100 ){
                
                // got a hit, show caption  and stop checking
                hovermenu.addClass('visible');
                hovermenu.css({top: e.pageY+10, left: e.pageX+10});
                hovermenu.html( get_details_for_edge(edge.data) )

                update_display( ctx )
                return
            }
        }

        update_display( ctx )
    };

    canvas.parentElement.onmouseout = function(e){
        $('#hovermenu').removeClass('visible')
        update_display( ctx )
    }
    
    canvas.parentElement.addEventListener('mousedown', function(e) {
        is_mouse_down = true

        var rect = this.getBoundingClientRect(),
        x = e.clientX - rect.left,
        y = e.clientY - rect.top;
        
        held_node = get_node_at_mouse_pos( ctx, x, y )
        if(held_node != null ){
            held_node.held = true
            held_pos = null
        } else {
            held_pos = [
                x-(ctx.view_offset[0]*ctx.view_scale),
                y-(ctx.view_offset[1]*ctx.view_scale)
            ]
        }

        update_display( ctx )

    })
    
    canvas.parentElement.addEventListener('mouseup', function(e) {

        i = ctx.nodes.length-1;
        while(node = ctx.nodes[i--]) {
            node.held = false
        }

        var was_mouse_dragging = is_mouse_dragging
        is_mouse_down = false
        is_mouse_dragging = false
        held_pos = null
        held_node = null
        
        if( (!was_mouse_dragging) ){        
            // click on node (or deselect node)
            ctx.selected_node = ctx.hover_node 
            for( var i = 0 ; i < ctx.node_selection_listeners.length ; i++ ){
                ctx.node_selection_listeners[i](ctx.selected_node)   
            }
            ctx.api_url = get_api_url(ctx)   
            update_display(ctx)
        }
    })
    
    canvas.parentElement.onwheel = function(event){
        
        // adjust scale, then adjust offset to maintain mouse position
        ctx.view_scale -= event.deltaY/1000
        ctx.view_offset[0] = ctx.mouseCanvasX/ctx.view_scale - ctx.mouseVirtualX
        ctx.view_offset[1] = ctx.mouseCanvasY/ctx.view_scale - ctx.mouseVirtualY
        update_display( ctx )
        
        // prevent normal mouse wheel behavior
        event.preventDefault();
    };
}

function load_more_button_clicked(count){
    if( ctx.selected_node ){
        load_more_data_from_api(ctx,count) 
    }   
}

function get_api_url_suffix(ctx){
    if( ctx.selected_node == null ){
        return '';
    }
    return "8,ASC,-2.1,2.1," + ctx.selected_node.data.gene_id + ",,,,"
}

function get_api_url(ctx){
    if( ctx.selected_node == null ){
        return ctx.default_api_url   
    } else {
    var parts = ctx.default_api_url.split('/')
    var base_url = parts.slice(0,-3).join('/')
        return base_url + '/' + get_api_url_suffix(ctx);
    }   
}




// build html content for the node details container
function get_detail_html_for_node( node_data ){
    
    var result = ''
    var url = '#'//get_url_for_node(node_data)
    var link_text = ''//get_node_link_text(node_data)
    result += "<a href='" + url + "'>" + link_text + '</a><br>'
    
    if( isTF(node_data) ){
        result += '<br>Type: Transcription Factor'
        result += '<br>TF Name: ' + node_data.protein_name
        result += '<br>Gene ID: ' + node_data.gene_id
    } else {
        result += '<br>Type: Gene'
        result += '<br>Gene ID: ' + node_data.gene_id
    }
    
    result += "<br><br>"
    
    var hpc = node_data.hidden_pdi_count
    if( hpc > 0 ){
        result += "(" + hpc.toLocaleString("en-US") + " interactions not loaded)"
        
        var all_counts = [10,20,50,100]
        for( var i = 0 ; i < all_counts.length ; i++ ){
            var count = all_counts[i]
            if( count > hpc ){
                count = hpc
                result += "<br><a href='javascript:load_more_button_clicked(" + count + ");'>Load All Interactions</a>"
                break   
            }
            result += "<br><a href='javascript:load_more_button_clicked(" + count + ");'>Load " + count + " More Interactions</a>"
        }
    } else {
        var pc = node_data.pdi_count
        result += "(showing all " + pc.toLocaleString("en-US") + " interactions)"
    }
    
    return result;
}

// get html content for the hover menu
function get_hover_html_for_node(node_data, selected){
    if( selected ){
        return node_data.gene_id + "<br>Details are Shown";
    } else {
        return node_data.gene_id + "<br>Click to Show Details"; 
    }  
    
}

// button is a rectnagle with properties x,y,w,h
function is_mouse_on_button( x, y, button ){
    return button && (x>button.x) && (x<(button.x+button.w)) && (y>button.y) && (y<(button.y+button.h))
}
    
function get_node_at_mouse_pos( ctx, x, y ){
        
    // check for nodes at mouse position
    // starting with the "top" (most visible) nodes
    i = ctx.nodes.length-1;
    while(node = ctx.nodes[i--]) {
        var hit = is_point_in_node( ctx, x, y, node.x, node.y, node.data, ctx.view_scale, ctx.view_offset )
        if( hit ){
            return node
        }
    }

    return null
}

function get_details_for_edge( all_edge_data ){
    var content;
    if( all_edge_data.length < 1 ){
        return "no interaction";
    } else if(all_edge_data.length == 1){
        content = "<b>Interaction</b>";
    } else {
        content = '<b>' + all_edge_data.length + ' Interactions</b>';
    }
    for (var i = 0; i < all_edge_data.length; i++) {
        var edge_data = all_edge_data[i];
        var clist = ['','']
        if( edge_data.repr == 't' ){
            clist.push('Repression')   
        }
        if( edge_data.distance != 'NA' ){
            clist.push('Distance to annotated<br>peak in TSS: ' + edge_data.distance + ' kb');
        }
        if( edge_data.experiment != 'NA' ){
            clist.push('Experiment: '  + edge_data.experiment);
        }
        if( edge_data.type != 'NA' ){
            clist.push('Type: '  + edge_data.type);
        }
        if( edge_data.conf != 'NA' ){
            clist.push('Confirmation: '  + edge_data.conf);
        }
        clist.push('Regulator: ' + edge_data.gene_id);
        clist.push('Target: ' + edge_data.target_id);
        clist.push('Edge ID: ' + edge_data.edge_id);
            
        content += clist.join('<br>')
    }
   return content;
}


function update_display( ctx ){     
    
    ctx.clear()
    
    // draw edges
    n_edges = ctx.edges.length
    for( var i = 0 ; i < n_edges ; i++ ){
        drawEdge(ctx, ctx.edges[i], ctx.view_scale, ctx.view_offset)
    }

    // draw nodes
    ctx.strokeStyle = 'black'
    ctx.font = '12px monospaced';
    ctx.lineWidth = 1;
    n_nodes = ctx.nodes.length
    for( var i = 0 ; i < n_nodes ; i++ ){
        var node = ctx.nodes[i]
        drawNode(ctx, node, ctx.view_scale, ctx.view_offset )
    }
    for( var i = 0 ; i < n_nodes ; i++ ){
        var node = ctx.nodes[i]
        drawNodeLabel(ctx, node, ctx.view_scale, ctx.view_offset )
    }
    
    if( ctx.show_legend ){
        drawLegend( ctx )
    } else {
        drawHelpIcon( ctx ) 
    }
    
    //draw outer border around entire canvas
    drawRect( ctx, 1,1,ctx.canvasWidth-2,ctx.canvasHeight-2, fillStyle=null, strokeStyle='black' )
    
    // update related html elements
    if( ctx.selected_node == null ){
        $('#node_details_container').hide()
    } else {
        $('#node_details_content').html(get_detail_html_for_node(ctx.selected_node.data))
        $('#node_details_container').show()
    }
}

function load_more_data_from_api(ctx, count){
    
    if( ctx.selected_node == null ){
        return   
    }
    
    var gid = ctx.selected_node.data.gene_id
    if(!(gid in ctx.skip_count_by_gid)){
        ctx.skip_count_by_gid[gid] = 0  
    }
    
    // request json data from api
    $.ajax({
        
        url: ctx.api_url + "/" + ctx.skip_count_by_gid[gid] + "/" + count, 
        
        // update network when data is received
        success: function(response_data){
            json_data = JSON.parse(response_data)
            update_network_with_json(ctx,json_data)
            for( var i = 0 ; i < ctx.node_selection_listeners.length ; i++ ){
                ctx.node_selection_listeners[i](ctx.selected_node)   
            }
        }
        
    })
    
    ctx.skip_count_by_gid[gid] += count
}

function update_network_with_json( ctx, json_data ){
    var new_nodes = json_data['nodes']
    var new_edges = json_data['edges']
    
    
    // identify which nodes are actually new
    var actually_new_nodes = []
    var n = new_nodes.length
    for( var i = 0 ; i < n ; i++ ){
        var existing_node = get_node( ctx, new_nodes[i].gene_id )
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
        ctx.node_coords[node_data.gene_id] = p
    }
    
    // insert new edge data into visualization
    var n = new_edges.length
    for( var i = 0 ; i < n ; i++ ){
        var edge_id = new_edges[i].edge_id
        
        if( ctx.all_single_edge_ids.includes(edge_id) ){
            continue   
        }        
        
        var udp_hash = new_edges[i].udp_hash
        if( udp_hash in ctx.edges_by_udp_hash ){
            
            // add support to existing edge
            var existing_edge = ctx.edges_by_udp_hash[udp_hash];
            existing_edge.data.push(new_edges[i]);
            
        } else {
        
            // add new edge
            var gene_id = new_edges[i].gene_id
            var target_id = new_edges[i].target_id
            var new_edge = {
                data: [new_edges[i]],
                gene_id: gene_id,
                target_id: target_id
            }
            ctx.edges.push(new_edge)
            ctx.edges_by_udp_hash[udp_hash] = new_edge
        }
        
        ctx.all_single_edge_ids.push(edge_id)
    }
    update_pdi_counts(ctx)
    update_edges(ctx)
    update_display(ctx)
}

// for each node build a list of related interactions shown
// (used to compute the number of interactions not being shown)
function update_pdi_counts(ctx){
    var node_data_by_gene_id = {}
    for( var i = 0 ; i < ctx.nodes.length ; i++ ){
        var data = ctx.nodes[i].data
        data.hidden_pdi_count = data.pdi_count
        data.related_pdis = []
        node_data_by_gene_id[data.gene_id] = data
    }
    
    for( var i = 0 ; i < ctx.edges.length ; i++ ){
        var e = ctx.edges[i]
        var tf_data = node_data_by_gene_id[e.gene_id]
        var tar_data = node_data_by_gene_id[e.target_id]
        
        tf_data.hidden_pdi_count -= e.data.length
        tf_data.related_pdis = tf_data.related_pdis.concat(e.data)
        
        tar_data.hidden_pdi_count -= e.data.length
        tar_data.related_pdis = tar_data.related_pdis.concat(e.data)
    }
}

// pick a good location for a new node
// used in update_network_with_json
function pick_new_node_location( ctx, new_node_data, new_edges ){
    if( ctx.nodes.length == 0 ){
        return [0,0]   
    }
    
    var gid = new_node_data.gene_id
    
    // check for existing neighbor
    var n = new_edges.length
    for( var i = 0; i < n ; i++ ) {
        var ne = new_edges[i]
        var neighbor = null
        if( ne.gene_id == gid ){
            neighbor = get_node( ctx, ne.target_id )
        } else if( ne.target_id == gid ) {
            neighbor = get_node( ctx, ne.gene_id )
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

// get an existing node by identifier
function get_node( ctx, gene_id ){
    var n = ctx.nodes.length
    for( var i = 0 ; i < n_nodes ; i++ ){
        var node = ctx.nodes[i]
        if( node.data.gene_id == gene_id ) {
            return node   
        }
    }    
    return null
}


function show_network_with_static_json( ctx, w, h, json_data, init_protein_name=null ){

    //
    ctx.setCursor = function (value) {
        this.upperCanvasEl.style.cursor = 'default';
    };
    ctx.selection = false;
    
    ctx.view_offset = [0,0]
    ctx.view_scale = 1
    ctx.canvasWidth = w
    ctx.canvasHeight = h
    
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
        var gid = nodes[i].gene_id
        
        // if an initial protein name as provided,
        // assume it's first batch of interaction data has already been loaded
        if( isTF(nodes[i]) && (nodes[i].protein_name==init_protein_name) ){
            ctx.skip_count_by_gid[gid] = 0
        }
        
        node_coords[gid] = [x,y]
        node_data_by_gid[gid] = nodes[i]
    }
    
    // prepare to build edges
    // - udp_hash (undirected pair hash) relates parellel edges
    // - edge_id is distinct for each individual edge
    ctx.edges = [] // list of vis 'edges' (groups of parellel edges with matching udp_hash)
    ctx.edges_by_udp_hash = {} // keys are udp_hashes, values are elements of ctx.edges
    ctx.all_single_edge_ids = [] // list of all individual edge IDs in vis
    
    
    
    // build edges
    for( var i = 0 ; i < edges.length ; i++ ){
        var edge_id = edges[i].edge_id
        if( edge_id in ctx.all_single_edge_ids ){
            continue   
        }
        
        var udp_hash = edges[i].udp_hash
        if( udp_hash in ctx.edges_by_udp_hash ){
            
            // add support to existing edge
            var existing_edge = ctx.edges_by_udp_hash[udp_hash];
            existing_edge.data.push(edges[i]);
            
        } else {
        
            // add new edge
            var gene_id = edges[i].gene_id
            var target_id = edges[i].target_id
            var a = node_coords[gene_id]
            var b = node_coords[target_id]
            var d = [b[0]-a[0],b[1]-a[1]]
            var new_edge = {
                a: a,
                b: b,
                d: d,
                det: d[0]*d[0] + d[1]*d[1],
                data: [edges[i]],
                gene_id: gene_id,
                target_id: target_id
            }
            ctx.edges.push(new_edge)
            ctx.edges_by_udp_hash[udp_hash] = new_edge
        }
        
        ctx.all_single_edge_ids.push( edge_id )
    }
    
    // build nodes
    ctx.node_coords = node_coords
    ctx.nodes = []
    for( var i = 0 ; i < n_nodes ; i++ ){
        var label = nodes[i].gene_id;
        var xy = node_coords[label]
    
        ctx.nodes[i] = {
            x: xy[0],
            y: xy[1],
            data: nodes[i]
        }
    }    

    // init variables for user interaction
    ctx.hover_node = null
    ctx.selected_node = null
    ctx.node_selection_listeners = []
    ctx.help_icon = {x:2,y:2,w:20,h:20}
    
    update_pdi_counts(ctx)
    update_display( ctx )
}

// update edge coordinates to match nodes
function update_edges(ctx){
    
    for( var i = 0 ; i < ctx.edges.length ; i++ ){
        var edge = ctx.edges[i]
        var a = ctx.node_coords[edge.gene_id]
        var b = ctx.node_coords[edge.target_id]
        var d = [b[0]-a[0],b[1]-a[1]]
        edge.a = a
        edge.b = b
        edge.d = d
        edge.det = d[0]*d[0] + d[1]*d[1]
    }
    
}


function show_network_with_api( ctx, w, h, api_url, success_func=null, init_tfname=null ){
    
    ctx.default_api_url = api_url
    ctx.api_url = api_url
    ctx.skip_count_by_gid = {}
    
    // request json data from api
    $.ajax({
        
        url: api_url, 
        
        // show network when data is received
        success: function(response_data){
            json_data = JSON.parse(response_data)
            show_network_with_static_json( ctx, w, h, json_data, init_tfname )
    
            var parts = api_url.split('/')
            var pp = parts[3].split(',')
            var count = parseInt(parts[5])
            var gid = pp[4]
            if( gid == '' ){
                var node = get_node_with_protein_name(pp[5])
                if( node != null ){
                    gid = node.data.gene_id
                }
            }
            ctx.skip_count_by_gid[gid] = count
            
            if( success_func != null ){
                success_func(response_data);   
            }
        }
        
    })
}

function get_node_with_protein_name(name){
    for( var i = 0 ; i < ctx.nodes.length ; i++ ){
        var node = ctx.nodes[i]
        if( isTF(node.data) && (node.data.protein_name==name) ){
            return node
        }
    }
    return null
}


function show_network_with_callback( ctx, w, h, callback_function ) {
       
    // get json data from the callback function
    json_data = callback_function()
    show_network_with_static_json( ctx, w, h, json_data )
}


function drawEdge( ctx, edge, scale=1, offset=[0,0] ){
    
    var a = edge.a
    var b = edge.b
    
    // check for any confirmed or repression interactions
    var forward_repression = false;
    var forward_confirmed = false;
    var two_way = false;
    var reverse_repression = false;
    var reverse_confirmed = false;
    for( var i = 0 ; i < edge.data.length ; i++ ){
        var d = edge.data[i]
        if( d.gene_id==edge.gene_id ){
            if( d.repr=='t' ){
                forward_repression = true;
            }
            if( d.conf=='confirmed' ){
                forward_confirmed = true;
            }
        } else {
            two_way = true; 
            if( d.repr=='t' ){
                reverse_repression = true;
            }
            if( d.conf=='confirmed' ){
                reverse_confirmed = true;
            }
        }
    }
    
    var dx = 0
    var dy = 0
    if( two_way ){
        var angle = Math.atan2(edge.d[1], edge.d[0]) + Math.PI/2
        var dist = 7
        dx = dist*Math.cos(angle)
        dy = dist*Math.sin(angle)
    }
    
    // check for any repression interactions
    drawSingleEdge(ctx, a[0]+dx, a[1]+dy, b[0]+dx, b[1]+dy, 
                   forward_confirmed, forward_repression, scale, offset)
    
    if( two_way ){
        drawSingleEdge(ctx, b[0]-dx, b[1]-dy, a[0]-dx, a[1]-dy, 
                       reverse_confirmed, reverse_repression, scale, offset)   
    }
}


function drawSingleEdge(context, fromx, fromy, tox, toy, confirmed, repression, scale=1, offset=[0,0]) {    
    var fromx = (fromx+offset[0])*scale
    var fromy = (fromy+offset[1])*scale
    var tox = (tox+offset[0])*scale
    var toy = (toy+offset[1])*scale
    var dx = tox-fromx
    var dy = toy-fromy
    var angle = Math.atan2(dy, dx);
    
    // draw arrowhead in the middle of the edge
    var r = .5
    var ax = fromx + dx*r
    var ay = fromy + dy*r
    drawArrow(context, ax, ay, angle)
    
    // draw extra line to indicate repression
    if( repression ){
        r = .5
        ax = fromx + dx*r
        ay = fromy + dy*r
        drawArrow(context, ax, ay, angle, head_angle=Math.PI/2, head_len=6)
    }
    
    // draw edge line
    context.add( new fabric.Line([
            fromx, fromy, tox, toy
        ],{ 
            stroke: 'black', 
            strokeDashArray: confirmed ? [] : [5,5],
            strokeWidth: 2,
            selectable:false
        }))
}

function drawArrow(context, x,y, angle, head_angle=null, head_len=10) {
    if( head_angle == null ){
        head_angle = Math.PI/6   
    }    
    
    //context.beginPath();
    
    //context.moveTo(x, y);
    //' context.lineTo(x - head_len * Math.cos(angle - head_angle), y - head_len * Math.sin(angle - head_angle));
    context.add( new fabric.Line([
        x,y,
        x - head_len * Math.cos(angle - head_angle), 
        y - head_len * Math.sin(angle - head_angle)
    ],{ stroke: 'black', selectable:false }) )
    
    //context.moveTo(x, y);
    //context.lineTo(x - head_len * Math.cos(angle + head_angle), y - head_len * Math.sin(angle + head_angle));
    context.add( new fabric.Line([
        x,y,
        x - head_len * Math.cos(angle + head_angle), 
        y - head_len * Math.sin(angle + head_angle)
    ],{ stroke: 'black', selectable:false }) )
    
    //context.stroke()
    
}


function is_point_in_node( ctx, px, py, node_x, node_y, node_data, scale=1, offset=[0,0] ){
    
    var x = (node_x+offset[0]) * scale
    var y = (node_y+offset[1]) * scale
    var radius = 45*scale
    
    //ctx.beginPath()
    if( isTF( node_data ) ){
        
        // node is circle
        return ( (Math.pow(x-px,2) + Math.pow(y-py,2)) <= Math.pow(radius,2) )
        //ctx.arc(x, y, radius, 0, 2 * Math.PI, false)
        
    } else {
        // node is square
        var r = radius*.9
        return (Math.abs(x-px)<r) && (Math.abs(y-py)<r)
        
        //ctx.moveTo(x-r,y-r)
        //ctx.lineTo(x-r,y+r)
        //ctx.lineTo(x+r,y+r)
        //ctx.lineTo(x+r,y-r)
        //ctx.lineTo(x-r,y-r)
    }
}

function isTF( node_data ){
    try{
        return Object.hasOwn(node_data, 'protein_name')
    }catch(error){
        return node_data.hasOwnProperty('protein_name')
    }
}

function drawHelpIcon(ctx){
    x = ctx.help_icon.x
    y = ctx.help_icon.y
    w = ctx.help_icon.w
    h = ctx.help_icon.h
    ctx.add(new fabric.Rect({
        left: x,
        top: y,
        fill: '#EEE',
        stroke: '#000',
        strokeWidth: 1,
        width: w,
        height: h,
        selectable: false,
        excludeFromExport: true,
    }));
    
    text = new fabric.Text('?', {
        left: 12,
        top: 6,
        fontFamily: 'Arial',
        fontSize: 12,
        fill: 'black',
        selectable: false,
        excludeFromExport: true,
    })
    ctx.add( text );
    text.left -= text.width/2
}


function drawRect( ctx, x,y,w,h, fillStyle=null, strokeStyle=null, strokeWidth=1 ){
    
    var rect = new fabric.Rect({
        left: x,
        top: y,
        fill: fillStyle,
        stroke: strokeStyle,
        strokeWidth: strokeWidth,
        width: w,
        height: h,
        selectable: false,
    });

    ctx.add(rect);
}

function drawLegend(ctx){

    var x = 2
    var y = 2
    var w = 250
    var h = 330
    drawRect( ctx, x, y, w, h, '#EEE', '#000' )

    ctx.add(new fabric.Text('Legend:', { 
        left: x+35, top: y+40,
        textAlign: 'left',
        fontSize: 12,
        fontFamily: 'Arial',
        color: 'black'
    }));
    
    var legend_nodes = [
        {
            x: x+260,
            y: y+90,
            data: {
                protein_name: 'TF'
            }
        },
        {
            x: x+380,
            y: y+90,
            data: {
                gene_id: 'Non-TF'
            }
        },
    ];
    drawNode( ctx, legend_nodes[0], .5)
    drawNode( ctx, legend_nodes[1], .5)
    drawNodeLabel( ctx, legend_nodes[0], .5 )
    drawNodeLabel( ctx, legend_nodes[1], .5 )
    
    draw_edge_legend( ctx, x+30, y+110 )
    
    var yo = 220
    var xo = 30
    var dy = 20
    var text_lines = [
        'Hover over nodes or edges for info',
        'Click nodes to show details',
        'Click and drag nodes to move them',
        'Click and drag background to pan',
        'Zoom with the mousewheel',
    ]
    for( var i = 0 ; i<text_lines.length ; i++ ){
        ctx.add(new fabric.Text(text_lines[i], { 
            left: x+xo, top: y+yo,
            textAlign: 'left',
            fontSize: 12,
            fontFamily: 'Arial',
            color: 'black'
        }));
        yo += dy
    }
}


function draw_edge_legend(ctx,x,y){
    var specs = [
        ['Confirmed','confirmed','f'],
        ['Uncomfirmed','unconfirmed','f'],
        ['Repression','confirmed','t']
    ]

    ctx.fillStyle = 'black'
    ctx.textAlign = 'left'
    ctx.add(new fabric.Text('Interactions', { 
        left: x, top: y,
        textAlign: 'left',
        fontSize: 12,
        fontFamily: 'Arial',
        color: 'black'
    }));
    y += 20

    for( var i = 0 ; i < specs.length ; i++ ){
        drawEdge( ctx, {
            a: [x+120,y],
            b: [x+200,y],
            data: [{
                conf:specs[i][1].toLowerCase(),
                repr:specs[i][2]
            }]
        }, 1);
        
        ctx.add(new fabric.Text(specs[i][0], { 
            left: x, top: y+3,
            textAlign: 'left',
            fontSize: 12,
            fontFamily: 'Arial',
            color: 'black'
        }));

        y += 20
    }
}

function drawNode(ctx, node, scale=1, offset=[0,0] ) {
    
    var x = node.x
    var y = node.y
    var node_data = node.data
    var tf = isTF(node_data)
    
    var strokeWidth = 1
    var stroke = 'black'
    if( node == ctx.selected_node ){
        strokeWidth = 6
    }
    
    var fill = '#AFA'
    if( tf ){
        fill = '#FAA'
    }
    
    // draw shape
    //ctx.fillStyle = fill
    //ctx.lineWidth = strokeWidth
    //ctx.strokeStyle = stroke
    //build_path_for_node_on_canvas( ctx, x, y, node_data, scale, offset )
    
    x = (x+offset[0]) * scale
    y = (y+offset[1]) * scale
    var radius = 45*scale
    
    if( isTF( node_data ) ){
        ctx.add(new fabric.Circle({
            left:x-radius, 
            top: y-radius,
            radius: radius,
            fill: fill,
            stroke: stroke,
            strokeWidth: strokeWidth,
            selectable: false,
        }))
    } else {
        var r = radius*.9
        drawRect( ctx, x-r, y-r, 2*r, 2*r, fill, stroke, strokeWidth )
    }
    
        
    // draw marble effect
    if( tf ){
        var gradient = new fabric.Gradient({
            type: 'radial',
            gradientUnits: 'percentage',
            coords:{
                x1: .5,
                y1: .5,
                x2: .5,
                y2: .5,
                r1: .45,
                r2: .55,
            },
            colorStops: [
                { offset: 0, color: "rgba(0,0,0,0)" },
                { offset: 1, color:'black' }
            ]
        })
        ctx.add(new fabric.Circle({
            left:x-radius, 
            top: y-radius,
            radius: radius,
            fill: gradient,
            selectable: false,
        }))
    }
    var gradient = new fabric.Gradient({
          type: 'linear',
        gradientUnits: 'percentage',
        coords:{
            x1:.5,
            y1:0,
            x2:.5,
            y2:1,
        },
        colorStops:[
            {offset:0, color:"rgba(255,255,255,.6)" },
            {offset:1, color:"rgba(0,0,0,0)" },
        ]
    })

    if( isTF( node_data ) ){
        ctx.add(new fabric.Circle({
            left:x-radius, 
            top: y-radius,
            radius: radius,
            fill: gradient,
            selectable: false,
        }))
    } else {
        var r = radius*.9
        drawRect( ctx, x-r, y-r, 2*r, 2*r, gradient, null, 0 )
    }
}


function drawNodeLabel(ctx, node, scale=1, offset=[0,0] ) {
    
    var x = node.x
    var y = node.y
    var node_data = node.data

    var stroke = 'black'
    var strokeWidth = 1
    
    // draw label
    if( scale >= .5 ) {
        x = (x+offset[0]) * scale
        y = (y+offset[1]) * scale
        if( isTF(node_data) ){
            var label = node_data.protein_name
            var co = 20
        } else {
            var label = node_data.gene_id
            var co = 8
        }
        
        drawReadableText(ctx,label,x,y,scale)
        //var hpc = node_data.hidden_pdi_count
        //if( hpc > 0 ){
        //    var hidden_report = "(" + hpc.toLocaleString("en-US") + " interactions not shown)"
        //    drawReadableText(ctx,hidden_report,x,y+20,scale);
        //}
    }
}

// draw black text with white shadow
function drawReadableText(ctx,label,x,y){
    var size = 12
    
    var shadow_radius = 1
    for( var dx = -shadow_radius ; dx <= shadow_radius ; dx++ ){
        for( var dy = -shadow_radius ; dy <= shadow_radius ; dy++ ){
            var text = new fabric.Text(label, {
                left: x+dx,
                top: y+dy,
                fontFamily: 'Arial',
                fontSize: size,
                fill: 'white',
                selectable: false,
            })
            ctx.add( text );
            text.left -= text.width/2
            text.top -= text.height/2
        }
    }
    
    text = new fabric.Text(label, {
        left: x,
        top: y,
        fontFamily: 'Arial',
        fontSize: size,
        fill: 'black',
        selectable: false,
    })
    ctx.add( text );
    text.left -= text.width/2
    text.top -= text.height/2
}








