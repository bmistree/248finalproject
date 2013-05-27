STREAM_FIDELITY = 80;
STREAM_CONTROL_FIDELITY = 6;
STREAM_NOISE_FACTOR = .5;
visible_particle_material = new THREE.ParticleBasicMaterial(
    {
        color: 0xFFFFFF,
        size: .7,
        map: THREE.ImageUtils.loadTexture(
            "textures/particle/particle.png"
        ),
        blending: THREE.AdditiveBlending,
        transparent: true,
        opacity: 1
    });
invisible_particle_material = new THREE.ParticleBasicMaterial(
    {
        color: 0xFFFFFF,
        size: .7,
        map: THREE.ImageUtils.loadTexture(
            "textures/particle/particle.png"
        ),
        blending: THREE.AdditiveBlending,
        transparent: true,
        opacity: 0
    });


function ParticleStream(start_point,dest_point,num_stream_particles)
{
    this.start_point = start_point.clone();
    this.dest_point = dest_point.clone();
    this.produce_point_paths();
    this.particles =  [];

    for (var index=0; index < num_stream_particles; ++index)
    {
        var single_particle = new THREE.Vertex(new THREE.Vector3(0,0,0));
        var particles_geometry = new THREE.Geometry();
        particles_geometry.vertices.push(single_particle);

        var particle = new THREE.ParticleSystem(particles_geometry,invisible_particle_material);
        particle.noise_x = Math.random() * STREAM_NOISE_FACTOR;
        particle.noise_y = Math.random() * STREAM_NOISE_FACTOR;
        particle.noise_z = Math.random() * STREAM_NOISE_FACTOR;

        particle.position.x = 0;
        particle.position.y = 0;
        particle.position.z = 0;

        
        particle.started_moving = false;
        particle.motion_index = 0;

        particle.sortParticles = true;
        particle.geometry.__dirtyVertices = true;
        this.particles.push(particle);
        scene.add(particle);
    }
    
}

ParticleStream.prototype.produce_point_paths = function()
{
    var control_points = [];
    for (var index = 0; index < STREAM_CONTROL_FIDELITY; ++index)
    {
        var fraction = index/STREAM_CONTROL_FIDELITY;

        // FIXME: Currently, using linear control points, may be
        // better to add some noise/shape to path.

        var noise_x = 0;
        var noise_y = 0;
        var noise_z = 0;
        if (index != 0)
        {
            noise_x = Math.random();
            noise_y = Math.random();
            noise_z = Math.random();
        }
        control_points.push(
            new THREE.Vector3(
                this.start_point.x + fraction*(this.dest_point.x - this.start_point.x) + noise_x,
                this.start_point.y + fraction*(this.dest_point.y - this.start_point.y) + noise_y,
                this.start_point.z + fraction*(this.dest_point.z - this.start_point.z) + noise_z));
    }
    this.point_paths =
        new THREE.SplineCurve3(control_points).getPoints(STREAM_FIDELITY);
};

ParticleStream.prototype.add_point = function()
{
    for (var particle_index = 0; particle_index < this.particles.length; ++particle_index)
    {
        var particle = this.particles[particle_index];
        if (! particle.started_moving)
        {
            // found a particle that had not started moving yet.
            // Cause it to start
            particle.started_moving = true;
            particle.material = visible_particle_material;
            return true;
        }
    }
    return false;
};

/**
 * Returns true if the full stream has arrived at other end
 */
ParticleStream.prototype.finished = function()
{
    return (this.particles.length == 0);
};


/**
 * If any point reaches destination, then return true and remove that
 * point from scene.  Otherwise, move points further along path.
 */
ParticleStream.prototype.update = function()
{
    var indices_to_remove = [];
    for (var particle_index =0; particle_index < this.particles.length; ++particle_index)
    {
        var particle = this.particles[particle_index];
        if (particle.started_moving)
        {
            particle.motion_index ++;
            if (particle.motion_index >= this.point_paths.length)
                indices_to_remove.push(particle_index);
            else
            {
                // FIXME: may want to add some noise here
                particle.position.x = this.point_paths[particle.motion_index].x + particle.noise_x;
                particle.position.y = this.point_paths[particle.motion_index].y + particle.noise_y;
                particle.position.z = this.point_paths[particle.motion_index].z + particle.noise_z;
                particle.geometry.__dirtyVertices = true;    
            }
        }
    }

    // remove backwards to preserve ordering
    for (var remove_index = indices_to_remove.length -1; remove_index >= 0; --remove_index)
    {
        var to_remove = indices_to_remove[remove_index];
        var particle_to_remove = this.particles[to_remove];
        scene.remove(particle_to_remove);
        this.particles.splice(to_remove,1);
    }
    
    return (indices_to_remove.length != 0);
};