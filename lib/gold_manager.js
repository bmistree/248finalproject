var scene, glow_scene;

var DrawingConsts;
var server_interface;

GOLD_DISPLAY_DIV = 'gold_display_div';

GOLD_DISPLAY_DIV_WIDTH = 225; // note that this is the same as radar width
GOLD_DISPLAY_DIV_HEIGHT = 30;
GOLD_DISPLAY_UPDATE_PERIOD_MS = 500;

GOLD_GRAB_RADIUS_SQUARED = 3*3;
GOLD_SPEND_RADIUS_SQUARED = 5*5;

GOLD_MAX_CAN_CARRY = 30;

GOLD_SOUND_DIV_ID = 'gold_audio';

var sound_manager;
var firing_manager;

/**
 * Keeps track of all the gold visible to the player (and that the
 * player is carrying)
 * 
 * Displays amount of gold holding + amount of gold can pick up from
 * around self + amount of gold can use to buy on a div.
 * 
 */
function GoldManager ()
{
    // amount of gold I am currently holding
    this.holding_gold = 0;
    this.points = 0;
    // from stash id to gold_stash
    this.gold_map = {};

    // updated in update_div
    this.within_grab_count = 0;
    this.within_spend_count = 0;
    
    
    $('#' + DrawingConsts.DRAWING_DIV).append(
        '<div id="' + GOLD_DISPLAY_DIV + '" ' +
            // style
            'style="background-color:rgba(105,105,105,.5); ' +
            'width: ' + GOLD_DISPLAY_DIV_WIDTH + '; ' +
            'position: relative; top: -650px; left: 950px;"' +
            '></div>');
    this.update_div();
}

GoldManager.prototype.update_gold_holding = function (new_amt_holding)
{
    this.holding_gold = new_amt_holding;
};

GoldManager.prototype.request_spend_gold = function ()
{
    var max_can_spend = this.holding_gold + this.within_spend_count;
    var result = prompt(
        'You are holding ' + this.holding_gold + ' pieces of gold, ' +
            'and there is ' + this.within_spend_count + ' pieces of gold ' +
            'nearby that you can use to buy points.  Remember, the cost for ' +
            'points is non-linear.  If you spend 20 pieces of gold, you will get ' +
            '1 point.  But if you spend 500 pieces of gold, you will get 100 points.',
        max_can_spend.toString()
    );
    
    try
    {
        result = parseFloat(result);
    }
    catch(e)
    {
        return;
    }

    result = Math.min(result,max_can_spend);

    if (result == 0)
        return;
    
    // tell the server to buy points
    server_interface.buy_points(result);
    sound_manager.play_multi_sound (GOLD_SOUND_DIV_ID );
};



/**
 * Player can drop gold in environment
 */
GoldManager.prototype.request_drop_gold = function()
{
    var result = prompt (
        'You are carrying ' + this.holding_gold + ' pieces of gold.  ' +
            'How much of it would you like to drop?',
        this.holding_gold.toString());

    try
    {
        result = parseFloat(result);
    }
    catch(e)
    {
        return;
    }

    // don't want user to invent gold
    result = Math.max(result,0);
    result = Math.min(this.holding_gold,result);
    if (result == 0)
        return;

    // tell the server to drop the gold in the environment
    server_interface.drop_gold(result);

    // play gold sound
    sound_manager.play_multi_sound (GOLD_SOUND_DIV_ID );
};

/**
 * When player tries to grab gold, pop up a message telling him/her
 * how much gold he/she can grab and then send message to server
 * actually grabbing it.
 */
GoldManager.prototype.request_grab_gold = function()
{
    if (this.holding_gold >= GOLD_MAX_CAN_CARRY)
    {
        alert(
            'You cannot hold more gold than ' +
                GOLD_MAX_CAN_CARRY + '.  You should either ' +
                'spend your gold or drop it in a safe place.');
        return;
    }

    var amount_can_hold = GOLD_MAX_CAN_CARRY - this.holding_gold;
    var max_amount_can_pick_up =
        Math.min(amount_can_hold,this.within_grab_count);

    var result = prompt('You have ' + this.holding_gold +
           ' pieces of gold and there are ' + this.within_grab_count +
           ' pieces of gold within your reach.  You can carray a maximum ' +
           ' of ' + GOLD_MAX_CAN_CARRY + ' pieces of gold.  How much do you ' +
           ' want to pick up?',
           Math.min(amount_can_hold, this.within_grab_count).toString());
    try
    {
        result = parseFloat(result);
    }
    catch(e)
    {
        return;
    }

    result = Math.min(max_amount_can_pick_up);
    if (result == 0)
        return;

    // notify server of intention to pick up gold.  when receive
    // message back from server, will update gold amounts in
    // environment and amount of gold holding.
    server_interface.pickup_gold(result);

    sound_manager.play_multi_sound (GOLD_SOUND_DIV_ID );
};

function calc_x_z_dist_squared(pos1,pos2)
{
    var delta_x = pos1.x - pos2.x;
    var delta_z = pos1.z - pos2.z;

    return delta_x*delta_x + delta_z*delta_z;
}


