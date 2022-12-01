function add_mouse_listener_to_canvas(canvas,ctx){

    ctx.canvasWidth = canvas.width;
    ctx.canvasHeight = canvas.height;

    $(".hovermenu").detach().appendTo(document.documentElement);

    is_mouse_down = false
    is_mouse_dragging = false  
    held_node = null
    held_pos = null

    canvas.onmousemove = function(e) {
        ctx.show_legend = false

        
        // get mouse position in terms of coordinates
        // that were used for drawing on the canvas
        var rect = this.getBoundingClientRect(),
        x = e.clientX - rect.left,
        y = e.clientY - rect.top;

        // handle click-and-drag
        if( is_mouse_down ){
            is_mouse_dragging = true
            if( held_node != null ){
                held_node.x = x/ctx.view_scale - ctx.view_offset[0]
                held_node.y = y/ctx.view_scale - ctx.view_offset[1]
                ctx.node_coords[held_node.data.node_id] = [held_node.x,held_node.y]
                update_edges(ctx)
            }
            if( held_pos != null ){
                ctx.view_offset[0] = (x-held_pos[0])/ctx.view_scale;
                ctx.view_offset[1] = (y-held_pos[1])/ctx.view_scale;
            }
        } else {
            // check if hovering over help icon
            if( (x<20) && (y<20) ){
                ctx.show_legend = true
            }
        }
        

        // make hover caption invisible by default
        var hovermenu = $('.hovermenu');
        hovermenu.removeClass('visible');
        canvas.style.cursor = 'default'
        ctx.click_url = null;
        
        // check for buttons at mouse position
        if( is_mouse_on_button(x,y,ctx.load_more_button) ){
            ctx.load_more_button.hl = true
            canvas.style.cursor = 'pointer'
            update_display( ctx )
            return
        } else {
            if( ctx.load_more_button ) ctx.load_more_button.hl = false
        }
        
        // check for nodes at mouse position
        // starting with the "top" (most visible) nodes
        var hover_node = get_node_at_mouse_pos( ctx, x, y )
                
        if( hover_node != null ){
            // got a hit, show caption  and stop checking
            hovermenu.addClass('visible');
            hovermenu.css({top: e.pageY+10, left: e.pageX+10});
            hovermenu.html( get_details_for_node(ctx, node.data) )
            
            var url = get_url_for_node( ctx, hover_node.data )
            if( url != null ){
                canvas.style.cursor = 'pointer'
                ctx.click_url = url;
            }

            update_display( ctx )
            return
        }
        
        // check for edges near mouse position
        x = x/ctx.view_scale - ctx.view_offset[0]
        y = y/ctx.view_scale - ctx.view_offset[1]
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
                hovermenu.html( get_details_for_edge(ctx, edge.data) )

                update_display( ctx )
                return
            }
        }

        update_display( ctx )
    };

    canvas.onmouseout = function(e){
        $('.hovermenu').removeClass('visible')
        if( ctx.load_more_button ) ctx.load_more_button.hl = false
        update_display( ctx )
    }
    
    canvas.addEventListener('mousedown', function(e) {
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
    
    canvas.addEventListener('mouseup', function(e) {

        i = ctx.nodes.length-1;
        while(node = ctx.nodes[i--]) {
            node.held = false
        }

        //click on node
        if( (!is_mouse_dragging) && ctx.click_url != null ){
            var win = window.open(ctx.click_url, '_blank');
            if (win) {
                win.focus();
            }
        }
        
        //click on button
        if( (!is_mouse_dragging) && ctx.load_more_button && ctx.load_more_button.hl ){
            load_more_data_from_api(ctx)  
        }

        is_mouse_down = false
        is_mouse_dragging = false
        held_pos = null
        held_node = null
    })
    
    canvas.onwheel = function(event){
        // adjust scale, then adjust offset to maintain center
        var old_scale = ctx.view_scale
        ctx.view_scale -= event.deltaY/1000
        var m = ctx.view_scale / old_scale
        var vw = ctx.canvasWidth / m
        var vh = ctx.canvasHeight / m 
        ctx.view_offset[0] += (vw-ctx.canvasWidth)/2
        ctx.view_offset[1] += (vh-ctx.canvasHeight)/2
        update_display( ctx )
        event.preventDefault();
    };
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
        build_path_for_node_on_canvas( ctx, node.x, node.y, node.data, ctx.view_scale, ctx.view_offset )
        if( ctx.isPointInPath(x, y) ){
            return node
        }
    }

    return null
}