function OpponentManager()
{
    this.opponents = {};
}

OpponentManager.prototype.produce_opponent_mesh_array = function()
{
    var return_array = [];
    for (var index in this.opponents)
        return_array.push(this.opponents[index].mesh);
    return return_array;
};


/**
 * Removes opponent if had already been added
 */
OpponentManager.prototype.handle_opponent_disconnect_message = function (server_msg)
{
    var opponent_id = server_msg.ID;
    if (opponent_id in this.opponents)
    {
        this.opponents[opponent_id].disconnect();
        this.opponents.remove(opponent_id);
    }
};

/**
 * Also creates a new opponent if did not previously have it. 
 */
OpponentManager.prototype.handle_opponent_position_message = function (server_msg)
{
    if (!(server_msg.ID in this.opponents))
        this.opponents[server_msg.ID] = new Opponent(server_msg);
    else
        this.opponents[server_msg.ID].update_position(server_msg);
};

    