GoldManager.prototype.update_div = function ()
{
    // calculate the amount of gold that you can grab or spend
    var camera_position = camera.position.clone();
    var within_grab_count = 0;
    var within_spend_count = 0;
    for (var gold_map_index in this.gold_map)
    {
        var gold_stash = this.gold_map[gold_map_index];
        var x_z_distance = calc_x_z_dist_squared(
            camera_position,gold_stash.mesh.position);

        if (x_z_distance < GOLD_GRAB_RADIUS_SQUARED)
            within_grab_count += gold_stash.amt;
        if (x_z_distance < GOLD_SPEND_RADIUS_SQUARED)
            within_spend_count += gold_stash.amt;
    }

    
    this.within_grab_count = within_grab_count;
    this.within_spend_count = within_spend_count;
    var shots_left = 0;
    if (fire_manager)
        shots_left = fire_manager.shots_left();
    
    // put together text for gold
    var to_display_text =
        '<table> ' +
        '<tr><td>STREAMS</td><td></td>' +
        '</tr><tr>' +
        '<td>Shots left: </td><td>' + shots_left + '</td>' + 
        '</tr><tr><td>GOLD</td><td></td>' + 
        '</tr><tr>' +
        '<td>Holding:</td><td>' + this.holding_gold + '</td>' +
        '</tr><tr>' +
        '<td>Can spend:</td><td>' + within_spend_count + '</td>' +
        '</tr><tr>' +
        '<td>Can grab:</td><td>' + within_grab_count + '</td>' +
        '</tr></table>';
    
    $('#' + GOLD_DISPLAY_DIV).html(to_display_text);

    // set another timeout
    var this_param = this;
    setTimeout(
        function()
        {
            this_param.update_div();
        },
        GOLD_DISPLAY_UPDATE_PERIOD_MS);
};

/**
 * @param {object} gold_message --- @see GoldMessage in player.go on
 * server side.
 */
GoldManager.prototype.handle_gold_message = function (gold_message)
{
    // handle all added messages
    if (gold_message.AddedSubmessages !== null)
    {
        for (var added_index =0; added_index < gold_message.AddedSubmessages.length;
             ++added_index)
        {
            var added_stash_info = gold_message.AddedSubmessages[added_index];
            this.gold_map[added_stash_info.StashId] = new GoldStash(
                added_stash_info.StashId,added_stash_info.Amt,
                {
                    x: added_stash_info.X,
                    y: added_stash_info.Y,
                    z: added_stash_info.Z
                });
        }
    }

    // handle all deleted messages
    if (gold_message.DeletedSubmessages !== null)
    {
        console.log('Contained deleted submessages');
        for (var deleted_index = 0; deleted_index < gold_message.DeletedSubmessages.length;
             ++deleted_index)
        {
            var deleted_stash_info = gold_message.DeletedSubmessages[deleted_index];
            this.gold_map[deleted_stash_info.StashId].delete_stash();
            this.gold_map.remove(deleted_stash_info.StashId);
        }
    }
        
    // handle all changed messages
    if (gold_message.ChangedSubmessages !== null)
    {
        for (var changed_index =0; changed_index < gold_message.ChangedSubmessages.length;
             ++changed_index)
        {
            var changed_stash_info = gold_message.ChangedSubmessages[changed_index];

            if (changed_stash_info.StashId in this.gold_map)
            {
                this.gold_map[changed_stash_info.StashId].update_val(
                    changed_stash_info.FinalAmt);
            }
        }
    }
};


SMALLEST_STASH_SIZE = .2;
SMALLEST_AMT_SIZE = 50;

// FIXME: add bloom to gold
var gold_texture = THREE.ImageUtils.loadTexture('textures/gold/gold_texture.png');
var gold_material = new THREE.MeshBasicMaterial({map: gold_texture});
var gold_glow_material = new THREE.MeshBasicMaterial(
        { color: 0xffffff, transparent:true, opacity:0.3 } );

function GoldStash (stash_id,amt,position)
{
    this.stash_id = stash_id;
    this.amt = amt;

    this.mesh = new THREE.Mesh(
        new THREE.TorusKnotGeometry( .1, .1 ), gold_material );
    
    this.mesh.position.x = position.x;
    this.mesh.position.y = position.y;
    this.mesh.position.z = position.z;

    // determine scale based on amount of gold available
    this.set_scale();
    scene.add(this.mesh);

    // glow around gold
    this.glow_mesh =
        new THREE.Mesh(
            new THREE.SphereGeometry(.2,16,16),
            gold_glow_material);
    
    this.glow_mesh.position = this.mesh.position;
    this.glow_mesh.rotation = this.mesh.rotation;
    this.glow_mesh.scale.set(1.5,1.5,1.5);
    glow_scene.add(this.glow_mesh);
}



GoldStash.prototype.delete_stash = function()
{
    console.log('Deleting stash');
    scene.remove(this.mesh);
    glow_scene.remove(this.glow_mesh);
};

GoldStash.prototype.update_val = function (new_val)
{
    this.amt = new_val;
    this.set_scale();
};


GoldStash.prototype.set_scale = function ()
{
    var amt_to_scale_by = 1.0;
    if (this.amt > SMALLEST_AMT_SIZE)
        amt_to_scale_by = this.amt/SMALLEST_AMT_SIZE;

    this.mesh.scale.set(amt_to_scale_by,1,amt_to_scale_by);
};


