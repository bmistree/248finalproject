var scene, glow_scene;

var DrawingConsts;


GOLD_DISPLAY_DIV = 'gold_display_div';

GOLD_DISPLAY_DIV_WIDTH = 225; // note that this is the same as radar width
GOLD_DISPLAY_DIV_HEIGHT = 30;
GOLD_DISPLAY_UPDATE_PERIOD_MS = 500;

GOLD_GRAB_RADIUS_SQUARED = 3*3;
GOLD_SPEND_RADIUS_SQUARED = 5*5;



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
    // from stash id to gold_stash
    this.gold_map = {};

    $('#' + DrawingConsts.DRAWING_DIV).append(
        '<div id="' + GOLD_DISPLAY_DIV + '" ' +
            // style
            'style="background-color:rgba(105,105,105,.5); ' +
            'width: ' + GOLD_DISPLAY_DIV_WIDTH + '; ' +
            'position: relative; top: -650px; left: 950px;"' +
            '></div>');
    this.update_div();
}

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
    
    // put together text for gold
    var to_display_text =
        '<table> ' +
        '<tr>' +
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
    scene.remove(this.mesh);
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


