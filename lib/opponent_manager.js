function OpponentManager()
{
    this.opponents = {};
}



// used to update opponents' scores
OpponentManager.prototype.handle_player_data_message = function (player_data_message)
{
    var id = player_data_message.ID;
    var points =  player_data_message.Points;
    if (id in this.opponents)
        this.opponents[id].points = points;
};

/**
 * Call by sharing so can include own score in array before sorting
 */
OpponentManager.prototype.get_opponents_by_score = function (opp_array)
{
    for (var id in this.opponents)
        opp_array.push(this.opponents[id]);
    
    opp_array.sort(
        function (a,b)
        {
            if (a.points < b.points)
                return 1;
            if (a.points > b.points)
                return -1;
            return 0;
        });
};


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
        this.opponents[server_msg.ID] = new Opponent(server_msg.ID);
    
    this.opponents[server_msg.ID].update_position(server_msg);
};

    
