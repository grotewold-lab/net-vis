

function drawHelpIcon(ctx){
    var x = 0
    var y = 0
    var w = 20
    var h = 20
    ctx.fillStyle = '#CCC'
    ctx.beginPath()
    ctx.moveTo(x,y)
    ctx.lineTo(x+w,y)
    ctx.lineTo(x+w,y+h)
    ctx.lineTo(x,y+h)
    ctx.lineTo(x,y)
    ctx.fill()
    
    ctx.fillStyle = 'black'
    ctx.fillText('?', x+w/2, y+h/2+3);
}

function drawLegend(ctx){

    var x = 0
    var y = 0
    var w = 200
    var h = 280
    ctx.fillStyle = '#CCC'
    ctx.beginPath()
    ctx.moveTo(x,y)
    ctx.lineTo(x+w,y)
    ctx.lineTo(x+w,y+h)
    ctx.lineTo(x,y+h)
    ctx.lineTo(x,y)
    ctx.fill()

    ctx.fillStyle = 'black'
    ctx.fillText('Legend:', x+35, y+40);
    drawNode(ctx, {
        x: x+200,
        y: y+90,
        data: {
            protein_name: 'TF'
        }
    }, .5)

    drawNode( ctx, {
        x: x+300,
        y: y+90,
        data: {
            node_id: 'Gene'
        }
    }, .5)

    var yo1 = 110
    var yo2 = 150

    drawEdge( ctx, {
        a: [x+30,y+yo1],
        b: [x+130,y+yo1],
        data:{support:1}
    });

    var xo = 140
    ctx.fillStyle = 'black'
    ctx.fillText('Interaction', x+xo, y+yo1);
    ctx.fillText('(weak evidence)', x+xo, y+yo1+15);

    drawEdge( ctx, {
        a: [x+30,y+yo2],
        b: [x+130,y+yo2],
        data:{support:5}
    });

    ctx.fillStyle = 'black'
    ctx.fillText('Interaction', x+xo, y+yo2);
    ctx.fillText('(strong evidence)', x+xo, y+yo2+15);
    
    xo = 10
    var yo = 200
    var dy = 15
    ctx.textAlign = "left";
    ctx.fillText('Hover over nodes or edges for info', x+xo, y+yo);
    yo += dy
    ctx.fillText('Click nodes to open a new tab', x+xo, y+yo);
    yo += dy
    ctx.fillText('Click and drag nodes to move them', x+xo, y+yo);
    yo += dy
    ctx.fillText('Click and drag background to pan', x+xo, y+yo);
    yo += dy
    ctx.fillText('Zoom with the mousewheel', x+xo, y+yo);
    ctx.textAlign = "center";
    
    
}