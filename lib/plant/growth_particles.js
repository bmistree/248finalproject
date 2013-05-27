PATH_FIDELITY = 100;

NUM_POINTS_IN_PATH = 7;
NUM_PARTICLES = 100;
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
    for(var particle_index = 0; particle_index < NUM_PARTICLES; ++particle_index)
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

GrowthParticles.prototype.goto_point = function (destination_point)
{
    var start_point = this.particles.position.clone();
    this.destination_point = destination_point;

    //var point_path = [ this.particles.position.clone()];
    var control_points = [];
    for (var point_index=0; point_index < NUM_POINTS_IN_PATH; ++point_index)
    {
        var fraction = point_index/NUM_POINTS_IN_PATH;
        var linear_x =
            start_point.x + fraction*(this.destination_point.x - start_point.x);
        var linear_y =
            start_point.y + fraction*(this.destination_point.y - start_point.y);
        var linear_z =
            start_point.z + fraction*(this.destination_point.z - start_point.z);
        
        linear_z = linear_z + Math.sin(point_index);
        control_points.push(
            new THREE.Vector3(linear_x,linear_y,linear_z));
    }

    // for (var particle_index = 0; particle_index < this.particles.geometry.vertices.length;
    //      ++particle_index)
    // {
    //     var particle = this.particles.geometry.vertices[particle_index];
    //     particle.delta_point_x = start_point.x - particle.x;
    //     particle.delta_point_y = start_point.y - particle.y;
    //     particle.delta_point_z = start_point.z - particle.z;
    // }

    this.unroll();
    this.movement_count = 0;
    this.in_movement_phase = true;
    this.particles.geometry.__dirtyVertices = true;    
    this.particle_path =
        new THREE.SplineCurve3(control_points).getPoints(PATH_FIDELITY);
};

GrowthParticles.prototype.reroll = function()
{
    this.particles.rotation.y = 0;
    for (var particle_index = 0; particle_index < this.particles.geometry.vertices.length;
         ++particle_index)
    {
        var particle = this.particles.geometry.vertices[particle_index];
        var tmp = sample_torus(INNER_TORUS_RADIUS,OUTER_TORUS_RADIUS);
        particle.x = tmp.x;
        particle.y = tmp.y;
        particle.z = tmp.z;
    }
    this.particles.geometry.__dirtyVertices = true;    
};

GrowthParticles.prototype.unroll = function()
{
    this.particles.rotation.y = 0;
    for (var particle_index = 0; particle_index < this.particles.geometry.vertices.length;
         ++particle_index)
    {
        var particle = this.particles.geometry.vertices[particle_index];
        particle.x = -1.0 + 2*Math.random();
        particle.z = Math.random()*.2;
    }
    // cut the torus at the bottom right quadrant, ie, when each
    // particle's position is 
};

GrowthParticles.prototype.movement_phase = function()
{
    if (this.movement_count >= PATH_FIDELITY)
    {
        this.in_movement_phase = false;
        this.reroll();
        return false;
    }

    var point_position = this.particle_path[this.movement_count];
    
    // for (var particle_index = 0; particle_index < this.particles.geometry.vertices.length;
    //      ++particle_index)
    // {
    //     var particle = this.particles.geometry.vertices[particle_index];
    //     particle.x = point_position.x + particle.delta_point_x;
    //     particle.y = point_position.y + particle.delta_point_y;
    //     particle.z = point_position.z + particle.delta_point_z;
    // }

    this.particles.position.x = point_position.x;
    this.particles.position.y = point_position.y;
    this.particles.position.z = point_position.z;
    
    this.particles.geometry.__dirtyVertices = true;    
    this.movement_count++;
    return true;
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
    this.particles.position.x = new_growth_point.x;
    this.particles.position.y = new_growth_point.y;
    this.particles.position.z = new_growth_point.z;
};


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

    // if trying to move to a new point, 
    if (this.in_movement_phase)
    {
        this.movement_phase();
        return false;
    }

    this.particles.rotation.y += .075;
    return true;
};


/**
 * @returns {int} --- Number of points
 *
 * Runs depth-first...ie, how the plant would be drawn
 * 
 */
function process_growth_points(to_append_to,root)
{
    to_append_to.push(root.base_point);
    var num_points = root.growth_points.length;
    
    for (var branch_index=0; branch_index < root.branches.length;
         ++branch_index)
    {
        num_points += process_growth_points(
            to_append_to,root.branches[branch_index]);
    }

    if (root.branches.length == 0)
        to_append_to.push(root.distant_point);

    return num_points;
}