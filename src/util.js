// check if the user provided a callback for the given name
// if so, return that callback function
// otherwise return null
function get_callback( ctx, name ) {
    if( callback_exists( ctx, name ) ){
        return ctx.callbacks[name]
    }
}
                                  
function callback_exists( ctx, name ){
    if( ctx.callbacks == null ){
        return false
    }
    try{
        return Object.hasOwn(ctx.callbacks, name)
    }catch(error){
        return ctx.callbacks.hasOwnProperty(name)
    }   
}