// Want to use a different material for each opponent
OPPONENT_MATERIAL_ARRAY = [
    new THREE.MeshLambertMaterial(
        {
            color: 0xCC0000
        }),
    new THREE.MeshLambertMaterial(
        {
            color: 0xCCCC00
        }),
    new THREE.MeshLambertMaterial(
        {
            color: 0xCC00CC
        }),
    new THREE.MeshLambertMaterial(
        {
            color: 0x00CCCC
        }),
    new THREE.MeshLambertMaterial(
        {
            color: 0x08088A
        }),
    new THREE.MeshLambertMaterial(
        {
            color: 0xB404AE
        })
    ];


var HIT_GLOW_MATERIAL = new THREE.MeshBasicMaterial(
    { color: 0xffffff, transparent:true, opacity:0.50 } );



var scene,glow_scene;
var black_material;

function Opponent(id)
{
    this.id = id;
    // start at -50 until receive a position update putting on board.
    this.current_position = null;
    this.final_position = null;
    this.points = 0;

    var opponent_material =
        OPPONENT_MATERIAL_ARRAY[ this.id % OPPONENT_MATERIAL_ARRAY.length];

    this.color = opponent_material.color;
    
    this.mesh = new THREE.Mesh(
        // args: radius, segments, rings
        new THREE.SphereGeometry(1,16,16),
        opponent_material);
    this.glow_mesh = new THREE.Mesh(
        this.mesh.geometry.clone(),
        black_material);

    this.glow_mesh.position = this.mesh.position;
    this.glow_mesh.rotation = this.mesh.rotation;
    this.glow_mesh.scale = this.mesh.scale;
    
    this.mesh.opponent_id = this.id;
    
    this.mesh.position.x = 0;
    this.mesh.position.y = -50;
    this.mesh.position.z = 0;
    scene.add(this.mesh);

    glow_scene.add(this.glow_mesh);
    this.movement_path = [];

    this.hit_glow_mesh = null;
    this.hit_glow_count = 0;
}

Opponent.prototype.hit_by_fire = function ()
{
    ++ this.hit_glow_count;
    if (this.hit_glow_mesh === null)
    {
        this.hit_glow_mesh = new THREE.Mesh(
            this.mesh.geometry.clone(),
            HIT_GLOW_MATERIAL);
        this.hit_glow_mesh.scale.set(1.3,1.3,1.3);
        this.hit_glow_mesh.position = this.mesh.position;
        this.hit_glow_mesh.rotation = this.mesh.rotation;
        glow_scene.add(this.hit_glow_mesh);
    }
};

Opponent.prototype.stop_hit_by_fire = function()
{
    -- this.hit_glow_count;
    if (this.hit_glow_count == 0)
    {
        glow_scene.remove(this.hit_glow_mesh);
        this.hit_glow_mesh = null;
    }
};


/**
 * Opponent has signed off.  Stop tracing his/her motions.
 */
Opponent.prototype.disconnect = function()
{
    scene.remove(this.mesh);
    glow_scene.remove(this.glow_mesh);

    if (this.hit_glow_mesh !== null)
        glow_scene.remove(this.hit_glow_mesh);
};

Opponent.prototype.update_position = function(update_msg)
{
    this.final_position = {
        x: update_msg.X,
        y: update_msg.Y,
        z: update_msg.Z
    };
    if (this.current_position === null)
        this.current_position = this.final_position;

    this.mesh.position.x = this.final_position.x;
    this.mesh.position.y = this.final_position.y;
    this.mesh.position.z = this.final_position.z;
};
