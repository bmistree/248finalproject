/**
 * Handles firing streams at opponents.
 */

var camera;

MAX_CAN_FIRE_AT_ONCE = 2;

// If do not hit an object within 30 meters, then calling it a miss
FIRE_RANGE = 30;

// how frequently to update particle stream that are firing.
FIRE_UPDATE_PERIOD_MS = 30;
FIRE_NUM_STREAM_PARTICLES = 50;

function FireManager()
{
    this.particle_streams = [];
    this.num_outstanding_fires = 0;
}

FireManager.prototype.fire = function()
{
    // Check if have any energy/ammunition left to fire
    if (this.particle_streams.length >= MAX_CAN_FIRE_AT_ONCE)
        return;

    var particle_stream_beginning_point = camera.position.clone();
    var direction_vector = new THREE.Vector3( 0, 0, -1 );
    direction_vector.applyEuler(camera.rotation,camera.eulerOrder);

    var ray_cast = new THREE.Raycaster(
        particle_stream_beginning_point,direction_vector.normalize());

    // check if hits any opponent
    var opponent_list = opponent_manager.produce_opponent_mesh_array();
    var intersect_list = ray_cast.intersectObjects(opponent_list,false);
    var hit_opponent = false;
    var hit_mesh;
    for (var index = 0; index < intersect_list.length; ++index)
    {
        var intersect_object = intersect_list[index];
        var mesh_intersect_object = intersect_object.object;
        
        if (intersect_object.distance < FIRE_RANGE)
        {
            hit_opponent = true;
            hit_mesh = mesh_intersect_object;
        }
    }

    // if do not hit opponent, then merely fire in the direction that had sent.
    var dest_point = new THREE.Vector3(
        particle_stream_beginning_point.x + direction_vector.x * FIRE_RANGE,
        particle_stream_beginning_point.y + direction_vector.y * FIRE_RANGE,
        particle_stream_beginning_point.z + direction_vector.z * FIRE_RANGE);

    
    if (hit_opponent)
    {
        // send message to server that hit the opponent
        console.log('Fixme: must send message that hit opponent');
        dest_point = hit_mesh.position.clone();
    }

    this.particle_streams.push(
        new ParticleStream(
            particle_stream_beginning_point,dest_point,
            FIRE_NUM_STREAM_PARTICLES));

    // check if we went from a state of not having any particle
    // streams firing to having one.
    if (this.particle_streams.length == 1)
        this.fire_update();
};

/**
 * Fire manager maintains its own event loop, which it starts whenever
 * go from having no particles to fire to having particles to fire.
 */
FireManager.prototype.fire_update = function()
{
    var stream_to_remove_indices = [];
    for (var stream_index = 0; stream_index < this.particle_streams.length;
         ++stream_index)
    {
        var stream = this.particle_streams[stream_index];
        stream.add_point();
        stream.update();
        if (stream.finished())
            stream_to_remove_indices.push(stream_index);
    }

    stream_to_remove_indices.reverse();
    for (var index = 0; index < stream_to_remove_indices.length; ++index)
    {
        var to_delete_index = stream_to_remove_indices[index];
        this.particle_streams.splice(to_delete_index,1);
    }

    if (this.particle_streams.length != 0)
    {
        var this_param = this;
        setTimeout(
            function()
            {
                this_param.fire_update();
            },
            FIRE_UPDATE_PERIOD_MS);
    }
};


    