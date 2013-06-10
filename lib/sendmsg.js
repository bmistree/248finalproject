
MsgTypes = {};
MsgTypes.PLAYER_POSITION_MESSAGE = 'player_position_message';
MsgTypes.PLAYER_DISCONNECTED_MESSAGE = 'player_disconnected_message';

/** To player gold messages */
MsgTypes.TO_PLAYER_GOLD_MESSAGE_TYPE = 'to_player_gold_message';


/** From player gold messages */
MsgTypes.PLAYER_GOLD_MESSAGE_TYPE = "gold_message";
MsgTypes.PLAYER_GOLD_MESSAGE_TYPE_GRAB = "grab_gold";
MsgTypes.PLAYER_GOLD_MESSAGE_TYPE_DROP = "drop_gold";
MsgTypes.PLAYER_GOLD_MESSAGE_TYPE_DEDUCT = "deduct_gold";
MsgTypes.PLAYER_GOLD_MESSAGE_TYPE_ADD = "add_gold";

MsgTypes.PLAYER_PLANT_MESSAGE_TYPE = "player_plant_message";

MsgTypes.PLAYER_DATA_MESSAGE_TYPE = "player_data_message";

MsgTypes.FIRE_MESSAGE_TYPE = 'fire_message';

NULL_OPPONENT_ID = 0;

var gold_manager;
var plant_manager;
var opponent_manager;
var my_id;

function ServerInterface(server_ws_address,position_update_period)
{
    console.log('Creating server interface');
    
    // when go to task, remove self from grid
    this.off_the_grid = false;
    this.ws = new WebSocket(server_ws_address);
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


    this.last_updated_position = {
        X: null,
        Y: null,
        Z: null
        };
}

ServerInterface.prototype.add_plant = function (plant_pos)
{
    console.log('Sending add plant message to server');
    var msg = {
        MsgType: MsgTypes.PLAYER_PLANT_MESSAGE_TYPE,
        X: plant_pos.x,
        Y: plant_pos.y,
        Z: plant_pos.z
        };
    this.ws.send(JSON.stringify(msg));
};

ServerInterface.prototype.send_gold_added_update = function (amt,position)
{
    var msg = {
        MsgType: MsgTypes.PLAYER_GOLD_MESSAGE_TYPE,
        GoldMsgType: MsgTypes.PLAYER_GOLD_MESSAGE_TYPE_ADD,
        Amt: parseInt(amt),
        X: position.x,
        Y: position.y,
        Z: position.z
        };
    this.ws.send(JSON.stringify(msg));
};


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
    if (my_id === undefined)
    {
        // first message always contains our unique id
        my_id = parseInt(msg.data);
        return;
    }
    
    // convert msg from string-ified json to object
    var server_msg = JSON.parse(msg.data);

    if (server_msg.MsgType == MsgTypes.PLAYER_POSITION_MESSAGE)
        opponent_manager.handle_opponent_position_message(server_msg);
    else if (server_msg.MsgType == MsgTypes.TO_PLAYER_GOLD_MESSAGE_TYPE)
        gold_manager.handle_gold_message(server_msg);
    else if (server_msg.MsgType == MsgTypes.PLAYER_PLANT_MESSAGE_TYPE)
    {
        var pos = {
            x: server_msg.X,
            y: server_msg.Y,
            z: server_msg.Z
            };
        plant_manager.server_adds_plant(pos);
    }
    else if (server_msg.MsgType == MsgTypes.PLAYER_DISCONNECTED_MESSAGE)
        opponent_manager.handle_opponent_disconnect_message(server_msg);
    else if (server_msg.MsgType == MsgTypes.PLAYER_DATA_MESSAGE_TYPE )
        gold_manager.handle_player_data_message(server_msg);
    else if (server_msg.MsgType == MsgTypes.FIRE_MESSAGE_TYPE)
        fire_manager.handle_fire_message(server_msg);
    else
        console.log('Warning: unknown message type received from server');
};

ServerInterface.prototype.start_task = function()
{
    this.off_the_grid = true;
};

ServerInterface.prototype.end_task = function(amt_of_gold)
{
    this.off_the_grid = false;
    this.send_position_update(true);

    if (amt_of_gold > 0)
        this.send_gold_added_update(amt_of_gold,camera.position);
};

ServerInterface.prototype.buy_points = function (gold_spent)
{
    var msg = {
        MsgType: MsgTypes.PLAYER_GOLD_MESSAGE_TYPE,
        GoldMsgType: MsgTypes.PLAYER_GOLD_MESSAGE_TYPE_DEDUCT,
        Amt: Math.ceil(gold_spent)
        };
    this.ws.send(JSON.stringify(msg));
};

ServerInterface.prototype.drop_gold = function (gold_dropped)
{
    var msg = {
        MsgType: MsgTypes.PLAYER_GOLD_MESSAGE_TYPE,
        GoldMsgType: MsgTypes.PLAYER_GOLD_MESSAGE_TYPE_DROP,
        Amt: Math.ceil(gold_dropped)
        };
    this.ws.send(JSON.stringify(msg));
};

ServerInterface.prototype.pickup_gold = function (gold_picked_up)
{
    var msg = {
        MsgType: MsgTypes.PLAYER_GOLD_MESSAGE_TYPE,
        GoldMsgType: MsgTypes.PLAYER_GOLD_MESSAGE_TYPE_GRAB,
        Amt: Math.ceil(gold_picked_up)
        };
    this.ws.send(JSON.stringify(msg));
};


/**
 * Notify the server that we tried shooting particles
 * 
 * @param {THREE.Vector3} beginning_point, dest_point
 * 
 * @param {int} (optional) opponent_hit_id --- If defined, then we hit
 * the opponent and the server should give us points and take away
 * points from him/her.
 */
ServerInterface.prototype.shoot_particles = function (
    beginning_point,dest_point,opponent_hit_id)
{
    var msg = {
        MsgType: MsgTypes.FIRE_MESSAGE_TYPE,
        Dest_x: dest_point.x,
        Dest_y: dest_point.y,
        Dest_z: dest_point.z
    };

    if (opponent_hit_id !== undefined)
        msg.OpponentHitID= opponent_hit_id;
    else
        msg.OpponentHitID= NULL_OPPONENT_ID;
    
    this.ws.send(JSON.stringify(msg));
};
