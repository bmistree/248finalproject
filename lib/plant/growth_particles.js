PATH_FIDELITY = 100;
GOTO_THRESHOLD = .5;
NUM_POINTS_IN_PATH = 7;
NUM_GROWTH_PARTICLES = 30;
particle_material = new THREE.ParticleBasicMaterial(
    {
        color: 0xFFFFFF,
        size: .7,
        map: THREE.ImageUtils.loadTexture(
            "textures/particle/particle.png"
        ),
        blending: THREE.AdditiveBlending,
        transparent: true        
    });

OUTER_TORUS_RADIUS = .8;
INNER_TORUS_RADIUS = .5;

/**
 * Assumes torus hole centered on y axis.
 * 
 * @returns {Point3}
 */
function sample_torus(inner_radius,outer_radius)
{
    // from hole in torus... in x-z plane
    var theta = Math.random()*2*Math.PI;
    var dist_to_center = (inner_radius + outer_radius) /2;

    // from center of circle in torus up or down to point.
    var circle_rad = Math.random()*(outer_radius - inner_radius)/2;
    var phi = Math.random()*2*Math.PI;
    var x_pos = Math.cos(phi)*circle_rad + dist_to_center;
    var y_pos = Math.sin(phi)*circle_rad;
    var z_pos = 0;
    
    var final_x_pos = Math.cos(theta)*x_pos + Math.sin(theta)*z_pos;
    var final_y_pos = y_pos;
    var final_z_pos = -Math.sin(theta)*x_pos + Math.cos(theta)*z_pos;

    // var rotation_matrix = [
    //     Math.cos(theta), 0, Math.sin(theta),
    //     0, 1, 0,
    //     -Math.sin(theta), 0, Math.cos(theta) ];

    var point_to_return = new THREE.Vector3(final_x_pos,final_y_pos,final_z_pos);
    point_to_return.frequency = Math.random()/2;
    point_to_return.base_y = final_y_pos;
    return point_to_return;
}



/**
 * Controls path and intensity of particles as plants grow.
 * 
 * Want particles to be spinning essentially on a torus.
 */
function GrowthParticles(root_plant)
{
    this.center = root_plant.base_point;
    
    // create a particle system for the growth
    var particles_geometry = new THREE.Geometry();
    // now create the individual particles
    for(var particle_index = 0; particle_index < NUM_GROWTH_PARTICLES; ++particle_index)
    {
        var particle_point = sample_torus(INNER_TORUS_RADIUS,OUTER_TORUS_RADIUS);
        var single_particle = new THREE.Vertex(particle_point);
        particles_geometry.vertices.push(single_particle);
    }
    this.particles = new THREE.ParticleSystem(
       particles_geometry,particle_material);

    this.particles.sortParticles = true;

    this.particles.geometry.__dirtyVertices = true;
    scene.add(this.particles);
    this.num_spins_called = 1;
}


/**
 * Doing three things:
 * 
 *   1) creates growth stream
 * 
 *   2) Creates another torus of hidden, swirling particles
 * 
 *   3) start monitoring for particles to hide from this.particles,
 *   and add to growth stream
 * 
 */
GrowthParticles.prototype.goto_point = function (destination_point)
{
    this.particle_stream = new ParticleStream(
        this.particles.position.clone(),destination_point,
        NUM_GROWTH_PARTICLES);

    this.source_point = this.particles.position;
    this.destination_point = destination_point.clone();
    
    for (var particle_index = 0; particle_index < this.particles.geometry.vertices.length;
         ++particle_index)
    {
        var particle = this.particles.geometry.vertices[particle_index];
        particle.hidden = false;
    }

    
    this.in_movement_phase = true;
};


GrowthParticles.prototype.stop = function()
{
};


/**
 * @param {Vector3} new_growth_point --- The new center of the torus
 * of particles.
 * 
 * Called each time the torus is supposed to continue growing.
 */
GrowthParticles.prototype.torus_position_update = function(new_growth_point)
{
    if (squared_distance(new_growth_point,this.particles.position) > GOTO_THRESHOLD)
        this.goto_point(new_growth_point);
    else
    {
        this.particles.position.x = new_growth_point.x;
        this.particles.position.y = new_growth_point.y;
        this.particles.position.z = new_growth_point.z;
    }
};

function squared_distance(pt1,pt2)
{
    var diff_x = pt1.x-pt2.x;
    var diff_y = pt1.y-pt2.y;
    var diff_z = pt1.z-pt2.z;
    
    return diff_x*diff_x + diff_y*diff_y + diff_z*diff_z;
}


/**
 * Returns true if particle system has arrived at the point we told it
 * to in goto_point... can call torus_position_update
 */
GrowthParticles.prototype.ready_for_torus_circle = function()
{
    return ! this.in_movement_phase;
};


/**
 * Either spins all the particles around a central point or moves
 * point to its next destination.
 */
GrowthParticles.prototype.update = function()
{
    // update each particle's verticle position
    for (var particle_index = 0; particle_index < this.particles.geometry.vertices.length;
         ++particle_index)
    {
        var particle = this.particles.geometry.vertices[particle_index];
        particle.y =
            .1*Math.sin(this.num_spins_called*particle.frequency) +
            particle.base_y;
    }
    this.particles.geometry.__dirtyVertices = true;
    this.num_spins_called++;

    this.particles.rotation.y += .075;
    
    // if trying to move to a new point, then need to update particle
    // stream, etc.
    if (this.in_movement_phase)
    {
        this.stream_next();

        this.particle_stream.update();
        if (this.particle_stream.finished())
        {
            // FIXME: add logic for transfering to new circular
            // particle stream at other point.
            this.in_movement_phase = false;
            this.particle_stream = undefined;
            this.particles.position.x = this.destination_point.x;
            this.particles.position.y = this.destination_point.y;
            this.particles.position.z = this.destination_point.z;
            this.particles.geometry.__dirtyVertices = true;
        }
        return false;
    }
    return true;
};


GrowthParticles.prototype.stream_next = function()
{
    var all_particles_hidden = true;

    for (var particle_index = 0; particle_index < this.particles.geometry.vertices.length;
         ++particle_index)
    {
        var particle = this.particles.geometry.vertices[particle_index];
        if (! particle.hidden)
        {
            this.particle_stream.add_point();
            break;
        }
    }
};


