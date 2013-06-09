function Opponent(id)
{
    this.id = id;
    // start at -50 until receive a position update putting on board.
    this.current_position = null;
    this.final_position = null;

    var opponent_material =  new THREE.MeshLambertMaterial(
    {
        color: 0xCC0000
    });
    
    this.mesh = new THREE.Mesh(
        // args: radius, segments, rings
        new THREE.SphereGeometry(1,16,16),
        opponent_material);
    this.mesh.opponent_id = this.id;
    
    this.mesh.position.x = 0;
    this.mesh.position.y = -50;
    this.mesh.position.z = 0;
    scene.add(this.mesh);
    this.movement_path = [];
}

/**
 * Opponent has signed off.  Stop tracing his/her motions.
 */
Opponent.prototype.disconnect = function()
{
    scene.remove(this.mesh);
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
