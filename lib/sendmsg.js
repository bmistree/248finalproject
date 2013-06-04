
MsgTypes = {};
MsgTypes.PLAYER_POSITION_MESSAGE = 'player_position_message';
MsgTypes.PLAYER_DISCONNECTED_MESSAGE = 'player_disconnected_message';

function ServerInterface(server_ws_address,position_update_period)
{
    // when go to task, remove self from grid
    this.off_the_grid = false;
    this.ws = new WebSocket(server_ws_address);
    console.log('Creaed server interface');
    var this_param = this;
    this.ws.onmessage = function(msg)
    {
        this_param.handle_server_msg(msg);
    };
    this.ws.onopen = function()
    {
        console.log('Connection open');
        this_param.server_connection_open();
    };

    this.position_update_period = position_update_period;
    this.opponents = {};

    this.last_updated_position = {
        X: null,
        Y: null,
        Z: null
        };
}

/**
 * If we are not within the game (ie, we are completing the task, then
 * do not send a position update.)
 */
ServerInterface.prototype.send_position_update = function()
{
    if (this.off_the_grid) 
        return;

    // only send an update if we have moved since we last sent an
    // update
    var current_position = {
        X: camera.position.x,
        Y: camera.position.y,
        Z: camera.position.z};
    
    if ((current_position.X !== this.last_updated_position.X) ||
        (current_position.Y !== this.last_updated_position.Y) ||
        (current_position.Z !== this.last_updated_position.Z))
    {
        current_position.MsgType =  MsgTypes.PLAYER_POSITION_MESSAGE;
        this.last_updated_position = current_position;
        this.ws.send(JSON.stringify(this.last_updated_position));
    }
    
    // schedule another position update
    var this_param = this;
    setTimeout(
        function()
        {
            this_param.send_position_update();
        },
        this.position_update_period);
};

ServerInterface.prototype.server_connection_open = function (msg)
{
    // periodically update the server with my position if it has not
    // changed
    this.send_position_update();
};

ServerInterface.prototype.handle_server_msg = function (msg)
{
    // convert msg from string-ified json to object
    var server_msg = JSON.parse(msg.data);

    if (server_msg.MsgType == MsgTypes.PLAYER_POSITION_MESSAGE)
    {
        if (!(server_msg.ID in this.opponents))
            this.opponents[server_msg.ID] = new Opponent(server_msg);
        else
            this.opponents[server_msg.ID].update_position(server_msg);
    }
    else if (server_msg.MsgType == MsgTypes.PLAYER_DISCONNECTED_MESSAGE)
    {
        var opponent_id = server_msg.ID;
        if (opponent_id in this.opponents)
        {
            this.opponents[opponent_id].disconnect();
            this.opponents.remove(opponent_id);
        }
    }
    else
        console.log('Warning: unknown message type received from server');
};

ServerInterface.prototype.start_task = function()
{
    this.off_the_grid = true;
};

ServerInterface.prototype.end_task = function()
{
    this.off_the_grid = false;
    this.send_position_update(true);
};