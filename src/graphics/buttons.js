

function drawLoadMoreButton(ctx){
    
    x = ctx.load_more_button.x
    y = ctx.load_more_button.y
    w = ctx.load_more_button.w
    h = ctx.load_more_button.h
    hl = ctx.load_more_button.hl
    
    if( hl ){
        ctx.fillStyle = 'black'
    } else {
        ctx.fillStyle = '#CCC'
    }
    ctx.beginPath()
    ctx.moveTo(x,y)
    ctx.lineTo(x+w,y)
    ctx.lineTo(x+w,y+h)
    ctx.lineTo(x,y+h)
    ctx.lineTo(x,y)
    ctx.fill()
    
    if( hl ){
        ctx.fillStyle = 'white'
    } else {
        ctx.fillStyle = 'black'
    }
    ctx.fillText('load more data', x+w/2, y+h/2+3);
}